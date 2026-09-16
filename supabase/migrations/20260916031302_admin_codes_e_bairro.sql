-- Recrutamento, parte 2:
--   1. o formulário passa a mostrar (e guardar) o BAIRRO do CEP;
--   2. área de admin em /vagas/admin, com códigos de acesso próprios.
--
-- Como na migration anterior, nada aqui é acessível pela anon key: RLS ligado,
-- nenhuma policy, e as funções serverless usam a service role.

-- ---------------------------------------------------------------- bairro ----
-- Nullable de propósito: nem todo CEP devolve bairro na BrasilAPI, e a
-- candidatura não pode travar por causa disso. A cidade continua sendo
-- guardada (é o dado mais estável), só deixou de ser o que aparece na tela.
alter table public.job_applications
  add column if not exists bairro text;

comment on column public.job_applications.bairro is
  'Bairro devolvido pela BrasilAPI para o CEP informado. Null quando o CEP não tem bairro.';

-- ------------------------------------------------------- códigos de acesso --
-- Um código por pessoa do RH. Guardamos só o hash (scrypt, calculado na função
-- serverless): nem quem abre o banco consegue ler o código de alguém.
create table if not exists public.job_admin_codes (
  id            uuid primary key default gen_random_uuid(),
  code_hash     text not null,
  label         text not null,
  ativo         boolean not null default true,
  criado_por    uuid references public.job_admin_codes (id) on delete set null,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  usos          integer not null default 0,

  constraint job_admin_codes_hash_valido  check (length(code_hash) >= 32),
  constraint job_admin_codes_label_valido check (length(btrim(label)) between 1 and 60)
);

comment on table public.job_admin_codes is
  'Códigos de acesso ao painel /vagas/admin. Guardados como hash scrypt (salt:hash), nunca em texto.';
comment on column public.job_admin_codes.criado_por is
  'Qual código gerou este. Null para o código inicial.';

create index if not exists job_admin_codes_ativo_idx on public.job_admin_codes (ativo, created_at desc);

-- Cada hash é único: evita dois registros para o mesmo código.
create unique index if not exists job_admin_codes_hash_key on public.job_admin_codes (code_hash);

-- ------------------------------------------------------------------- RLS ----
alter table public.job_admin_codes enable row level security;
revoke all on table public.job_admin_codes from anon, authenticated;

-- ------------------------------------------------ tentativas de login -------
-- Serve só para segurar ataque de força bruta no código de acesso. O IP é
-- guardado como hash, igual ao resto do projeto.
create table if not exists public.job_admin_login_attempts (
  id          bigserial primary key,
  ip_hash     text not null,
  sucesso     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists job_admin_login_attempts_idx
  on public.job_admin_login_attempts (ip_hash, created_at desc);

comment on table public.job_admin_login_attempts is
  'Tentativas de login no painel de vagas. Usada para rate limit; sem dado pessoal.';

alter table public.job_admin_login_attempts enable row level security;
revoke all on table public.job_admin_login_attempts from anon, authenticated;
