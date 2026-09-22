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

// ------------------------------------------------------------- leitura ----
// O DISC não se lê pelo maior número. O que descreve o comportamento é a
// relação entre os quatro fatores: quem é o dominante, quem é o segundo (que
// muda bastante o primeiro), quais estão baixos e o quanto eles estão
// distantes entre si. Tudo abaixo é calculado a partir do resultado guardado,
// então vale também para testes respondidos antes desta leitura existir.

// Combinação dos dois fatores predominantes.
const COMBINACOES = {
  DI: "Executor persuasivo", DC: "Executor analítico", DS: "Executor constante",
  ID: "Comunicador orientado a resultado", IS: "Comunicador relacional", IC: "Comunicador criterioso",
  SI: "Relacional e colaborativo", SC: "Estável e organizado", SD: "Estável com iniciativa",
  CD: "Analítico e exigente", CS: "Analítico e consistente", CI: "Analítico comunicativo",
};

// Comportamentos que a vaga de recepção pede, e não "a vaga precisa de um D".
// Recepção de clínica de alto padrão que também converte pelo WhatsApp:
// conversa o tempo todo (I), rotina e paciência (S), agenda e cadastro sem
// falha (C) e iniciativa comercial sem precisar de perfil agressivo (D).
//
// As faixas respeitam uma característica do formato de escolha forçada: como a
// pessoa sempre escolhe uma frase e descarta outra, os quatro fatores são
// relativos entre si e a média das quatro medidas é sempre 50. Pedir "alto" em
// três fatores ao mesmo tempo seria impossível de atingir. Por isso a faixa de
// I é a mais exigente, S e C ficam em nível médio-alto e D em nível médio.
// Para outra vaga, mude só esta tabela.
const ALVO = {
  I: { min: 62, max: 82, peso: 0.35, porque: "a recepção conversa o tempo todo e precisa criar conexão rápido" },
  S: { min: 52, max: 72, peso: 0.25, porque: "o dia a dia é de rotina, atendimento e paciência" },
  C: { min: 45, max: 65, peso: 0.25, porque: "agenda, cadastro e procedimentos não podem falhar" },
  D: { min: 30, max: 52, peso: 0.15, porque: "existe iniciativa e conversão, sem precisar de perfil agressivo" },
};

const TENDENCIAS = {
  alto: {
    D: "decidir rápido, assumir a frente e buscar resultado",
    I: "criar relacionamento com facilidade, comunicar e persuadir",
    S: "ter paciência, constância e trabalhar bem em equipe",
    C: "cuidar de detalhes, seguir processos e conferir antes de agir",
  },
  baixo: {
    D: "evitar confronto e buscar consenso antes de decidir",
    I: "ser mais reservada na comunicação e preferir falar por fatos",
    S: "preferir variedade e ritmo mais dinâmico do que rotina",
    C: "ser mais flexível e prática do que apegada a procedimentos",
  },
};

// DISC deveria gerar perguntas, não respostas definitivas.
const PERGUNTAS = {
  D: { alto: "Me conte uma situação em que você precisou tomar uma decisão sem ter todas as informações.",
       baixo: "Como você reage quando tem meta para bater e a cliente está adiando a decisão?" },
  I: { alto: "Como você conduz uma conversa com uma cliente que chega desconfiada e só pergunta o preço?",
       baixo: "Me conte como você faz para criar conexão com uma cliente nova pelo WhatsApp." },
  S: { alto: "Me conte uma situação em que a rotina mudou de repente. Como você lidou?",
       baixo: "Como você lida com as tarefas repetitivas do dia a dia da recepção?" },
  C: { alto: "Me conte uma situação em que você percebeu um erro que outras pessoas não perceberam.",
       baixo: "Como você organiza agenda e cadastros para não deixar nada passar?" },
};

function nivel(p) { return p >= 65 ? "alto" : (p <= 44 ? "baixo" : "medio"); }

function interpretar(resultado) {
  if (!resultado || !resultado.percentual) return null;
  const pct = resultado.percentual;
  const ordem = FATORES.slice().sort(function (a, b) { return pct[b] - pct[a]; });
  const d1 = ordem[0], d2 = ordem[1];

  const fatores = FATORES.map(function (f) {
    const alvo = ALVO[f];
    const situacao = pct[f] < alvo.min ? "abaixo" : (pct[f] > alvo.max ? "acima" : "dentro");
    return { fator: f, nome: PERFIS[f].nome, percentual: pct[f], pontos: resultado.pontos[f],
             nivel: nivel(pct[f]), situacao: situacao, alvo: alvo.min + " a " + alvo.max, porque: alvo.porque };
  });

  // Distância entre o maior e o menor: diz o quanto a preferência é marcada.
  const amplitude = pct[ordem[0]] - pct[ordem[3]];
  const leituraAmplitude = amplitude >= 40
    ? "Diferença grande entre os fatores: a preferência por esses comportamentos é bem marcada."
    : (amplitude >= 20
      ? "Diferença moderada entre os fatores: há preferência, mas ela não é extrema."
      : "Fatores próximos entre si: não há preferência comportamental forte, o que costuma indicar adaptação ao contexto.");

  // Aderência ao desenho da vaga: quanto cada fator se afasta da faixa
  // esperada, com peso diferente por fator.
  let soma = 0;
  fatores.forEach(function (f) {
    const alvo = ALVO[f.fator];
    const fora = f.percentual < alvo.min ? alvo.min - f.percentual : (f.percentual > alvo.max ? f.percentual - alvo.max : 0);
    soma += Math.max(0, 100 - fora * 2.5) * alvo.peso;
  });
  const aderencia = Math.round(soma);

  const altos = fatores.filter(function (f) { return f.nivel === "alto"; }).sort(function (a, b) { return b.percentual - a.percentual; });
  const baixos = fatores.filter(function (f) { return f.nivel === "baixo"; }).sort(function (a, b) { return a.percentual - b.percentual; });
  const medios = fatores.filter(function (f) { return f.nivel === "medio"; });

  // Texto no formato que se usa numa devolutiva: o que tende a aparecer e o
  // que precisa ser validado, em vez de um rótulo.
  const frases = [];
  if (altos.length) {
    frases.push(altos.map(function (f) { return f.fator + " (" + f.nome + ")"; }).join(" e ") +
      (altos.length > 1 ? " elevados." : " elevado.") +
      " Tende a " + altos.map(function (f) { return TENDENCIAS.alto[f.fator]; }).join("; ") + ".");
  } else {
    frases.push("Nenhum fator se destaca com força. Tende a ajustar o comportamento conforme a situação.");
  }
  if (medios.length) {
    frases.push(medios.map(function (f) { return f.fator; }).join(" e ") +
      (medios.length > 1 ? " em nível intermediário, o que deve ser validado" : " em nível intermediário, o que deve ser validado") +
      " com situações práticas na entrevista.");
  }
  if (baixos.length) {
    frases.push(baixos.map(function (f) { return f.fator; }).join(" e ") +
      (baixos.length > 1 ? " mais baixos sugerem investigar a tendência a " : " mais baixo sugere investigar a tendência a ") +
      baixos.map(function (f) { return TENDENCIAS.baixo[f.fator]; }).join("; ") + ".");
  }

  // Perguntas: começa pelo que está fora da faixa da vaga, depois o dominante.
  const perguntas = [];
  function addPergunta(f, comoEsta) {
    const texto = PERGUNTAS[f][comoEsta === "baixo" ? "baixo" : "alto"];
    if (texto && perguntas.indexOf(texto) === -1) perguntas.push(texto);
  }
  fatores.filter(function (f) { return f.situacao !== "dentro"; })
    .sort(function (a, b) { return ALVO[b.fator].peso - ALVO[a.fator].peso; })
    .forEach(function (f) { addPergunta(f.fator, f.situacao === "abaixo" ? "baixo" : "alto"); });
  addPergunta(d1, nivel(pct[d1]) === "baixo" ? "baixo" : "alto");

  return {
    dominante: d1,
    secundario: d2,
    sigla: d1 + d2,
    combinacao: COMBINACOES[d1 + d2] || "",
    ordem: ordem,
    fatores: fatores,
    amplitude: amplitude,
    leituraAmplitude: leituraAmplitude,
    aderencia: aderencia,
    nivelAderencia: aderencia >= 80 ? "alta" : (aderencia >= 65 ? "média" : "baixa"),
    leitura: frases,
    perguntas: perguntas.slice(0, 4),
  };
}

module.exports = { GRUPOS, FATORES, PERFIS, COMBINACOES, ALVO, perguntasPublicas, calcular, interpretar };
