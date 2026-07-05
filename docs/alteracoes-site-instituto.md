# Alterações aplicadas — Site Instituto Bruna Aguiar

Data: 2026-07-04 / 2026-07-05  
Arquivo principal: `breathiva.webflow.io/index.html`  
Assets: `breathiva.webflow.io/assets/instituto/`  
CSS customizado: bloco `<style data-offline="1">` no `<head>`  
Script de reaplicação: `scripts/reapply-instituto-alteracoes.py`

Este documento registra **todas as personalizações** feitas sobre o template Breathiva, para facilitar revisão e reaplicação caso o `index.html` seja sobrescrito.

> **Registro:** Dev Sênior — 2026-07-05. Revisão completa, reaplicação de customizações, remoção de blocos solicitados, troca de foto da equipe e novo footer integrado.

---

## 1. Hero

| Item | Valor |
|------|-------|
| Título (`<h1>`) | **Natural como a vida** |
| Classe do título | `rt-home-hero-big-text rt-gap-off rt-text-color-white` |
| Removido do hero | "O cuidado certo muda tudo" e "Estética avançada, natural e sofisticada" |
| **Removido (2026-07-05)** | Coluna direita com pilares: Naturalidade, Sofisticação, Tecnologia, Individualização |
| Imagem de fundo | `assets/instituto/hero.jpg` (substitui vídeo do template) |
| Enquadramento | `object-position: 72% 28%` (inline + CSS responsivo: 68% 24% tablet, 62% 20% mobile) |
| Hero decorativo (flutuantes) | `jardim.jpg`, `espaco-1.jpg`, `espaco-2.jpg`, `espaco-3.jpg` |

---

## 2. Menu lateral desktop (`.rt-slide-nav`)

| Item | Valor |
|------|-------|
| Logo | `assets/instituto/logo.png` |
| Título | **Localização e acesso** |
| Endereço | Mix Park Sul — SGAS 910, Bloco F, Salas 11/13/15, Asa Sul, Brasília-DF, CEP 70390-100 |
| Região | Coração do Plano Piloto, com fácil acesso pelas vias principais |
| Estacionamento | Estacionamento local gratuito + rotativo pago |
| Link Maps | **Abrir no Maps →** → Google Maps do Instituto |
| CTA | **Agende sua Avaliação** (WhatsApp) |
| Instagram | https://www.instagram.com/instituto.brunaaguiar/ |
| Facebook | https://www.facebook.com/institutobrunaaguiar/ |

Classes CSS adicionadas: `.rt-slide-nav-location`, `.rt-slide-nav-maps-link`, `.rt-slide-nav-cta`

---

## 3. Menu mobile (`.rt-nav-image-text-wrap`)

| Item | Valor |
|------|-------|
| Título | **Instituto Bruna Aguiar** |
| Imagem lateral | `assets/instituto/jardim.jpg` |
| Instagram | https://www.instagram.com/instituto.brunaaguiar/ |
| Facebook | https://www.facebook.com/institutobrunaaguiar/ |

---

## 4. Estatísticas (`.rt-our-studio-counter-block`, seção `#sobre`)

| Número | Legenda |
|--------|---------|
| **5** | Avaliação 5 estrelas no Google |
| **6 mil+** | Mais de 6 mil pacientes atendidos |
| **40+** | Tratamentos disponíveis |
| **100%** | Foco em naturalidade |

**Correção de bug:** removido wrapper `.rt-counter.rt-overflow-hidden` (causava exibição "5 0" pela animação split de caracteres do GSAP).

**CSS:** espaçamento entre colunas via `.rt-our-studio-counter-block` e `.rt-counter-compact` para "6 mil+".

---

## 5. Ícones das áreas de atuação (`.rt-therapy-main`)

Substituídos ícones yoga/spa do template por SVGs customizados em `assets/instituto/`:

| Área | Arquivo |
|------|---------|
| Topo da seção (cuidado integral) | `icon-wellness.svg` |
| Estética Facial | `icon-facial.svg` |
| Tecnologias & Laser | `icon-laser.svg` |
| Estética Corporal | `icon-corporal.svg` |
| Tricologia | `icon-tricologia.svg` |

Cor dos traços: `#D8AA78` (dourado do template).

---

## 6. Fotos reais — mapeamento

### Origem (`public/`)

| Pasta | Arquivos |
|-------|----------|
| `public/espacos/` | `recepcao.jpg`, `sala-1.jpg`, `sala-2.jpg`, `jardim.jpg` |
| `public/galeria/` | `espaco-1.jpg` … `espaco-8.jpg` |
| `public/equipe/` | `membro-1.jpg` (Dra. Bruna Aguiar) |
| `public/` | `hero.jpg`, `logo.png`, `icon.png` |

**Não usar:** PNGs brutos de `public/fotos_local/` e `public/fotos_time/` (12MB+).

### Destino no site

| Seção | Imagens |
|-------|---------|
| Hero | `hero.jpg` |
| Hero decorativo (flutuantes) | `jardim.jpg`, `espaco-1.jpg`, `espaco-2.jpg`, `espaco-3.jpg` |
| Sobre (`#sobre`) — 3 fotos | `recepcao.jpg`, `sala-1.jpg`, `jardim.jpg` |
| Nosso jeito de cuidar (pilares) | `espaco-6.jpg`, `sala-2.jpg` |
| Faixa de agendamento | `recepcao.jpg` |
| Galeria (`#galeria`) — 6 cards | `espaco-1.jpg` … `espaco-6.jpg` |
| Galeria — título animado | `espaco-7.jpg`, `espaco-8.jpg` |
| Depoimentos (slider) | `espaco-7.jpg`, `espaco-8.jpg` |
| Equipe (`#equipe`) | `INSTITUTO-23.png` (origem: `public/fotos_time/`, otimizado ~1400px) |
| Nav mobile / footer | `jardim.jpg`, `espaco-8.jpg` |

**Nota equipe (2026-07-05):** Seção `#equipe` exibe somente a foto da equipe — removidos bloco de texto "Dra. Bruna Aguiar / Responsável técnica" e CTA duplicado.

### Legendas da galeria

| Arquivo | Legenda |
|---------|---------|
| espaco-1.jpg | Ambiente do Instituto Bruna Aguiar |
| espaco-2.jpg | Sala de atendimento do Instituto |
| espaco-3.jpg | Recepção do Instituto Bruna Aguiar |
| espaco-4.jpg | Espaço de cuidado e estética |
| espaco-5.jpg | Detalhe do ambiente do Instituto |
| espaco-6.jpg | Sala de procedimentos |
| espaco-7.jpg | Ambiente acolhedor do Instituto |
| espaco-8.jpg | Espaço do Instituto Bruna Aguiar |

**Título da galeria:** "Conheça os espaços do Instituto Bruna Aguiar"

**Lightbox:** URLs apontam para `assets/instituto/espaco-*.jpg` (não CDN Webflow).

---

## 7. IDs de seção (navegação)

| Âncora do menu | ID no HTML |
|----------------|------------|
| Sobre | `id="sobre"` |
| Galeria | `id="galeria"` |
| Equipe | `id="equipe"` |

---

## 8. CSS customizado (`<style data-offline="1">`)

Regras adicionadas além da visibilidade offline:

- Hero: `object-position` responsivo
- Menu lateral: largura, tipografia e link Maps
- Estatísticas: gap, flex-wrap, `white-space: nowrap`, fonte compacta para "6 mil+"

---

## 9. O que NÃO entra (por decisão do spec)

- Membros 2, 3 e 4 da equipe (`membro-2.jpg`, `membro-3.jpg`, `membro-4.jpg`) — aguardar confirmação da clínica
- PNGs de `fotos_local/` e `fotos_time/` sem compressão
- Nova identidade visual (cores/fontes do Breathiva são mantidas)

---

## 10. Verificação rápida (grep)

```bash
# Deve retornar resultados
grep -c "Natural como a vida" breathiva.webflow.io/index.html
grep -c "Localização e acesso" breathiva.webflow.io/index.html
grep -c "6 mil+" breathiva.webflow.io/index.html
grep -c "icon-facial.svg" breathiva.webflow.io/index.html
grep -c 'id="galeria"' breathiva.webflow.io/index.html

# Não deve retornar (stats antigos / bug)
grep -c "169+" breathiva.webflow.io/index.html
grep -c "rt-counter rt-overflow-hidden" breathiva.webflow.io/index.html
```

---

## 11. Footer (`#contato`) — novo layout (2026-07-05)

Substituído o footer template Breathiva (`rt-footer`) por footer customizado (`ib-footer`), inspirado no componente shadcn/ui (adaptado para HTML estático).

| Coluna | Conteúdo |
|--------|----------|
| Marca | Logo + "Instituto Bruna Aguiar" + descrição |
| Links úteis | Sobre, Tratamentos, Galeria, Equipe, FAQ |
| Siga-nos | Facebook, Instagram + horário (Seg–Sex 9h–18h) |
| Newsletter | Formulário de e-mail com feedback visual |
| Barra inferior | © 2026 + CTA WhatsApp "Agende sua Avaliação" |

Endereço e link Maps na coluna newsletter. Estilos em `<style data-offline="1">` (classes `.ib-footer-*`).

---

## 12. Reaplicação automática

```bash
python3 scripts/reapply-instituto-alteracoes.py
```

O script copia assets de `public/`, reaplica hero, menus, stats, ícones, galeria, equipe, footer e corrige lightbox CDN.

---

## Referências

- Spec de design: `docs/superpowers/specs/2026-07-04-site-breathiva-instituto-design.md`
- Plano de implementação: `docs/superpowers/plans/2026-07-04-site-breathiva-instituto.md`
- Copy e legendas: `conteudo-site.md`
