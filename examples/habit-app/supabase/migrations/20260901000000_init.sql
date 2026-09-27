create table public.habits (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  title text not null
);
create table public.journal (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  body text
);
alter table public.journal enable row level security;
create policy "journal all" on public.journal for all using (true) with check (true);
