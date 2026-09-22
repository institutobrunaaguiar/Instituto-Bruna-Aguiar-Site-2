# Vagas / recrutamento (`/vagas`)

Landing pública da vaga + formulário de candidatura em formato wizard. Usa a
mesma stack do resto do site: HTML estático servido pela Vercel a partir de
`breathiva.webflow.io/`, com funções serverless em `api/` e Supabase para dados
e arquivos.

## Arquivos

| Caminho | O que é |
| --- | --- |
| `breathiva.webflow.io/vagas/index.html` | Landing da vaga + wizard de 5 etapas (HTML, CSS e JS em um arquivo só, como as demais páginas) |
| `breathiva.webflow.io/vagas/obrigado/index.html` | Confirmação de envio (`noindex`) |
| `api/vagas/upload-url.js` | Emite signed upload URL para currículo/foto |
| `api/vagas/candidatura.js` | Revalida tudo e grava a candidatura |
| `api/_lib/recrutamento.js` | Utilidades compartilhadas pelas duas funções |
| `breathiva.webflow.io/vagas/admin/index.html` | Painel do RH: candidaturas, currículos e códigos de acesso |
| `api/vagas/admin.js` | Endpoints do painel (login, lista, arquivos, status, códigos) |
| `api/_lib/admin.js` | Sessão, hash dos códigos e geração de código novo |
| `scripts/criar-codigo-admin.js` | Cria código de acesso pelo terminal (primeiro acesso / recuperação) |
| `supabase/migrations/20260916021231_create_job_applications.sql` | Tabela, índices, constraints, RLS e buckets |
| `supabase/migrations/20260916031302_admin_codes_e_bairro.sql` | Coluna `bairro`, tabela de códigos e de tentativas de login |
| `breathiva.webflow.io/vagas/disc/index.html` | Questionário DISC respondido pelo candidato |
| `api/vagas/disc.js` | Abre e recebe o DISC pelo link do candidato |
| `api/_lib/disc.js` | Frases do DISC e cálculo do perfil (gabarito nunca sai do servidor) |
| `supabase/migrations/20260922162422_entrevista_e_disc.sql` | Tabelas `job_interviews` e `job_disc` |

## Variáveis de ambiente

Todas estão registradas no projeto da Vercel, nos três ambientes
(Production, Preview e Development):

| Variável | Para que serve |
| --- | --- |
| `SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (o código aceita qualquer uma das duas) |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso server-side ao banco e ao Storage |
| `RECRUITMENT_SECRET` | Assina os tokens HMAC de candidatura e o hash de IP do rate limit |

A service role key só existe no servidor. A página publicada não contém
nenhuma credencial.

Confira ou altere pela CLI:

```sh
vercel env ls
vercel env add <NOME> <production|preview|development>
```

### Rodando localmente

```sh
vercel env pull .env.local   # traz as variáveis de Development
vercel dev --listen 3002
```

O `vercel dev` lê o `.env.local` gerado por esse `pull`. Se as funções
responderem `503 servico_indisponivel`, é sinal de que o `.env.local` está
faltando ou desatualizado — rode o `pull` de novo.

### Trocando o `RECRUITMENT_SECRET`

Ele assina os tokens que autorizam upload. Ao trocá-lo, quem estiver
preenchendo o formulário naquele instante recebe `sessao_invalida` e precisa
reenviar os arquivos. Troque em horário de baixo movimento e faça o redeploy
logo em seguida — variáveis novas só valem para deployments novos:

```sh
vercel env rm RECRUITMENT_SECRET production
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))" \
  | vercel env add RECRUITMENT_SECRET production
vercel --prod
```

## Fluxo de um envio

1. A pessoa escolhe o arquivo. O navegador pede a `/api/vagas/upload-url/` uma
   URL assinada. O servidor emite (ou reaproveita) um `applicationId` e o
   assina com HMAC — é esse par id + token que autoriza a escrita em uma pasta
   específica do bucket.
2. O arquivo vai **direto do navegador para o Storage**, sem passar pela função.
   Isso evita o limite de 4,5 MB de body das funções da Vercel.
3. No envio final, `/api/vagas/candidatura/` revalida tudo: campos, token,
   tamanho e assinatura real (magic bytes) dos arquivos, e reconfere o endereço
   na BrasilAPI. A idade é recalculada no servidor — o valor vindo do navegador é
   ignorado.
4. O `id` da linha é o próprio `applicationId`, então um duplo envio esbarra na
   chave primária em vez de criar duas candidaturas.

## O que o CEP mostra

Na etapa *Onde você mora?* a pessoa digita só o CEP e a tela responde com o
**bairro** ("Bairro encontrado — Asa Sul"). Rua, número e coordenadas nunca
aparecem. Quando o CEP não tem bairro na base da BrasilAPI, a cidade entra no
lugar para a tela não ficar vazia.

No banco continuam guardados `bairro`, `cidade` e `estado`: o bairro é o que
interessa para saber a distância até a clínica, e cidade/UF seguem como
referência. O servidor reconsulta o CEP e sobrescreve o que veio do navegador.

## Banco

Tabela `public.job_applications`. RLS ligado e **nenhuma policy** — `anon` e
`authenticated` não leem nem escrevem. Só a service role (que ignora RLS)
consegue inserir, e é ela que as funções usam.

Constraints que valem citar: currículo não pode ser vazio, e
`curriculo_tem_foto = true OR foto_perfil_url preenchido`. A regra do produto
está no banco, não só na aplicação.

Não há UNIQUE em e-mail ou telefone — a mesma pessoa pode se candidatar de novo
em outro processo.

## Arquivos no Storage

Buckets **privados** `recruitment-resumes` (10 MB, PDF/DOC/DOCX) e
`recruitment-photos` (5 MB, JPG/PNG/WEBP). As colunas `curriculo_url` e
`foto_perfil_url` guardam o *path* do objeto, não uma URL pública.

No dia a dia o RH abre os arquivos pelo painel (`/vagas/admin`), que gera um
link assinado válido por 5 minutos a cada clique. O comando abaixo serve para
quando você precisar do arquivo fora do painel (1 hora de validade):

```sh
set -a && . ./.env.local && set +a
curl -s -X POST "$SUPABASE_URL/storage/v1/object/sign/recruitment-resumes/<path>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn":3600}'
```

A resposta traz `signedURL`; o link completo é `$SUPABASE_URL/storage/v1` + esse
valor. Pelo painel do Supabase também dá para baixar direto.

## Painel do RH (`/vagas/admin`)

Como o site é estático, o navegador nunca fala com o Supabase direto: tudo passa
por `api/vagas/admin.js`, que confere a sessão antes de qualquer coisa. A página
é `noindex` e a API responde com `X-Robots-Tag: noindex`.

**Entrar.** O acesso é por código, sem e-mail nem senha. Cada código vale para
uma pessoa e fica guardado como hash scrypt — nem quem abre o banco lê o código
de alguém. A sessão é um cookie `HttpOnly` + `SameSite=Strict` (e `Secure` em
produção), com validade de 8 horas.

**O que dá para fazer.** Listar as candidaturas (busca por nome, e-mail ou
telefone, filtro por status), abrir o currículo por link temporário de 5
minutos, e mover o status entre *nova, em análise, entrevista, aprovada,
reprovada e arquivada*.

**O retrato no cartão.** Quando a pessoa enviou foto de perfil, ela aparece como
um avatar redondo no cartão; clicar abre em tamanho real. Como o bucket é
privado, o servidor assina as fotos da página inteira em uma única chamada ao
Storage (links de 15 minutos) e o path do arquivo nunca chega ao navegador. Quem
mandou a foto dentro do próprio currículo aparece com as iniciais e o selo
*foto no currículo*.

**Códigos de acesso.** Na aba *Acessos* dá para gerar um código novo para cada
pessoa do RH. Ele aparece **uma única vez**, na hora em que é criado; depois
disso só resta o hash. Revogar um código derruba na hora quem estiver usando
aquela sessão. Ninguém consegue revogar o próprio código — assim não dá para
ficar de fora por engano.

**Perdeu todos os acessos?** Crie um novo pelo terminal:

```sh
set -a && . ./.env.local && set +a
node scripts/criar-codigo-admin.js "Nome de quem vai usar"
```

O comando aceita um segundo argumento se você quiser escolher o código em vez de
sortear um.

**Força bruta.** Oito tentativas erradas do mesmo IP em 15 minutos travam novos
logins por aquele período. As tentativas ficam em `job_admin_login_attempts`,
com o IP em hash.

## Ficha de entrevista

No painel, "Abrir ficha" mostra o roteiro da entrevista junto dos dados da
candidatura. As respostas ficam em `job_interviews.respostas` (jsonb, uma linha
por candidatura) e são salvas sozinhas enquanto o RH digita.

O roteiro está em `ROTEIRO`, no JavaScript da página do painel. Cada campo tem
uma chave (`exp_recepcao`, `perfil_conexao`…), um tipo (`text`, `area`, `sn`,
`escala`, `select`, `date`) e, quando é condicional, `se: ["campo", "valor"]`.
As seções 3 e 7 usam isso para aparecer só quando fazem sentido. Para mudar as
perguntas, basta editar esse trecho: o servidor aceita qualquer chave no formato
`[a-z0-9_]` e limpa os valores (texto de até 4000 caracteres, sem caracteres de
controle, sem objetos aninhados).

O que é corrigido na ficha fica só na ficha. A candidatura original não muda,
com uma exceção: trocar foto ou currículo pela seção 8 substitui os arquivos da
candidatura.

## Teste DISC

"Gerar link do teste" cria uma linha em `job_disc` com um token aleatório de 32
bytes e devolve `https://www.institutobrunaaguiar.com.br/vagas/disc/?t=<token>`,
mais um link de WhatsApp com a mensagem pronta. O link vale 30 dias, só pode ser
respondido uma vez, e "Gerar novo link" cancela o anterior.

São 24 grupos de 4 frases. Em cada grupo a pessoa marca a que mais e a que menos
combina com ela. Cada frase pertence a um fator (D, I, S, C) e a pontuação é
"vezes que foi mais" menos "vezes que foi menos", de −24 a +24, convertida em
porcentagem. O navegador recebe só os textos: o fator de cada frase e o cálculo
ficam em `api/_lib/disc.js`, no servidor.

As frases foram escritas para este site, não vêm de instrumento comercial, e
estão em primeira pessoa para não depender de gênero. O resultado é indicativo,
e o painel avisa para usar como apoio à entrevista, não como critério único.

Se a base for trocada, mude `GRUPOS` em `api/_lib/disc.js`. Testes já
respondidos guardam o resultado calculado, então não são afetados.

### Leitura do resultado

A ficha não mostra só o fator mais alto. `interpretar()` monta, a partir do
resultado guardado, a mesma leitura que se faz numa devolutiva:

1. **Fator dominante e segundo fator**, que é o que de fato descreve o
   comportamento. Duas pessoas com D alto são perfis diferentes se uma tem I
   alto e a outra, C alto: uma sai como DI (executor persuasivo) e a outra como
   CD (analítico e exigente).
2. **Fatores baixos**, que valem tanto quanto os altos.
3. **Distância entre o maior e o menor**: acima de 40 pontos a preferência é
   bem marcada; abaixo de 20 não há preferência forte.
4. **Aderência ao desenho da vaga**, comparando cada fator com a faixa que a
   função pede, com pesos diferentes. Para a recepção: I alto (peso 0,35),
   S e C médios ou altos (0,25 cada) e D médio (0,15). Para outra vaga, mude
   só a tabela `ALVO`.
5. **Perguntas para a entrevista**, geradas pelo que ficou fora da faixa, para
   comparar o teste com evidência de comportamento real.

Como a leitura é calculada na hora, mudar `ALVO` ou os textos vale na mesma
hora para todos os testes já respondidos.

## Proteção contra abuso

- Honeypot (`website`): quando preenchido, a resposta é sucesso e nada é gravado.
- Rate limit: 5 candidaturas por IP por hora (o IP é guardado como hash, em
  `ip_hash`, e nunca em texto).
- Tipo de arquivo conferido por extensão, content-type **e** magic bytes, tanto
  no envio do candidato quanto na troca de arquivos pela ficha.
- O path do arquivo precisa pertencer à candidatura que está sendo enviada.

## Analytics

Os eventos (`job_page_view`, `application_started`, `application_step_completed`,
`resume_uploaded`, `profile_photo_uploaded`, `application_submitted`,
`application_error`) vão para `dataLayer`/`gtag`/`fbq` quando existirem — hoje o
site não tem nenhum deles, então viram no-op. Nenhum dado pessoal é enviado:
só o nome do evento, o slug da vaga e o número da etapa.

## Publicar uma nova vaga

A página é escrita para a vaga de Recepção (`job_slug = 'recepcao'`). Para abrir
outra, duplique a pasta `vagas/` e acrescente o novo slug em `JOB_SLUGS` na
função `api/vagas/candidatura.js` — a validação recusa slug desconhecido.
