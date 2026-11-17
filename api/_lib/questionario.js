// Perguntas da ficha de entrevista que a própria candidata responde pelo link
// do DISC (/vagas/disc/?t=), antes do questionário de perfil.
//
// As chaves e os textos são os mesmos do ROTEIRO do painel
// (breathiva.webflow.io/vagas/admin/index.html): cada resposta cai no campo
// certo da ficha. Mudou uma dessas perguntas lá? Mude aqui também.
//
// Formato gravado, igual ao da ficha: "sim"/"nao", nota "0" a "10" (texto),
// texto da opção escolhida, ou texto livre.

const TEMPO_EXP = ["Sem experiência", "Menos de 1 ano", "De 1 a 2 anos", "De 3 a 5 anos", "Mais de 5 anos"];

const SECOES = [
  { titulo: "Experiência profissional", campos: [
    { k: "exp_recepcao", t: "sn", p: "Você já trabalhou com recepção?" },
    { k: "exp_administrativo", t: "sn", p: "Você já trabalhou na área administrativa?" },
    { k: "exp_atendimento", t: "sn", p: "Você já trabalhou com atendimento ao público?" },
    { k: "exp_whatsapp", t: "sn", p: "Você já trabalhou com atendimento pelo WhatsApp?" },
    { k: "exp_vendas", t: "sn", p: "Você já trabalhou com vendas?" },
    { k: "exp_metas", t: "sn", p: "Você já trabalhou com metas?" },
    { k: "exp_clinica", t: "sn", p: "Você já trabalhou em clínica, consultório, estética ou negócios relacionados?" },
    { k: "exp_sistema", t: "sn", p: "Você já utilizou algum sistema de agenda ou CRM?" },
    { k: "exp_sistema_qual", t: "text", p: "Qual sistema?", se: ["exp_sistema", "sim"] },
    { k: "exp_tempo", t: "select", p: "Quanto tempo de experiência profissional você possui?", op: TEMPO_EXP },
  ]},
  { titulo: "Perfil profissional", desc: "Responda com uma nota de 0 a 10. Não existe resposta certa ou errada.", campos: [
    { k: "perfil_conexao", t: "escala", p: "De 0 a 10, quanto você considera que tem facilidade para conversar e criar conexão com pessoas?" },
    { k: "perfil_comercial", t: "escala", p: "De 0 a 10, quanto você considera que possui perfil comercial?" },
    { k: "perfil_organizacao", t: "escala", p: "De 0 a 10, quanto você se considera uma pessoa organizada?" },
    { k: "perfil_sistemas", t: "escala", p: "De 0 a 10, quanto você considera que tem facilidade com computador e sistemas?" },
    { k: "perfil_aprendizado", t: "escala", p: "De 0 a 10, quanto você considera que aprende novas ferramentas com facilidade?" },
  ]},
  { titulo: "Situações práticas", desc: "Escreva como você faria, do seu jeito.", campos: [
    { k: "sit_quanto_custa", t: "area", p: "Uma cliente entra em contato pelo WhatsApp e pergunta apenas: “Quanto custa?”. Como você responderia?" },
    { k: "sit_parou_responder", t: "area", p: "Uma cliente pediu informações, demonstrou interesse e depois parou de responder. O que você faria?" },
  ]},
  { titulo: "Disponibilidade", campos: [
    { k: "disp_presencial", t: "sn", p: "Você possui disponibilidade para trabalhar presencialmente?" },
    { k: "disp_sabados", t: "sn", p: "Você possui disponibilidade para trabalhar aos sábados?" },
    { k: "trabalhando", t: "sn", p: "Atualmente você está trabalhando?" },
    { k: "inicio", t: "text", p: "Quando você poderia começar?" },
  ]},
  { titulo: "Sobre você", campos: [
    { k: "por_que_voce", t: "area", p: "Por que você acredita que seria uma boa pessoa para fazer parte do nosso time?" },
  ]},
];

const CAMPOS = [].concat.apply([], SECOES.map(function (s) { return s.campos; }));

// Marca, dentro das respostas da ficha, quando a candidata enviou o questionário.
const MARCA = "questionario_em";

// Chaves que a candidata preenche. O painel não pode apagá-las sem querer.
const CHAVES = CAMPOS.map(function (f) { return f.k; }).concat([MARCA]);

const LIMITE = { text: 200, area: 2000 };

function texto(v, max) {
  return String(v == null ? "" : v).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim().slice(0, max);
}

// Confere e normaliza o que a página mandou. Toda pergunta visível é
// obrigatória ("Qual sistema?" só vale quando a resposta anterior é sim).
// Devolve { respostas } ou { faltando: [chaves] }.
function validar(entrada) {
  const e = entrada && typeof entrada === "object" && !Array.isArray(entrada) ? entrada : {};
  const respostas = {};
  const faltando = [];

  CAMPOS.forEach(function (f) {
    if (f.se && respostas[f.se[0]] !== f.se[1]) return;
    let v = null;
    if (f.t === "sn") {
      v = e[f.k] === "sim" || e[f.k] === "nao" ? e[f.k] : null;
    } else if (f.t === "escala") {
      const n = Number(e[f.k]);
      v = e[f.k] !== "" && e[f.k] != null && Number.isInteger(n) && n >= 0 && n <= 10 ? String(n) : null;
    } else if (f.t === "select") {
      v = f.op.indexOf(e[f.k]) >= 0 ? e[f.k] : null;
    } else {
      v = texto(e[f.k], LIMITE[f.t]) || null;
    }
    if (v === null) faltando.push(f.k);
    else respostas[f.k] = v;
  });

  return faltando.length ? { faltando: faltando } : { respostas: respostas };
}

// Junta as respostas da candidata com a ficha que já existe. O que o RH já
// preencheu vale mais: a candidata só completa campos vazios.
function mesclar(existente, daCandidata) {
  const saida = Object.assign({}, existente || {});
  Object.keys(daCandidata).forEach(function (k) {
    const atual = saida[k];
    if (atual === undefined || atual === null || atual === "") saida[k] = daCandidata[k];
  });
  saida[MARCA] = new Date().toISOString();
  return saida;
}

module.exports = { SECOES, CHAVES, MARCA, validar, mesclar };
