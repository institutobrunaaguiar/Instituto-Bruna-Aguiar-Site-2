-- Recrutamento, parte 3:
--   1. ficha de entrevista preenchida pelo RH no painel;
--   2. teste DISC enviado ao candidato por link.
--
-- Mesmo modelo das migrations anteriores: RLS ligado, nenhuma policy, acesso só
-- pela service role nas funções serverless. Apagar a candidatura apaga junto a
-- entrevista e o DISC (on delete cascade).

-- ------------------------------------------------------------ entrevista ----
-- Uma ficha por candidatura. As respostas ficam em jsonb porque o roteiro de
-- perguntas vai mudar com o tempo; o formato de cada campo é validado na função.
create table if not exists public.job_interviews (
  application_id  uuid primary key references public.job_applications (id) on delete cascade,
  respostas       jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  updated_by      uuid references public.job_admin_codes (id) on delete set null,

  constraint job_interviews_respostas_objeto check (jsonb_typeof(respostas) = 'object'),
  constraint job_interviews_respostas_tamanho check (pg_column_size(respostas) < 200000)
);

comment on table public.job_interviews is
  'Ficha da entrevista, preenchida pelo RH no painel /vagas/admin. Uma por candidatura.';

drop trigger if exists job_interviews_set_updated_at on public.job_interviews;
create trigger job_interviews_set_updated_at
  before update on public.job_interviews
  for each row execute function public.job_applications_touch_updated_at();

alter table public.job_interviews enable row level security;
revoke all on table public.job_interviews from anon, authenticated;

-- ------------------------------------------------------------------ DISC ----
-- O token vai no link enviado ao candidato. Ele só permite responder o próprio
-- questionário, e fica guardado para o RH poder copiar o link de novo.
create table if not exists public.job_disc (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.job_applications (id) on delete cascade,
  token           text not null,
  status          text not null default 'pendente',
  respostas       jsonb,
  resultado       jsonb,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '30 days'),
  aberto_em       timestamptz,
  concluido_em    timestamptz,
  created_by      uuid references public.job_admin_codes (id) on delete set null,

  constraint job_disc_status_valido check (status in ('pendente', 'concluido', 'cancelado')),
  constraint job_disc_token_tamanho check (length(token) >= 32)
);

comment on table public.job_disc is
  'Testes DISC enviados aos candidatos. resultado guarda a pontuação D/I/S/C calculada no servidor.';

create unique index if not exists job_disc_token_key on public.job_disc (token);
create index if not exists job_disc_application_idx on public.job_disc (application_id, created_at desc);
-- no máximo um link pendente por candidatura
create unique index if not exists job_disc_um_pendente
  on public.job_disc (application_id) where status = 'pendente';

alter table public.job_disc enable row level security;
revoke all on table public.job_disc from anon, authenticated;
