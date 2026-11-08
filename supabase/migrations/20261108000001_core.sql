-- 0001 core: extensoes, enums, helpers, imoveis. ADITIVA (schema public estava vazio na auditoria de 2026-11-08).
create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.property_status as enum ('draft','published','reserved','sold','rented','archived');
create type public.property_purpose as enum ('sale','rent');
create type public.lead_status as enum ('new','first_contact','negotiating','visit_scheduled','done','lost');
create type public.lead_contact_kind as enum ('click','confirmed','manual');
create type public.visit_status as enum ('scheduled','done','cancelled','no_show');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.features (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  code text unique, -- codigo interno (aparece no WhatsApp)
  slug text not null unique,
  title text not null,
  description text,
  status public.property_status not null default 'draft',
  purpose public.property_purpose not null default 'sale',
  type text not null,
  price numeric(14,2) check (price is null or price >= 0),
  condo_fee numeric(12,2) check (condo_fee is null or condo_fee >= 0),
  iptu numeric(12,2) check (iptu is null or iptu >= 0),
  region text,
  city text,
  state text,
  neighborhood text,
  bedrooms int check (bedrooms >= 0),
  suites int check (suites >= 0),
  bathrooms int check (bathrooms >= 0),
  parking int check (parking >= 0),
  area numeric(10,2) check (area >= 0), -- area util
  area_total numeric(10,2) check (area_total >= 0),
  featured boolean not null default false,
  address_public boolean not null default false, -- false = endereco e coordenada exata ocultos
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as (
    to_tsvector('portuguese', coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(city,'')||' '||coalesce(neighborhood,'')||' '||coalesce(type,''))
  ) stored
);
create index properties_search_idx on public.properties using gin (search_tsv);
create index properties_avail_idx on public.properties (status, city, price) where deleted_at is null;
create trigger properties_updated before update on public.properties for each row execute function public.set_updated_at();

create or replace function public.set_published_at() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end $$;
create trigger properties_published_at before insert or update on public.properties for each row execute function public.set_published_at();

-- dados privados (endereco exato, proprietario, PPI): admin only, nunca na view publica
create table public.property_private (
  property_id uuid primary key references public.properties(id) on delete cascade,
  address text,
  lat double precision, -- coordenada exata: nunca publica (a view expoe aproximada)
  lng double precision,
  owner_name text,
  owner_phone text,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.property_features (
  property_id uuid not null references public.properties(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  primary key (property_id, feature_id)
);

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  path text not null,
  width int,
  height int,
  position int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index property_images_one_cover on public.property_images (property_id) where is_cover;

create table public.property_views (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index property_views_idx on public.property_views (property_id, viewed_at);

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  business_name text,
  logo_url text,   -- bucket publico site-assets
  avatar_url text,
  whatsapp text,   -- DDI+DDD+numero, so digitos
  email text,
  bio text,
  creci text,
  instagram text,
  facebook text,
  youtube text,
  tiktok text,
  default_message text, -- mensagem comercial padrao (WhatsApp)
  hero_title text,
  hero_subtitle text,
  featured_limit int not null default 6 check (featured_limit between 1 and 12),
  extra jsonb not null default '{}'::jsonb, -- SEM chaves de IA nem segredos
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1);
