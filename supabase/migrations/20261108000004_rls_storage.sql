-- 0004 RLS, grants, view publica, storage.
-- Principio: anon NAO tem acesso a tabelas. Publico le so a view public_properties (+ fotos via URL assinada no servidor).

alter table public.admin_users enable row level security;
alter table public.features enable row level security;
alter table public.properties enable row level security;
alter table public.property_private enable row level security;
alter table public.property_features enable row level security;
alter table public.property_images enable row level security;
alter table public.property_views enable row level security;
alter table public.site_settings enable row level security;
alter table public.leads enable row level security;
alter table public.lead_preferences enable row level security;
alter table public.lead_properties enable row level security;
alter table public.lead_activities enable row level security;
alter table public.visits enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.property_embeddings enable row level security;
alter table public.index_jobs enable row level security;

-- revoga tudo de anon/public; authenticated so passa pelas policies is_admin()
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- admin: CRUD nas tabelas de negocio
do $$
declare t text;
begin
  foreach t in array array['features','properties','property_private','property_features','property_images',
    'leads','lead_preferences','lead_properties','lead_activities','visits','site_settings'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin_all', t);
  end loop;
end $$;

-- somente leitura para admin
grant select on public.audit_logs, public.property_views, public.admin_users to authenticated;
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.is_admin());
create policy views_admin_read on public.property_views for select to authenticated using (public.is_admin());
create policy admin_users_self_read on public.admin_users for select to authenticated using (user_id = auth.uid());
-- embeddings, index_jobs, chat_*: sem policy = so service_role (bypassa RLS)

-- view publica: sem endereco/CRM/PPI; so published e nao excluido
create view public.public_properties with (security_invoker = false) as
  select p.id, p.code, p.slug, p.title, p.description, p.purpose, p.type, p.price, p.condo_fee, p.iptu,
         p.region, p.city, p.state, p.neighborhood, p.bedrooms, p.suites, p.bathrooms, p.parking,
         p.area, p.area_total, p.featured, p.published_at, p.created_at,
         case when p.address_public then pr.address end as address,
         -- coordenada exata so se o admin liberou; senao arredondada (~1 km) p/ proximidade sem revelar o endereco
         case when p.address_public then pr.lat else round(pr.lat::numeric, 2)::double precision end as lat,
         case when p.address_public then pr.lng else round(pr.lng::numeric, 2)::double precision end as lng,
         (select i.path from public.property_images i where i.property_id = p.id and i.is_cover limit 1) as cover_path
    from public.properties p
    left join public.property_private pr on pr.property_id = p.id
   where p.status = 'published' and p.deleted_at is null;
grant select on public.public_properties to anon, authenticated;

-- configuracoes publicas (somente campos nao sensiveis)
create view public.public_site_settings with (security_invoker = false) as
  select business_name, logo_url, avatar_url, whatsapp, whatsapp as whatsapp_number, email, bio, creci,
         instagram, facebook, youtube, tiktok, default_message, hero_title, hero_subtitle, featured_limit
    from public.site_settings where id = 1;
grant select on public.public_site_settings to anon, authenticated;

-- RPCs do worker/lead: so service_role
grant execute on function public.claim_index_jobs(int, text, int) to service_role;
grant execute on function public.complete_index_job(bigint) to service_role;
grant execute on function public.fail_index_job(bigint, text, int) to service_role;
grant execute on function public.upsert_property_embedding(uuid, text, text, int, extensions.vector) to service_role;
grant execute on function public.search_properties_hybrid(jsonb, text, extensions.vector, int) to service_role;
grant execute on function public.get_properties_for_response(uuid[]) to service_role;
grant execute on function public.create_lead(text, text, text, text, text, jsonb, uuid[]) to service_role;
grant execute on function public.purge_expired_chats() to service_role;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ===== Storage =====
-- property-images: PRIVADO (URL publica de bucket ignora policies). Servidor gera URL assinada
-- so para imoveis published. Caminho: <property_id>/<arquivo>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- site-assets: logo/avatar, publico por desenho (nao contem dados de imoveis)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 2097152, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

create policy property_images_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'property-images' and public.is_admin())
  with check (bucket_id = 'property-images' and public.is_admin());
-- Helper: o anon NAO tem SELECT em public.properties (correto), entao a policy nao pode consultar a tabela.
-- Funcao SECURITY DEFINER com search_path fixo, devolve so um boolean e so para o id informado.
create or replace function public.is_property_published(p_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.properties p
     where p.id::text = p_id and p.status = 'published' and p.deleted_at is null);
$$;
revoke all on function public.is_property_published(text) from public;
grant execute on function public.is_property_published(text) to anon, authenticated;

create policy property_images_read_published on storage.objects for select to anon, authenticated
  using (bucket_id = 'property-images' and (
    public.is_admin() or public.is_property_published((storage.foldername(name))[1])));
create policy site_assets_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

-- fotos publicas (so de imoveis published); anon pode assinar URLs porque a policy de storage permite SELECT nelas
create view public.public_property_images with (security_invoker = false) as
  select i.id, i.property_id, i.path, i.width, i.height, i.position, i.is_cover
    from public.property_images i
    join public.properties p on p.id = i.property_id
   where p.status = 'published' and p.deleted_at is null;
grant select on public.public_property_images to anon, authenticated;

-- indicadores do painel (so admin). Dados reais; sem agregacao no cliente.
create or replace function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select jsonb_build_object(
    'totalProperties', (select count(*) from properties where deleted_at is null),
    'published', (select count(*) from properties where deleted_at is null and status = 'published'),
    'reservedOrSold', (select count(*) from properties where deleted_at is null and status in ('reserved','sold','rented')),
    'newLeads', (select count(*) from leads where status = 'new'),
    'leadsInProgress', (select count(*) from leads where status in ('first_contact','negotiating','visit_scheduled')),
    'leadsLast30d', (select count(*) from leads where created_at >= now() - interval '30 days'),
    'mostViewed', coalesce((select jsonb_agg(x) from (
        select p.id, p.title, count(v.id) as count from property_views v join properties p on p.id = v.property_id
         where p.deleted_at is null group by p.id, p.title order by count(v.id) desc limit 5) x), '[]'::jsonb),
    'mostInterest', coalesce((select jsonb_agg(x) from (
        select p.id, p.title, count(*) as count from lead_properties lp join properties p on p.id = lp.property_id
         where lp.kind = 'interest' and p.deleted_at is null group by p.id, p.title order by count(*) desc limit 5) x), '[]'::jsonb),
    'leadsByWeek', (select coalesce(jsonb_agg(jsonb_build_object('week', to_char(w, 'DD/MM'),
        'count', (select count(*) from leads l where l.created_at >= w and l.created_at < w + interval '7 days')) order by w), '[]'::jsonb)
        from generate_series(date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week') w)
  ) into r;
  return r;
end $$;
grant execute on function public.admin_dashboard_stats() to authenticated;
revoke execute on function public.admin_dashboard_stats() from public, anon;

create view public.public_property_features with (security_invoker = false) as
  select pf.property_id, f.name
    from public.property_features pf
    join public.features f on f.id = pf.feature_id
    join public.properties p on p.id = pf.property_id
   where p.status = 'published' and p.deleted_at is null;
grant select on public.public_property_features to anon, authenticated;
