-- Contract 3: the data model. Owned by Role 4 (Mohamed).
-- Tables, enums, row-level security, event triggers and the private lead-files bucket.
-- The app reaches these only through src/lib/db; see docs/team/ for the contract.

-- ── Enums ─────────────────────────────────────────────────────────────────────
create type public.user_role as enum ('user', 'admin');
create type public.lead_status as enum ('new', 'contacted', 'quoted', 'won', 'lost');
create type public.lead_event_kind as enum ('created', 'status', 'owner', 'email', 'note', 'file');

-- ── Tables ────────────────────────────────────────────────────────────────────
-- One row per auth user, created by the on_auth_user_created trigger below.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'user',
  full_name text not null default '',
  created_at timestamptz not null default now()
);

-- A saved sizing run. Results are computed on the server (sizeHotel) and stored with the engine version.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  hotel_name text not null check (char_length(hotel_name) between 1 and 160),
  inputs jsonb not null,
  results jsonb not null,
  engine_version text not null,
  -- 32 hex characters from a random v4 uuid: the read-only share link /p/<token>.
  share_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_owner_id_idx on public.projects (owner_id);

-- Lead ids read like the prototype: L-1001, L-1002, ...
create sequence public.lead_number_seq start 1001;

-- A study request. Inserted only by the server with the service role (no insert policy).
create table public.leads (
  id text primary key default 'L-' || nextval('public.lead_number_seq'),
  project_id uuid references public.projects (id) on delete set null,
  hotel_name text not null check (char_length(hotel_name) between 1 and 160),
  city text not null check (city in ('djerba', 'sousse', 'hammamet', 'tozeur')),
  rooms integer not null check (rooms > 0),
  contact_name text not null,
  email text not null,
  phone text,
  message text,
  consent boolean not null check (consent),
  inputs jsonb not null,
  results jsonb not null,
  engine_version text not null,
  status public.lead_status not null default 'new',
  owner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter sequence public.lead_number_seq owned by public.leads.id;
create index leads_status_idx on public.leads (status);
create index leads_owner_id_idx on public.leads (owner_id);
create index leads_created_at_idx on public.leads (created_at desc);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null references public.leads (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  body text not null check (char_length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);
create index lead_notes_lead_id_idx on public.lead_notes (lead_id);

-- The History tab. Written by the triggers below, and by the server for emails (#19).
create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null references public.leads (id) on delete cascade,
  kind public.lead_event_kind not null,
  data jsonb not null default '{}',
  -- null = the system (e.g. an email sent automatically).
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);
create index lead_events_lead_id_idx on public.lead_events (lead_id);

-- Metadata for objects in the private lead-files bucket.
create table public.lead_files (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null references public.leads (id) on delete cascade,
  path text not null unique check (starts_with(path, lead_id || '/')),
  name text not null,
  size bigint not null check (size >= 0),
  uploaded_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);
create index lead_files_lead_id_idx on public.lead_files (lead_id);

-- ── Helpers ───────────────────────────────────────────────────────────────────
-- True when the signed-in user is a team member. Security definer so policies can call it
-- without needing read access to every profile.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- The admin with the fewest open leads (new, contacted or quoted). Ties go to the earliest admin.
create function public.next_lead_owner()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  left join public.leads l
    on l.owner_id = p.id and l.status in ('new', 'contacted', 'quoted')
  where p.role = 'admin'
  group by p.id, p.created_at
  order by count(l.id), p.created_at, p.id
  limit 1;
$$;
alter table public.leads alter column owner_id set default public.next_lead_owner();

-- The share link: anyone with the token reads these five fields and nothing else.
create function public.get_shared_project(token text)
returns table (hotel_name text, inputs jsonb, results jsonb, engine_version text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.hotel_name, p.inputs, p.results, p.engine_version, p.created_at
  from public.projects p
  where p.share_token = token;
$$;

-- ── Triggers ──────────────────────────────────────────────────────────────────
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'user',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- A lead can only be owned by a team member.
create function public.check_lead_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null
     and not exists (select 1 from public.profiles where id = new.owner_id and role = 'admin') then
    raise exception 'A lead can only be owned by an admin.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger leads_check_owner
  before insert or update of owner_id on public.leads
  for each row execute function public.check_lead_owner();

-- History: one event per lead creation, status change, reassignment, note and file.
create function public.log_lead_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'leads' and tg_op = 'INSERT' then
    insert into public.lead_events (lead_id, kind, data, actor_id)
    values (
      new.id, 'created',
      jsonb_build_object('source', case when new.project_id is null then 'website form' else 'saved project' end),
      null
    );
  elsif tg_table_name = 'leads' then
    if new.status is distinct from old.status then
      insert into public.lead_events (lead_id, kind, data, actor_id)
      values (new.id, 'status', jsonb_build_object('from', old.status, 'to', new.status), auth.uid());
    end if;
    if new.owner_id is distinct from old.owner_id then
      insert into public.lead_events (lead_id, kind, data, actor_id)
      values (new.id, 'owner', jsonb_build_object('from', old.owner_id, 'to', new.owner_id), auth.uid());
    end if;
  elsif tg_table_name = 'lead_notes' then
    insert into public.lead_events (lead_id, kind, data, actor_id)
    values (new.lead_id, 'note', jsonb_build_object('noteId', new.id), new.author_id);
  elsif tg_table_name = 'lead_files' then
    insert into public.lead_events (lead_id, kind, data, actor_id)
    values (new.lead_id, 'file', jsonb_build_object('fileId', new.id, 'name', new.name), new.uploaded_by);
  end if;
  return new;
end;
$$;
create trigger leads_log_created
  after insert on public.leads
  for each row execute function public.log_lead_event();
create trigger leads_log_changes
  after update of status, owner_id on public.leads
  for each row execute function public.log_lead_event();
create trigger lead_notes_log
  after insert on public.lead_notes
  for each row execute function public.log_lead_event();
create trigger lead_files_log
  after insert on public.lead_files
  for each row execute function public.log_lead_event();

-- ── Row-level security ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_events enable row level security;
alter table public.lead_files enable row level security;

-- Profiles: you read your own; admins read everyone. Nobody but the service role changes a role.
create policy "Read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using ((select public.is_admin()));

-- Projects: the owner does everything with their own rows; nobody else sees them
-- (the share link goes through get_shared_project).
create policy "Owners read own projects" on public.projects
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owners create own projects" on public.projects
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owners update own projects" on public.projects
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners delete own projects" on public.projects
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Leads: admins only. No insert policy: study requests are inserted by the server (service role).
create policy "Admins read leads" on public.leads
  for select to authenticated using ((select public.is_admin()));
create policy "Admins update leads" on public.leads
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete leads" on public.leads
  for delete to authenticated using ((select public.is_admin()));

create policy "Admins read notes" on public.lead_notes
  for select to authenticated using ((select public.is_admin()));
create policy "Admins write own notes" on public.lead_notes
  for insert to authenticated with check ((select public.is_admin()) and author_id = (select auth.uid()));

-- Events are written by triggers and the server; admins only read them.
create policy "Admins read events" on public.lead_events
  for select to authenticated using ((select public.is_admin()));

create policy "Admins read files" on public.lead_files
  for select to authenticated using ((select public.is_admin()));
create policy "Admins add files" on public.lead_files
  for insert to authenticated with check ((select public.is_admin()) and uploaded_by = (select auth.uid()));
create policy "Admins delete files" on public.lead_files
  for delete to authenticated using ((select public.is_admin()));

-- Only the RPCs the app calls are reachable; the trigger helpers are not.
revoke execute on function public.next_lead_owner() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.check_lead_owner() from public, anon, authenticated;
revoke execute on function public.log_lead_event() from public, anon, authenticated;
grant execute on function public.get_shared_project(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- ── Storage: the private lead-files bucket, admins only ───────────────────────
insert into storage.buckets (id, name, public)
values ('lead-files', 'lead-files', false)
on conflict (id) do nothing;

create policy "Admins read lead files" on storage.objects
  for select to authenticated using (bucket_id = 'lead-files' and (select public.is_admin()));
create policy "Admins upload lead files" on storage.objects
  for insert to authenticated with check (bucket_id = 'lead-files' and (select public.is_admin()));
create policy "Admins delete lead files" on storage.objects
  for delete to authenticated using (bucket_id = 'lead-files' and (select public.is_admin()));
