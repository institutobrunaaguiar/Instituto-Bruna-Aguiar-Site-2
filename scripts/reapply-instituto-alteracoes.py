#!/usr/bin/env python3
"""Reaplica alterações do Instituto Bruna Aguiar no index.html Breathiva.
Referência: docs/alteracoes-site-instituto.md
"""
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "breathiva.webflow.io/index.html"
ASSETS = ROOT / "breathiva.webflow.io/assets/instituto"
PUBLIC = ROOT / "public"

OFFLINE_CSS = '''<style data-offline="1">/* offline: ensure content is visible regardless of JS init state */
html,body{opacity:1!important;visibility:visible!important}
.w-webflow-badge{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
.page-loader,.site-loader,[class*='loading-screen'],[id*='loading-screen']{display:none!important}
.rt-home-hero-image-wrapper .rt-hero-video{object-position:72% 28%}
@media (max-width:991px){.rt-home-hero-image-wrapper .rt-hero-video{object-position:68% 24%}}
@media (max-width:767px){.rt-home-hero-image-wrapper .rt-hero-video{object-position:62% 20%}}
.rt-slide-nav-text-wrapper{max-width:22rem}
.rt-slide-nav-description.rt-slide-nav-location{max-width:18rem;text-align:center}
.rt-slide-nav-description.rt-slide-nav-location p{margin-bottom:.5rem;font-size:.875rem;line-height:1.45;opacity:.92}
.rt-slide-nav-description.rt-slide-nav-location p:last-child{margin-bottom:0}
.rt-slide-nav-maps-link{color:#fff;text-decoration:underline;text-underline-offset:.15em}
.rt-slide-nav-maps-link:hover{opacity:.85}
.rt-slide-nav-cta{margin-top:1.25rem;margin-bottom:1.25rem}
.rt-our-studio-counter-block{gap:clamp(1.5rem,4vw,4rem);flex-wrap:wrap;justify-content:center}
.rt-our-studio-counter-block-v1{flex:1 1 9rem;max-width:16rem;padding:0 .5rem}
.rt-our-studio-counter-block .rt-counter-number-text{white-space:nowrap;line-height:1;display:block}
.rt-our-studio-counter-block .rt-counter-number-text.rt-counter-compact{font-size:clamp(2.25rem,5.5vw,6.5rem)}
.rt-home-sticly-wrap{background-color:#1f2a1c}
.rt-wellness-section{position:relative;z-index:2;background-color:#1f2a1c;padding-top:clamp(2.5rem,8vw,5rem);padding-bottom:clamp(2rem,5vw,3.75rem)}
.rt-wellness-top.rt-text-align-center{gap:1.25rem}
.rt-therapy.rt-home-therapy{padding-top:2.5rem!important;padding-bottom:0!important}
@media (max-width:767px){.rt-therapy.rt-home-therapy{padding-top:1.75rem!important}}
.ib-footer{background:#f4f1ec;color:#1f2a1c;font-family:inherit}
.ib-footer-inner{max-width:75rem;margin:0 auto;padding:0 1.5rem}
.ib-footer-grid{display:grid;grid-template-columns:1fr;gap:2.5rem;padding:4rem 0 3rem}
@media(min-width:768px){.ib-footer-grid{grid-template-columns:1fr 1fr}}
@media(min-width:1024px){.ib-footer-grid{grid-template-columns:1.35fr 1fr 1fr 1.25fr;gap:3rem}}
.ib-footer-brand{display:flex;align-items:center;gap:.75rem;margin-bottom:1rem}
.ib-footer-logo{width:2.5rem;height:2.5rem;border-radius:999px;object-fit:cover}
.ib-footer-name{font-size:1.15rem;font-weight:600;color:#1f2a1c}
.ib-footer-desc{font-size:.875rem;line-height:1.65;color:#5a6658;max-width:22rem;margin:0}
.ib-footer-heading{font-size:1rem;font-weight:600;margin:0 0 1rem;color:#1f2a1c}
.ib-footer-links,.ib-footer-social{list-style:none;margin:0;padding:0}
.ib-footer-links li,.ib-footer-social li{margin-bottom:.5rem}
.ib-footer-links a,.ib-footer-social a{color:#5a6658;text-decoration:none;font-size:.875rem;transition:color .2s;display:inline-flex;align-items:center;gap:.5rem}
.ib-footer-links a:hover,.ib-footer-social a:hover{color:#9e9271}
.ib-footer-hours{font-size:.875rem;color:#5a6658;margin:1.25rem 0 0;line-height:1.5}
.ib-footer-address{font-size:.8125rem;color:#5a6658;margin:1rem 0 0;line-height:1.55}
.ib-footer-address a{color:inherit}
.ib-footer-input-wrap{position:relative;display:flex;width:100%;max-width:20rem}
.ib-footer-input{flex:1;min-width:0;height:2.75rem;border:1px solid #d8ddd2;border-radius:.375rem 0 0 .375rem;padding:0 .75rem;font-size:16px;background:#fff;color:#1f2a1c;outline:none}
.ib-footer-input:focus{border-color:#9e9271;box-shadow:0 0 0 2px rgba(158,146,113,.25)}
.ib-footer-submit{height:2.75rem;border:none;border-radius:0 .375rem .375rem 0;padding:0 1rem;background:#1f2a1c;color:#f9f6f3;font-size:16px;font-weight:500;cursor:pointer;white-space:nowrap}
.ib-footer-submit:hover{background:#2f3c2c}
.ib-footer-submit:disabled{opacity:.6;cursor:not-allowed}
.ib-footer-newsletter-msg{font-size:.8125rem;margin-top:.5rem}
.ib-footer-newsletter-msg.success{color:#2d6a4f}
.ib-footer-newsletter-msg.error{color:#b42318}
.ib-footer-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;border-top:1px solid #e0e4da;padding:1.25rem 0 2rem;font-size:.8125rem;color:#5a6658}
.ib-footer-whatsapp{display:inline-block;padding:.65rem 1.25rem;background:#1f2a1c;color:#f9f6f3;border-radius:999px;text-decoration:none;font-size:.875rem;font-weight:500}
.ib-footer-whatsapp:hover{background:#2f3c2c}
</style>'''

NEW_FOOTER = '''<footer id="contato" class="ib-footer"><div class="ib-footer-inner"><div class="ib-footer-grid"><div class="ib-footer-brand-col"><div class="ib-footer-brand"><span class="ib-footer-name">Instituto Bruna Aguiar</span></div><p class="ib-footer-desc">Referência em estética avançada no DF: harmonização facial natural, toxina botulínica, preenchimentos, bioestimuladores, lasers e ultrassom microfocado (HYPRO). Asa Sul, Brasília.</p></div><div class="ib-footer-col"><h3 class="ib-footer-heading">Links úteis</h3><ul class="ib-footer-links"><li><a href="#sobre">Sobre</a></li><li><a href="#tratamentos">Tratamentos</a></li><li><a href="#galeria">Galeria</a></li><li><a href="#equipe">Equipe</a></li><li><a href="#faq">FAQ</a></li></ul></div><div class="ib-footer-col"><h3 class="ib-footer-heading">Siga-nos</h3><ul class="ib-footer-social"><li><a href="https://www.facebook.com/institutobrunaaguiar/" target="_blank" rel="noopener"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>Facebook</a></li><li><a href="https://www.instagram.com/instituto.brunaaguiar/" target="_blank" rel="noopener"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>Instagram</a></li></ul><p class="ib-footer-hours"><strong>Segunda a sexta</strong><br/>9h às 18h</p></div><div class="ib-footer-col"><h3 class="ib-footer-heading">Assine nossa newsletter</h3><form class="ib-footer-newsletter" id="ib-newsletter-form"><div class="ib-footer-input-wrap"><input class="ib-footer-input" type="email" name="email" placeholder="Seu e-mail" required aria-label="E-mail para newsletter"/><button class="ib-footer-submit" type="submit">Assinar</button></div><div class="ib-footer-newsletter-msg" id="ib-newsletter-msg" hidden></div></form><p class="ib-footer-address">SGAS 910, Bloco F — Mix Park Sul, Salas 11/13/15<br/>Asa Sul, Brasília-DF, 70390-100 · (61) 98120-4327<br/><a href="https://maps.google.com/?q=Instituto+Bruna+Aguiar+SGAS+910+Mix+Park+Sul+Asa+Sul+Brasilia" target="_blank" rel="noopener">Como chegar →</a></p></div></div><div class="ib-footer-bar"><p>© 2026 Instituto Bruna Aguiar. Todos os direitos reservados.</p><a class="ib-footer-whatsapp" href="https://api.whatsapp.com/message/5DWUJQU6VH5VP1?autoload=1&amp;app_absent=0&amp;utm_source=ig" target="_blank" rel="noopener">Agende sua Avaliação</a></div></div></footer><script>(function(){var f=document.getElementById("ib-newsletter-form");if(!f)return;f.addEventListener("submit",function(e){e.preventDefault();var btn=f.querySelector(".ib-footer-submit");var msg=document.getElementById("ib-newsletter-msg");var email=f.querySelector('input[type="email"]').value;btn.disabled=true;btn.textContent="Enviando...";setTimeout(function(){msg.hidden=false;msg.className="ib-footer-newsletter-msg success";msg.textContent="Inscrição realizada! Obrigado.";btn.disabled=false;btn.textContent="Assinar";f.reset();setTimeout(function(){msg.hidden=true;},3000);},800);});})();</script><script>(function(){function r(){document.querySelectorAll(".w-webflow-badge").forEach(function(e){e.remove()});}r();document.addEventListener("DOMContentLoaded",r);window.addEventListener("load",r);setTimeout(r,100);setTimeout(r,2000);new MutationObserver(r).observe(document.documentElement,{childList:true,subtree:true});})();</script>'''

EQUIPE_SECTION = '''<section id="equipe" class="rt-our-story rt-overflow-hidden" style="padding:7rem 0;background:#f9f6f3;"><div class="w-layout-blockcontainer rt-container-xxl w-container"><div style="text-align:center;margin-bottom:3.5rem;"><div style="text-transform:uppercase;letter-spacing:.18em;font-size:.8rem;color:#9e9271;margin-bottom:1rem;">Nossa equipe</div><h2 class="rt-gap-off">As pessoas por trás do seu cuidado</h2></div><div style="display:flex;flex-wrap:wrap;gap:3.5rem;align-items:center;justify-content:center;max-width:1000px;margin:0 auto;"><img src="assets/instituto/INSTITUTO-23.png" alt="Equipe do Instituto Bruna Aguiar" style="flex:1 1 460px;max-width:600px;width:100%;border-radius:14px;height:auto;"/></div></div></section>'''

SLIDE_NAV = '''<div class="rt-slide-nav-text-wrapper rt-text-center"><div class="rt-slide-nav-logo"><img alt="Instituto Bruna Aguiar" height="39" loading="lazy" src="assets/instituto/logo.png" width="199"/></div><h2 class="rt-gap-off rt-text-color-white rt-navbar-form-h2-gap">Localização e acesso</h2><div class="rt-slide-nav-description rt-slide-nav-location"><p class="rt-gap-off rt-text-color-white"><strong>Mix Park Sul</strong></p><p class="rt-gap-off rt-text-color-white">SGAS 910, Bloco F, Mix Park Sul, Salas 11/13/15</p><p class="rt-gap-off rt-text-color-white">Asa Sul, Brasília — DF</p><p class="rt-gap-off rt-text-color-white">CEP 70390-100</p><p class="rt-gap-off rt-text-color-white">Coração do Plano Piloto, com fácil acesso pelas vias principais</p><p class="rt-gap-off rt-text-color-white">Estacionamento local gratuito + rotativo pago</p><p class="rt-gap-off rt-text-color-white"><a class="rt-slide-nav-maps-link" href="https://maps.google.com/?q=Instituto+Bruna+Aguiar+SGAS+910+Mix+Park+Sul+Asa+Sul+Brasilia" target="_blank" rel="noopener">Abrir no Maps →</a></p></div><div class="rt-slide-nav-cta"><a class="rt-button-v1 w-inline-block" data-w-id="a11a5db7-aada-7323-dc83-65092ff9911e" data-wf--rt-button-v1--variant="base" href="https://api.whatsapp.com/message/5DWUJQU6VH5VP1?autoload=1&app_absent=0&utm_source=ig" target="_blank" rel="noopener"><div class="rt-button-text">Agende sua Avaliação</div><div class="w-layout-hflex rt-button-v1-line"><div class="rt-button-v1-fill-line" style="width: 0%;"></div></div><div class="rt-decorative"></div></a></div><div class="rt-navbar-form-social-icon"><div class="rt-footer-social-icon-list"><a class="rt-footer-social-link-wrapper w-inline-block" href="https://www.instagram.com/instituto.brunaaguiar/" target="_blank" rel="noopener"><img alt="instagram-white" height="20" loading="lazy" src="assets/0fc6ab0af0032e8c_699558a0172165dc3d74fa0c_insta.svg" width="20"/></a><a class="rt-footer-social-link-wrapper w-inline-block" href="https://www.facebook.com/institutobrunaaguiar/" target="_blank" rel="noopener"><img alt="facebook-white" height="20" loading="lazy" src="assets/5173a89463b08997_6995589f8f02909cb37e947a_faceb.svg" width="20"/></a></div></div></div>'''

GALLERY_HEADING = '''<div class="w-layout-hflex rt-gallery-v2-heading" data-w-id="67beff17-1221-6994-a415-f9a8d26f0782" style="opacity: 1; transform: translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg); transform-style: preserve-3d;"><div class="rt-large-text-v3">Conheça</div><div class="rt-large-text-v3">os</div><div class="rt-home-v6-text-line-image rt-overflow-hidden"><img alt="Ambiente acolhedor do Instituto" height="96" loading="lazy" src="assets/instituto/espaco-7.jpg" width="95"/></div><div class="rt-large-text-v3">espaços</div><div class="rt-large-text-v3">do</div><div class="rt-large-text-v3">Instituto</div><div class="rt-large-text-v3">Bruna</div><div class="rt-home-v6-text-line-image-two rt-overflow-hidden"><img alt="Espaço do Instituto Bruna Aguiar" height="88" loading="lazy" src="assets/instituto/espaco-8.jpg" width="203"/></div><div class="rt-large-text-v3">Aguiar</div></div>'''

IMAGE_MAP = {
    "40edfbedd00fcfee_699d27968716e3fcd6a5f771_rt-ho": "assets/instituto/recepcao.jpg",
    "7db70137849739f8_699d2796afab459a7be62366_rt-ho": "assets/instituto/sala-1.jpg",
    "36beaf13c2c3f087_699d279664b9256eaf330d25_rt-ho": "assets/instituto/jardim.jpg",
    "773fbd4f26fc7c6f_699d3eecee8c59dd8c0c83c0_rt-ho": "assets/instituto/espaco-6.jpg",
    "4dd5255b77de0d8b_699d3ed977b7cc8ae95f4a08_rt-ho": "assets/instituto/sala-2.jpg",
    "fa1adaf8edf43c49": "assets/instituto/espaco-1.jpg",
    "4cc0e58c62160d97": "assets/instituto/espaco-2.jpg",
    "6fad7586bf57a737": "assets/instituto/espaco-3.jpg",
    "beb6dcfc1b705abd": "assets/instituto/espaco-4.jpg",
    "dc2bb906cd1bbced": "assets/instituto/espaco-5.jpg",
    "90fb96f624a7369d": "assets/instituto/espaco-6.jpg",
    "86f77f5aa1caba99": "assets/instituto/espaco-1.jpg",
    "afe876829ea658fd": "assets/instituto/espaco-3.jpg",
    "bd6e710894365c61": "assets/instituto/espaco-4.jpg",
    "3210b45daa5df76d": "assets/instituto/espaco-5.jpg",
    "e8f62e36800280dd": "assets/instituto/espaco-6.jpg",
    "af68d4ad": "assets/instituto/espaco-7.jpg",
    "f0f0f76ce": "assets/instituto/espaco-8.jpg",
    "9432a714b3af1e56": "assets/instituto/recepcao.jpg",
    "c2808406139b9552": "assets/instituto/recepcao.jpg",
    "b72df3f1113288e6": "assets/instituto/jardim.jpg",
    "4611125eb7d0a8fc": "assets/instituto/espaco-8.jpg",
    "230c6da9a73c66ac": "assets/instituto/jardim.jpg",
    "477ad175329874c5": "assets/instituto/espaco-1.jpg",
    "f9cfe4ba36b35270": "assets/instituto/espaco-2.jpg",
    "65c7d7e930d1a21c": "assets/instituto/espaco-3.jpg",
    "cff0cd76c322ba07": "assets/instituto/espaco-7.jpg",
    "4d9bd43c9615292f": "assets/instituto/espaco-8.jpg",
    "a2d2385b": "assets/instituto/membro-1.jpg",
    "7530e123": "assets/instituto/membro-1.jpg",
    "8e98f5b2e1c3295f": "assets/instituto/membro-1.jpg",
    "a3492cbafa1a643c": "assets/instituto/membro-1.jpg",
    "56297982974e445f": "assets/instituto/membro-1.jpg",
    "41e9fcdf79ca4807": "assets/instituto/membro-1.jpg",
    "cc02785f8addaef7": "assets/instituto/membro-1.jpg",
    "9cb66c3f93b6dd87": "assets/instituto/membro-1.jpg",
    "7a9096c65c500823": "assets/instituto/membro-1.jpg",
    "dra-bruna": "assets/instituto/membro-1.jpg",
    "ib-sofisticacao": "assets/instituto/espaco-1.jpg",
    "ib-tecnologia": "assets/instituto/espaco-3.jpg",
    "footer.jpg": "assets/instituto/espaco-8.jpg",
}

GALLERY_LABELS = {
    "espaco-1.jpg": "Ambiente do Instituto Bruna Aguiar",
    "espaco-2.jpg": "Sala de atendimento do Instituto",
    "espaco-3.jpg": "Recepção do Instituto Bruna Aguiar",
    "espaco-4.jpg": "Espaço de cuidado e estética",
    "espaco-5.jpg": "Detalhe do ambiente do Instituto",
    "espaco-6.jpg": "Sala de procedimentos",
}

SECTION_PHOTOS = [
    ("rt-home-v2-top-image-wrapper", "assets/instituto/recepcao.jpg", "Recepção do Instituto Bruna Aguiar"),
    ("rt-home-v2-bottom-left", "assets/instituto/sala-1.jpg", "Sala de atendimento do Instituto"),
    ("rt-home-v2-bottom-right", "assets/instituto/jardim.jpg", "Jardim do Instituto Bruna Aguiar"),
    ("rt-home-v3-big-image", "assets/instituto/espaco-6.jpg", "Sala de procedimentos do Instituto"),
    ("rt-home-v3-small-image", "assets/instituto/sala-2.jpg", "Sala de atendimento do Instituto"),
]


def copy_assets():
    ASSETS.mkdir(parents=True, exist_ok=True)
    for sub in ("espacos", "galeria", "equipe"):
        d = PUBLIC / sub
        if d.exists():
            for f in d.glob("*.jpg"):
                shutil.copy2(f, ASSETS / f.name)
    for f in ("hero.jpg", "logo.png", "icon.png"):
        if (PUBLIC / f).exists():
            shutil.copy2(PUBLIC / f, ASSETS / f)
    m = PUBLIC / "equipe/membro-1.jpg"
    if m.exists():
        shutil.copy2(m, ASSETS / "membro-1.jpg")
    src23 = PUBLIC / "fotos_time/INSTITUTO-23.png"
    if src23.exists():
        subprocess.run(["sips", "-Z", "1400", str(src23), "--out", str(ASSETS / "INSTITUTO-23.png")], check=False)


def gallery_section_end(html: str, gid: int) -> int:
    for marker in ('<section id="equipe"', '<section class="rt-pricing-v2"', '<section id="profissionais"'):
        ge = html.find(marker, gid + 1)
        if ge >= 0:
            return ge
    return html.find("</section>", gid + 500)


def fix_gallery_block(block: str) -> str:
    parts = re.split(r'(?=<a aria-haspopup="dialog"[^>]*class="rt-gallery-v2-wrapper)', block)
    out = [parts[0]]
    for part in parts[1:]:
        m = re.search(r'src="assets/instituto/(espaco-[1-6]\.jpg)"', part)
        if m and "rt-gallery-v2-text" in part:
            label = GALLERY_LABELS[m.group(1)]
            part = re.sub(
                r'(<div class="rt-gallery-v2-text"><div class="rt-text-style-h[34][^"]*">)[^<]*(</div>)',
                r"\1" + label + r"\2",
                part,
                count=1,
            )
            idx = part.find('class="w-json"')
            if idx >= 0:
                script_start = part.rfind("<script", 0, idx)
                end = part.find("</script>", idx) + 9
                jp = part[script_start:end]
                jp = re.sub(r'"url"\s*:\s*"[^"]+"', f'"url": "assets/instituto/{m.group(1)}"', jp, count=1)
                jp = re.sub(r'"(origFileName|fileName)"\s*:\s*"[^"]+"', rf'"\1": "{m.group(1)}"', jp)
                part = part[:script_start] + jp + part[end:]
        out.append(part)
    return "".join(out)


def apply(html: str) -> str:
    if 'data-offline="1"' in html:
        html = re.sub(r'<style data-offline="1">.*?</style>', OFFLINE_CSS, html, count=1, flags=re.DOTALL)
    else:
        html = html.replace("</head>", OFFLINE_CSS + "</head>", 1)

    html = html.replace(
        '<h1 class="rt-gap-off rt-text-color-white">Estética avançada, natural e sofisticada</h1>',
        '<h1 class="rt-home-hero-big-text rt-gap-off rt-text-color-white">Natural como a vida</h1>',
    )
    html = re.sub(
        r'<div class="rt-home-hero-bottom"[^>]*>\s*<h1 class="rt-gap-off rt-text-color-white">[^<]+</h1>\s*</div>',
        '<div class="rt-home-hero-bottom" style="will-change: opacity; opacity: 0.84323;"><h1 class="rt-home-hero-big-text rt-gap-off rt-text-color-white">Natural como a vida</h1></div>',
        html,
        count=1,
    )
    html = html.replace("assets/instituto/hero-mateus.jpg", "assets/instituto/hero.jpg")
    html = re.sub(
        r'(<img alt="Instituto Bruna Aguiar" class="rt-hero-video" src=")assets/instituto/hero[^"]*(" style=")([^"]*)(")',
        r"\1assets/instituto/hero.jpg\2object-fit:cover;object-position:72% 28%;width:100%;height:100%;position:absolute;inset:0;\4",
        html,
        count=1,
    )

    for cls, src, alt in [
        ("rt-hero-image-one", "assets/instituto/jardim.jpg", "Jardim do Instituto"),
        ("rt-hero-image-two", "assets/instituto/espaco-1.jpg", "Ambiente do Instituto"),
        ("rt-hero-image-three", "assets/instituto/espaco-2.jpg", "Sala de atendimento"),
        ("rt-hero-image-four", "assets/instituto/espaco-3.jpg", "Recepção do Instituto"),
    ]:
        marker = f'class="rt-hero-image-wrap {cls}"'
        idx = html.find(marker)
        if idx < 0:
            continue
        img_idx = html.find("<img", idx)
        img_end = html.find("/>", img_idx) + 2
        tag = html[img_idx:img_end]
        tag = re.sub(r'src="[^"]*"', f'src="{src}"', tag, count=1)
        tag = re.sub(r'alt="[^"]*"', f'alt="{alt}"', tag, count=1)
        html = html[:img_idx] + tag + html[img_end:]

    html = re.sub(
        r'<div class="rt-slide-nav-text-wrapper rt-text-center">.*?</div></div><div class="rt-navbar-form-cross"',
        SLIDE_NAV + '<div class="rt-navbar-form-cross"',
        html,
        count=1,
        flags=re.DOTALL,
    )

    html = re.sub(r'src="assets/[^"]*respo\.avif"', 'src="assets/instituto/jardim.jpg"', html)
    html = html.replace('alt="responsive navbar image"', 'alt="Instituto Bruna Aguiar — jardim"')
    nav_idx = html.find("rt-nav-right-wrap")
    if nav_idx >= 0:
        img_idx = html.find("<img", nav_idx)
        img_end = html.find("/>", img_idx) + 2
        tag = html[img_idx:img_end]
        tag = re.sub(r'src="[^"]*"', 'src="assets/instituto/jardim.jpg"', tag, count=1)
        html = html[:img_idx] + tag + html[img_end:]
    html = html.replace(
        '<div class="rt-text-style-h4 rt-text-color-white">Estética avançada em Brasília</div>',
        '<div class="rt-text-style-h4 rt-text-color-white">Instituto Bruna Aguiar</div>',
    )
    if "institutobrunaaguiar" not in html[html.find("rt-nav-social-wrap") : html.find("rt-nav-social-wrap") + 1200]:
        html = re.sub(
            r'(<div class="w-layout-hflex rt-nav-social-wrap">).*?(</div></div></div></div></nav>)',
            r'\1<a class="rt-nav-social-link w-inline-block" href="https://www.instagram.com/instituto.brunaaguiar/" target="_blank" rel="noopener"><img alt="Instagram" height="20" loading="lazy" src="assets/494b218a1f5792e0_69afdc75ac52590bfcf786fe_nav-i.svg" width="20"/></a><a class="rt-nav-social-link w-inline-block" href="https://www.facebook.com/institutobrunaaguiar/" target="_blank" rel="noopener"><img alt="Facebook" height="20" loading="lazy" src="assets/5173a89463b08997_6995589f8f02909cb37e947a_faceb.svg" width="20"/></a>\2',
            html,
            count=1,
            flags=re.DOTALL,
        )

    html = html.replace(
        '<div class="w-layout-hflex rt-counter rt-overflow-hidden"><div class="rt-counter-number-text">5.0</div></div><div class="rt-counter-text-block"><div class="rt-counter-text">Avaliação no Google</div>',
        '<div class="rt-counter-number-text">5</div><div class="rt-counter-text-block"><div class="rt-counter-text">Avaliação 5 estrelas no Google</div>',
    )
    html = html.replace(
        '<div class="w-layout-hflex rt-counter rt-overflow-hidden"><div class="rt-counter-number-text">169+</div></div><div class="rt-counter-text-block"><div class="rt-counter-text">Avaliações de pacientes</div>',
        '<div class="rt-counter-number-text rt-counter-compact">6 mil+</div><div class="rt-counter-text-block"><div class="rt-counter-text">Mais de 6 mil pacientes atendidos</div>',
    )
    html = re.sub(
        r'<div class="w-layout-hflex rt-counter rt-overflow-hidden"><div class="rt-counter-number-text">(40\+|100%)</div></div>',
        r'<div class="rt-counter-number-text">\1</div>',
        html,
    )

    for old, new in [
        ("assets/6d26a27ae95275ff_699c318b8f03d039741943da_home-.svg", "assets/instituto/icon-wellness.svg"),
        ("assets/677e69596a681085_69968beea4278634fbc56b91_class.svg", "assets/instituto/icon-facial.svg"),
        ("assets/8b5769e34d08fa72_69968bef8c25d3ba9a0a4cbc_class.svg", "assets/instituto/icon-laser.svg"),
        ("assets/8aaa6c54d51f5e14_69968bee74a5b343a1ac7917_class.svg", "assets/instituto/icon-corporal.svg"),
        ("assets/7ca7bd3d4f6d3bea_69968beed005d21fe6c56ae7_class.svg", "assets/instituto/icon-tricologia.svg"),
    ]:
        html = html.replace(old, new)

    for prefix, new_path in IMAGE_MAP.items():
        html = re.sub(r"assets/" + re.escape(prefix) + r'[^"\s,]*', new_path, html)

    def clean_img(m):
        tag = m.group(0)
        if "assets/instituto/" not in tag:
            return tag
        tag = re.sub(r'\s*srcset="[^"]*"', "", tag)
        tag = re.sub(r'\s*sizes="[^"]*"', "", tag)
        return tag

    html = re.sub(r"<img\b[^>]*>", clean_img, html)

    for marker, src, alt in SECTION_PHOTOS:
        idx = html.find(marker)
        if idx < 0:
            continue
        chunk_end = html.find("</div></div>", idx) + 12
        if chunk_end <= idx:
            chunk_end = idx + 1500
        chunk = html[idx:chunk_end]
        new_chunk = re.sub(r'(<img[^>]*src=")[^"]*("[^>]*alt=")[^"]*(")', rf"\1{src}\2{alt}\3", chunk, count=1)
        if new_chunk == chunk:
            new_chunk = re.sub(r'(<img[^>]*src=")[^"]*(")', rf"\1{src}\2", chunk, count=1)
            new_chunk = re.sub(r'(alt=")[^"]*(")', rf"\1{alt}\2", new_chunk, count=1)
        html = html[:idx] + new_chunk + html[chunk_end:]

    html = re.sub(
        r'<div class="w-layout-hflex rt-gallery-v2-heading"[^>]*>.*?</div><div class="w-layout-grid rt-home-gallery"',
        GALLERY_HEADING + '<div class="w-layout-grid rt-home-gallery"',
        html,
        count=1,
        flags=re.DOTALL,
    )

    html = html.replace("Workshop gallery", "Galeria")
    html = html.replace("assets/instituto/footer.jpg", "assets/instituto/espaco-8.jpg")

    html = re.sub(
        r'<div class="w-layout-vflex rt-home-hero-right">.*?</div>\s*(</div></div></div></div></section>)',
        r"\1",
        html,
        count=1,
        flags=re.DOTALL,
    )
    html = html.replace("</div></div>></div></div></div></section>", "</div></div></div></div></section>")
    html = html.replace("</div></div>></div></div></section>", "</div></div></div></div></section>")

    html = re.sub(r'<section id="equipe"[^>]*>.*?</section>', EQUIPE_SECTION, html, count=1, flags=re.DOTALL)

    html = re.sub(
        r'<footer id="contato" class="ib-footer">.*?</footer>(?:<script[^>]*>.*?</script>)?',
        NEW_FOOTER,
        html,
        count=1,
        flags=re.DOTALL,
    )
    html = re.sub(
        r'<section id="contato" class="rt-footer">.*?</section>',
        NEW_FOOTER,
        html,
        count=1,
        flags=re.DOTALL,
    )

    gid = html.find('id="galeria"')
    if gid < 0:
        gid = html.find('class="rt-gallery-v2"')
    ge = gallery_section_end(html, gid)
    if gid >= 0 and ge >= 0:
        section = html[gid:ge]
        ggs = section.find('class="w-layout-grid rt-home-gallery"')
        gge = section.find('class="rt-mobile-slider', ggs)
        if ggs >= 0 and gge >= 0:
            section = section[:ggs] + fix_gallery_block(section[ggs:gge]) + section[gge:]
        mgs = section.find('class="rt-mobile-slider')
        if mgs >= 0:
            section = section[:mgs] + fix_gallery_block(section[mgs:])
        espacos = [f"assets/instituto/espaco-{i}.jpg" for i in range(1, 7)]
        n = [0]

        def fix_cdn(_m):
            u = espacos[n[0] % 6]
            n[0] += 1
            return f'"url": "{u}"'

        section = re.sub(r'"url"\s*:\s*"https://cdn\.prod\.website-files\.com/[^"]+"', fix_cdn, section)
        html = html[:gid] + section + html[ge:]

    if 'id="equipe"' not in html:
        html = html.replace(
            '<section class="rt-yoga-classes-v2" data-w-id="32cf64a3-bdb8-b877-f4cd-4fea22f1eaa2">',
            '<section class="rt-yoga-classes-v2" id="equipe" data-w-id="32cf64a3-bdb8-b877-f4cd-4fea22f1eaa2">',
            1,
        )
    if 'id="galeria"' not in html:
        html = html.replace('<section class="rt-gallery-v2">', '<section id="galeria" class="rt-gallery-v2">', 1)

    html = re.sub(r'<div class="rt-top-logo">\s*.*?</div>\s*', '', html, flags=re.DOTALL)
    html = re.sub(
        r'<img[^>]*(?:86ea6b0a230663ce|small\.svg|69afc47f53a6a841a4281a48)[^>]*/>\s*',
        '',
        html,
    )
    html = re.sub(r'<img class="ib-footer-logo"[^>]*/>\s*', '', html)

    return html


def main():
    copy_assets()
    html = HTML_PATH.read_text(encoding="utf-8")
    HTML_PATH.write_text(apply(html), encoding="utf-8")
    print("Reaplicado:", HTML_PATH)


if __name__ == "__main__":
    main()
