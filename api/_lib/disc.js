// Questionário DISC do processo seletivo.
//
// Formato clássico de escolha forçada: em cada grupo de 4 frases, a pessoa
// marca a que MAIS combina e a que MENOS combina com ela. Cada frase pertence a
// um fator: D (dominância), I (influência), S (estabilidade), C (conformidade).
// A pontuação de cada fator é (vezes em que foi "mais") − (vezes em que foi
// "menos"), de −24 a +24.
//
// As frases são próprias deste site (não são de nenhum instrumento comercial)
// e estão em primeira pessoa para não depender de gênero. O fator de cada frase
// nunca é enviado ao navegador: o candidato recebe só o texto, e o cálculo
// acontece aqui no servidor.

const GRUPOS = [
  [["Decido rápido", "D"], ["Converso com facilidade", "I"], ["Tenho muita paciência", "S"], ["Gosto de tudo organizado", "C"]],
  [["Presto atenção aos detalhes", "C"], ["Vou atrás do que quero", "D"], ["Me empolgo fácil", "I"], ["Mantenho a calma", "S"]],
  [["Sou leal às pessoas", "S"], ["Faço tudo com cuidado", "C"], ["Falo de forma direta", "D"], ["Faço amizade rápido", "I"]],
  [["Vejo o lado bom das coisas", "I"], ["Prefiro um ritmo tranquilo", "S"], ["Busco precisão", "C"], ["Gosto de competir", "D"]],
  [["Arrisco quando é preciso", "D"], ["Convenço com facilidade", "I"], ["Trato todos com gentileza", "S"], ["Analiso antes de agir", "C"]],
  [["Evito riscos desnecessários", "C"], ["Sou firme nas decisões", "D"], ["Animo o ambiente", "I"], ["Gosto de ajudar", "S"]],
  [["Sou constante no que faço", "S"], ["Sigo regras e processos", "C"], ["Me posiciono com clareza", "D"], ["Expresso o que sinto", "I"]],
  [["Inspiro as pessoas", "I"], ["Entendo o lado do outro", "S"], ["Trabalho com método", "C"], ["Cobro resultados", "D"]],
  [["Trabalho bem com autonomia", "D"], ["Encanto as pessoas", "I"], ["Prefiro trabalhar em equipe", "S"], ["Busco a perfeição", "C"]],
  [["Confiro tudo duas vezes", "C"], ["Encaro desafios de frente", "D"], ["Ajo com espontaneidade", "I"], ["Sei ouvir", "S"]],
  [["Prefiro estabilidade", "S"], ["Penso com lógica", "C"], ["Tenho muita energia", "D"], ["Adoro estar com pessoas", "I"]],
  [["Deixo o clima mais leve", "I"], ["Lido bem com as diferenças", "S"], ["Faço passo a passo", "C"], ["Vou direto ao ponto", "D"]],
  [["Não desisto fácil", "D"], ["Gosto de apresentar ideias", "I"], ["Acolho quem chega", "S"], ["Penso antes de falar", "C"]],
  [["Planejo com antecedência", "C"], ["Confio nas minhas decisões", "D"], ["Adoro conversar", "I"], ["Transmito serenidade", "S"]],
  [["As pessoas contam comigo", "S"], ["Gosto de números exatos", "C"], ["Gosto de desafios", "D"], ["Conheço muita gente", "I"]],
  [["Me comunico bem", "I"], ["Mantenho a rotina", "S"], ["Sigo padrões rigorosos", "C"], ["Assumo a liderança", "D"]],
  [["Faço tudo com rapidez", "D"], ["Espalho alegria", "I"], ["Evito conflitos", "S"], ["Observo tudo com atenção", "C"]],
  [["Ajo com prudência", "C"], ["Foco em resultados", "D"], ["Envolvo as pessoas", "I"], ["Me dedico ao que faço", "S"]],
  [["Cuido bem das pessoas", "S"], ["Faço do jeito certo", "C"], ["Gosto de começar coisas novas", "D"], ["Crio conexão rápido", "I"]],
  [["Contagio com minha empolgação", "I"], ["Busco harmonia", "S"], ["Registro tudo por escrito", "C"], ["Topo novidades sem medo", "D"]],
  [["Digo o que penso", "D"], ["Influencio opiniões", "I"], ["Ajo com tranquilidade", "S"], ["Peso prós e contras", "C"]],
  [["Prefiro regras claras", "C"], ["Tenho metas ambiciosas", "D"], ["Levo as coisas com humor", "I"], ["Gosto de ambientes calmos", "S"]],
  [["Ajo com moderação", "S"], ["Questiono o que não entendo", "C"], ["Não tenho medo de errar", "D"], ["Motivo quem está perto", "I"]],
  [["Apoio os colegas", "S"], ["Sigo o combinado à risca", "C"], ["Resolvo problemas rápido", "D"], ["Cativo as pessoas", "I"]],
];

const FATORES = ["D", "I", "S", "C"];

const PERFIS = {
  D: {
    nome: "Dominância",
    resumo: "Perfil direto, decidido e orientado a resultados. Gosta de desafios, age rápido e toma a frente.",
    atencao: "Sob pressão, tende à impaciência e a atropelar etapas.",
  },
  I: {
    nome: "Influência",
    resumo: "Perfil comunicativo, entusiasmado e persuasivo. Cria conexão com facilidade e anima o ambiente.",
    atencao: "Pode perder o foco em detalhes e em rotinas repetitivas.",
  },
  S: {
    nome: "Estabilidade",
    resumo: "Perfil paciente, constante e acolhedor. Escuta bem e colabora com a equipe.",
    atencao: "Tende a evitar conflitos e a se adaptar devagar a mudanças bruscas.",
  },
  C: {
    nome: "Conformidade",
    resumo: "Perfil organizado, cuidadoso e analítico. Preza por precisão, processos e qualidade.",
    atencao: "Pode demorar para decidir e ser exigente demais com detalhes.",
  },
};

// O que o navegador recebe: só os textos.
function perguntasPublicas() {
  return GRUPOS.map(function (g) { return g.map(function (f) { return f[0]; }); });
}

// respostas: [{ mais: 0..3, menos: 0..3 }, ...] na ordem dos grupos.
// Devolve null se o formato não bater (não confiamos no navegador).
function calcular(respostas) {
  if (!Array.isArray(respostas) || respostas.length !== GRUPOS.length) return null;

  const mais = { D: 0, I: 0, S: 0, C: 0 };
  const menos = { D: 0, I: 0, S: 0, C: 0 };

  for (let i = 0; i < GRUPOS.length; i++) {
    const r = respostas[i] || {};
    const a = Number(r.mais), b = Number(r.menos);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || a > 3 || b < 0 || b > 3 || a === b) return null;
    mais[GRUPOS[i][a][1]] += 1;
    menos[GRUPOS[i][b][1]] += 1;
  }

  const pontos = {}, percentual = {};
  FATORES.forEach(function (f) {
    pontos[f] = mais[f] - menos[f];
    percentual[f] = Math.round(((pontos[f] + GRUPOS.length) / (2 * GRUPOS.length)) * 100);
  });

  const ordem = FATORES.slice().sort(function (x, y) { return pontos[y] - pontos[x]; });
  return {
    pontos: pontos,
    percentual: percentual,
    mais: mais,
    menos: menos,
    predominante: ordem[0],
    secundario: ordem[1],
    perfil: PERFIS[ordem[0]].nome + (pontos[ordem[1]] > 0 ? " com " + PERFIS[ordem[1]].nome : ""),
  };
}

module.exports = { GRUPOS, FATORES, PERFIS, perguntasPublicas, calcular };
