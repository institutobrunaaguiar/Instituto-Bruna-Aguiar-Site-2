-- Tabela de leads da landing /campanha-co2
-- Rode no Supabase: Dashboard → SQL Editor → New query → cole e Run.

create table if not exists public.leads_campanha_co2 (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  nome                 text,
  telefone             text,
  uf                   text,
  ja_fez_procedimento  text,
  conhece_instituto    text,
  ocupacao             text,
  origem               text default 'campanha-co2',
  user_agent           text
);

-- RLS ligado: os inserts vêm da função serverless usando a SERVICE ROLE KEY,
-- que ignora RLS. Nenhuma política pública é criada, então a tabela não fica
-- exposta pela anon key.
alter table public.leads_campanha_co2 enable row level security;

-- Consulta rápida dos últimos leads:
-- select created_at, nome, telefone, uf, ja_fez_procedimento, conhece_instituto, ocupacao
-- from public.leads_campanha_co2 order by created_at desc;
