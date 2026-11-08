-- 0005 Salvamento ATOMICO do imovel: properties + property_private + property_features numa so transacao.
-- SECURITY INVOKER: a RLS continua valendo (nao enfraquece nada); alem disso exige is_admin() explicitamente.
-- Triggers do outbox (index_jobs) disparam na MESMA transacao; qualquer erro (FK, enum, NOT NULL) desfaz tudo.
-- Whitelist: so as chaves abaixo sao lidas; chaves desconhecidas sao ignoradas.
-- Update parcial: so atualiza as chaves presentes no jsonb. p_feature_ids null = nao mexe nas comodidades.

create or replace function public.admin_save_property(p_id uuid, p jsonb, p_feature_ids uuid[] default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  pid uuid := p_id;
  v_slug text;
  created boolean := false;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  if pid is null then
    v_slug := nullif(trim(p->>'slug'), '');
    if v_slug is null then raise exception 'slug required' using errcode = '22023'; end if;
    insert into public.properties (
      slug, code, title, description, type, purpose, price, condo_fee, iptu, area, area_total,
      bedrooms, bathrooms, suites, parking, city, state, neighborhood, status, featured, address_public)
    values (
      v_slug, p->>'code', p->>'title', p->>'description', p->>'type',
      coalesce((p->>'purpose')::public.property_purpose, 'sale'),
      (p->>'price')::numeric, (p->>'condo_fee')::numeric, (p->>'iptu')::numeric,
      (p->>'area_useful')::numeric, (p->>'area_total')::numeric,
      (p->>'bedrooms')::int, (p->>'bathrooms')::int, (p->>'suites')::int, (p->>'parking')::int,
      p->>'city', p->>'state', p->>'neighborhood',
      coalesce((p->>'status')::public.property_status, 'draft'),
      coalesce((p->>'featured')::boolean, false),
      not coalesce((p->>'hide_address')::boolean, true))
    returning id into pid;
    created := true;
  else
    update public.properties set
      code         = case when jsonb_exists(p, 'code')         then p->>'code' else code end,
      title        = case when jsonb_exists(p, 'title')        then p->>'title' else title end,
      description  = case when jsonb_exists(p, 'description')  then p->>'description' else description end,
      type         = case when jsonb_exists(p, 'type')         then p->>'type' else type end,
      purpose      = case when jsonb_exists(p, 'purpose')      then (p->>'purpose')::public.property_purpose else purpose end,
      price        = case when jsonb_exists(p, 'price')        then (p->>'price')::numeric else price end,
      condo_fee    = case when jsonb_exists(p, 'condo_fee')    then (p->>'condo_fee')::numeric else condo_fee end,
      iptu         = case when jsonb_exists(p, 'iptu')         then (p->>'iptu')::numeric else iptu end,
      area         = case when jsonb_exists(p, 'area_useful')  then (p->>'area_useful')::numeric else area end,
      area_total   = case when jsonb_exists(p, 'area_total')   then (p->>'area_total')::numeric else area_total end,
      bedrooms     = case when jsonb_exists(p, 'bedrooms')     then (p->>'bedrooms')::int else bedrooms end,
      bathrooms    = case when jsonb_exists(p, 'bathrooms')    then (p->>'bathrooms')::int else bathrooms end,
      suites       = case when jsonb_exists(p, 'suites')       then (p->>'suites')::int else suites end,
      parking      = case when jsonb_exists(p, 'parking')      then (p->>'parking')::int else parking end,
      city         = case when jsonb_exists(p, 'city')         then p->>'city' else city end,
      state        = case when jsonb_exists(p, 'state')        then p->>'state' else state end,
      neighborhood = case when jsonb_exists(p, 'neighborhood') then p->>'neighborhood' else neighborhood end,
      status       = case when jsonb_exists(p, 'status')       then (p->>'status')::public.property_status else status end,
      featured     = case when jsonb_exists(p, 'featured')     then (p->>'featured')::boolean else featured end,
      address_public = case when jsonb_exists(p, 'hide_address') then not (p->>'hide_address')::boolean else address_public end
    where id = pid and deleted_at is null;
    if not found then raise exception 'imovel nao encontrado' using errcode = 'P0002'; end if;
  end if;

  if created or jsonb_exists(p, 'address') or jsonb_exists(p, 'latitude') or jsonb_exists(p, 'longitude') then
    insert into public.property_private (property_id, address, lat, lng)
    values (pid, p->>'address', (p->>'latitude')::double precision, (p->>'longitude')::double precision)
    on conflict (property_id) do update set
      address = case when jsonb_exists(p, 'address')   then excluded.address else public.property_private.address end,
      lat     = case when jsonb_exists(p, 'latitude')  then excluded.lat     else public.property_private.lat end,
      lng     = case when jsonb_exists(p, 'longitude') then excluded.lng     else public.property_private.lng end,
      updated_at = now();
  end if;

  if p_feature_ids is not null then
    delete from public.property_features where property_id = pid and feature_id <> all (p_feature_ids);
    insert into public.property_features (property_id, feature_id)
    select pid, f from unnest(p_feature_ids) as f
    on conflict do nothing; -- FK invalida: erro e rollback de tudo
  end if;

  return jsonb_build_object('id', pid, 'slug', (select slug from public.properties where id = pid));
end $$;

revoke all on function public.admin_save_property(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.admin_save_property(uuid, jsonb, uuid[]) to authenticated;
