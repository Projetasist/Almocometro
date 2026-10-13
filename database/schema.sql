-- Almoçômetro: schema PostgreSQL. Access through trusted server only.
create table public.employees (
 id text primary key,
 name text not null check (char_length(name) between 2 and 100),
 department text not null,
 normalized text not null,
 created_date date not null,
 deleted_date date,
 contact text,
 constraint employees_identity unique (normalized, department)
);
create table public.replies (
 id text primary key,
 employee_id text not null references public.employees(id),
 date date not null,
 answer smallint not null check (answer in (0,1)),
 updated_at timestamptz not null,
 employee_name text,
 employee_department text,
 constraint replies_day_employee unique (date, employee_id)
);
create index replies_employee_id_idx on public.replies(employee_id);
create table public.daily_control (
 date date primary key,
 mode text not null check (mode in ('auto','open','closed')),
 updated_at timestamptz not null
);
create table public.lunch_prices (
 date date primary key,
 cents integer not null check (cents >= 0)
);
alter table public.employees enable row level security;
alter table public.replies enable row level security;
alter table public.daily_control enable row level security;
alter table public.lunch_prices enable row level security;
revoke all on public.employees,public.replies,public.daily_control,public.lunch_prices from anon, authenticated;
grant select,insert,update,delete on public.employees,public.replies,public.daily_control,public.lunch_prices to service_role;
comment on table public.employees is 'Cadastros do Almoçômetro; exclusão lógica preserva o histórico.';
comment on table public.replies is 'Uma resposta por colaborador e data, com nome e departamento históricos.';
comment on table public.lunch_prices is 'Preço em centavos vigente a partir da data, preservando reajustes.';
