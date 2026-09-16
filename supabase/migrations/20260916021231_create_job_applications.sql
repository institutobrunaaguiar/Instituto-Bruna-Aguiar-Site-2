-- Recrutamento: candidaturas recebidas pela landing pública /vagas
--
-- Fluxo: a página estática envia os dados para as funções serverless em
-- api/vagas/*, que usam a SERVICE ROLE KEY (só no servidor). Nada aqui é
-- acessível pela anon key: RLS fica ligado e nenhuma policy pública é criada.
--
-- Os arquivos (currículo e foto) ficam em buckets PRIVADOS do Storage. As
-- colunas curriculo_url / foto_perfil_url guardam o PATH do objeto dentro do
-- bucket (ex.: "<id da candidatura>/<uuid>.pdf"), não uma URL pública — a
-- leitura futura acontece por signed URL temporária.

-- ---------------------------------------------------------------- tabela ----
create table if not exists public.job_applications (
  id                  uuid primary key default gen_random_uuid(),
  job_slug            text not null default 'recepcao',

  nome_completo       text not null,
  email               text not null,
  telefone            text not null,

  data_nascimento     date not null,
  idade               integer not null,
  sexo                text,

  cep                 text not null,
  cidade              text not null,
  estado              text,

  curriculo_url       text not null,
  curriculo_nome      text,
  curriculo_tem_foto  boolean not null,
  foto_perfil_url     text,

  consentimento       boolean not null default false,
  status              text not null default 'nova',

  origem              text not null default 'site',
  user_agent          text,
  ip_hash             text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- currículo é obrigatório: not null não basta, string vazia também não vale
  constraint job_applications_curriculo_obrigatorio
    check (length(btrim(curriculo_url)) > 0),

  -- a regra do produto: currículo COM foto, ou foto de perfil separada
  constraint job_applications_foto_obrigatoria
    check (curriculo_tem_foto = true or length(btrim(coalesce(foto_perfil_url, ''))) > 0),

  constraint job_applications_nome_valido
    check (length(btrim(nome_completo)) >= 3),

  constraint job_applications_email_valido
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'),

  -- telefone guardado só com dígitos, com DDD (10 ou 11)
  constraint job_applications_telefone_valido
    check (telefone ~ '^[0-9]{10,11}$'),

  constraint job_applications_cep_valido
    check (cep ~ '^[0-9]{8}$'),

  constraint job_applications_estado_valido
    check (estado is null or estado ~ '^[A-Z]{2}$'),

  constraint job_applications_idade_valida
    check (idade between 14 and 100),

  constraint job_applications_sexo_valido
    check (sexo is null or sexo in ('feminino', 'masculino', 'outro', 'nao_informado')),

  constraint job_applications_status_valido
    check (status in ('nova', 'em_analise', 'entrevista', 'aprovada', 'reprovada', 'arquivada')),

  -- sem consentimento não existe candidatura
  constraint job_applications_consentimento_obrigatorio
    check (consentimento = true)
);

comment on table  public.job_applications              is 'Candidaturas das vagas publicadas em /vagas. Acesso só via service role.';
comment on column public.job_applications.curriculo_url    is 'Path do objeto no bucket privado recruitment-resumes.';
comment on column public.job_applications.foto_perfil_url  is 'Path do objeto no bucket privado recruitment-photos (null quando o currículo já tem foto).';
comment on column public.job_applications.idade            is 'Idade completa calculada a partir de data_nascimento no momento do envio.';
comment on column public.job_applications.sexo             is 'Informação cadastral. Não é usada para classificação ou triagem.';
comment on column public.job_applications.ip_hash          is 'SHA-256 do IP + salt. Serve só para conter abuso; não identifica a pessoa.';

-- --------------------------------------------------------------- índices ----
create index if not exists job_applications_created_at_idx on public.job_applications (created_at desc);
create index if not exists job_applications_status_idx     on public.job_applications (status);
create index if not exists job_applications_email_idx      on public.job_applications (lower(email));
create index if not exists job_applications_telefone_idx   on public.job_applications (telefone);
create index if not exists job_applications_job_slug_idx   on public.job_applications (job_slug, created_at desc);
-- usado pelo rate limit por IP (janela curta)
create index if not exists job_applications_ip_hash_idx    on public.job_applications (ip_hash, created_at desc);

-- Sem UNIQUE em email/telefone de propósito: a mesma pessoa pode se candidatar
-- de novo em outro processo seletivo.

-- ------------------------------------------------------------ updated_at ----
create or replace function public.job_applications_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute function public.job_applications_touch_updated_at();

-- ------------------------------------------------------------------- RLS ----
alter table public.job_applications enable row level security;

-- Nenhuma policy é criada: com RLS ligado e sem policy, anon e authenticated
-- não leem nem escrevem nada. Os inserts vêm da service role, que ignora RLS.
-- O revoke abaixo é defesa em profundidade contra os grants padrão do schema.
revoke all on table public.job_applications from anon, authenticated;

-- --------------------------------------------------------------- storage ----
-- Buckets privados (public = false). A leitura futura dos arquivos acontece
-- por signed URL gerada no servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'recruitment-resumes',
    'recruitment-resumes',
    false,
    10485760, -- 10 MB
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'recruitment-photos',
    'recruitment-photos',
    false,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Nenhuma policy em storage.objects para esses buckets: sem policy, anon e
-- authenticated não listam, não leem e não sobrescrevem os arquivos. O upload
-- do candidato usa signed upload URL de uso único, emitida pelo servidor.
