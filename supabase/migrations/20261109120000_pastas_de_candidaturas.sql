-- Recrutamento, parte 4: pastas de candidaturas.
--
-- Ao abrir vagas novas, o RH guarda as candidaturas da seleção anterior numa
-- pasta com nome (ex.: "Seleção set/2026") e o painel volta a mostrar só o que
-- chegou depois. Cada candidatura mantém o próprio status dentro da pasta.
--
-- folder_id nulo = "Seleção atual". Toda candidatura nova entra assim, sem que
-- o formulário público precise saber de pastas.
--
-- Mesmo modelo das migrations anteriores: RLS ligado, nenhuma policy, acesso só
-- pela service role nas funções serverless.

create table if not exists public.job_folders (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.job_admin_codes (id) on delete set null,

  constraint job_folders_nome_tamanho check (char_length(btrim(nome)) between 2 and 80)
);

comment on table public.job_folders is
  'Pastas do painel /vagas/admin: guardam as candidaturas de seleções anteriores.';

create unique index if not exists job_folders_nome_unico on public.job_folders (lower(btrim(nome)));

alter table public.job_folders enable row level security;
revoke all on table public.job_folders from anon, authenticated;

-- Apagar uma pasta devolve as candidaturas para a seleção atual em vez de
-- apagá-las junto.
alter table public.job_applications
  add column if not exists folder_id uuid references public.job_folders (id) on delete set null;

comment on column public.job_applications.folder_id is
  'Pasta em que a candidatura foi arquivada. Nulo = seleção atual.';

create index if not exists job_applications_folder_created_idx
  on public.job_applications (folder_id, created_at desc);
