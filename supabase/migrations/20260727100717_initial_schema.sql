-- One shared workspace per row
create table page (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  goal_title   text,
  goal_type    text not null default 'total_coins'
               check (goal_type in ('total_coins','total_sessions','deadline')),
  goal_target  numeric,          -- e.g. target coins or target sessions
  goal_deadline date,            -- optional
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Participants, added by name only (no accounts)
create table person (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references page(id) on delete cascade,
  name       text not null,
  color      text,               -- UI accent, optional
  created_at timestamptz not null default now()
);

-- Groups of sessions
create table section (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references page(id) on delete cascade,
  title      text not null,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);

-- The core unit: a note + metadata
create table session (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references section(id) on delete cascade,
  page_id     uuid not null references page(id) on delete cascade,  -- denormalized for easy scoping
  title       text not null,
  note        text,
  coin_value  int  not null default 1,
  status      text not null default 'todo' check (status in ('todo','done')),
  done_at     timestamptz,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Many-to-many: which people are attributed to a session
create table session_person (
  session_id uuid not null references session(id) on delete cascade,
  person_id  uuid not null references person(id) on delete cascade,
  primary key (session_id, person_id)
);

create index on person(page_id);
create index on section(page_id);
create index on session(section_id);
create index on session(page_id);
create index on session_person(person_id);

-- Derived per-person score (coins are computed, never stored, see SPEC.md §2)
create view person_score as
select
  p.id                                                              as person_id,
  p.page_id,
  p.name,
  coalesce(sum(s.coin_value) filter (where s.status = 'done'), 0)   as coins,
  count(s.id)            filter (where s.status = 'done')           as sessions_done
from person p
left join session_person sp on sp.person_id = p.id
left join session s         on s.id = sp.session_id
group by p.id;

-- RLS — v1 permissive: fully open CRUD for the anon role (public anon key).
-- See SPEC.md §5.3. Accepted trade-off for small trusted groups + unguessable slugs.
alter table page           enable row level security;
alter table person         enable row level security;
alter table section        enable row level security;
alter table session        enable row level security;
alter table session_person enable row level security;

create policy anon_all on page           for all to anon using (true) with check (true);
create policy anon_all on person         for all to anon using (true) with check (true);
create policy anon_all on section        for all to anon using (true) with check (true);
create policy anon_all on session        for all to anon using (true) with check (true);
create policy anon_all on session_person for all to anon using (true) with check (true);

-- Realtime: enable live sync on mutable tables (SPEC.md §5.5)
alter publication supabase_realtime add table session;
alter publication supabase_realtime add table session_person;
alter publication supabase_realtime add table section;
alter publication supabase_realtime add table person;
