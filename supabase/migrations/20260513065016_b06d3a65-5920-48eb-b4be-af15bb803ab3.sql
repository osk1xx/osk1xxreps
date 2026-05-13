
-- Roles enum + table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "users can read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  source_url text not null,
  image_url text,
  price_cny numeric,
  status text not null default 'draft' check (status in ('draft','approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create policy "anyone can view approved products" on public.products
  for select using (status = 'approved');

create policy "admins can view all products" on public.products
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "admins can insert products" on public.products
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "admins can update products" on public.products
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "admins can delete products" on public.products
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  browser_id text not null,
  role text not null check (role in ('user','admin')),
  body text not null,
  created_at timestamptz not null default now()
);
create index chat_messages_browser_id_idx on public.chat_messages(browser_id, created_at);
alter table public.chat_messages enable row level security;

-- Anyone can insert as a user (browser_id is the identity); admin posts via service role / admin role
create policy "anyone can send user messages" on public.chat_messages
  for insert with check (role = 'user');

create policy "admins can insert any messages" on public.chat_messages
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "admins can read all messages" on public.chat_messages
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
-- Public read happens via server function (service role) scoped by browser_id

-- App settings (singleton)
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  disable_products boolean not null default false,
  critical_alert boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1);
alter table public.app_settings enable row level security;

create policy "anyone can read settings" on public.app_settings
  for select using (true);

create policy "admins can update settings" on public.app_settings
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
