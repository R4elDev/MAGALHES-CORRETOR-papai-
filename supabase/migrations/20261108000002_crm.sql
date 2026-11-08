-- 0002 CRM: leads, preferencias, atividades, visitas, chat, auditoria
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text, -- "se informado"
  phone text,
  email text,
  status public.lead_status not null default 'new',
  contact_kind public.lead_contact_kind not null default 'click',
  source text,
  consent_at timestamptz,
  consent_text text,
  next_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_status_idx on public.leads (status, created_at desc);
create trigger leads_updated before update on public.leads for each row execute function public.set_updated_at();

create table public.lead_preferences (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  purpose public.property_purpose,
  city text,
  neighborhood text,
  type text,
  max_price numeric(14,2),
  min_bedrooms int,
  income_range text, -- sensivel: admin/service only, nunca em URL/log
  financing text check (financing in ('financiar','a_vista','avaliando')),
  notes text
);

create table public.lead_properties (
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  kind text not null default 'interest' check (kind in ('interest','viewed','suggested')),
  created_at timestamptz not null default now(),
  primary key (lead_id, property_id, kind)
);

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null check (type in ('note','status_change','contact','contact_confirmed','visit')),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index lead_activities_idx on public.lead_activities (lead_id, created_at desc);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  visitor_name text,
  property_id uuid not null references public.properties(id) on delete cascade,
  scheduled_at timestamptz not null,
  status public.visit_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger visits_updated before update on public.visits for each row execute function public.set_updated_at();

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create table public.chat_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
create index chat_messages_idx on public.chat_messages (session_id, id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  table_name text not null,
  row_id text,
  at timestamptz not null default now()
);

-- auditoria sem copiar dados sensiveis: so quem, o que e quando
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path = public as $$
declare rid text;
begin
  rid := coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id', '');
  insert into public.audit_logs(actor, action, table_name, row_id) values (auth.uid(), tg_op, tg_table_name, rid);
  return null;
end $$;
create trigger audit_properties after insert or update or delete on public.properties for each row execute function public.audit_row();
create trigger audit_leads after insert or update or delete on public.leads for each row execute function public.audit_row();
create trigger audit_visits after insert or update or delete on public.visits for each row execute function public.audit_row();
create trigger audit_settings after update on public.site_settings for each row execute function public.audit_row();
