# Campanha CO2 — Landing em formato jornada (`/campanha-co2`)

Data: 2026-08-05

## Objetivo
Landing page de tráfego pago (99,9% mobile) para a campanha de Laser CO2 do
Instituto Bruna Aguiar. Coleta dados em formato de jornada (funil, uma pergunta
por tela, sensação de app iOS), salva o lead no Kommo e redireciona a pessoa
para o WhatsApp da clínica com a mensagem pré-preenchida.

## Rota e build
- Página: `breathiva.webflow.io/campanha-co2/index.html` → publicada em
  `/campanha-co2/` (o build copia `breathiva.webflow.io/` → `dist/`).
- `vercel.json`: `trailingSlash: true`, `outputDirectory: dist`.
- Função serverless: `api/lead.js` (raiz do repo; Vercel serve `/api/*`
  independente do `outputDirectory`). Sem dependências — só Node built-ins + `fetch` global.

## Fluxo (6 passos + envio)
1. Nome (texto) → Continuar
2. Telefone (`type=tel`, máscara BR) → Continuar
3. Estado — bottom-sheet iOS, 27 UFs (código + nome do estado; valor = UF)
4. "Já fez procedimento estético?" → Sim/Não (auto-avança)
5. "Conhece o Instituto Bruna Aguiar ou a Bruna Aguiar?" → Sim/Não
6. Ocupação — bottom-sheet: Empresário(a) / Servidor Público / Outros
7. Tela "Enviando…" → `POST /api/lead` → redirect WhatsApp

## Experiência mobile (prioridade máxima — app iOS)
- Telas full-viewport (`100dvh`) + safe-area insets (notch / home bar).
- Transições em mola (slide horizontal) entre passos; respeita `prefers-reduced-motion`.
- Feedback tátil: `:active` scale + `navigator.vibrate` em seleções.
- Teclados corretos: `inputmode`, `type=tel`, `enterkeyhint`, `autocomplete`.
- Inputs font-size ≥16px + `maximum-scale=1` para o iOS não dar zoom no foco.
- Dropdowns como bottom-sheet deslizante (não `<select>` cru).
- Tudo inline num único HTML (zero requests externos além do POST do lead).

## Captura de lead — Supabase + Kommo (em paralelo)
`api/lead.js` grava em dois destinos independentes (`Promise.all`), cada um
opcional e gated por env var, ambos com degradação segura.

### Supabase (fonte de verdade)
Insert via PostgREST (`POST {SUPABASE_URL}/rest/v1/leads_campanha_co2`) com a
`SUPABASE_SERVICE_ROLE_KEY` (fica só no servidor; bypassa RLS). Sem SDK — só
`fetch`, porque o build roda sem `npm install`. Schema: `docs/supabase/leads_campanha_co2.sql`.
Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### Kommo (CRM)
`api/lead.js` recebe JSON e:
1. `POST /api/v4/leads/complex` → cria lead + contato (contato com `field_code: PHONE`),
   tag "Campanha CO2", opcional `pipeline_id`/`status_id`.
2. `POST /api/v4/leads/{id}/notes` → nota com todas as respostas (UF, 3 perguntas, telefone).

Env vars na Vercel: `KOMMO_SUBDOMAIN`, `KOMMO_TOKEN` (token de longa duração de
integração privada). Opcionais: `KOMMO_PIPELINE_ID`, `KOMMO_STATUS_ID`.

**Degradação segura:** a função sempre responde 200; se o Kommo não estiver
configurado ou falhar, o front redireciona pro WhatsApp mesmo assim. O front usa
`fetch` com `keepalive` + timeout de 4,5s e redireciona independentemente do resultado.

## WhatsApp
`https://wa.me/5561981204327?text=<msg>` com:
> "Olá! Vi a campanha sobre CO2 e quero saber mais. Meu nome é [Nome], sou de [UF] e gostaria de saber mais sobre o procedimento."

## Fora de escopo
- Autenticação/OAuth do Kommo (usa token de longa duração).
- Persistência local dos leads (fonte de verdade é o Kommo).
