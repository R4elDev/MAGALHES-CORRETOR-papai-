-- 0003 RAG: embeddings, outbox transacional, RPCs (service_role).
-- Dimensao: coluna vector SEM dims fixas ate o usuario definir EMBEDDING_MODEL.
-- Quando definido: nova migration aditiva cria o indice HNSW via expressao ((embedding::vector(N))).

create table public.property_embeddings (
  property_id uuid primary key references public.properties(id) on delete cascade,
  doc_hash text not null,
  model text not null,
  dims int not null,
  embedding extensions.vector not null,
  updated_at timestamptz not null default now(),
  constraint embedding_dims_match check (extensions.vector_dims(embedding) = dims)
);

create table public.index_jobs (
  id bigint generated always as identity primary key,
  property_id uuid not null, -- sem FK: jobs de invalidacao sobrevivem a exclusao
  op text not null check (op in ('upsert','invalidate')),
  doc_hash text,
  status text not null default 'pending' check (status in ('pending','processing','done','failed','dead')),
  attempts int not null default 0,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now()
);
create unique index index_jobs_one_pending on public.index_jobs (property_id) where status = 'pending';
create index index_jobs_claim on public.index_jobs (status, run_after);

-- disponivel = published e nao excluido
create or replace function public.property_is_available(p public.properties) returns boolean
language sql immutable as $$ select p.status = 'published' and p.deleted_at is null $$;

create or replace function public.enqueue_index_job(p_property uuid, p_op text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_op = 'invalidate' then
    delete from public.property_embeddings where property_id = p_property; -- invalida na mesma transacao
  end if;
  insert into public.index_jobs(property_id, op) values (p_property, p_op)
  on conflict (property_id) where status = 'pending'
  do update set op = excluded.op, run_after = now();
end $$;

create or replace function public.trg_properties_outbox() returns trigger
language plpgsql security definer set search_path = public as $$
declare was boolean := false; now_av boolean;
begin
  if tg_op = 'DELETE' then
    perform public.enqueue_index_job(old.id, 'invalidate');
    return old;
  end if;
  now_av := public.property_is_available(new);
  if tg_op = 'UPDATE' then was := public.property_is_available(old); end if;
  if now_av then
    perform public.enqueue_index_job(new.id, 'upsert');
  elsif was then
    perform public.enqueue_index_job(new.id, 'invalidate');
  end if;
  return new;
end $$;
create trigger properties_outbox after insert or update or delete on public.properties
  for each row execute function public.trg_properties_outbox();

create or replace function public.trg_child_outbox() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid; r record; av boolean;
begin
  r := case when tg_op = 'DELETE' then old else new end;
  if tg_table_name = 'property_images' then
    if not r.is_cover then return r; end if; -- so a capa conta
  end if;
  pid := r.property_id;
  select public.property_is_available(p) into av from public.properties p where p.id = pid;
  if coalesce(av, false) then perform public.enqueue_index_job(pid, 'upsert'); end if;
  return r;
end $$;
create trigger property_features_outbox after insert or update or delete on public.property_features
  for each row execute function public.trg_child_outbox();
create trigger property_images_outbox after insert or update or delete on public.property_images
  for each row execute function public.trg_child_outbox();

-- ===== RPCs do worker (service_role) =====
create or replace function public.claim_index_jobs(p_limit int, p_worker text, p_lease_seconds int)
returns setof public.index_jobs language plpgsql security definer set search_path = public as $$
begin
  return query
  with c as (
    select id from public.index_jobs
    where (status = 'pending' and run_after <= now())
       or (status = 'processing' and locked_at < now() - make_interval(secs => p_lease_seconds))
    order by run_after, id
    limit p_limit
    for update skip locked
  )
  update public.index_jobs j
     set status = 'processing', locked_at = now(), locked_by = p_worker, attempts = j.attempts + 1
    from c where j.id = c.id
  returning j.*;
end $$;

create or replace function public.complete_index_job(p_id bigint) returns void
language sql security definer set search_path = public as $$
  update public.index_jobs set status = 'done', locked_at = null, locked_by = null where id = p_id;
$$;

create or replace function public.fail_index_job(p_id bigint, p_err text, p_max_attempts int default 5) returns void
language plpgsql security definer set search_path = public as $$
declare a int;
begin
  select attempts into a from public.index_jobs where id = p_id;
  update public.index_jobs
     set status = case when a >= p_max_attempts then 'dead' else 'pending' end,
         last_error = left(p_err, 500),
         run_after = now() + make_interval(secs => least(3600, 30 * power(2, greatest(a - 1, 0))::int)),
         locked_at = null, locked_by = null
   where id = p_id;
exception when unique_violation then
  -- ja existe outro pending para o imovel: este job e redundante
  update public.index_jobs set status = 'done', last_error = left(p_err, 500), locked_at = null, locked_by = null where id = p_id;
end $$;

create or replace function public.upsert_property_embedding(p_property uuid, p_doc_hash text, p_model text, p_dims int, p_embedding extensions.vector)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- nao grava vetor de imovel que deixou de estar disponivel
  if not exists (select 1 from public.properties p where p.id = p_property and public.property_is_available(p)) then
    delete from public.property_embeddings where property_id = p_property;
    return;
  end if;
  insert into public.property_embeddings(property_id, doc_hash, model, dims, embedding)
  values (p_property, p_doc_hash, p_model, p_dims, p_embedding)
  on conflict (property_id) do update
    set doc_hash = excluded.doc_hash, model = excluded.model, dims = excluded.dims,
        embedding = excluded.embedding, updated_at = now();
end $$;

-- busca: filtros duros DENTRO do SQL, antes de qualquer score. Nunca devolve endereco.
create or replace function public.search_properties_hybrid(
  p_filters jsonb, p_query_text text, p_query_embedding extensions.vector default null, p_limit int default 10
) returns table (property_id uuid, fts_score real, semantic_score double precision)
language sql stable security definer set search_path = public, extensions as $$
  select p.id,
         case when coalesce(p_query_text,'') = '' then 0::real
              else ts_rank(p.search_tsv, websearch_to_tsquery('portuguese', p_query_text)) end,
         case when p_query_embedding is null then null
              else 1 - (e.embedding <=> p_query_embedding) end
    from public.properties p
    left join public.property_embeddings e
      on e.property_id = p.id and p_query_embedding is not null
     and e.dims = extensions.vector_dims(p_query_embedding)
   where p.status = 'published' and p.deleted_at is null
     and (p_filters->>'city' is null or lower(p.city) = lower(p_filters->>'city'))
     and (p_filters->>'type' is null or lower(p.type) = lower(p_filters->>'type'))
     and (p_filters->>'purpose' is null or p.purpose::text = p_filters->>'purpose')
     and (p_filters->>'neighborhood' is null or lower(p.neighborhood) = lower(p_filters->>'neighborhood'))
     and (p_filters->>'min_price' is null or p.price >= (p_filters->>'min_price')::numeric)
     and (p_filters->>'max_price' is null or p.price <= (p_filters->>'max_price')::numeric)
     and (p_filters->>'min_bedrooms' is null or p.bedrooms >= (p_filters->>'min_bedrooms')::int)
     and (p_filters->>'min_bathrooms' is null or p.bathrooms >= (p_filters->>'min_bathrooms')::int)
     and (p_filters->>'min_parking' is null or p.parking >= (p_filters->>'min_parking')::int)
   order by 3 desc nulls last, 2 desc, p.featured desc, p.price asc nulls last, p.id
   limit least(coalesce(p_limit, 10), 50)
$$;

-- dados atuais para a resposta; reconfirma status/preco; so published
create or replace function public.get_properties_for_response(p_ids uuid[])
returns table (id uuid, code text, slug text, title text, description text, status text,
               purpose public.property_purpose, type text,
               price numeric, city text, neighborhood text, bedrooms int, bathrooms int, parking int, area numeric,
               lat double precision, lng double precision,
               cover_path text, image_paths text[], features text[])
language sql stable security definer set search_path = public as $$
  select p.id, p.code, p.slug, p.title, p.description, p.status::text, p.purpose, p.type, p.price, p.city, p.neighborhood,
         p.bedrooms, p.bathrooms, p.parking, p.area,
         -- coordenada exata so se o admin liberou o endereco; senao aproximada (~1 km)
         (select case when p.address_public then pr.lat else round(pr.lat::numeric, 2)::double precision end
            from public.property_private pr where pr.property_id = p.id),
         (select case when p.address_public then pr.lng else round(pr.lng::numeric, 2)::double precision end
            from public.property_private pr where pr.property_id = p.id),
         (select i.path from public.property_images i where i.property_id = p.id and i.is_cover limit 1),
         coalesce((select array_agg(i.path order by i.position) from public.property_images i where i.property_id = p.id), '{}'),
         coalesce((select array_agg(f.name) from public.property_features pf join public.features f on f.id = pf.feature_id where pf.property_id = p.id), '{}')
    from public.properties p
   where p.id = any(p_ids) and p.status = 'published' and p.deleted_at is null
$$;

create or replace function public.create_lead(
  p_name text, p_phone text, p_email text, p_source text, p_consent_text text,
  p_preferences jsonb default '{}'::jsonb, p_property_ids uuid[] default '{}'
) returns uuid language plpgsql security definer set search_path = public as $$
declare lid uuid;
begin
  if coalesce(trim(p_name), '') = '' and coalesce(trim(p_phone), '') = '' then raise exception 'name or phone required'; end if;
  insert into public.leads(name, phone, email, source, consent_at, consent_text)
  values (p_name, p_phone, p_email, p_source, now(), p_consent_text) returning id into lid;
  insert into public.lead_preferences(lead_id, purpose, city, neighborhood, type, max_price, min_bedrooms, income_range, financing, notes)
  values (lid, nullif(p_preferences->>'purpose','')::public.property_purpose, p_preferences->>'city',
          p_preferences->>'neighborhood', p_preferences->>'type', nullif(p_preferences->>'max_price','')::numeric,
          nullif(p_preferences->>'min_bedrooms','')::int, p_preferences->>'income_range',
          nullif(p_preferences->>'financing',''), p_preferences->>'notes');
  insert into public.lead_properties(lead_id, property_id)
  select lid, p.id from public.properties p where p.id = any(p_property_ids) and p.status = 'published' and p.deleted_at is null
  on conflict do nothing;
  return lid;
end $$;

-- limpeza do chat expirado (chamar via cron/worker)
create or replace function public.purge_expired_chats() returns int language sql security definer set search_path = public as $$
  with d as (delete from public.chat_sessions where expires_at < now() returning 1) select count(*)::int from d;
$$;
