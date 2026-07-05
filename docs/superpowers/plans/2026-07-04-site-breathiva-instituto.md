# Site Instituto Bruna Aguiar (adaptação Breathiva) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o export Webflow do template Breathiva no site institucional do Instituto Bruna Aguiar, trocando conteúdo (textos + imagens) e reaproveitando/removendo seções, mantendo o visual e as animações do template.

**Architecture:** Edição in-place do `breathiva.webflow.io/index.html` (HTML minificado — editar por âncoras de texto/atributo únicas, nunca por número de linha, nunca reformatar). Imagens do Instituto vão para `breathiva.webflow.io/assets/instituto/` e os `src` do template são repontados (removendo `srcset`/`sizes` para não carregar variantes antigas). CSS, GSAP e interações do Webflow permanecem intactos.

**Tech Stack:** HTML/CSS estático do Webflow + jQuery + GSAP/ScrollTrigger (não tocar nos JS).

## Global Constraints

- **Visual mantido**: paleta verde/dourado/creme e fontes Avelora/Satoshi do Breathiva. NÃO trocar cores nem fontes.
- **HTML minificado**: editar via `Edit` com `old_string` único (incluir contexto vizinho). Nunca reformatar/prettificar o arquivo.
- **CTA global**: TODOS os botões de ação apontam para `https://api.whatsapp.com/message/5DWUJQU6VH5VP1?autoload=1&app_absent=0&utm_source=ig` com `target="_blank" rel="noopener"`. Deixar comentário HTML com a alternativa `https://wa.me/5561981204327?text=Ol%C3%A1%2C%20tudo%20bem%3F%20Vim%20do%20site%20e%20quero%20saber%20mais%20informa%C3%A7%C3%B5es.`
- **Idioma**: pt-BR. `<html lang="pt-BR">`.
- **Fonte de conteúdo**: `conteudo-site.md` (na raiz do projeto). Copiar copy verbatim das seções indicadas. NÃO inventar conteúdo.
- **Imagens proibidas**: nunca referenciar `public/fotos_local/` nem `public/fotos_time/` (PNGs 12MB+).
- **Conteúdo provisório** (marcar com `<!-- TODO revisar: cliente confirmar -->`): números de Stats e textos do FAQ.
- **Equipe**: exibir SOMENTE a Dra. Bruna Aguiar. Não incluir os 3 membros genéricos.
- **Sem suíte de testes**: verificação = `grep` (texto antigo ausente / novo presente) + conferência visual no navegador.
- **Diretório de trabalho**: `breathiva.webflow.io/` é a raiz do site entregável. Caminhos abaixo são relativos a essa pasta salvo indicação contrária.

---

### Task 1: Preparar imagens do Instituto e baseline

**Files:**
- Create: `breathiva.webflow.io/assets/instituto/` (pasta com cópias das imagens)

- [ ] **Step 1: Criar pasta e copiar imagens do Instituto**

```bash
cd /Users/alexrodriguesdossantos/Projetos/Instituto-Bruna-Aguiar-Site-2
mkdir -p breathiva.webflow.io/assets/instituto
cp public/hero.jpg breathiva.webflow.io/assets/instituto/hero.jpg
cp public/logo.png breathiva.webflow.io/assets/instituto/logo.png
cp public/icon.png breathiva.webflow.io/assets/instituto/icon.png
cp public/equipe/membro-1.jpg breathiva.webflow.io/assets/instituto/dra-bruna.jpg
for n in 1 2 3 4 5 6 7 8; do cp public/galeria/espaco-$n.jpg breathiva.webflow.io/assets/instituto/espaco-$n.jpg; done
cp public/espacos/recepcao.jpg breathiva.webflow.io/assets/instituto/recepcao.jpg
cp public/espacos/sala-1.jpg breathiva.webflow.io/assets/instituto/sala-1.jpg
cp public/espacos/sala-2.jpg breathiva.webflow.io/assets/instituto/sala-2.jpg
cp public/espacos/jardim.jpg breathiva.webflow.io/assets/instituto/jardim.jpg
```

- [ ] **Step 2: Verificar cópias**

Run: `ls breathiva.webflow.io/assets/instituto/`
Expected: 15 arquivos (hero.jpg, logo.png, icon.png, dra-bruna.jpg, espaco-1..8.jpg, recepcao.jpg, sala-1.jpg, sala-2.jpg, jardim.jpg)

- [ ] **Step 3: Commit**

```bash
git add breathiva.webflow.io/assets/instituto
git commit -m "chore: imagens do Instituto para o site"
```

---

### Task 2: `<head>` — título, meta, lang, favicon

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`<head>` e `<html>`)

**Interfaces:**
- Produces: título e metadados do Instituto usados por SEO e aba do navegador.

- [ ] **Step 1: Trocar `lang` do `<html>`**

Localizar o atributo `lang` da tag `<html ...>` (início do arquivo) e trocar para `pt-BR`. Se houver `data-wf-...`, preservar. Substituir `lang="en"` → `lang="pt-BR"`.

- [ ] **Step 2: Trocar `<title>`**

Substituir:
`<title>Breathiva - Webflow HTML website template</title>`
por:
`<title>Instituto Bruna Aguiar — Estética avançada, natural e sofisticada | Brasília-DF</title>`

- [ ] **Step 3: Trocar meta description e OG (se presentes)**

Para cada `content="..."` de `meta name="description"`, `meta property="og:title"`, `meta property="og:description"` cujo texto seja do template, substituir por:
- description: `Referência em estética avançada no DF: harmonização facial natural, toxina botulínica, preenchimentos, bioestimuladores, lasers e ultrassom microfocado (HYPRO). Asa Sul, Brasília.`
- og:title: `Instituto Bruna Aguiar — Estética avançada, natural e sofisticada`
- og:description: mesmo texto da description.

- [ ] **Step 4: Trocar favicon**

Localizar `<link ... rel="shortcut icon" ...>` e `<link ... rel="apple-touch-icon" ...>`. Trocar o `href` para `assets/instituto/icon.png`.

- [ ] **Step 5: Verificar**

Run: `grep -c "Instituto Bruna Aguiar" breathiva.webflow.io/index.html`
Expected: ≥ 3
Run: `grep -c "Webflow HTML website template" breathiva.webflow.io/index.html`
Expected: 0

- [ ] **Step 6: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: head, título e favicon do Instituto"
```

---

### Task 3: Header/Nav — logo, menu por âncoras e CTA global

**Files:**
- Modify: `breathiva.webflow.io/index.html` (header `rt-header-v1` e navbar)

**Interfaces:**
- Consumes: `assets/instituto/logo.png` (Task 1).
- Produces: âncoras de seção (`#sobre`, `#tratamentos`, `#galeria`, `#equipe`, `#depoimentos`, `#faq`, `#contato`) usadas pelos IDs das seções nas tasks seguintes.

- [ ] **Step 1: Trocar a logo do header**

Substituir os `src` de `alt="Breathiva logo"` (`assets/56566fdbc4713e13_699eb71a699afb8e898d0c25_Breat.svg`) por `assets/instituto/logo.png` e o `alt` para `Instituto Bruna Aguiar`. Remover `srcset`/`sizes` se houver. (Ocorre em desktop e mobile — trocar todas as ocorrências desse src.)

- [ ] **Step 2: Trocar textos e destinos do menu**

O menu tem itens `home`, `Pages`, `Classes`, `Contact` etc. Reescrever para os itens do Instituto com âncoras:
- `home` → texto `Início`, `href="#top"`
- item de classes → `Tratamentos`, `href="#tratamentos"`
- adicionar/renomear para: `Sobre` (`#sobre`), `Galeria` (`#galeria`), `Equipe` (`#equipe`), `Depoimentos` (`#depoimentos`), `FAQ` (`#faq`), `Contato` (`#contato`)
- Remover o dropdown `Pages` (menu de páginas do template) — apagar o bloco `rt-dropdown ... w-dropdown` do nav (desktop e mobile). Se a remoção for arriscada no minificado, no mínimo esvaziar seus links para `#`.
Trocar os `<div class="rt-nav-text">TEXTO</div>` correspondentes.

- [ ] **Step 3: Trocar o botão CTA do header pelo WhatsApp**

Localizar o botão CTA do navbar (texto tipo `Book class` / `Start your journey`, `href="/contact"`). Trocar texto para `Agende sua Avaliação` e `href` para o link global do WhatsApp, adicionando `target="_blank" rel="noopener"`. Inserir logo antes do `<a` o comentário:
`<!-- alt WhatsApp: https://wa.me/5561981204327?text=Ol%C3%A1%2C%20tudo%20bem%3F%20Vim%20do%20site%20e%20quero%20saber%20mais%20informa%C3%A7%C3%B5es. -->`

- [ ] **Step 4: Verificar**

Run: `grep -c "5DWUJQU6VH5VP1" breathiva.webflow.io/index.html`
Expected: ≥ 1
Run: `grep -o "rt-nav-text\">[^<]*" breathiva.webflow.io/index.html | head`
Expected: mostra `Tratamentos`, `Sobre`, `Galeria`, etc.

- [ ] **Step 5: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: header com logo, menu por âncoras e CTA WhatsApp"
```

---

### Task 4: Hero — imagem no lugar do vídeo + copy

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-home-hero-section`)

**Interfaces:**
- Consumes: `assets/instituto/hero.jpg` (Task 1); âncora `#top` (Task 3).

- [ ] **Step 1: Adicionar `id="top"` à seção Hero**

Na abertura `<section class="rt-home-hero-section"...`, adicionar `id="top"`.

- [ ] **Step 2: Trocar vídeo de fundo por imagem**

Localizar `<div class="rt-hero-video w-background-video w-background-video-atom" data-autoplay="true" ...>` até o fechamento do bloco de vídeo (contém `<video ...><source .../><source .../><img .../></video>` e os botões `Pause video`/`Play video`). Substituir TODO esse bloco por uma imagem de fundo estática:

```html
<img alt="Instituto Bruna Aguiar" class="rt-hero-video" src="assets/instituto/hero.jpg" style="object-fit:cover;width:100%;height:100%;position:absolute;inset:0;"/>
```

Isso remove `<video>`, os dois `<source>`, o fallback e os botões play/pause de uma vez. Manter o(s) `<div class="rt-home-hero-overlay...">` que vêm depois (overlay escuro).

- [ ] **Step 3: Trocar textos do Hero**

- Selo/eyebrow `Yoga studio` → `O cuidado certo muda tudo`
- Título `Yoga and fitness studio` (h1) → `Estética avançada, natural e sofisticada`
- Botão `Start Your Yoga Journey` → `Agende sua Avaliação`, `href` = WhatsApp global (`target="_blank" rel="noopener"`)
- Se houver segundo botão/subtítulo, subtítulo = `Estética com técnica, propósito e naturalidade.` e 2º botão `Conheça os tratamentos` `href="#tratamentos"`.

- [ ] **Step 4: Trocar os 4 blocos (Focus/Wellness/Strength/Balance)**

Substituir os 4 pares título+descrição por 4 diferenciais do Instituto:
1. `Naturalidade` — `Resultados que preservam seus traços e a sua essência, sem exageros.`
2. `Sofisticação` — `Atendimento humanizado, ambiente acolhedor e cuidado em cada detalhe.`
3. `Tecnologia` — `Equipamentos e protocolos de última geração para segurança e excelência.`
4. `Individualização` — `Cada protocolo é definido após uma avaliação criteriosa e personalizada.`

- [ ] **Step 5: Verificar**

Run: `grep -c "Estética avançada, natural e sofisticada" breathiva.webflow.io/index.html`
Expected: ≥ 1
Run: `grep -c "rt-hero-video w-background-video" breathiva.webflow.io/index.html`
Expected: 0
Visual: abrir no navegador — Hero mostra `hero.jpg` como fundo, sem player de vídeo, sem botão play/pause.

- [ ] **Step 6: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: hero com imagem (sem vídeo) e copy do Instituto"
```

---

### Task 5: Wellness → Áreas de atuação (4 cards)

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-wellness-section`)

- [ ] **Step 1: Trocar título e subtítulo**

- Título `Inspiring mindful living through purposeful Yoga practice and wellness` → `Estética facial, corporal e capilar com técnica e naturalidade`
- Subtítulo `Discover calm, strength, and balance through mindful Yoga practice.` → `Cuidado integral para realçar a sua beleza em cada fase da vida.`
- Botão `Book class` (href `/contact`) → `Agende sua Avaliação` + WhatsApp global.

- [ ] **Step 2: Trocar os 4 cards**

Substituir os 4 cards (Meditation/Aromatherapy/Yoga asanas/Meditation) por (título + descrição):
1. `Estética Facial` — `Rejuvenescimento, harmonização e prevenção com foco na sua naturalidade.`
2. `Tecnologias & Laser` — `HYPRO, laser CO2 e luz pulsada para lifting e tratamento de manchas sem cirurgia.`
3. `Estética Corporal` — `Protocolos para flacidez, contorno, estrias, celulite e gordura localizada.`
4. `Tricologia — Saúde Capilar` — `Avaliação e protocolos para o couro cabeludo e o fortalecimento dos fios.`

(Ícones SVG do template permanecem.)

- [ ] **Step 3: Verificar**

Run: `grep -c "Tricologia" breathiva.webflow.io/index.html`
Expected: ≥ 1
Run: `grep -c "Aromatherapy" breathiva.webflow.io/index.html`
Expected: 0

- [ ] **Step 4: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: seção Áreas de atuação"
```

---

### Task 6: About → Sobre + Estatísticas

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-about`)

- [ ] **Step 1: `id="sobre"` na seção**

Adicionar `id="sobre"` à abertura de `<section class="rt-about"...`.

- [ ] **Step 2: Trocar título e texto**

- Título `Creating a welcoming space for balance, growth, and well-being` (a 1ª ocorrência, na `rt-about`) → `Referência em estética natural, sofisticação e tecnologia no DF`
- Parágrafo do template → usar os 4 parágrafos de `conteudo-site.md` linhas 56–59 (Instituto Bruna Aguiar...). Concatenar no(s) parágrafo(s) existentes; se só houver um `<p>`, juntar os 4 mantendo os `<strong>` nos termos em negrito.
- Botão `Start your journey` → `Agende sua Avaliação` + WhatsApp global.

- [ ] **Step 3: Remover o bloco promocional "40% Off"**

Localizar `40% Off — Our lowest price ever` e o botão `Start trial` no bloco promo. Remover esse bloco (não há promoção). Se remoção completa for arriscada, trocar o texto para `Cada protocolo é definido após uma avaliação individualizada.` e o botão `Start trial` → `Agende sua Avaliação` + WhatsApp.

- [ ] **Step 4: Trocar os contadores (Stats)**

Os contadores animados são `Years of experience`, `Per month classes`, `Instructors`. Trocar os rótulos e os números-alvo para (⚠️ provisório):
- `5.0` → rótulo `Avaliação no Google`
- `169` (com `+`) → rótulo `Avaliações de pacientes`
- `40` (com `+`) → rótulo `Tratamentos disponíveis`
- `100` (com `%`) → rótulo `Foco em naturalidade`

Os contadores usam dígitos empilhados por casa (`0 1 2 3...`). Ajustar o dígito final/alvo de cada coluna para bater com o número (5, 169, 40, 100) conforme a mecânica do template; onde o template usa 3 números e precisamos de 4, duplicar a estrutura de uma coluna para criar a 4ª. Adicionar `<!-- TODO revisar: cliente confirmar números -->` antes do bloco.

- [ ] **Step 5: Verificar**

Run: `grep -c "Referência em estética natural" breathiva.webflow.io/index.html`
Expected: 1
Run: `grep -c "Years of experience" breathiva.webflow.io/index.html`
Expected: 0
Visual: conferir no navegador se os contadores animam para 5.0 / 169+ / 40+ / 100%.

- [ ] **Step 6: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: seção Sobre + Estatísticas (provisório)"
```

---

### Task 7: Growth → Pilares

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-growth`)

- [ ] **Step 1: Trocar título e texto**

- Título `Creating a welcoming space for balance, growth, and well-being` (ocorrência da `rt-growth`) → `Nosso jeito de cuidar`
- Texto → `Não buscamos transformar quem você é, mas realçar seus traços, tratar o que realmente incomoda e conduzir cada etapa com naturalidade, segurança e acompanhamento próximo — do pré ao pós-procedimento.`

- [ ] **Step 2: Trocar a lista de benefícios (checklist)**

Substituir os 5 itens (Improved flexibility, Enhanced mindfulness, Whole-body wellness, Better posture and strength, Relief stress and anxiety) por:
1. `Avaliação criteriosa e plano individualizado`
2. `Resultados naturais que preservam a sua identidade`
3. `Tecnologia e protocolos de última geração`
4. `Acompanhamento do pré ao pós-procedimento`
5. `Estética facial, corporal e capilar em um só lugar`

(Ícones de check permanecem.)

- [ ] **Step 3: Verificar**

Run: `grep -c "Avaliação criteriosa e plano individualizado" breathiva.webflow.io/index.html`
Expected: 1
Run: `grep -c "Enhanced mindfulness" breathiva.webflow.io/index.html`
Expected: 0

- [ ] **Step 4: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: seção Pilares/diferenciais"
```

---

### Task 8: Table → Tratamentos (catálogo por categoria)

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-table-v2`)

**Interfaces:**
- Consumes: âncora `#tratamentos` (Task 3).

- [ ] **Step 1: `id="tratamentos"` na seção**

Adicionar `id="tratamentos"` à abertura de `<section class="rt-table-v2"...`.

- [ ] **Step 2: Trocar título**

`Find a class time that fits your lifestyle` → `Nossos tratamentos`.

- [ ] **Step 3: Trocar as linhas da tabela pelas categorias**

A tabela tem 6 linhas (yoga type + dias + horários). Reaproveitar como 5 linhas = 5 categorias. Para cada linha:
- Coluna 1 (nome): a categoria.
- Colunas de detalhe (onde havia dias/horários): listar os principais tratamentos da categoria.

Conteúdo (de `conteudo-site.md` linhas 118–175), por categoria:
1. `Estética Facial` — `Toxina Botulínica · Preenchimento com Ácido Hialurônico · Skinboosters · Bioestimuladores de Colágeno · Fios de Sustentação (PDO) · Microagulhamento`
2. `Tecnologias & Laser Facial` — `HYPRO (Ultrassom Microfocado) · Laser CO2 Fracionado · Melasma e Manchas · BB Glow · Luz Intensa Pulsada`
3. `Cuidados Faciais & Skincare` — `Limpeza de Pele Profunda · Peeling de Diamante · Dermaplaning · Revitalização Facial · Design de Sobrancelhas`
4. `Estética Corporal` — `HYPRO Corporal · Bioestimuladores Corporais · PEIM (Microvasos) · Endolaser · Drenagem Linfática`
5. `Tricologia — Saúde Capilar` — `Avaliação Capilar Detalhada · Mesoterapia + Alta Frequência + LEDterapia + Ozonioterapia · Terapia de Acalmia`

Se a tabela tiver 6 linhas, remover a 6ª ou usá-la para o CTA. Terminar a seção com a faixa `Cada protocolo é definido após uma avaliação individualizada.` + botão `Agende sua Avaliação` (WhatsApp global) se houver slot; senão deixar para a Task 9 (Booking).

- [ ] **Step 4: Verificar**

Run: `grep -c "HYPRO" breathiva.webflow.io/index.html`
Expected: ≥ 1
Run: `grep -c "Hatha Yoga" breathiva.webflow.io/index.html`
Expected: 0

- [ ] **Step 5: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: seção Tratamentos (catálogo)"
```

---

### Task 9: Booking → Faixa CTA "Agende sua Avaliação"

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-booking-v2`)

- [ ] **Step 1: Trocar copy e imagem**

- Título `Experience mindful Yoga today` → `Vamos cuidar da sua beleza — do seu jeito`
- Subtítulo (se houver) → `Agende sua avaliação e receba um plano personalizado, com naturalidade e segurança em cada etapa.`
- Botão `start your journey` → `Agende sua Avaliação` + WhatsApp global.
- Imagem `alt="book class image 1"` (`...Recta.avif`) → `src="assets/instituto/recepcao.jpg"` (remover `srcset`/`sizes`), `alt="Recepção do Instituto Bruna Aguiar"`.

- [ ] **Step 2: Verificar**

Run: `grep -c "Vamos cuidar da sua beleza" breathiva.webflow.io/index.html`
Expected: 1

- [ ] **Step 3: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: faixa CTA de agendamento"
```

---

### Task 10: Gallery → Galeria (fotos dos espaços)

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-gallery-v2`)

**Interfaces:**
- Consumes: `assets/instituto/espaco-1..8.jpg` (Task 1); âncora `#galeria` (Task 3).

- [ ] **Step 1: `id="galeria"` na seção**

Adicionar `id="galeria"` à abertura de `<section class="rt-gallery-v2"...`.

- [ ] **Step 2: Trocar título**

`A peaceful collection of moments from our Yoga sessions` → `Um ambiente pensado para o seu cuidado`.

- [ ] **Step 3: Trocar imagens do slider**

Repontar os slides `home-gallery-1..6` (e as duplicatas de loop com o mesmo src) para `assets/instituto/espaco-1.jpg` … `espaco-6.jpg`, removendo `srcset`/`sizes`. Mapear cada `alt` para a legenda correspondente de `conteudo-site.md` linhas 196–203 (ex.: espaco-1 → `Ambiente do Instituto Bruna Aguiar`). Repontar também `home-v6-1`/`home-v6-2` (imagens de moldura da seção) para `assets/instituto/espaco-7.jpg` e `espaco-8.jpg`.

- [ ] **Step 4: Trocar os rótulos do slider**

Rótulos `Vinyasa Yoga`, `Hatha Yoga`, `Power Yoga`, `Outdoor Yoga`, `Mindfulness Yoga`, `Ashtanga Yoga` (aparecem 2x cada) → `Recepção`, `Sala de atendimento`, `Ambiente acolhedor`, `Espaço de cuidado`, `Sala de procedimentos`, `Nosso espaço`.

- [ ] **Step 5: Verificar**

Run: `grep -c "699d6711" breathiva.webflow.io/index.html`  (hash de um asset de galeria antigo)
Expected: 0
Run: `grep -c "assets/instituto/espaco-1.jpg" breathiva.webflow.io/index.html`
Expected: ≥ 1
Visual: slider da galeria mostra as fotos dos espaços e navega normalmente.

- [ ] **Step 6: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: galeria com fotos dos espaços"
```

---

### Task 11: Pricing → Tratamentos em destaque (sem preço)

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-pricing-v2`)

- [ ] **Step 1: Trocar título/subtítulo**

- Título `Choose a membership designed for your wellness journey` → `Tratamentos em destaque`
- Subtítulo → `Alguns dos protocolos mais procurados no Instituto — todos com avaliação personalizada.`

- [ ] **Step 2: Converter os 2 cards de plano em cards de tratamento (remover preço)**

Card 1 → `HYPRO — Ultrassom Microfocado`, sem valor. Remover o preço `$79`/`Monthly Subscription`. Lista de bullets:
`Lifting facial sem cirurgia · Estímulo de colágeno · Efeito progressivo e natural · Também disponível para o corpo`. Texto: `Tecnologia de ultrassom microfocado para lifting e firmeza, sem cortes e sem afastamento.` Botão `Start your journey` → `Agende sua Avaliação` + WhatsApp.

Card 2 → `Harmonização Facial`, sem valor. Remover `$179`. Bullets:
`Toxina botulínica · Preenchimento com ácido hialurônico · Bioestimuladores de colágeno · Resultados harmônicos e naturais`. Texto: `Planejamento individualizado para realçar seus traços preservando a sua identidade.` Botão → `Agende sua Avaliação` + WhatsApp.

Remover qualquer selo de "mais popular"/desconto se houver.

- [ ] **Step 3: Verificar**

Run: `grep -Ec "\\$79|\\$179|Monthly Subscription" breathiva.webflow.io/index.html`
Expected: 0
Run: `grep -c "Harmonização Facial" breathiva.webflow.io/index.html`
Expected: ≥ 1

- [ ] **Step 4: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: tratamentos em destaque (sem preço)"
```

---

### Task 12: Our story → Depoimentos (60 avaliações)

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-our-story`)

**Interfaces:**
- Consumes: âncora `#depoimentos` (Task 3).

- [ ] **Step 1: `id="depoimentos"` na seção**

Adicionar `id="depoimentos"` à abertura de `<section class="rt-our-story"...`.

- [ ] **Step 2: Trocar cabeçalho**

- Selo `Our story` → `5.0 · 169 avaliações no Google`
- Adicionar título `O que dizem nossas pacientes` e subtítulo `Histórias reais de quem confia no cuidado do Instituto Bruna Aguiar.` (usar os slots de heading existentes da seção; se não houver, reaproveitar o primeiro `<h2>/<h3>` da seção).

- [ ] **Step 3: Substituir os depoimentos**

A seção tem N cards de depoimento (Helen Hermiston / Liam Carter / Ava Richardson / Noah Thompson…), cada um com nome + cargo + citação. Substituir pelos depoimentos reais de `conteudo-site.md` linhas 224–342 (60 itens: nome + texto). Estrutura por card:
- nome = nome do paciente (ex.: `Anna Karla Américo`)
- cargo/subtítulo = `Paciente` (o template tem um 2º campo; usar `Paciente` para todos)
- citação = o texto do depoimento.

Replicar o markup de um card existente para chegar a 60 cards (o marquee/carrossel do template itera sobre os cards). Se o template duplicar os cards para o loop, aplicar o conteúdo à lista-fonte e deixar a duplicação de loop como está no template.

Se houver avatares de imagem por depoimento, remover a imagem do avatar (não temos fotos das pacientes) ou substituir por um placeholder de inicial — preferir remover o `<img>` do avatar mantendo o card.

- [ ] **Step 4: Verificar**

Run: `grep -c "Anna Karla Américo" breathiva.webflow.io/index.html`
Expected: 1
Run: `grep -c "Andrea Quaresma" breathiva.webflow.io/index.html`  (último, item 60)
Expected: 1
Run: `grep -c "Helen Hermiston" breathiva.webflow.io/index.html`
Expected: 0

- [ ] **Step 5: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: depoimentos reais (60)"
```

---

### Task 13: Yoga classes (vídeo) → Spotlight Dra. Bruna Aguiar

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-yoga-classes-v2`)

**Interfaces:**
- Consumes: `assets/instituto/dra-bruna.jpg` (Task 1); âncora `#equipe` (Task 3).

- [ ] **Step 1: `id="equipe"` na seção**

Adicionar `id="equipe"` à abertura de `<section class="rt-yoga-classes-v2"...`.

- [ ] **Step 2: Trocar cabeçalho e remover o vídeo**

- Selo `Yoga classes` → `Nossa equipe`
- Título `Video tutorials for online Yoga classes` → `As pessoas por trás do seu cuidado`
- Localizar o player de vídeo/embed da seção (iframe/`<video>`/thumbnail de vídeo) e substituí-lo pela foto `assets/instituto/dra-bruna.jpg` (`alt="Dra. Bruna Aguiar — responsável técnica"`, remover `srcset`/`sizes`).

- [ ] **Step 3: Adicionar os dados da Dra. Bruna**

Ao lado/abaixo da foto: nome `Dra. Bruna Aguiar`, cargo `Responsável técnica`, e texto: `À frente do Instituto, a Dra. Bruna conduz cada avaliação com escuta, critério e um olhar atento à beleza natural de cada paciente.` Botão `Agende sua Avaliação` + WhatsApp global. (Apenas a Dra. Bruna — não incluir outros membros.)

- [ ] **Step 4: Verificar**

Run: `grep -c "Dra. Bruna Aguiar" breathiva.webflow.io/index.html`
Expected: ≥ 1
Run: `grep -c "Video tutorials for online Yoga" breathiva.webflow.io/index.html`
Expected: 0

- [ ] **Step 5: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: spotlight Dra. Bruna Aguiar"
```

---

### Task 14: FAQ (nova seção accordion)

**Files:**
- Modify: `breathiva.webflow.io/index.html` (inserir seção antes do footer)

**Interfaces:**
- Consumes: âncora `#faq` (Task 3).

- [ ] **Step 1: Inserir a seção FAQ antes do footer**

Imediatamente antes de `<section class="rt-footer"`, inserir uma seção FAQ com `id="faq"`. Reaproveitar classes utilitárias de container do template (`w-layout-blockcontainer rt-container-xxl w-container`) e usar o accordion nativo do Webflow (`w-dropdown`) OU um accordion `<details>/<summary>` simples e acessível. Preferir `<details>` (não depende de JS do Webflow):

```html
<!-- TODO revisar: cliente confirmar perguntas/respostas do FAQ -->
<section id="faq" class="rt-faq-instituto" style="padding:6rem 0;background:#f9f6f3;">
  <div class="w-layout-blockcontainer rt-container-xxl w-container">
    <p class="rt-eyebrow">Perguntas frequentes</p>
    <h2 class="rt-gap-off">Respostas que trazem clareza</h2>
    <div class="rt-faq-list" style="max-width:820px;margin:2.5rem auto 0;">
      <!-- repetir <details> para cada pergunta -->
    </div>
  </div>
</section>
```

Adicionar um `<details>` por pergunta (6), com pergunta em `<summary>` e resposta em `<p>`. Conteúdo verbatim de `conteudo-site.md` linhas 349–365 (6 perguntas/respostas). Exemplo do 1º item:

```html
<details class="rt-faq-item" style="border-bottom:1px solid #e7e9e1;padding:1.25rem 0;">
  <summary style="font-weight:600;cursor:pointer;list-style:none;">Como funciona a primeira avaliação?</summary>
  <p style="margin-top:.75rem;color:#414e3d;">A primeira consulta é dedicada a entender seus objetivos, avaliar sua pele e seus traços e montar um plano individualizado. Nenhum procedimento é feito sem essa avaliação criteriosa.</p>
</details>
```

Repetir para as perguntas 2–6 com o texto verbatim das linhas 352–365.

- [ ] **Step 2: Verificar**

Run: `grep -c "Respostas que trazem clareza" breathiva.webflow.io/index.html`
Expected: 1
Run: `grep -c "<summary" breathiva.webflow.io/index.html`
Expected: 6
Visual: seção FAQ aparece antes do footer; cada item abre/fecha ao clicar.

- [ ] **Step 3: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: seção FAQ (accordion, provisório)"
```

---

### Task 15: Footer — contato, endereço, redes, CTA

**Files:**
- Modify: `breathiva.webflow.io/index.html` (`section.rt-footer`)

**Interfaces:**
- Consumes: âncora `#contato`; `assets/instituto/logo.png`.

- [ ] **Step 1: `id="contato"` no footer**

Adicionar `id="contato"` à abertura de `<section class="rt-footer"...`.

- [ ] **Step 2: Trocar logo e frase**

- Logo do footer → `assets/instituto/logo.png` (alt `Instituto Bruna Aguiar`).
- Frase/manifesto → `Estética com técnica, propósito e naturalidade. Referência em estética avançada, sofisticação e tecnologia em Brasília-DF.`

- [ ] **Step 3: Trocar colunas de links**

- Coluna de navegação (`Our studio`, `Yoga classes`, `Workshop`, `gallery`, `Pricing plan`, `Instructor`) → `Sobre` (#sobre), `Tratamentos` (#tratamentos), `Galeria` (#galeria), `Equipe` (#equipe), `Depoimentos` (#depoimentos), `FAQ` (#faq).
- Horário (`Monday to Thursday...`) → `Segunda a sexta · 9h às 18h`.
- CTA `start your wellness journey` → `Agende sua Avaliação` + WhatsApp global.

- [ ] **Step 4: Trocar contato, endereço e redes**

- Endereço `410 Sandtown, California, 94001, USA` (todas as ocorrências) → `SGAS 910, Bloco F — Mix Park Sul, Salas 11/13/15, Asa Sul, Brasília-DF, 70390-100`. Adicionar link `Como chegar →` para `https://maps.google.com/?q=Instituto+Bruna+Aguiar+SGAS+910+Mix+Park+Sul+Asa+Sul+Brasilia` (`target="_blank" rel="noopener"`).
- Telefone: adicionar `(61) 98120-4327` com `href="tel:+5561981204327"`.
- Redes sociais: Instagram `https://www.instagram.com/instituto.brunaaguiar` e `https://www.instagram.com/drabrunaaguiar_`; site `https://brunaaguiar.com.br`. Remover ícones/links de Facebook, X/Twitter e LinkedIn (não fornecidos) ou apontar os que sobrarem para o Instagram.
- Remover créditos do template (`radianttemplates.com`, "Webflow").

- [ ] **Step 5: Verificar**

Run: `grep -c "98120-4327" breathiva.webflow.io/index.html`
Expected: ≥ 1
Run: `grep -Ec "Sandtown|radianttemplates|Yoga classes" breathiva.webflow.io/index.html`
Expected: 0

- [ ] **Step 6: Commit**

```bash
git add breathiva.webflow.io/index.html
git commit -m "feat: footer do Instituto (contato, endereço, redes)"
```

---

### Task 16: Varredura final de resíduos + verificação visual

**Files:**
- Modify: `breathiva.webflow.io/index.html` (correções pontuais)

- [ ] **Step 1: Procurar textos residuais do template**

Run:
```bash
grep -oiE "yoga|wellness journey|instructor|membership|breathiva|meditation|Webflow" breathiva.webflow.io/index.html | sort | uniq -c
```
Expected: idealmente 0 em textos visíveis. Para cada resíduo em conteúdo visível (ignorar nomes de classe CSS `rt-...`, ids de interação e nomes de arquivo de asset), corrigir com o termo do Instituto equivalente.

- [ ] **Step 2: Verificar todos os CTAs apontam pro WhatsApp**

Run: `grep -Ec 'href="/contact"|href="/pricing-one"|href="/pricing-two"' breathiva.webflow.io/index.html`
Expected: 0 (todos convertidos)
Run: `grep -c "5DWUJQU6VH5VP1" breathiva.webflow.io/index.html`
Expected: ≥ 8 (um por seção com CTA)

- [ ] **Step 3: Verificar ausência de mídia de vídeo remanescente**

Run: `grep -Ec "<video|w-background-video|Play video|Pause video" breathiva.webflow.io/index.html`
Expected: 0

- [ ] **Step 4: Verificação visual no navegador**

Abrir `breathiva.webflow.io/index.html` no navegador e validar seção por seção:
- Hero com imagem (sem vídeo), título e CTAs corretos.
- Menu âncora rola para as seções certas.
- Contadores animam para 5.0/169+/40+/100%.
- Galeria carrega fotos dos espaços e o slider funciona.
- Depoimentos rolam no marquee.
- FAQ abre/fecha.
- Footer com contato/endereço/redes corretos.
- Todos os botões de CTA abrem o WhatsApp em nova aba.
- Layout responsivo no mobile (largura ~390px) sem quebras.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: varredura final de resíduos do template"
```

---

## Notas de execução

- **Ordem**: Task 1 → 16 em sequência (Task 3 define as âncoras que as demais consomem).
- **Reversível**: cada task é um commit; se uma edição quebrar o layout, `git revert` do commit isola o problema.
- **Edição do minificado**: sempre `grep` o texto-alvo antes de editar para pegar o contexto exato do `old_string` e garantir unicidade.
