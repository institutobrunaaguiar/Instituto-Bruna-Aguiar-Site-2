# Design — Site Instituto Bruna Aguiar (adaptação do template Breathiva)

Data: 2026-07-04
Status: aprovado (aguardando revisão do spec)

## Objetivo

Construir o novo site institucional de página única do **Instituto Bruna Aguiar**
(clínica de estética avançada, Asa Sul, Brasília-DF) **adaptando o export Webflow
do template Breathiva** (`breathiva.webflow.io/index.html`).

## Abordagem

- **Editar o export Webflow in-place**: trocar textos e imagens no `index.html`,
  mantendo o CSS, o GSAP/ScrollTrigger e as interações do Webflow.
- **Sem reescrever a stack** (não é Next.js). Trabalho de conteúdo + troca de mídia
  + remoções/repurpose de seções.

## Identidade visual — MANTIDA do Breathiva

- Paleta: verde-floresta `#1f2a1c`, dourado/bege `#d8aa78` / `#9e9271`, creme `#f9f6f3`.
- Fontes: Avelora / Orticalinear (títulos) + Satoshi (corpo).
- **Não** aplicar a antiga marca azul do Instituto. Sem cirurgia de CSS de cor/fonte.

## Mapa de seções (Breathiva → Instituto)

| # | Seção Breathiva | Vira | Conteúdo |
|---|---|---|---|
| 1 | Hero (vídeo de fundo) | **Hero (imagem)** | Logo; título "Estética avançada, natural e sofisticada"; subtítulo = tagline "Estética com técnica, propósito e naturalidade."; CTA "Agende sua Avaliação" (WhatsApp) + "Conheça os tratamentos" (#tratamentos). **Fundo = imagem `hero.jpg`, sem vídeo.** |
| 2 | Wellness (4 cards) | **Áreas de atuação** | Estética Facial · Tecnologias & Laser · Estética Corporal · Tricologia (descrições da seção 3 do conteudo-site.md) |
| 3 | About + contadores | **Sobre + Estatísticas** | 4 parágrafos institucionais; contadores 5.0 · 169+ · 40+ · 100% ⚠️ provisório |
| 4 | Growth (checklist) | **Pilares** | 01 Naturalidade · 02 Sofisticação · 03 Tecnologia |
| 5 | Table (grade horários) | **Tratamentos** | Catálogo por 5 categorias (Facial; Tecnologias & Laser; Skincare; Corporal; Tricologia) |
| 6 | Booking (banner) | **Faixa CTA** | "Agende sua Avaliação" → WhatsApp |
| 7 | Gallery (slider) | **Galeria** | 8 fotos `galeria/espaco-1..8.jpg` com legendas (seção 5) |
| 8 | Pricing (2 planos) | **Tratamentos em destaque** | 2–3 carro-chefe (ex.: HYPRO — Ultrassom Microfocado; Harmonização Facial), **sem preço** |
| 9 | Our story (depoimentos) | **Depoimentos** | 60 avaliações reais (seção 7) |
| 10 | Yoga classes (vídeo) | **Dra. Bruna Aguiar** | Spotlight da responsável técnica (única confirmada); foto `equipe/membro-1.jpg` |
| 11 | Footer | **Footer** | Contato, endereço "Como chegar →", redes |
| ➕ | *(novo)* | **FAQ** | Accordion, 6 perguntas (seção 8) ⚠️ provisório — adaptar estrutura do template |

## Alteração do Hero (imagem no lugar do vídeo)

- O Hero usa `div.rt-hero-video.w-background-video` com `<video>` (mp4/webm) + botão
  play/pause + interações GSAP.
- **Trocar por imagem estática**: substituir o bloco de vídeo por fundo de imagem
  (`hero.jpg`); remover o botão play/pause e as interações de vídeo associadas.
- Manter o overlay, o título, o subtítulo, os CTAs e os 4 blocos do Hero.

## CTA global do WhatsApp (regra em TODAS as seções)

- **Todos os CTAs** do site ("Agende sua Avaliação", banners, footer, botões dos
  cards, etc.) apontam para o mesmo link:
  `https://api.whatsapp.com/message/5DWUJQU6VH5VP1?autoload=1&app_absent=0&utm_source=ig`
- Mensagem pretendida: **"Olá, tudo bem? Vim do site e quero saber mais informações."**
- ⚠️ Caveat: o formato `api.whatsapp.com/message/CÓDIGO` define a saudação no painel do
  WhatsApp Business e pode ignorar texto via URL. Deixar comentado no código a
  alternativa `https://wa.me/5561981204327?text=Ol%C3%A1%2C%20tudo%20bem%3F%20Vim%20do%20site%20e%20quero%20saber%20mais%20informa%C3%A7%C3%B5es.`
  caso o texto pré-preenchido não apareça.
- Todos os links abrem em nova aba (`target="_blank" rel="noopener"`).

## Dados de contato (fonte: conteudo-site.md)

- Telefone/WhatsApp: (61) 98120-4327 · https://wa.me/5561981204327 · tel:+5561981204327
- Endereço: SGAS 910, Bloco F, Mix Park Sul, Salas 11/13/15, Asa Sul, Brasília-DF, 70390-100
- Horário: Segunda a sexta · 9h às 18h
- Instagram: @instituto.brunaaguiar e @drabrunaaguiar_ · Site: brunaaguiar.com.br
- Google Maps: link de "Como chegar →" no footer

## Imagens

- Hero: `public/hero.jpg`
- Galeria: `public/galeria/espaco-1..8.jpg`
- Dra. Bruna: `public/equipe/membro-1.jpg`
- Logo/favicon: `public/logo.png` / `public/icon.png`
- Áreas de atuação e Tratamentos em destaque: reaproveitar fotos dos espaços
  (`public/espacos/` e `public/galeria/`).
- **Nunca** referenciar os PNGs brutos de `fotos_local/` e `fotos_time/` (12MB+).
- As imagens do Instituto entram na pasta `assets/` do export (ou `public/`), com os
  `src`/`srcset` do template ajustados para apontar para elas.

## Conteúdo provisório (⚠️ marcar `<!-- TODO revisar -->` no código)

- Números de Estatísticas (5.0 / 169+ / 40+ / 100%).
- Textos do FAQ (6 perguntas).
- Equipe: exibir **somente a Dra. Bruna Aguiar** (responsável técnica) — os 3 nomes
  genéricos ("Equipe Instituto") **não** entram até a clínica confirmar.

## Fora de escopo

- Nova identidade de cor/fonte.
- Reescrita em Next.js/React.
- Confirmação da copy RASCUNHO (depende da cliente).
- Conteúdo de vídeo (a clínica não tem).

## Verificação

- Abrir o `index.html` no navegador e conferir cada seção (conteúdo trocado,
  imagens carregando, animações GSAP intactas, links de WhatsApp/tel/maps corretos,
  Hero com imagem sem vídeo, responsivo mobile).
- Sem suíte de testes (site apresentacional).
