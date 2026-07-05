#!/usr/bin/env python3
"""Aplica SEO, copy e arquitetura de categorias na home (index.html)."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "breathiva.webflow.io" / "index.html"

SITE_URL = "https://institutobrunaaguiar.com.br"
WHATSAPP = "https://api.whatsapp.com/message/5DWUJQU6VH5VP1?autoload=1&app_absent=0&utm_source=site"

TREATMENTS_SECTION = '''<section class="rt-table-v2 ib-treatments-compact" id="tratamentos" style="padding:5rem 0;background:#fff;">
<div class="w-layout-blockcontainer rt-container-xl w-container">
<div class="w-layout-vflex rt-class-time-main">
<div class="ib-areas-layout">
<div class="ib-areas-copy">
<div class="rt-home-v4-heading">
<p style="text-transform:uppercase;letter-spacing:.16em;font-size:.75rem;color:#9e9271;margin:0 0 .75rem;">Áreas de atuação</p>
<h2 class="rt-gap-off">Tratamentos por especialidade</h2>
<p class="rt-gap-off" style="margin:1rem 0 0;color:#414e3d;line-height:1.65;">Explore cada área com conteúdo técnico, indicações e FAQs. Passe o mouse nos cards para descobrir os protocolos.</p>
</div>
</div>
<div class="ib-display-cards" aria-label="Principais áreas de tratamento">
<a class="ib-display-card ib-display-card--1" href="/tratamentos-faciais/">
<div class="ib-display-card-head">
<span class="ib-display-card-icon"><img src="assets/instituto/icon-facial.svg" alt="" width="16" height="16"/></span>
<p class="ib-display-card-title">Estética facial e harmonização</p>
</div>
<p class="ib-display-card-desc">Avaliação facial, toxina botulínica, preenchimentos, bioestimuladores, regenerativos e fios.</p>
<p class="ib-display-card-meta">Ver tratamentos →</p>
</a>
<a class="ib-display-card ib-display-card--2" href="/tecnologias-faciais-e-laser/">
<div class="ib-display-card-head">
<span class="ib-display-card-icon"><img src="assets/instituto/icon-laser.svg" alt="" width="16" height="16"/></span>
<p class="ib-display-card-title">Tecnologias faciais e laser</p>
</div>
<p class="ib-display-card-desc">HYPRO, laser CO2 fracionado, BB Glow e protocolos para flacidez, textura e manchas.</p>
<p class="ib-display-card-meta">Ver tratamentos →</p>
</a>
<a class="ib-display-card ib-display-card--3" href="/tratamentos-corporais/">
<div class="ib-display-card-head">
<span class="ib-display-card-icon"><img src="assets/instituto/icon-corporal.svg" alt="" width="16" height="16"/></span>
<p class="ib-display-card-title">Tratamentos corporais</p>
</div>
<p class="ib-display-card-desc">HYPRO corporal, laser CO2, LIP e injetáveis para contorno, flacidez e qualidade da pele.</p>
<p class="ib-display-card-meta">Ver tratamentos →</p>
</a>
</div>
</div>
<div class="ib-areas-more">
<a href="/tratamentos-capilares/">Tricologia e saúde capilar</a>
<a href="/estetica-com-esteticista/">Cuidados com esteticista Adriana</a>
<a class="ib-areas-cta" href="/avaliacao-facial/">Comece pela avaliação facial</a>
</div>
<div style="text-align:center;margin-top:2rem;">
<a class="rt-button-v1 w-inline-block" href="''' + WHATSAPP + '''" target="_blank" rel="noopener" style="display:inline-block;padding:.75rem 1.5rem;background:#1f2a1c;color:#f9f6f3;border-radius:999px;text-decoration:none;font-size:.875rem;font-weight:500;">Agende sua avaliação</a>
</div>
</div>
</div>
</section>'''

SCHEMA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": ["MedicalBusiness", "LocalBusiness", "HealthAndBeautyBusiness"],
            "@id": f"{SITE_URL}/#organization",
            "name": "Instituto Bruna Aguiar",
            "url": SITE_URL,
            "telephone": "+5561981204327",
            "image": f"{SITE_URL}/assets/instituto/hero.jpg",
            "description": "Referência em estética avançada, harmonização facial, tecnologias regenerativas e tricologia na Asa Sul, Brasília.",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "SGAS 910, Bloco F, Mix Park Sul, Salas 11/13/15",
                "addressLocality": "Brasília",
                "addressRegion": "DF",
                "postalCode": "70390-100",
                "addressCountry": "BR",
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "169",
                "bestRating": "5",
            },
            "sameAs": [
                "https://www.instagram.com/instituto.brunaaguiar/",
                "https://www.facebook.com/institutobrunaaguiar/",
            ],
        },
        {
            "@type": "WebSite",
            "@id": f"{SITE_URL}/#website",
            "url": SITE_URL,
            "name": "Instituto Bruna Aguiar",
            "publisher": {"@id": f"{SITE_URL}/#organization"},
        },
    ],
}


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")

    # SEO head
    html = html.replace(
        "Instituto Bruna Aguiar — Estética avançada, natural e sofisticada | Brasília-DF",
        "Instituto Bruna Aguiar | Estética avançada em Brasília",
    )
    html = html.replace(
        "Instituto Bruna Aguiar — Estética avançada, natural e sofisticada",
        "Instituto Bruna Aguiar | Estética avançada em Brasília",
    )
    html = html.replace(
        'meta content="Referência em estética avançada no DF: harmonização facial natural, toxina botulínica, preenchimentos, bioestimuladores, lasers e ultrassom microfocado (HYPRO). Asa Sul, Brasília." name="description"',
        'meta content="Clínica de estética avançada na Asa Sul: harmonização facial, toxina botulínica, bioestimuladores, HYPRO, laser e tricologia. Avaliação individualizada e resultados naturais." name="description"',
    )
    html = html.replace(
        'property="og:description"/><meta content="assets/instituto/hero.jpg"',
        'property="og:description"/><meta content="https://institutobrunaaguiar.com.br/assets/instituto/hero.jpg"',
    )
    html = html.replace(
        'name="twitter:description"/><meta content="assets/instituto/hero.jpg"',
        'name="twitter:description"/><meta content="https://institutobrunaaguiar.com.br/assets/instituto/hero.jpg"',
    )

    if 'rel="canonical"' not in html:
        html = html.replace(
            '<meta content="width=device-width, initial-scale=1" name="viewport"/>',
            '<meta content="width=device-width, initial-scale=1" name="viewport"/>'
            '<meta name="robots" content="index, follow"/>'
            f'<link rel="canonical" href="{SITE_URL}/"/>'
            f'<meta property="og:url" content="{SITE_URL}/"/>'
            f'<meta property="og:locale" content="pt_BR"/>'
            f'<meta property="og:site_name" content="Instituto Bruna Aguiar"/>',
        )

    if "site-pages.css" not in html:
        html = html.replace(
            'rel="stylesheet" type="text/css"/>',
            'rel="stylesheet" type="text/css"/><link href="assets/instituto/site-pages.css" rel="stylesheet"/>',
            1,
        )

    if "display-cards.css" not in html:
        html = html.replace(
            '<link href="assets/instituto/site-pages.css" rel="stylesheet"/>',
            '<link href="assets/instituto/site-pages.css" rel="stylesheet"/>'
            '<link href="assets/instituto/display-cards.css" rel="stylesheet"/>',
            1,
        )

    if "application/ld+json" not in html:
        schema_tag = f'<script type="application/ld+json">{json.dumps(SCHEMA, ensure_ascii=False)}</script>'
        html = html.replace("</head>", schema_tag + "</head>", 1)

    # Hero: manter "Natural como a vida" (não sobrescrever)

    # Nav: tratamentos link to section stays; add second link optional - change href to /tratamentos-faciais/ for desktop? Keep #tratamentos for scroll on home

    # Wellness intro copy
    html = html.replace(
        "Estética facial, corporal e capilar com técnica e naturalidade",
        "Referência em estética facial, corporal e capilar",
    )
    html = html.replace(
        "Cuidado integral para realçar a sua beleza em cada fase da vida.",
        "Protocolos médicos e tecnológicos com avaliação individualizada e foco em naturalidade.",
    )

    # About copy - remove em dash
    html = html.replace(
        "acompanhamento próximo — do pré ao pós-procedimento.",
        "acompanhamento próximo, do pré ao pós-procedimento.",
    )
    html = html.replace(
        "conduzir cada etapa com naturalidade, segurança e acompanhamento próximo — do pré ao pós-procedimento.",
        "conduzir cada etapa com naturalidade, segurança e acompanhamento próximo, do pré ao pós-procedimento.",
    )

    # Booking CTA
    html = html.replace(
        "<h3 class=\"rt-gap-off\">Vamos cuidar da sua beleza — do seu jeito</h3>",
        "<h3 class=\"rt-gap-off\">Seu plano começa com uma avaliação criteriosa</h3>",
    )

    # Tricologia title fix
    html = html.replace("Tricologia — Saúde Capilar", "Tricologia e saúde capilar")

    # Replace tratamentos table section
    html = re.sub(
        r'<section class="rt-table-v2" id="tratamentos">.*?</section><section class="rt-booking-v2',
        TREATMENTS_SECTION + '<section class="rt-booking-v2',
        html,
        count=1,
        flags=re.DOTALL,
    )

    # Footer links
    footer_links = '''<ul class="ib-footer-links"><li><a href="#sobre">Sobre</a></li><li><a href="/tratamentos-faciais/">Tratamentos faciais</a></li><li><a href="/tratamentos-corporais/">Tratamentos corporais</a></li><li><a href="/tratamentos-capilares/">Tricologia</a></li><li><a href="#equipe">Equipe</a></li><li><a href="#faq">FAQ</a></li></ul>'''
    html = re.sub(
        r'<ul class="ib-footer-links"><li><a href="#sobre">Sobre</a></li>.*?</ul>',
        footer_links,
        html,
        count=1,
        flags=re.DOTALL,
    )

    # FAQ copy upgrade
    faq_replacements = [
        (
            "A primeira consulta é dedicada a entender seus objetivos, avaliar sua pele e seus traços e montar um plano individualizado. Nenhum procedimento é feito sem essa avaliação criteriosa.",
            "Consulta dedicada para entender objetivos, analisar pele e proporções e definir um plano seguro. Nenhum procedimento é realizado sem essa etapa.",
        ),
        (
            "Sim. Nossa filosofia é realçar a sua beleza preservando a sua identidade. Trabalhamos para resultados harmônicos, progressivos e coerentes com a sua fase de vida.",
            "Sim. Realçamos sua beleza preservando identidade e expressividade. Buscamos resultados harmônicos, progressivos e coerentes com sua fase de vida.",
        ),
        (
            "Atuamos em estética facial, corporal e capilar, com tecnologias e protocolos personalizados para cada paciente.",
            "Estética facial, corporal e capilar, com tecnologias, injetáveis e protocolos de skincare integrados quando indicado.",
        ),
    ]
    for old, new in faq_replacements:
        html = html.replace(old, new)

    # Mobile sticky CTA
    if 'class="ib-mobile-cta"' not in html:
        mobile_cta = f'''<div class="ib-mobile-cta"><a class="ib-btn ib-btn-primary" href="{WHATSAPP}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;min-height:2.75rem;padding:0 1.25rem;border-radius:999px;background:#1f2a1c;color:#f9f6f3;text-decoration:none;font-weight:500;width:100%;">Agende sua Avaliação</a></div>'''
        html = html.replace("</footer>", "</footer>" + mobile_cta, 1)

    # Hero image fetchpriority
    html = html.replace(
        'class="rt-hero-video" src="assets/instituto/hero.jpg"',
        'class="rt-hero-video" src="assets/instituto/hero.jpg" fetchpriority="high" decoding="async"',
    )

    # Ícone geométrico duplicado no header mobile
    html = re.sub(r'<div class="rt-top-logo">\s*.*?</div>\s*', '', html, flags=re.DOTALL)
    html = re.sub(
        r'<img[^>]*(?:86ea6b0a230663ce|small\.svg|69afc47f53a6a841a4281a48)[^>]*/>\s*',
        '',
        html,
    )

    INDEX.write_text(html, encoding="utf-8")
    print("Home atualizada:", INDEX)


if __name__ == "__main__":
    main()
