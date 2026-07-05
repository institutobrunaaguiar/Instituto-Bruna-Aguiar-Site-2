#!/usr/bin/env python3
"""Gera páginas HTML, sitemap.xml e robots.txt do Instituto Bruna Aguiar."""

from __future__ import annotations

import html
import json
import shutil
from datetime import date
from pathlib import Path

from pages_data import PAGES, page_url, all_pages
from site_config import (
    ADDRESS,
    FACEBOOK,
    HOURS,
    INSTAGRAM,
    MAPS_URL,
    OG_IMAGE,
    PHONE_DISPLAY,
    PHONE_TEL,
    RATING_COUNT,
    RATING_VALUE,
    SITE_NAME,
    SITE_TAGLINE,
    SITE_URL,
    WHATSAPP_URL,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "breathiva.webflow.io"
CSS_SRC = OUT / "assets" / "instituto" / "site-pages.css"


def asset_prefix(depth: int) -> str:
    if depth == 0:
        return "assets"
    return "/".join([".."] * depth) + "/assets"


def abs_asset(path: str) -> str:
    return f"{SITE_URL}{path if path.startswith('/') else '/' + path}"


def breadcrumbs(page) -> list[tuple[str, str]]:
    crumbs: list[tuple[str, str]] = [("Início", "/")]
    chain: list = []
    current = page
    while current and current.parent_slug:
        chain.append(current.parent_slug)
        current = PAGES.get(current.parent_slug)
    for slug in reversed(chain):
        p = PAGES[slug]
        crumbs.append((p.breadcrumb_label or p.h1, page_url(slug)))
    label = page.breadcrumb_label or page.h1
    crumbs.append((label, page_url(page.slug)))
    return crumbs


def render_header(depth: int, active: str = "") -> str:
    ap = asset_prefix(depth)
    home = "/" if depth == 0 else "../" * depth
    nav_items = [
        ("Início", home if depth else "/"),
        ("Tratamentos", f"{home}tratamentos-faciais/" if depth else "/tratamentos-faciais/"),
        ("Sobre", f"{home}#sobre" if depth == 0 else "/#sobre"),
        ("Contato", f"{home}#contato" if depth == 0 else "/#contato"),
    ]
    links = []
    for label, href in nav_items:
        cur = ' aria-current="page"' if label.lower() == active.lower() else ""
        links.append(f'<a href="{href}"{cur}>{html.escape(label)}</a>')
    return f"""<header class="ib-header">
  <div class="ib-header-inner">
    <a class="ib-logo" href="{home if depth else '/'}">
      <img src="{ap}/instituto/logo.png" alt="{html.escape(SITE_NAME)}" width="32" height="32" loading="eager"/>
      <span>{html.escape(SITE_NAME)}</span>
    </a>
    <button class="ib-nav-toggle" type="button" aria-expanded="false" aria-controls="ib-nav" aria-label="Abrir menu">
      <span></span><span></span><span></span>
    </button>
    <nav class="ib-nav" id="ib-nav" aria-label="Principal">
      {''.join(links)}
      <a class="ib-btn ib-btn-primary" href="{WHATSAPP_URL}" target="_blank" rel="noopener">Agende sua Avaliação</a>
    </nav>
  </div>
</header>"""


def render_footer(depth: int) -> str:
    ap = asset_prefix(depth)
    home = "/" if depth == 0 else "../" * depth
    tratamentos_links = [
        ("Tratamentos faciais", "/tratamentos-faciais/"),
        ("Tecnologias e laser", "/tecnologias-faciais-e-laser/"),
        ("Tratamentos corporais", "/tratamentos-corporais/"),
        ("Tricologia", "/tratamentos-capilares/"),
        ("Esteticista Adriana", "/estetica-com-esteticista/"),
        ("Avaliação facial", "/avaliacao-facial/"),
    ]
    t_links = "\n".join(
        f'<li><a href="{href}">{html.escape(label)}</a></li>' for label, href in tratamentos_links
    )
    return f"""<footer id="contato" class="ib-footer">
  <div class="ib-footer-inner">
    <div class="ib-footer-grid">
      <div>
        <div class="ib-footer-brand">
          <span class="ib-footer-name">{html.escape(SITE_NAME)}</span>
        </div>
        <p class="ib-footer-desc">{html.escape(SITE_TAGLINE)} Referência em estética avançada na Asa Sul, Brasília.</p>
      </div>
      <div>
        <h3 class="ib-footer-heading">Tratamentos</h3>
        <ul class="ib-footer-links">{t_links}</ul>
      </div>
      <div>
        <h3 class="ib-footer-heading">Institucional</h3>
        <ul class="ib-footer-links">
          <li><a href="{home if depth == 0 else '/'}#sobre">Sobre</a></li>
          <li><a href="{home if depth == 0 else '/'}#equipe">Equipe</a></li>
          <li><a href="{home if depth == 0 else '/'}#galeria">Galeria</a></li>
          <li><a href="{home if depth == 0 else '/'}#faq">FAQ</a></li>
        </ul>
        <p class="ib-footer-desc" style="margin-top:1rem"><strong>{html.escape(HOURS)}</strong><br/>{html.escape(PHONE_DISPLAY)}</p>
      </div>
      <div>
        <h3 class="ib-footer-heading">Redes e localização</h3>
        <ul class="ib-footer-social">
          <li><a href="{INSTAGRAM}" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="{FACEBOOK}" target="_blank" rel="noopener">Facebook</a></li>
        </ul>
        <p class="ib-footer-desc" style="margin-top:1rem;font-size:.8125rem">{html.escape(ADDRESS)}<br/>
        <a href="{MAPS_URL}" target="_blank" rel="noopener">Como chegar</a></p>
      </div>
    </div>
    <div class="ib-footer-bar">
      <p>© {date.today().year} {html.escape(SITE_NAME)}. Todos os direitos reservados.</p>
      <a class="ib-footer-whatsapp" href="{WHATSAPP_URL}" target="_blank" rel="noopener">Agende sua Avaliação</a>
    </div>
  </div>
</footer>
<div class="ib-mobile-cta">
  <a class="ib-btn ib-btn-primary" href="{WHATSAPP_URL}" target="_blank" rel="noopener">Agende sua Avaliação</a>
</div>
<script>
(function(){{
  var btn=document.querySelector('.ib-nav-toggle');
  var nav=document.getElementById('ib-nav');
  if(!btn||!nav)return;
  btn.addEventListener('click',function(){{
    var open=nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded',open?'true':'false');
  }});
}})();
</script>"""


def schema_for_page(page, canonical: str) -> str:
    graphs = []

    bc_items = []
    for i, (name, url) in enumerate(breadcrumbs(page)):
        bc_items.append(
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": name,
                "item": f"{SITE_URL}{url}" if url != "/" else SITE_URL + "/",
            }
        )
    graphs.append({"@type": "BreadcrumbList", "itemListElement": bc_items})

    if page.page_type == "procedure":
        graphs.append(
            {
                "@type": "MedicalProcedure",
                "name": page.h1,
                "description": page.meta_description,
                "url": canonical,
                "procedureType": "https://schema.org/NoninvasiveProcedure",
            }
        )
        if page.faqs:
            graphs.append(
                {
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": f.question,
                            "acceptedAnswer": {"@type": "Answer", "text": f.answer},
                        }
                        for f in page.faqs
                    ],
                }
            )

    org = {
        "@type": ["MedicalBusiness", "LocalBusiness", "HealthAndBeautyBusiness"],
        "@id": f"{SITE_URL}/#organization",
        "name": SITE_NAME,
        "url": SITE_URL,
        "telephone": PHONE_TEL,
        "image": abs_asset(OG_IMAGE),
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "SGAS 910, Bloco F, Mix Park Sul, Salas 11/13/15",
            "addressLocality": "Brasília",
            "addressRegion": "DF",
            "postalCode": "70390-100",
            "addressCountry": "BR",
        },
        "geo": {"@type": "GeoCoordinates", "latitude": -15.8267, "longitude": -47.9218},
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "18:00",
            }
        ],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": RATING_VALUE,
            "reviewCount": RATING_COUNT,
            "bestRating": "5",
        },
        "sameAs": [INSTAGRAM, FACEBOOK],
    }
    graphs.insert(0, org)

    payload = {"@context": "https://schema.org", "@graph": graphs}
    return json.dumps(payload, ensure_ascii=False, indent=2)


def render_page(page, depth: int = 1) -> str:
    canonical = f"{SITE_URL}{page_url(page.slug)}"
    ap = asset_prefix(depth)
    css_href = f"{ap}/instituto/site-pages.css"

    bc_html = ""
    crumbs = breadcrumbs(page)
    parts = []
    for i, (name, url) in enumerate(crumbs):
        if i == len(crumbs) - 1:
            parts.append(f"<span aria-current=\"page\">{html.escape(name)}</span>")
        else:
            prefix = "../" * depth if depth else ""
            href = url if url.startswith("/") else url
            if depth and href.startswith("/"):
                href = prefix.rstrip("/") + href
            parts.append(f'<a href="{href}">{html.escape(name)}</a>')
            parts.append('<span aria-hidden="true"> / </span>')
    bc_html = "".join(parts)

    body_sections = []
    if page.page_type == "hub":
        cards = []
        for child_slug in page.children:
            child = PAGES[child_slug]
            intro_snip = child.intro[:140] + ("…" if len(child.intro) > 140 else "")
            cards.append(
                f"""<a class="ib-card" href="{page_url(child_slug)}">
  <h3 class="ib-card-title">{html.escape(child.h1)}</h3>
  <p class="ib-card-desc">{html.escape(intro_snip)}</p>
</a>"""
            )
        body_sections.append(f'<section class="ib-section"><div class="ib-card-grid">{"".join(cards)}</div></section>')
    else:
        sections = [
            ("Para que serve", page.purpose),
            ("Para quem pode ser indicado", page.indication),
            ("Regiões tratadas", page.regions),
            ("Como funciona", page.how_it_works),
            ("Benefícios esperados", page.benefits),
            ("Cuidados antes e depois", page.care),
            ("Associações recomendadas", page.associations),
        ]
        for title, content in sections:
            if content:
                body_sections.append(
                    f'<section class="ib-section"><h2>{html.escape(title)}</h2><p>{html.escape(content)}</p></section>'
                )

    faq_html = ""
    faqs = page.faqs
    if faqs:
        items = []
        for f in faqs:
            items.append(
                f"<details><summary>{html.escape(f.question)}</summary><p>{html.escape(f.answer)}</p></details>"
            )
        faq_html = f'<section class="ib-section ib-faq"><h2>Perguntas frequentes</h2>{"".join(items)}</section>'

    related_html = ""
    rel = page.related or []
    if rel:
        links = []
        for slug in rel:
            if slug in PAGES:
                links.append(f'<li><a href="{page_url(slug)}">{html.escape(PAGES[slug].h1)}</a></li>')
        if links:
            related_html = f'<section class="ib-related"><h2>Tratamentos relacionados</h2><ul>{"".join(links)}</ul></section>'

    keywords = ", ".join(page.keywords)
    schema = schema_for_page(page, canonical)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{html.escape(page.meta_title)}</title>
  <meta name="description" content="{html.escape(page.meta_description)}"/>
  <meta name="keywords" content="{html.escape(keywords)}"/>
  <meta name="robots" content="index, follow"/>
  <link rel="canonical" href="{canonical}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:locale" content="pt_BR"/>
  <meta property="og:site_name" content="{html.escape(SITE_NAME)}"/>
  <meta property="og:title" content="{html.escape(page.meta_title)}"/>
  <meta property="og:description" content="{html.escape(page.meta_description)}"/>
  <meta property="og:url" content="{canonical}"/>
  <meta property="og:image" content="{abs_asset(OG_IMAGE)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{html.escape(page.meta_title)}"/>
  <meta name="twitter:description" content="{html.escape(page.meta_description)}"/>
  <meta name="twitter:image" content="{abs_asset(OG_IMAGE)}"/>
  <link rel="icon" href="{ap}/instituto/icon.png" type="image/png"/>
  <link rel="stylesheet" href="{css_href}"/>
  <script type="application/ld+json">{schema}</script>
</head>
<body class="ib-page">
  <a class="ib-skip" href="#conteudo">Ir para o conteúdo</a>
  {render_header(depth)}
  <main class="ib-main" id="conteudo">
    <nav class="ib-breadcrumb" aria-label="Breadcrumb">{bc_html}</nav>
    <header class="ib-hero-page">
      <p class="ib-eyebrow">{html.escape(SITE_NAME)}</p>
      <h1 class="ib-h1">{html.escape(page.h1)}</h1>
      <p class="ib-lead">{html.escape(page.intro)}</p>
    </header>
    {''.join(body_sections)}
    {faq_html}
    {related_html}
    <section class="ib-cta-band">
      <h2>Próximo passo</h2>
      <p>Converse com nossa equipe e receba um plano personalizado, com clareza sobre indicações, sequência e cuidados.</p>
      <a class="ib-btn ib-btn-primary" href="{WHATSAPP_URL}" target="_blank" rel="noopener">{html.escape(page.cta_text)}</a>
    </section>
  </main>
  {render_footer(depth)}
</body>
</html>"""


def write_sitemap() -> None:
    today = date.today().isoformat()
    urls = [("/", "weekly", "1.0")]
    for slug, page in all_pages().items():
        priority = "0.9" if page.page_type == "hub" and not page.parent_slug else "0.8"
        if page.page_type == "procedure":
            priority = "0.7"
        urls.append((page_url(slug), "monthly", priority))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, freq, pri in urls:
        loc = SITE_URL + (path if path != "/" else "/")
        lines.append("  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        lines.append(f"    <lastmod>{today}</lastmod>")
        lines.append(f"    <changefreq>{freq}</changefreq>")
        lines.append(f"    <priority>{pri}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")
    (OUT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_robots() -> None:
    content = f"""User-agent: *
Allow: /

Sitemap: {SITE_URL}/sitemap.xml
"""
    (OUT / "robots.txt").write_text(content, encoding="utf-8")


def main() -> None:
    pages = all_pages()
    print(f"Gerando {len(pages)} páginas…")

    for slug, page in pages.items():
        out_dir = OUT / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        html_content = render_page(page, depth=1)
        (out_dir / "index.html").write_text(html_content, encoding="utf-8")

    write_sitemap()
    write_robots()
    print(f"Sitemap: {OUT / 'sitemap.xml'}")
    print(f"Robots: {OUT / 'robots.txt'}")
    print("Concluído.")


if __name__ == "__main__":
    main()
