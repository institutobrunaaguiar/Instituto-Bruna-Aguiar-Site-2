"""Definições de páginas, hubs e procedimentos para geração do site."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


PageType = Literal["hub", "procedure"]


@dataclass
class FAQ:
    question: str
    answer: str


@dataclass
class Page:
    slug: str
    title: str
    h1: str
    meta_title: str
    meta_description: str
    keywords: list[str]
    page_type: PageType
    intro: str
    parent_slug: str | None = None
    children: list[str] = field(default_factory=list)
    purpose: str = ""
    indication: str = ""
    regions: str = ""
    how_it_works: str = ""
    benefits: str = ""
    care: str = ""
    associations: str = ""
    faqs: list[FAQ] = field(default_factory=list)
    related: list[str] = field(default_factory=list)
    cta_text: str = "Agende sua avaliação personalizada"
    breadcrumb_label: str | None = None


def _faq(*pairs: tuple[str, str]) -> list[FAQ]:
    return [FAQ(q, a) for q, a in pairs]


def _proc(
    slug: str,
    h1: str,
    meta_title: str,
    meta_description: str,
    keywords: list[str],
    intro: str,
    parent_slug: str,
    purpose: str,
    indication: str,
    how_it_works: str,
    benefits: str,
    care: str,
    faqs: list[FAQ],
    related: list[str],
    regions: str = "",
    associations: str = "",
    cta_text: str = "Agende sua avaliação personalizada",
) -> Page:
    return Page(
        slug=slug,
        title=h1,
        h1=h1,
        meta_title=meta_title,
        meta_description=meta_description,
        keywords=keywords,
        page_type="procedure",
        parent_slug=parent_slug,
        intro=intro,
        purpose=purpose,
        indication=indication,
        regions=regions,
        how_it_works=how_it_works,
        benefits=benefits,
        care=care,
        associations=associations,
        faqs=faqs,
        related=related,
        cta_text=cta_text,
    )


def _hub(
    slug: str,
    h1: str,
    meta_title: str,
    meta_description: str,
    keywords: list[str],
    intro: str,
    children: list[str],
    parent_slug: str | None = None,
    faqs: list[FAQ] | None = None,
    related: list[str] | None = None,
) -> Page:
    return Page(
        slug=slug,
        title=h1,
        h1=h1,
        meta_title=meta_title,
        meta_description=meta_description,
        keywords=keywords,
        page_type="hub",
        parent_slug=parent_slug,
        intro=intro,
        children=children,
        faqs=faqs or [],
        related=related or [],
    )


# ---------------------------------------------------------------------------
# Hubs principais
# ---------------------------------------------------------------------------

PAGES: dict[str, Page] = {}

PAGES["tratamentos-faciais"] = _hub(
    slug="tratamentos-faciais",
    h1="Tratamentos faciais em Brasília",
    meta_title="Tratamentos Faciais | Instituto Bruna Aguiar — Asa Sul, DF",
    meta_description=(
        "Harmonização facial, toxina botulínica, preenchimentos, bioestimuladores, "
        "regenerativos e fios de colágeno com avaliação individualizada na Asa Sul."
    ),
    keywords=["tratamentos faciais brasília", "estética facial asa sul", "harmonização facial df"],
    intro=(
        "Protocolos faciais médicos e estéticos avançados, definidos após avaliação "
        "individualizada. Cada plano considera anatomia, objetivos, histórico e fase de vida, "
        "com foco em naturalidade, segurança e resultados progressivos."
    ),
    children=[
        "avaliacao-facial",
        "toxina-botulinica",
        "preenchimentos-e-skinboosters",
        "bioestimuladores-de-colageno",
        "procedimentos-regenerativos-faciais",
        "fios-de-colageno",
    ],
    faqs=_faq(
        (
            "Por onde começo se nunca fiz procedimentos?",
            "Pela avaliação facial. Ela organiza prioridades, indicações e sequência de tratamentos.",
        ),
        (
            "Posso combinar diferentes técnicas faciais?",
            "Sim, quando há indicação clínica. A combinação é planejada para respeitar recuperação e naturalidade.",
        ),
    ),
)

PAGES["tecnologias-faciais-e-laser"] = _hub(
    slug="tecnologias-faciais-e-laser",
    h1="Tecnologias faciais e rejuvenescimento a laser",
    meta_title="Laser e Tecnologias Faciais | Instituto Bruna Aguiar — Brasília",
    meta_description=(
        "Laser CO2 fracionado, BB Glow, HYPRO e protocolos para flacidez, textura, "
        "manchas e contorno facial na Asa Sul, Brasília."
    ),
    keywords=["laser facial brasília", "hypro facial", "co2 fracionado df"],
    intro=(
        "Equipamentos de última geração para rejuvenescimento, qualidade da pele e "
        "definição de contorno. Cada protocolo é personalizado conforme região, flacidez "
        "e objetivo estético."
    ),
    children=[
        "laser-co2-fracionado",
        "bb-glow-laser-poros-manchas",
        "hypro-facial",
    ],
    parent_slug=None,
)

PAGES["tratamentos-corporais"] = _hub(
    slug="tratamentos-corporais",
    h1="Tratamentos corporais em Brasília",
    meta_title="Estética Corporal | Instituto Bruna Aguiar — Asa Sul, DF",
    meta_description=(
        "HYPRO corporal, laser CO2, LIP, injetáveis e protocolos para flacidez, "
        "contorno, estrias e qualidade da pele na Asa Sul."
    ),
    keywords=["estética corporal brasília", "flacidez corporal df", "hypro corporal"],
    intro=(
        "Protocolos corporais para flacidez, contorno, textura e qualidade da pele. "
        "A indicação de cada região e tecnologia depende de avaliação individual."
    ),
    children=[
        "hypro-corporal",
        "laser-co2-fracionado-corporal",
        "luz-intensa-pulsada",
        "injetaveis-corporais",
    ],
)

PAGES["tratamentos-capilares"] = _hub(
    slug="tratamentos-capilares",
    h1="Tricologia e saúde capilar",
    meta_title="Tricologia e Saúde Capilar | Instituto Bruna Aguiar — Brasília",
    meta_description=(
        "Avaliação capilar, mesoterapia, LEDterapia e protocolos para queda, "
        "couro cabeludo sensível e fortalecimento dos fios na Asa Sul."
    ),
    keywords=["tricologia brasília", "queda de cabelo df", "mesoterapia capilar"],
    intro=(
        "Diagnóstico e tratamento do couro cabeludo e dos fios com abordagem técnica "
        "e acolhedora. Resultados dependem de causa, constância e plano personalizado."
    ),
    children=[
        "avaliacao-capilar",
        "mesoterapia-capilar",
        "mesoterapia-capilar-regenerativa",
        "terapia-de-acalmia-capilar",
    ],
)

PAGES["estetica-com-esteticista"] = _hub(
    slug="estetica-com-esteticista",
    h1="Estética facial e corporal com esteticista",
    meta_title="Cuidados Faciais e Drenagem | Esteticista Adriana — Instituto Bruna Aguiar",
    meta_description=(
        "Limpeza de pele, revitalização, design de sobrancelhas e drenagem corporal "
        "com a esteticista Adriana, integrados aos protocolos médicos do Instituto."
    ),
    keywords=["limpeza de pele brasília", "drenagem corporal asa sul", "esteticista adriana"],
    intro=(
        "Procedimentos realizados pela esteticista Adriana, com foco em saúde da pele, "
        "conforto e manutenção. Podem ser associados a protocolos médicos quando indicado."
    ),
    children=["cuidados-faciais-esteticista", "drenagem-corporal"],
)

# ---------------------------------------------------------------------------
# Sub-hubs faciais
# ---------------------------------------------------------------------------

PAGES["avaliacao-facial"] = _proc(
    slug="avaliacao-facial",
    h1="Avaliação facial personalizada",
    meta_title="Avaliação Facial | Instituto Bruna Aguiar — Brasília",
    meta_description=(
        "Avaliação facial individualizada para novos pacientes e retornos. "
        "Plano de tratamento baseado em anatomia, objetivos e histórico clínico."
    ),
    keywords=["avaliação facial brasília", "consulta estética facial df"],
    intro=(
        "A avaliação facial é o ponto de partida de qualquer protocolo no Instituto. "
        "Ela organiza prioridades, indicações e expectativas com base em análise técnica "
        "e escuta cuidadosa."
    ),
    parent_slug="tratamentos-faciais",
    purpose=(
        "Mapear estrutura facial, qualidade da pele, queixas e objetivos para construir "
        "um plano seguro, coerente e personalizado."
    ),
    indication=(
        "Indicada para quem busca o primeiro procedimento, retorno após um ano ou "
        "revisão de protocolos em andamento."
    ),
    how_it_works=(
        "Consulta dedicada com análise de proporções, dinâmica muscular, textura cutânea "
        "e histórico. Ao final, você recebe orientações claras sobre opções, sequência "
        "e cuidados."
    ),
    benefits=(
        "Clareza sobre indicações, redução de riscos, planejamento por etapas e "
        "decisões mais seguras sobre investimento e tempo."
    ),
    care="Traga histórico de procedimentos, medicamentos e fotos de referência, se desejar.",
    faqs=_faq(
        (
            "A avaliação inclui procedimento no mesmo dia?",
            "Depende da indicação e disponibilidade. Muitas vezes o plano é definido primeiro e o tratamento agendado em seguida.",
        ),
        (
            "Preciso repetir a avaliação?",
            "Recomendamos retorno anual ou quando houver mudança significativa de objetivos ou histórico.",
        ),
    ),
    related=["toxina-botulinica", "preenchimentos-e-skinboosters", "bioestimuladores-de-colageno"],
    cta_text="Agende sua avaliação facial personalizada",
)

PAGES["toxina-botulinica"] = _hub(
    slug="toxina-botulinica",
    h1="Toxina botulínica (Botox)",
    meta_title="Toxina Botulínica em Brasília | Botox Feminino e Masculino",
    meta_description=(
        "Botox para terço superior, full face, pescoço, hiperidrose e rinotox. "
        "Abordagens femininas e masculinas com naturalidade na Asa Sul."
    ),
    keywords=["botox brasília", "toxina botulínica df", "botox masculino brasília"],
    intro=(
        "A toxina botulínica modula a contração muscular para suavizar linhas de expressão, "
        "refinar contornos e tratar indicações funcionais. A dosagem e o mapa de aplicação "
        "variam conforme anatomia, gênero e objetivo."
    ),
    parent_slug="tratamentos-faciais",
    children=[
        "botox-feminino-terco-superior",
        "botox-full-face-feminino",
        "botox-full-face-feminino-contorno-pescoco",
        "botox-masculino-terco-superior",
        "botox-full-face-masculino",
        "botox-full-face-masculino-contorno-pescoco",
        "botox-pontual",
        "botox-pescoco",
        "botox-hiperidrose",
        "rinotox",
    ],
    related=["avaliacao-facial", "preenchimentos-e-skinboosters"],
)

PAGES["preenchimentos-e-skinboosters"] = _hub(
    slug="preenchimentos-e-skinboosters",
    h1="Preenchimentos e skinboosters com ácido hialurônico",
    meta_title="Preenchimento Facial e Skinbooster | Instituto Bruna Aguiar",
    meta_description=(
        "Preenchimento facial e labial, skinboosters, rinomodelação e hialuronidase. "
        "Volumização, hidratação profunda e equilíbrio facial na Asa Sul."
    ),
    keywords=["preenchimento facial brasília", "skinbooster df", "rinomodelação brasília"],
    intro=(
        "Ácido hialurônico para volumização, contorno, hidratação injetável e correções "
        "pontuais. Cada técnica tem indicação, profundidade e resultado esperado distintos."
    ),
    parent_slug="tratamentos-faciais",
    children=[
        "preenchimento-facial",
        "preenchimento-labial",
        "skinbooster-labial",
        "skinbooster-facial",
        "rinomodelacao",
        "hialuronidase",
    ],
)

PAGES["bioestimuladores-de-colageno"] = _hub(
    slug="bioestimuladores-de-colageno",
    h1="Bioestimuladores de colágeno injetáveis",
    meta_title="Bioestimuladores de Colágeno | Sculptra, Radiesse, Elleva — Brasília",
    meta_description=(
        "Duo Blend, ácido poli-L-lático, hidroxiapatita de cálcio e Radiesse com ativos "
        "regenerativos para estímulo progressivo de colágeno."
    ),
    keywords=["bioestimulador de colágeno brasília", "sculptra df", "radiesse brasília"],
    intro=(
        "Ativos que estimulam a produção natural de colágeno, com resultados progressivos. "
        "Diferem dos preenchimentos imediatos por atuarem na qualidade estrutural da pele."
    ),
    parent_slug="tratamentos-faciais",
    children=[
        "duo-blend",
        "acido-poli-l-latico",
        "hidroxiapatita-de-calcio",
        "radiesse-ativos-regenerativos",
    ],
)

PAGES["procedimentos-regenerativos-faciais"] = _hub(
    slug="procedimentos-regenerativos-faciais",
    h1="Procedimentos regenerativos faciais",
    meta_title="Procedimentos Regenerativos Faciais | PDRN, Exossomos, Peeling",
    meta_description=(
        "Microagulhamento, intradermoterapia, peeling químico, Peeling Evolution, "
        "jato de plasma e cauterização de sinais na Asa Sul."
    ),
    keywords=["microagulhamento pdrn brasília", "peeling facial df", "exossomos facial"],
    intro=(
        "Tecnologias e ativos regenerativos para renovar textura, tratar manchas, "
        "cicatrizes e estimular colágeno com protocolos personalizados."
    ),
    parent_slug="tratamentos-faciais",
    children=[
        "microagulhamento-com-pdrn",
        "intradermoterapia-regenerativa",
        "peeling-quimico",
        "protocolo-peeling-evolution",
        "jato-de-plasma-facial",
        "cauterizacao-de-sinais",
    ],
)

PAGES["fios-de-colageno"] = _hub(
    slug="fios-de-colageno",
    h1="Fios de colágeno e sustentação",
    meta_title="Fios de Colágeno PDO | Estímulo e Sustentação Facial — Brasília",
    meta_description=(
        "Fios absorvíveis para estímulo de colágeno e sustentação. Combos com 10 ou 20 fios "
        "e fios de sustentação com avaliação individualizada."
    ),
    keywords=["fios de colágeno brasília", "fios pdo df", "fio de sustentação facial"],
    intro=(
        "Fios absorvíveis que estimulam colágeno ou oferecem sustentação mecânica, "
        "conforme indicação. A escolha depende de flacidez, região e plano de tratamento."
    ),
    parent_slug="tratamentos-faciais",
    children=["fios-combo-10", "fios-combo-20", "fio-de-sustentacao"],
)

# ---------------------------------------------------------------------------
# Sub-hubs tecnologias
# ---------------------------------------------------------------------------

PAGES["laser-co2-fracionado"] = _hub(
    slug="laser-co2-fracionado",
    h1="Laser CO2 fracionado",
    meta_title="Laser CO2 Fracionado Facial | Rejuvenescimento — Brasília",
    meta_description=(
        "CO2 fracionado para face completa, pálpebras, mãos e orelhas. "
        "Textura, linhas, cicatrizes e poros com recuperação orientada."
    ),
    keywords=["laser co2 fracionado brasília", "co2 facial df", "laser pálpebras"],
    intro=(
        "Laser ablativo fracionado que renova a pele em profundidade controlada, "
        "indicado para rejuvenescimento, textura irregular e cicatrizes."
    ),
    parent_slug="tecnologias-faciais-e-laser",
    children=[
        "co2-fracionado-face-completa",
        "co2-fracionado-palpebras",
        "co2-fracionado-maos-orelhas",
    ],
)

PAGES["bb-glow-laser-poros-manchas"] = _proc(
    slug="bb-glow-laser-poros-manchas",
    h1="BB Glow e laser para poros e manchas",
    meta_title="BB Glow e Tratamento de Poros e Manchas | Brasília",
    meta_description=(
        "BB Glow e protocolos laser para poros, manchas e uniformidade da pele, "
        "incluindo ciclo de três sessões por região."
    ),
    keywords=["bb glow brasília", "tratamento manchas facial df", "poros dilatados"],
    intro=(
        "Protocolos combinados para luminosidade, poros e discromias superficiais, "
        "com plano de sessões definido na avaliação."
    ),
    parent_slug="tecnologias-faciais-e-laser",
    purpose="Melhorar uniformidade, viço e textura superficial da pele.",
    indication="Pacientes com manchas leves, poros aparentes ou pele opaca, sem contraindicações ativas.",
    how_it_works=(
        "Sessões sequenciais com tecnologia e ativos específicos. O ciclo de três sessões "
        "potencializa resultado quando indicado."
    ),
    benefits="Pele mais uniforme, poros menos visíveis e glow natural progressivo.",
    care="Proteção solar rigorosa e home care orientado entre sessões.",
    faqs=_faq(
        ("Quantas sessões são necessárias?", "Varia conforme pele e objetivo. Muitos protocolos usam ciclos de três sessões."),
        ("Posso associar com outros lasers?", "Sim, quando há indicação e intervalo adequado entre procedimentos."),
    ),
    related=["laser-co2-fracionado", "hypro-facial", "avaliacao-facial"],
)

PAGES["hypro-facial"] = _hub(
    slug="hypro-facial",
    h1="HYPRO Facial — ultrassom microfocado",
    meta_title="HYPRO Facial | Ultrassom Microfocado — Brasília",
    meta_description=(
        "HYPRO para terço superior, papada, pescoço e full face. "
        "Flacidez e definição de contorno com protocolo personalizado."
    ),
    keywords=["hypro facial brasília", "ultrassom microfocado df", "lifting sem cirurgia"],
    intro=(
        "Ultrassom microfocado para estímulo de colágeno em planos profundos, "
        "com foco em flacidez e contorno conforme região tratada."
    ),
    parent_slug="tecnologias-faciais-e-laser",
    children=[
        "hypro-terco-superior",
        "hypro-papada",
        "hypro-pescoco",
        "hypro-papada-pescoco",
        "hypro-terco-medio-inferior",
        "hypro-full-face",
        "hypro-full-face-pescoco",
    ],
)

# ---------------------------------------------------------------------------
# Sub-hubs corporais
# ---------------------------------------------------------------------------

PAGES["hypro-corporal"] = _hub(
    slug="hypro-corporal",
    h1="HYPRO Corporal",
    meta_title="HYPRO Corporal | Flacidez e Contorno — Brasília",
    meta_description=(
        "HYPRO corporal para colo, braços, abdômen, costas, culote, coxas e outras regiões. "
        "Protocolo individualizado na Asa Sul."
    ),
    keywords=["hypro corporal brasília", "flacidez corporal df", "ultrassom microfocado corporal"],
    intro=(
        "Ultrassom microfocado aplicado a regiões corporais específicas para flacidez "
        "e contorno. Cada área tem objetivo e parâmetros próprios."
    ),
    parent_slug="tratamentos-corporais",
    children=[
        "hypro-corporal-colo",
        "hypro-corporal-bracos",
        "hypro-corporal-abdomen",
        "hypro-corporal-costas-flancos",
        "hypro-corporal-prega-glutea",
        "hypro-corporal-culote",
        "hypro-corporal-prega-axilar",
        "hypro-corporal-coxas-internas",
        "hypro-corporal-virilha",
        "hypro-corporal-posterior-coxa",
        "hypro-corporal-faixa-pequena",
    ],
)

PAGES["laser-co2-fracionado-corporal"] = _hub(
    slug="laser-co2-fracionado-corporal",
    h1="Laser CO2 fracionado corporal",
    meta_title="Laser CO2 Corporal | Estrias e Flacidez — Brasília",
    meta_description=(
        "CO2 fracionado corporal para regiões grandes e médias, mãos, orelhas e BB Laser "
        "para manchas em ciclo de três sessões."
    ),
    keywords=["laser co2 corporal brasília", "estrias laser df", "flacidez corporal laser"],
    intro="Renovação cutânea corporal para estrias, cicatrizes, flacidez e manchas.",
    parent_slug="tratamentos-corporais",
    children=[
        "co2-corporal-regioes-grandes",
        "co2-corporal-regioes-medias",
        "co2-corporal-maos-orelhas",
        "bb-laser-manchas-corporal",
    ],
)

PAGES["luz-intensa-pulsada"] = _proc(
    slug="luz-intensa-pulsada",
    h1="Luz Intensa Pulsada (LIP)",
    meta_title="Luz Intensa Pulsada | LIP — Instituto Bruna Aguiar, Brasília",
    meta_description=(
        "LIP para manchas, vasos e fotoenvelhecimento. Sessões avulsas ou pacote "
        "de dez sessões com protocolo personalizado."
    ),
    keywords=["luz intensa pulsada brasília", "lip df", "fotoenvelhecimento"],
    intro=(
        "Tecnologia de luz pulsada para tratar discromias, vasos superficiais e "
        "sinais de fotoenvelhecimento, com número de sessões definido na avaliação."
    ),
    parent_slug="tratamentos-corporais",
    purpose="Uniformizar tom, tratar lesões vasculares superficiais e melhorar qualidade global da pele.",
    indication="Pacientes com manchas, vasinhos ou fotoenvelhecimento leve a moderado.",
    how_it_works=(
        "Impulsos de luz filtrados atingem cromóforos específicos. Sessões individuais "
        "ou pacote de dez sessões conforme extensão e resposta."
    ),
    benefits="Tom mais uniforme, redução progressiva de manchas e pele com aspecto mais saudável.",
    care="Evitar sol direto antes e depois, usar fotoproteção e seguir preparo indicado.",
    faqs=_faq(
        ("Quantas sessões preciso?", "Depende da queixa. Pacotes de dez sessões são comuns em protocolos extensos."),
        ("A LIP serve para rosto e corpo?", "Sim, conforme indicação e parâmetros ajustados por região."),
    ),
    related=["bb-glow-laser-poros-manchas", "laser-co2-fracionado-corporal"],
)

PAGES["injetaveis-corporais"] = _hub(
    slug="injetaveis-corporais",
    h1="Injetáveis corporais",
    meta_title="Injetáveis Corporais | Intradermoterapia, PEIM — Brasília",
    meta_description=(
        "Intradermoterapia corporal, otimizador metabólico, jato de plasma e PEIM "
        "para microvasos com avaliação profissional."
    ),
    keywords=["intradermoterapia corporal brasília", "peim df", "injetáveis corporais"],
    intro=(
        "Tratamentos injetáveis e complementares para contorno, qualidade da pele "
        "e microvasos, sempre com limites e indicações claras."
    ),
    parent_slug="tratamentos-corporais",
    children=[
        "intradermoterapia-corporal",
        "otimizador-metabolico",
        "jato-de-plasma-corporal",
        "peim-microvasos",
    ],
)

# ---------------------------------------------------------------------------
# Esteticista
# ---------------------------------------------------------------------------

PAGES["cuidados-faciais-esteticista"] = _hub(
    slug="cuidados-faciais-esteticista",
    h1="Cuidados faciais com esteticista",
    meta_title="Limpeza de Pele e Cuidados Faciais | Esteticista Adriana",
    meta_description=(
        "Limpeza de pele profunda, dermaplaning, revitalização, Hydra Gloss Lips, "
        "Nano Lips e design de sobrancelhas na Asa Sul."
    ),
    keywords=["limpeza de pele brasília", "dermaplaning df", "design sobrancelha asa sul"],
    intro=(
        "Protocolos de skincare profissional para saúde, luminosidade e manutenção da pele, "
        "com possibilidade de integração aos tratamentos médicos."
    ),
    parent_slug="estetica-com-esteticista",
    children=[
        "limpeza-de-pele",
        "limpeza-de-pele-albumina",
        "limpeza-de-pele-peeling-diamante",
        "limpeza-de-pele-dermaplaning",
        "revitalizacao-facial",
        "hydra-gloss-lips",
        "nano-lips",
        "design-sobrancelha",
        "design-laminacao-coloracao",
        "design-laminacao",
        "design-coloracao",
    ],
)

PAGES["drenagem-corporal"] = _proc(
    slug="drenagem-corporal",
    h1="Drenagem corporal",
    meta_title="Drenagem Linfática Corporal | Protocolos 5 e 10 sessões — Brasília",
    meta_description=(
        "Drenagem corporal para retenção de líquidos, conforto e bem-estar. "
        "Protocolos de cinco e dez sessões personalizados."
    ),
    keywords=["drenagem linfática brasília", "drenagem corporal df", "retenção de líquidos"],
    intro=(
        "Técnica manual que favorece a circulação linfática, alivia sensação de peso "
        "e complementa protocolos corporais quando indicado."
    ),
    parent_slug="estetica-com-esteticista",
    purpose="Reduzir edema, melhorar conforto e apoiar resultados de tratamentos corporais.",
    indication="Retenção de líquidos, peso nas pernas, pós-operatório orientado ou manutenção de bem-estar.",
    how_it_works=(
        "Sessões com ritmo e pressão adequados à região. Planos de cinco ou dez sessões "
        "são definidos conforme objetivo e resposta."
    ),
    benefits="Sensação de leveza, conforto e apoio à circulação local.",
    care="Hidratação adequada e movimento leve ajudam a manter o benefício entre sessões.",
    faqs=_faq(
        ("Drenagem emagrece?", "Não é tratamento para perda de peso. Atua sobre líquidos retidos e conforto."),
        ("Posso associar com HYPRO ou LIP?", "Sim, quando o plano corporal integrado indica sequência segura."),
    ),
    related=["hypro-corporal", "luz-intensa-pulsada"],
)

# ---------------------------------------------------------------------------
# Geradores de procedimentos repetitivos
# ---------------------------------------------------------------------------

def _botox_page(slug: str, h1: str, meta_title: str, meta_desc: str, kw: list[str], detail: str) -> Page:
    return _proc(
        slug=slug,
        h1=h1,
        meta_title=meta_title,
        meta_description=meta_desc,
        keywords=kw,
        intro=(
            f"{detail} A aplicação respeita anatomia, expressividade e diferenças entre "
            "abordagens femininas e masculinas."
        ),
        parent_slug="toxina-botulinica",
        purpose="Suavizar linhas de expressão e refinar contornos com naturalidade.",
        indication="Pacientes com indicação clínica para modulação muscular na região descrita.",
        regions=detail,
        how_it_works=(
            "Aplicação precisa da toxina nos pontos mapeados na avaliação. "
            "O efeito instala-se progressivamente em dias subsequentes."
        ),
        benefits="Expressão mais descansada, contorno harmonioso e resultado proporcional ao objetivo.",
        care="Evitar deitar ou massagear a região nas horas iniciais. Retorno conforme orientação médica.",
        faqs=_faq(
            ("Quanto tempo dura o efeito?", "Em média de três a seis meses, variando por metabolismo e região."),
            ("O resultado fica natural?", "Sim, quando a dosagem e o mapa respeitam sua anatomia e expressividade."),
        ),
        related=["avaliacao-facial", "preenchimentos-e-skinboosters", "botox-pontual"],
    )


BOTOX_VARIANTS = [
    ("botox-feminino-terco-superior", "Botox feminino para terço superior", "Testa, glabela e região periorbital."),
    ("botox-full-face-feminino", "Botox full face feminino", "Terço superior associado a regiões complementares do rosto."),
    ("botox-full-face-feminino-contorno-pescoco", "Botox full face feminino com face contour e pescoço", "Rosto completo com contorno mandibular e bandas do pescoço quando indicado."),
    ("botox-masculino-terco-superior", "Botox masculino para terço superior", "Terço superior com dosagem e mapa adaptados à musculatura masculina."),
    ("botox-full-face-masculino", "Botox full face masculino", "Protocolo masculino ampliado preservando traços e expressividade."),
    ("botox-full-face-masculino-contorno-pescoco", "Botox full face masculino com face contour e pescoço", "Full face masculino com contorno e pescoço conforme indicação."),
    ("botox-pontual", "Botox pontual", "Aplicação localizada em região específica identificada na avaliação."),
    ("botox-pescoco", "Botox para pescoço", "Bandas platismais e contorno cervical."),
    ("botox-hiperidrose", "Botox para hiperidrose", "Modulação sudomotora em axilas, mãos ou pés conforme indicação."),
    ("rinotox", "Rinotox", "Aplicação em região nasal para refinamento funcional e estético quando indicado."),
]

for slug, h1, detail in BOTOX_VARIANTS:
    PAGES[slug] = _botox_page(
        slug,
        h1,
        f"{h1} | Instituto Bruna Aguiar — Brasília",
        f"{h1} com avaliação individualizada, naturalidade e segurança na Asa Sul, Brasília.",
        [f"{slug.replace('-', ' ')} brasília", "toxina botulínica df"],
        detail,
    )

FILLERS = [
    ("preenchimento-facial", "Preenchimento facial", "Volumização e contorno em regiões como malar, mandíbula, mento e sulcos."),
    ("preenchimento-labial", "Preenchimento labial", "Volume, contorno e equilíbrio dos lábios com naturalidade."),
    ("skinbooster-labial", "Skinbooster labial", "Hidratação profunda labial com ácido hialurônico de baixa reticulação."),
    ("skinbooster-facial", "Skinbooster facial", "Hidratação injetável difusa para viço e qualidade da pele."),
    ("rinomodelacao", "Rinomodelação", "Correção não cirúrgica de contorno nasal com ácido hialurônico."),
    ("hialuronidase", "Hialuronidase", "Enzima para reversão de preenchimentos com ácido hialurônico quando necessário."),
]

for slug, h1, detail in FILLERS:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | Instituto Bruna Aguiar — Brasília",
        meta_description=f"{h1} com técnica, naturalidade e avaliação individualizada na Asa Sul.",
        keywords=[f"{slug.replace('-', ' ')} brasília", "ácido hialurônico df"],
        intro=f"{detail} Planejamento e produto são definidos na avaliação facial.",
        parent_slug="preenchimentos-e-skinboosters",
        purpose=detail,
        indication="Pacientes com indicação para volumização, hidratação injetável ou correção específica.",
        how_it_works="Aplicação com cânula ou agulha conforme região, com controle de camada e volume.",
        benefits="Equilíbrio facial, hidratação profunda ou correção pontual com reversibilidade quando aplicável.",
        care="Evitar calor excessivo, pressão local e exercício intenso nas primeiras 24 a 48 horas.",
        faqs=_faq(
            ("Qual a diferença entre preenchimento e skinbooster?", "Preenchimento estrutura volumes; skinbooster hidrata e melhora qualidade da pele."),
            ("Quando usar hialuronidase?", "Quando há necessidade clínica de dissolver ácido hialurônico previamente aplicado."),
        ),
        related=["avaliacao-facial", "bioestimuladores-de-colageno", "toxina-botulinica"],
    )

BIOSTIM = [
    ("duo-blend", "Duo Blend com ácido hialurônico e hidroxiapatita de cálcio", "Combinação para estímulo e suporte estrutural progressivo."),
    ("acido-poli-l-latico", "Ácido poli-L-lático (Sculptra e Elleva)", "Estímulo gradual de colágeno com resultados progressivos."),
    ("hidroxiapatita-de-calcio", "Hidroxiapatita de cálcio (Radiesse)", "Bioestimulador com efeito de sustentação e neocolagênese."),
    ("radiesse-ativos-regenerativos", "Radiesse com ativos regenerativos", "Protocolo associado a ativos regenerativos quando indicado."),
]

for slug, h1, detail in BIOSTIM:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | Bioestimuladores — Instituto Bruna Aguiar",
        meta_description=f"{h1}. Estímulo de colágeno com avaliação facial na Asa Sul, Brasília.",
        keywords=[f"{slug.replace('-', ' ')} brasília", "bioestimulador df"],
        intro=f"{detail} Resultados são progressivos e dependem de plano e número de sessões.",
        parent_slug="bioestimuladores-de-colageno",
        purpose="Estimular colágeno endógeno e melhorar firmeza e qualidade da pele.",
        indication="Flacidez leve a moderada, perda de sustentação ou desejo de rejuvenescimento progressivo.",
        how_it_works="Injeção em planos adequados com intervalos entre sessões conforme protocolo.",
        benefits="Firmeza progressiva, melhora da qualidade cutânea e naturalidade ao longo das semanas.",
        care="Massagens orientadas quando indicadas, fotoproteção e hidratação.",
        associations="Pode integrar planos com toxina botulínica, preenchimentos ou tecnologias de flacidez.",
        faqs=_faq(
            ("Quando vejo resultado?", "Estímulo de colágeno é progressivo, com evolução ao longo de semanas e meses."),
            ("Substitui preenchimento?", "Não necessariamente. Atuam de formas complementares conforme objetivo."),
        ),
        related=["avaliacao-facial", "preenchimentos-e-skinboosters", "hypro-facial"],
    )

REGEN = [
    ("microagulhamento-com-pdrn", "Microagulhamento com PDRN ou exossomos", "Microperfurações controladas com ativos regenerativos."),
    ("intradermoterapia-regenerativa", "Intradermoterapia com PDRN ou exossomos", "Infusão de ativos regenerativos na derme."),
    ("peeling-quimico", "Peeling químico", "Renovação celular com ácidos de profundidade definida na avaliação."),
    ("protocolo-peeling-evolution", "Protocolo Peeling Evolution", "Protocolo avançado de peeling com etapas personalizadas."),
    ("jato-de-plasma-facial", "Jato de plasma facial", "Tratamento para flacidez palpebral e lesões superficiais selecionadas."),
    ("cauterizacao-de-sinais", "Cauterização de sinais", "Remoção ou redução de lesões cutâneas benignas indicadas."),
]

for slug, h1, detail in REGEN:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | Regenerativos — Instituto Bruna Aguiar",
        meta_description=f"{h1} para textura, manchas e estímulo de colágeno na Asa Sul.",
        keywords=[f"{slug.replace('-', ' ')} brasília", "tratamento regenerativo facial"],
        intro=f"{detail} Indicação depende de tipo de pele, downtime aceito e objetivo.",
        parent_slug="procedimentos-regenerativos-faciais",
        purpose="Renovar a pele, tratar cicatrizes, manchas ou flacidez superficial.",
        indication="Pacientes com indicação clínica após avaliação dermatológica estética.",
        how_it_works="Sessão ou ciclo com técnica específica, home care e retornos programados.",
        benefits="Textura mais uniforme, estímulo de colágeno e melhora progressiva das queixas.",
        care="Fotoproteção, hidratação e evitar sol direto conforme protocolo pós-procedimento.",
        faqs=_faq(
            ("Há tempo de recuperação?", "Varia por técnica. Orientamos downtime esperado na avaliação."),
            ("Posso combinar com laser?", "Integrações são possíveis com intervalos seguros entre sessões."),
        ),
        related=["avaliacao-facial", "laser-co2-fracionado", "peeling-quimico"],
    )

FIO = [
    ("fios-combo-10", "Combo com 10 fios", "Protocolo de estímulo com dez fios absorvíveis."),
    ("fios-combo-20", "Combo com 20 fios", "Protocolo ampliado com vinte fios para áreas maiores ou maior flacidez."),
    ("fio-de-sustentacao", "Fio de sustentação", "Fios com função mecânica de sustentação em regiões indicadas."),
]

for slug, h1, detail in FIO:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | Fios de Colágeno — Instituto Bruna Aguiar",
        meta_description=f"{h1}. Fios absorvíveis com avaliação facial na Asa Sul, Brasília.",
        keywords=[f"{slug.replace('-', ' ')} brasília", "fios pdo df"],
        intro=f"{detail} Diferenciam-se por função: estímulo de colágeno ou sustentação.",
        parent_slug="fios-de-colageno",
        purpose="Melhorar flacidez e firmeza com fios absorvíveis.",
        indication="Flacidez leve a moderada em regiões faciais indicadas.",
        how_it_works="Inserção de fios com técnica e vetor definidos na avaliação.",
        benefits="Estímulo de colágeno e/ou sustentação imediata conforme tipo de fio.",
        care="Evitar expressões exageradas e massagens na região nas primeiras semanas.",
        associations="Pode complementar bioestimuladores, toxina ou tecnologias de flacidez.",
        related=["avaliacao-facial", "bioestimuladores-de-colageno", "hypro-facial"],
        faqs=_faq(
            ("Fios de estímulo e sustentação são iguais?", "Não. Estímulo prioriza colágeno; sustentação oferece apoio mecânico."),
            ("Quanto tempo duram?", "Fios são absorvíveis; o benefício do colágeno estimulado persiste além da absorção."),
        ),
    )

CO2_FACE = [
    ("co2-fracionado-face-completa", "CO2 fracionado para face completa", "Rejuvenescimento global de textura, linhas e poros."),
    ("co2-fracionado-palpebras", "CO2 fracionado para pálpebras", "Região periorbital com parâmetros conservadores."),
    ("co2-fracionado-maos-orelhas", "CO2 fracionado para mãos e orelhas", "Renovação de áreas expostas ao fotoenvelhecimento."),
]

for slug, h1, detail in CO2_FACE:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | Laser CO2 — Instituto Bruna Aguiar",
        meta_description=f"{h1}. Rejuvenescimento, cicatrizes e textura na Asa Sul, Brasília.",
        keywords=[f"{slug.replace('-', ' ')} brasília", "laser co2 df"],
        intro=f"{detail} Recuperação e número de sessões são explicados na avaliação.",
        parent_slug="laser-co2-fracionado",
        purpose="Renovar a pele, tratar linhas, poros, cicatrizes e fotoenvelhecimento.",
        indication="Pacientes com indicação para laser ablativo fracionado e downtime compatível.",
        regions=detail,
        how_it_works="Feixes fracionados criam microzonas de renovação com cicatrização periférica.",
        benefits="Textura mais lisa, poros menos visíveis e rejuvenescimento progressivo.",
        care="Home care rigoroso, fotoproteção total e evitar sol durante recuperação.",
        related=["bb-glow-laser-poros-manchas", "hypro-facial", "avaliacao-facial"],
        faqs=_faq(
            ("Quantos dias de recuperação?", "Depende da intensidade. Orientamos cronograma social na consulta."),
            ("Posso tratar pálpebras e face juntos?", "Quando indicado, sim, com parâmetros seguros por região."),
        ),
    )

HYPRO_FACE = [
    ("hypro-terco-superior", "HYPRO para terço superior", "Flacidez de testa e região periorbital."),
    ("hypro-papada", "HYPRO para papada", "Definição submentoniana e flacidez localizada."),
    ("hypro-pescoco", "HYPRO para pescoço", "Flacidez e qualidade da pele cervical."),
    ("hypro-papada-pescoco", "HYPRO para papada e pescoço", "Protocolo combinado submentoniano e cervical."),
    ("hypro-terco-medio-inferior", "HYPRO para terço médio e inferior", "Flacidez malar, mandibular e região perioral."),
    ("hypro-full-face", "HYPRO full face", "Tratamento facial amplo conforme mapa individual."),
    ("hypro-full-face-pescoco", "HYPRO full face com pescoço", "Face completa associada ao pescoço quando indicado."),
]

for slug, h1, detail in HYPRO_FACE:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | HYPRO — Instituto Bruna Aguiar, Brasília",
        meta_description=f"{h1}. Ultrassom microfocado para flacidez e contorno na Asa Sul.",
        keywords=[f"{slug.replace('-', ' ')} brasília", "hypro df"],
        intro=f"{detail} Profundidade e linhas de aplicação são personalizadas.",
        parent_slug="hypro-facial",
        purpose="Estimular colágeno profundo e melhorar flacidez e contorno.",
        indication="Flacidez facial ou cervical com indicação para ultrassom microfocado.",
        regions=detail,
        how_it_works="Ultrassom microfocado atinge planos SMAS com pontos de coagulação térmica controlada.",
        benefits="Firmeza progressiva e definição de contorno ao longo de meses.",
        care="Hidratação, fotoproteção e evitar procedimentos agressivos concomitantes sem orientação.",
        related=["avaliacao-facial", "laser-co2-fracionado", "bioestimuladores-de-colageno"],
        faqs=_faq(
            ("Quantas sessões?", "Geralmente uma sessão por região, com reforço conforme resposta individual."),
            ("Substitui cirurgia?", "Não. Atua em flacidez moderada com resultados progressivos e naturais."),
        ),
    )

HYPRO_BODY = [
    ("hypro-corporal-colo", "Colo", "Flacidez e qualidade da pele decollete."),
    ("hypro-corporal-bracos", "Braços", "Flacidez de face interna ou posterior do braço."),
    ("hypro-corporal-abdomen", "Abdômen", "Flacidez abdominal superficial."),
    ("hypro-corporal-costas-flancos", "Costas e flancos", "Contorno e firmeza de dorso e flancos."),
    ("hypro-corporal-prega-glutea", "Prega glútea", "Flacidez na prega infraglútea."),
    ("hypro-corporal-culote", "Culote", "Flacidez lateral de quadril."),
    ("hypro-corporal-prega-axilar", "Prega axilar", "Flacidez na prega anterior do braço/axila."),
    ("hypro-corporal-coxas-internas", "Parte interna das coxas", "Flacidez de face interna."),
    ("hypro-corporal-virilha", "Virilha", "Flacidez localizada na região."),
    ("hypro-corporal-posterior-coxa", "Posterior de coxa", "Firmeza de face posterior."),
    ("hypro-corporal-faixa-pequena", "Faixa pequena", "Regiões compactas com protocolo reduzido."),
]

for slug, region, detail in HYPRO_BODY:
    PAGES[slug] = _proc(
        slug=slug,
        h1=f"HYPRO corporal: {region}",
        meta_title=f"HYPRO Corporal {region} | Instituto Bruna Aguiar — Brasília",
        meta_description=f"HYPRO corporal para {region.lower()}. Flacidez e contorno com protocolo individualizado.",
        keywords=[f"hypro {region.lower()} brasília", "hypro corporal df"],
        intro=f"Ultrassom microfocado para {detail.lower()}",
        parent_slug="hypro-corporal",
        purpose=f"Tratar flacidez e melhorar contorno em {region.lower()}.",
        indication="Pacientes com flacidez corporal localizada e indicação para HYPRO.",
        regions=region,
        how_it_works="Aplicação de linhas de ultrassom microfocado conforme anatomia da região.",
        benefits="Firmeza progressiva e melhora do contorno local.",
        care="Hidratação, movimento leve e fotoproteção na área exposta.",
        related=["hypro-corporal", "laser-co2-fracionado-corporal", "drenagem-corporal"],
        faqs=_faq(
            ("Uma sessão basta?", "Na maioria das regiões, sim, com avaliação de reforço posterior."),
            ("Combina com drenagem?", "Pode ser associado em planos corporais integrados."),
        ),
    )

CO2_BODY = [
    ("co2-corporal-regioes-grandes", "Regiões grandes", "Estrias, cicatrizes e flacidez em áreas extensas."),
    ("co2-corporal-regioes-medias", "Regiões médias", "Tratamento em áreas de tamanho intermediário."),
    ("co2-corporal-maos-orelhas", "Mãos e orelhas", "Fotoenvelhecimento e textura."),
    ("bb-laser-manchas-corporal", "BB Laser para manchas", "Ciclo de três sessões por região para discromias."),
]

for slug, h1, detail in CO2_BODY:
    PAGES[slug] = _proc(
        slug=slug,
        h1=f"Laser CO2 corporal: {h1}",
        meta_title=f"Laser CO2 Corporal {h1} | Instituto Bruna Aguiar",
        meta_description=f"Laser CO2 fracionado corporal para {detail.lower()} na Asa Sul, Brasília.",
        keywords=[f"laser co2 corporal {slug} brasília"],
        intro=f"Protocolo a laser para {detail.lower()}",
        parent_slug="laser-co2-fracionado-corporal",
        purpose="Renovar qualidade da pele corporal e tratar estrias, cicatrizes ou manchas.",
        indication="Conforme avaliação corporal e tolerância ao downtime.",
        regions=h1,
        how_it_works="Sessões fracionadas com parâmetros ajustados à extensão da região.",
        benefits="Textura mais uniforme e melhora progressiva de estrias, cicatrizes ou manchas.",
        care="Recuperação orientada, fotoproteção e hidratação intensiva.",
        related=["hypro-corporal", "luz-intensa-pulsada", "drenagem-corporal"],
        faqs=_faq(
            ("Estrias respondem ao laser?", "Melhora progressiva é possível; expectativa realista é definida na avaliação."),
        ),
    )

INJ_CORP = [
    ("intradermoterapia-corporal", "Intradermoterapia corporal", "Ativos injetáveis para qualidade da pele e contorno."),
    ("otimizador-metabolico", "Otimizador metabólico", "Protocolo injetável de apoio metabólico quando indicado."),
    ("jato-de-plasma-corporal", "Jato de plasma corporal", "Tratamento de lesões superficiais e flacidez localizada."),
    ("peim-microvasos", "PEIM para microvasos", "Tratamento de microvasos superficiais."),
]

for slug, h1, detail in INJ_CORP:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | Injetáveis Corporais — Instituto Bruna Aguiar",
        meta_description=f"{h1}. {detail} na Asa Sul, Brasília.",
        keywords=[f"{slug.replace('-', ' ')} brasília"],
        intro=detail,
        parent_slug="injetaveis-corporais",
        purpose=detail,
        indication="Após avaliação corporal e confirmação de indicação segura.",
        how_it_works="Sessões ou ciclos conforme protocolo definido profissionalmente.",
        benefits="Melhora localizada conforme objetivo e limites de cada técnica.",
        care="Seguir orientações de atividade, compressão ou fotoproteção quando aplicável.",
        related=["hypro-corporal", "luz-intensa-pulsada", "drenagem-corporal"],
        faqs=_faq(
            ("Substitui cirurgia ou lipo?", "Não. Atuam em indicações específicas com limites claros."),
        ),
    )

CAPILAR = [
    ("avaliacao-capilar", "Avaliação capilar detalhada", "Mapeamento de couro cabeludo, queda e plano terapêutico."),
    ("mesoterapia-capilar", "Mesoterapia com alta frequência, LEDterapia e ozônio", "Protocolo combinado para couro cabeludo."),
    ("mesoterapia-capilar-regenerativa", "Mesoterapia com ativos regenerativos", "Ativos regenerativos associados a tecnologias auxiliares."),
    ("terapia-de-acalmia-capilar", "Terapia de acalmia capilar", "Protocolo para couro cabeludo sensibilizado ou inflamado."),
]

for slug, h1, detail in CAPILAR:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | Tricologia — Instituto Bruna Aguiar",
        meta_description=f"{h1}. Saúde capilar com avaliação individualizada na Asa Sul, Brasília.",
        keywords=[f"{slug.replace('-', ' ')} brasília", "tricologia df"],
        intro=f"{detail} Resultados variam conforme causa, constância e resposta individual.",
        parent_slug="tratamentos-capilares",
        purpose="Fortalecer fios, equilibrar couro cabeludo e tratar queda ou inflamação.",
        indication="Queda capilar, afinamento, oleosidade, sensibilidade ou manutenção capilar.",
        how_it_works="Sessões seriadas com ativos e tecnologias conforme diagnóstico.",
        benefits="Couro cabeludo mais saudável, fios fortalecidos e queda controlada quando indicado.",
        care="Shampoo e ativos domiciliares orientados, constância no protocolo.",
        related=["avaliacao-capilar", "mesoterapia-capilar"],
        faqs=_faq(
            ("Em quanto tempo vejo resultado?", "Depende da causa. Avaliação define prazo realista e metas."),
            ("Promete crescimento total?", "Não. Trabalhamos com diagnóstico honesto e metas alcançáveis."),
        ),
        cta_text="Agende sua avaliação capilar",
    )

SKINCARE = [
    ("limpeza-de-pele", "Limpeza de pele profunda", "Remoção de impurezas e revitalização básica."),
    ("limpeza-de-pele-albumina", "Limpeza de pele com máscara de albumina", "Limpeza associada à máscara firmadora."),
    ("limpeza-de-pele-peeling-diamante", "Limpeza de pele com peeling de diamante", "Esfoliação mecânica controlada."),
    ("limpeza-de-pele-dermaplaning", "Limpeza de pele com dermaplaning", "Remoção de células mortas e vello superficial."),
    ("revitalizacao-facial", "Revitalização facial", "Protocolo de viço e luminosidade."),
    ("hydra-gloss-lips", "Hydra Gloss Lips", "Hidratação e brilho labial."),
    ("nano-lips", "Nano Lips", "Técnica de pigmentação sutil labial."),
    ("design-sobrancelha", "Design de sobrancelha", "Mapeamento e acabamento das sobrancelhas."),
    ("design-laminacao-coloracao", "Design com laminação e coloração", "Laminação associada à coloração."),
    ("design-laminacao", "Design com laminação", "Laminação para volume e direcionamento dos fios."),
    ("design-coloracao", "Design com coloração", "Coloração semipermanente dos fios."),
]

for slug, h1, detail in SKINCARE:
    PAGES[slug] = _proc(
        slug=slug,
        h1=h1,
        meta_title=f"{h1} | Esteticista Adriana — Instituto Bruna Aguiar",
        meta_description=f"{h1}. {detail} na Asa Sul, Brasília.",
        keywords=[f"{slug.replace('-', ' ')} brasília", "esteticista adriana"],
        intro=f"{detail} Realizado pela esteticista Adriana, com integração aos protocolos médicos quando indicado.",
        parent_slug="cuidados-faciais-esteticista",
        purpose=detail,
        indication="Manutenção da pele, preparação para eventos ou complemento a tratamentos médicos.",
        how_it_works="Sessão com etapas definidas conforme tipo de pele e técnica escolhida.",
        benefits="Pele mais limpa, luminosa e sobrancelhas ou lábios harmonizados.",
        care="Fotoproteção e produtos domiciliares orientados pós-sessão.",
        related=["avaliacao-facial", "revitalizacao-facial", "limpeza-de-pele"],
        faqs=_faq(
            ("Posso fazer perto de procedimentos médicos?", "Intervalos seguros são definidos pela equipe conforme seu plano."),
        ),
        cta_text="Agende com a esteticista",
    )


def all_pages() -> dict[str, Page]:
    return PAGES


def page_url(slug: str | None) -> str:
    if not slug:
        return "/"
    return f"/{slug}/"
