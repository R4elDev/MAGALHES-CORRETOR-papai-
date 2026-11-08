-- Testes de RLS/privacidade/outbox/storage. Rodar DENTRO de uma transacao com ROLLBACK (nada persiste):
--   begin; <migrations>; <este arquivo>; rollback;
-- Usa fixtures sinteticas (dominio .invalid) e claims JWT simulados; nao cria conta real.
-- Resultado: ultima instrucao lista test/ok/detail. Todos devem ter ok = true.

create temp table results (test text, ok boolean, detail text);

-- ===== fixtures (como postgres) =====
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-0000000000a1', 'admin-teste@example.invalid'),
  ('aaaaaaaa-0000-0000-0000-0000000000a2', 'user-teste@example.invalid');
insert into public.admin_users (user_id, email) values ('aaaaaaaa-0000-0000-0000-0000000000a1', 'admin-teste@example.invalid');

insert into public.properties (id, slug, code, title, status, type, purpose, price, city, neighborhood, bedrooms, bathrooms, parking, area) values
  ('11111111-1111-1111-1111-111111111111', 'imovel-publicado', 'T-001', 'Imovel publicado (teste)', 'published', 'apartment', 'sale', 300000, 'Barueri', 'Centro', 2, 1, 1, 60),
  ('22222222-2222-2222-2222-222222222222', 'imovel-rascunho', 'T-002', 'Imovel rascunho (teste)', 'draft', 'apartment', 'sale', 300000, 'Barueri', 'Centro', 2, 1, 1, 60);
insert into public.property_private (property_id, address, lat, lng) values
  ('11111111-1111-1111-1111-111111111111', 'Rua Secreta 123', -23.5055, -46.8741),
  ('22222222-2222-2222-2222-222222222222', 'Rua Secreta 456', -23.5055, -46.8741);
insert into public.property_images (property_id, path, is_cover) values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111/cover.webp', true),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222/cover.webp', true);
insert into storage.objects (bucket_id, name) values
  ('property-images', '11111111-1111-1111-1111-111111111111/cover.webp'),
  ('property-images', '22222222-2222-2222-2222-222222222222/cover.webp');
insert into public.features (id, slug, name) values ('33333333-3333-3333-3333-333333333333', 'piscina-teste', 'Piscina');
insert into public.property_features (property_id, feature_id) values ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333');

-- ===== ANON =====
do $$
declare t text; bad text := '';
begin
  set local role anon;
  foreach t in array array['admin_users','features','properties','property_private','property_features','property_images',
    'property_views','site_settings','leads','lead_preferences','lead_properties','lead_activities','visits',
    'chat_sessions','chat_messages','audit_logs','property_embeddings','index_jobs'] loop
    begin
      execute format('select 1 from public.%I limit 1', t);
      bad := bad || t || ' ';
    exception when insufficient_privilege then null;
    end;
  end loop;
  reset role;
  insert into results values ('anon: nenhuma tabela legivel', bad = '', nullif(bad, ''));
end $$;

do $$
declare n int; nd int; addr text; la double precision; ni int; nf int; ns int;
begin
  set local role anon;
  select count(*) into n from public.public_properties;
  select count(*) into nd from public.public_properties where slug = 'imovel-rascunho';
  select address, lat into addr, la from public.public_properties where slug = 'imovel-publicado';
  select count(*) into ni from public.public_property_images;
  select count(*) into nf from public.public_property_features;
  select count(*) into ns from public.public_site_settings;
  reset role;
  insert into results values ('anon: view so mostra published (1 de 2)', n = 1 and nd = 0, n::text);
  insert into results values ('anon: endereco exato oculto na view', addr is null, addr);
  insert into results values ('anon: coordenada aproximada (-23.51)', la = -23.51, la::text);
  insert into results values ('anon: fotos/comodidades so de published', ni = 1 and nf = 1, ni || '/' || nf);
  insert into results values ('anon: public_site_settings legivel', ns = 1, ns::text);
end $$;

do $$
declare n int; pub_ok boolean; draft_ok boolean;
begin
  set local role anon;
  select count(*) into n from storage.objects where bucket_id = 'property-images';
  select public.is_property_published('11111111-1111-1111-1111-111111111111') into pub_ok;
  select public.is_property_published('22222222-2222-2222-2222-222222222222') into draft_ok;
  reset role;
  insert into results values ('storage anon: so foto de imovel published', n = 1, n::text);
  insert into results values ('helper is_property_published (pub=true, draft=false)', pub_ok and not draft_ok, null);
end $$;

do $$
declare t text; bad text := '';
begin
  set local role anon;
  foreach t in array array[
    'select public.claim_index_jobs(1, ''x'', 60)',
    'select public.complete_index_job(1)',
    'select public.fail_index_job(1, ''x'', 5)',
    'select public.create_lead(''a'', ''1'', null, null, null)',
    'select public.get_properties_for_response(array[''11111111-1111-1111-1111-111111111111''::uuid])',
    'select public.search_properties_hybrid(''{}''::jsonb, ''x'', null, 5)',
    'select public.admin_dashboard_stats()',
    'select public.purge_expired_chats()'] loop
    begin execute t; bad := bad || t || ' | ';
    exception when insufficient_privilege then null;
    end;
  end loop;
  reset role;
  insert into results values ('anon: RPCs de servico/admin negadas', bad = '', nullif(bad, ''));
end $$;

-- ===== AUTHENTICATED nao-admin =====
do $$
declare np int; nl int; ns int; ins_blocked boolean := false; stats_blocked boolean := false; ra int;
begin
  perform set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into np from public.properties;
  select count(*) into nl from public.leads;
  select count(*) into ns from storage.objects where bucket_id = 'property-images';
  select count(*) into ra from public.admin_users;
  begin insert into public.leads (name) values ('x'); exception when insufficient_privilege then ins_blocked := true; end;
  begin perform public.admin_dashboard_stats(); exception when insufficient_privilege then stats_blocked := true; end;
  reset role;
  insert into results values ('usuario comum: nao le properties/leads', np = 0 and nl = 0, np || '/' || nl);
  insert into results values ('usuario comum: nao insere lead (RLS)', ins_blocked, null);
  insert into results values ('usuario comum: storage so published', ns = 1, ns::text);
  insert into results values ('usuario comum: nao ve admin_users', ra = 0, ra::text);
  insert into results values ('usuario comum: stats negado', stats_blocked, null);
end $$;

-- ===== ADMIN =====
do $$
declare np int; npr int; ns int; st jsonb; ok_lead boolean := true; na int;
begin
  perform set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into np from public.properties;
  select count(*) into npr from public.property_private;
  select count(*) into ns from storage.objects where bucket_id = 'property-images';
  select public.admin_dashboard_stats() into st;
  begin insert into public.leads (name) values ('Lead de teste'); exception when others then ok_lead := false; end;
  select count(*) into na from public.audit_logs;
  reset role;
  insert into results values ('admin: ve todos os imoveis e dados privados', np = 2 and npr = 2, np || '/' || npr);
  insert into results values ('admin: storage ve rascunho tambem', ns = 2, ns::text);
  insert into results values ('admin: stats (total 2, published 1)', (st->>'totalProperties')::int = 2 and (st->>'published')::int = 1, st::text);
  insert into results values ('admin: cria lead', ok_lead, null);
  insert into results values ('admin: audit_logs legivel e populado', na >= 1, na::text);
end $$;

-- ===== OUTBOX / RAG (como postgres) =====
do $$
declare j1 int; j2 int; op1 text; ne int; np int; st text; dead_ok boolean;
begin
  select count(*) into j1 from public.index_jobs where property_id = '11111111-1111-1111-1111-111111111111' and op = 'upsert' and status = 'pending';
  select count(*) into j2 from public.index_jobs where property_id = '22222222-2222-2222-2222-222222222222';
  insert into results values ('outbox: published gera 1 upsert pending', j1 = 1, j1::text);
  insert into results values ('outbox: rascunho nao gera job', j2 = 0, j2::text);

  perform public.upsert_property_embedding('11111111-1111-1111-1111-111111111111', 'h', 'm', 3, '[1,2,3]');
  select count(*) into ne from public.property_embeddings;
  insert into results values ('embedding gravado para published', ne = 1, ne::text);
  perform public.upsert_property_embedding('22222222-2222-2222-2222-222222222222', 'h', 'm', 3, '[1,2,3]');
  select count(*) into ne from public.property_embeddings;
  insert into results values ('embedding NAO gravado para rascunho', ne = 1, ne::text);

  update public.properties set status = 'sold' where id = '11111111-1111-1111-1111-111111111111';
  select count(*) into ne from public.property_embeddings;
  select op, count(*) over () into op1, np from public.index_jobs where property_id = '11111111-1111-1111-1111-111111111111' and status = 'pending';
  insert into results values ('vender invalida: embedding removido na mesma transacao', ne = 0, ne::text);
  insert into results values ('vender: 1 pending (dedupe) com op=invalidate', op1 = 'invalidate' and np = 1, op1 || '/' || np);

  update public.properties set status = 'published' where id = '11111111-1111-1111-1111-111111111111';
  select op, count(*) over () into op1, np from public.index_jobs where property_id = '11111111-1111-1111-1111-111111111111' and status = 'pending';
  insert into results values ('republicar: pending vira upsert (dedupe)', op1 = 'upsert' and np = 1, op1 || '/' || np);

  update public.properties set deleted_at = now() where id = '11111111-1111-1111-1111-111111111111';
  select count(*) into ne from public.property_embeddings;
  select op into op1 from public.index_jobs where property_id = '11111111-1111-1111-1111-111111111111' and status = 'pending';
  insert into results values ('exclusao logica invalida', op1 = 'invalidate', op1);
  update public.properties set deleted_at = null where id = '11111111-1111-1111-1111-111111111111';

  -- claim / fail / complete
  select count(*) into np from public.claim_index_jobs(10, 'teste', 60);
  select count(*) into ne from public.index_jobs where status = 'processing' and locked_by = 'teste';
  insert into results values ('claim_index_jobs trava com lease', np >= 1 and ne = np, np || '/' || ne);
  perform public.fail_index_job(id, 'erro de teste', 1) from public.index_jobs where status = 'processing';
  select bool_and(status = 'dead') into dead_ok from public.index_jobs where last_error = 'erro de teste';
  insert into results values ('fail_index_job: dead apos max tentativas', coalesce(dead_ok, false), null);
end $$;

do $$
declare lid uuid; nlp int; blocked boolean := false;
begin
  select public.create_lead('Fulano Teste', '11999999999', null, 'teste', 'consentimento de teste',
    '{"city":"Barueri","financing":"avaliando","income_range":"4000"}'::jsonb,
    array['11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid]) into lid;
  select count(*) into nlp from public.lead_properties where lead_id = lid;
  insert into results values ('create_lead vincula so imovel published', lid is not null and nlp = 1, nlp::text);
  begin perform public.create_lead(null, null, null, null, null); exception when others then blocked := true; end;
  insert into results values ('create_lead exige nome ou telefone', blocked, null);
end $$;

do $$
declare n_all int; n_none int; has_draft boolean; r record; n_resp int; st text; la double precision;
begin
  select count(*), coalesce(bool_or(property_id = '22222222-2222-2222-2222-222222222222'), false)
    into n_all, has_draft from public.search_properties_hybrid('{"city":"barueri"}'::jsonb, '', null, 10);
  select count(*) into n_none from public.search_properties_hybrid('{"max_price":1000}'::jsonb, '', null, 10);
  insert into results values ('busca: filtro duro exclui rascunho', n_all = 1 and not has_draft, n_all::text);
  insert into results values ('busca: max_price aplicado no SQL', n_none = 0, n_none::text);
  select count(*), min(status), min(lat) into n_resp, st, la
    from public.get_properties_for_response(array['11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid]);
  insert into results values ('get_properties_for_response: so published, coord aproximada', n_resp = 1 and st = 'published' and la = -23.51, n_resp || '/' || st || '/' || la);
end $$;

do $$
declare pub boolean;
begin
  select public into pub from storage.buckets where id = 'property-images';
  insert into results values ('bucket property-images e privado', pub = false, pub::text);
end $$;

select test, ok, detail from results order by ok, test;
