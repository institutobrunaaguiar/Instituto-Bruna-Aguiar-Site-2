// Painel de recrutamento (/vagas/admin): lista as candidaturas, abre currículo
// e foto por link temporário, move o status e administra os códigos de acesso.
//
// Tudo passa por aqui porque a página é estática: o navegador nunca fala com o
// Supabase direto, nunca vê a service role key e nunca recebe o path de um
// arquivo sem que o servidor tenha conferido a sessão antes.
//
// Env vars: SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
// RECRUITMENT_SECRET — ver docs/vagas-recrutamento.md.

const crypto = require("crypto");
const {
  KINDS,
  supabaseConfig,
  supabaseHeaders,
  resolveType,
  matchesSignature,
  extensionOf,
  cleanText,
  safeFileName,
  parseBody,
  clientIpHash,
  methodGuard,
} = require("../_lib/recrutamento");
const { PERFIS, interpretar } = require("../_lib/disc");

const {
  COOKIE,
  SESSAO_HORAS,
  LOGIN_MAX_ERROS,
  LOGIN_JANELA_MS,
  hashCodigo,
  confereCodigo,
  criarSessao,
  lerSessao,
  lerCookie,
  setCookieSessao,
  gerarCodigo,
} = require("../_lib/admin");

const STATUS_VALIDOS = ["nova", "em_analise", "entrevista", "aprovada", "reprovada", "arquivada"];
const ARQUIVO_TTL = 300; // 5 min — tempo de abrir, não de compartilhar
const FOTO_TTL = 900;    // 15 min: a miniatura fica na tela enquanto o RH navega
const POR_PAGINA = 25;
// Base dos links enviados aos candidatos: sempre o site público, mesmo quando o
// painel é aberto localmente.
const SITE_PUBLICO = (process.env.PUBLIC_SITE_URL || "https://www.institutobrunaaguiar.com.br").replace(/\/$/, "");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async (req, res) => {
  if (methodGuard(req, res, "POST")) return;

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  const cfg = supabaseConfig();
  if (!cfg.ok) {
    console.error("[vagas/admin] Supabase não configurado");
    return res.status(503).json({ ok: false, error: "servico_indisponivel" });
  }

  const body = parseBody(req);
  const acao = cleanText(body.action, 30);

  try {
    if (acao === "login") return await login(req, res, cfg, body);
    if (acao === "sair") {
      setCookieSessao(res, "", 0, req);
      return res.status(200).json({ ok: true });
    }

    // Daqui para baixo, só com sessão válida.
    const sessao = await exigirSessao(req, cfg);
    if (!sessao) {
      setCookieSessao(res, "", 0, req);
      return res.status(401).json({ ok: false, error: "sessao_expirada" });
    }

    // Usou o painel, ganha mais SESSAO_HORAS: quem está trabalhando não é
    // derrubado no meio do dia. Revogar o código continua derrubando na hora.
    setCookieSessao(res, criarSessao(sessao.id, sessao.inicio), SESSAO_HORAS * 3600, req);

    if (acao === "sessao") return res.status(200).json({ ok: true, usuario: sessao.label });
    if (acao === "candidaturas") return await listar(res, cfg, body);
    if (acao === "arquivo") return await arquivo(res, cfg, body);
    if (acao === "status") return await mudarStatus(res, cfg, body);
    if (acao === "codigos") return await listarCodigos(res, cfg);
    if (acao === "codigo_novo") return await criarCodigo(res, cfg, body, sessao);
    if (acao === "codigo_revogar") return await revogarCodigo(res, cfg, body, sessao);
    if (acao === "ficha") return await ficha(res, cfg, body);
    if (acao === "salvar_entrevista") return await salvarEntrevista(res, cfg, body, sessao);
    if (acao === "disc_gerar") return await gerarDisc(res, cfg, body, sessao);
    if (acao === "anexo_url") return await anexoUrl(res, cfg, body);
    if (acao === "anexo_confirmar") return await anexoConfirmar(res, cfg, body);

    return res.status(400).json({ ok: false, error: "acao_desconhecida" });
  } catch (e) {
    console.error("[vagas/admin] erro", String(e).slice(0, 300));
    return res.status(500).json({ ok: false, error: "erro_interno" });
  }
};

// ------------------------------------------------------------------ login --
async function login(req, res, cfg, body) {
  const ipHash = clientIpHash(req);
  const codigo = String(body.codigo == null ? "" : body.codigo).trim();

  if (await loginTravado(cfg, ipHash)) {
    return res.status(429).json({
      ok: false,
      error: "muitas_tentativas",
      message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    });
  }

  if (codigo.length < 4 || codigo.length > 100) {
    await registrarTentativa(cfg, ipHash, false);
    return res.status(401).json({ ok: false, error: "codigo_invalido", message: "Código não confere." });
  }

  const r = await api(cfg, "/rest/v1/job_admin_codes?select=id,code_hash,label&ativo=is.true");
  const codigos = r.ok ? await r.json() : [];

  // Percorre todos, sem interromper no primeiro acerto: o tempo de resposta
  // não deixa escapar quantos códigos existem nem qual bateu.
  let encontrado = null;
  for (const c of codigos) {
    if (confereCodigo(codigo, c.code_hash)) encontrado = c;
  }

  if (!encontrado) {
    await registrarTentativa(cfg, ipHash, false);
    return res.status(401).json({ ok: false, error: "codigo_invalido", message: "Código não confere." });
  }

  await registrarTentativa(cfg, ipHash, true);
  await api(cfg, `/rest/v1/job_admin_codes?id=eq.${encontrado.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ last_used_at: new Date().toISOString(), usos: (encontrado.usos || 0) + 1 }),
  });

  setCookieSessao(res, criarSessao(encontrado.id), SESSAO_HORAS * 3600, req);
  return res.status(200).json({ ok: true, usuario: encontrado.label });
}

async function exigirSessao(req, cfg) {
  const dados = lerSessao(lerCookie(req, COOKIE));
  if (!dados) return null;
  // Código revogado derruba a sessão na hora.
  const r = await api(cfg, `/rest/v1/job_admin_codes?select=id,label,ativo&id=eq.${encodeURIComponent(dados.cid)}`);
  if (!r.ok) return null;
  const linhas = await r.json();
  const c = linhas && linhas[0];
  return c && c.ativo ? { id: c.id, label: c.label, inicio: dados.ini } : null;
}

async function loginTravado(cfg, ipHash) {
  const desde = new Date(Date.now() - LOGIN_JANELA_MS).toISOString();
  const r = await api(cfg, `/rest/v1/job_admin_login_attempts?select=id&ip_hash=eq.${encodeURIComponent(ipHash)}&sucesso=is.false&created_at=gte.${encodeURIComponent(desde)}&limit=${LOGIN_MAX_ERROS}`);
  if (!r.ok) return false;
  const linhas = await r.json();
  return Array.isArray(linhas) && linhas.length >= LOGIN_MAX_ERROS;
}

function registrarTentativa(cfg, ipHash, sucesso) {
  return api(cfg, "/rest/v1/job_admin_login_attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ ip_hash: ipHash, sucesso: sucesso }),
  }).catch(function () { /* registrar tentativa nunca pode derrubar o login */ });
}

// ----------------------------------------------------------- candidaturas --
async function listar(res, cfg, body) {
  const pagina = Math.max(0, Math.min(200, Number(body.pagina) || 0));
  const status = STATUS_VALIDOS.indexOf(cleanText(body.status, 20)) >= 0 ? cleanText(body.status, 20) : "";
  const busca = cleanText(body.busca, 60);

  const campos = "id,nome_completo,email,telefone,idade,data_nascimento,sexo,bairro,cidade,estado," +
    "curriculo_nome,curriculo_tem_foto,foto_perfil_url,status,created_at," +
    "job_interviews(updated_at),job_disc(status,created_at)";
  let url = `/rest/v1/job_applications?select=${campos}&order=created_at.desc` +
    `&limit=${POR_PAGINA}&offset=${pagina * POR_PAGINA}`;
  if (status) url += `&status=eq.${status}`;
  if (busca) {
    // PostgREST: vírgula separa alternativas dentro do or(...)
    const alvo = encodeURIComponent("*" + busca.replace(/[(),*]/g, " ").trim() + "*");
    url += `&or=(nome_completo.ilike.${alvo},email.ilike.${alvo},telefone.ilike.${alvo})`;
  }

  let r = await api(cfg, url, { headers: { Prefer: "count=exact" } });
  let fichaDisponivel = true;
  if (!r.ok && r.status === 400) {
    // Tabelas de entrevista/DISC ainda não existem (migration pendente): lista
    // sem os selos em vez de deixar o painel sem nada.
    const corpo = await r.text();
    if (/PGRST200|job_interviews|job_disc/.test(corpo)) {
      fichaDisponivel = false;
      r = await api(cfg, url.replace(",job_interviews(updated_at),job_disc(status,created_at)", ""), { headers: { Prefer: "count=exact" } });
    }
  }
  if (!r.ok) {
    console.error("[vagas/admin] falha ao listar", r.status, (await r.text()).slice(0, 200));
    return res.status(502).json({ ok: false, error: "falha_ao_listar" });
  }

  const linhas = await r.json();
  await anexarFotos(cfg, linhas);
  const total = totalDoContentRange(r.headers.get("content-range"));
  const novidades = await contarNovidades(cfg, body.desde);

  return res.status(200).json({
    ok: true,
    candidaturas: linhas,
    total: total,
    pagina: pagina,
    porPagina: POR_PAGINA,
    // data da candidatura mais recente de todas (sem filtro): é a referência
    // que o painel guarda para perguntar "chegou alguma depois desta?"
    ultimaCriacao: novidades.ultimaCriacao,
    novas: novidades.novas,
    // false até a migration da ficha/DISC entrar: o painel esconde o botão
    fichaDisponivel: fichaDisponivel,
  });
}

// Quantas candidaturas chegaram depois de `desde`, ignorando busca e filtro:
// a pergunta do RH é "chegou currículo novo?", não "chegou nesta busca?".
async function contarNovidades(cfg, desde) {
  const saida = { ultimaCriacao: null, novas: null };

  const ult = await api(cfg, "/rest/v1/job_applications?select=created_at&order=created_at.desc&limit=1");
  if (ult.ok) {
    const l = await ult.json();
    saida.ultimaCriacao = l[0] ? l[0].created_at : null;
  }

  const marco = cleanText(desde, 40);
  if (marco && !Number.isNaN(Date.parse(marco))) {
    const r = await api(cfg,
      `/rest/v1/job_applications?select=id&created_at=gt.${encodeURIComponent(marco)}&limit=1`,
      { headers: { Prefer: "count=exact" } });
    if (r.ok) saida.novas = totalDoContentRange(r.headers.get("content-range"));
  }
  return saida;
}

// Miniatura das fotos para o painel mostrar o rosto no cartão. O bucket é
// privado, então cada foto precisa de link assinado — e o Storage assina a
// página inteira de uma vez, em vez de uma chamada por candidatura.
async function anexarFotos(cfg, linhas) {
  const caminhos = linhas.map(function (l) { return l.foto_perfil_url; }).filter(Boolean);

  let assinadas = {};
  if (caminhos.length) {
    try {
      const r = await fetch(`${cfg.url}/storage/v1/object/sign/recruitment-photos`, {
        method: "POST",
        headers: supabaseHeaders(cfg.key, { "Content-Type": "application/json" }),
        body: JSON.stringify({ expiresIn: FOTO_TTL, paths: caminhos }),
      });
      if (r.ok) {
        (await r.json()).forEach(function (item) {
          const assinada = item.signedURL || item.signedUrl;
          if (item.path && assinada) assinadas[item.path] = `${cfg.url}/storage/v1${assinada}`;
        });
      } else {
        console.error("[vagas/admin] falha ao assinar fotos", r.status);
      }
    } catch (e) {
      console.error("[vagas/admin] erro ao assinar fotos", String(e).slice(0, 200));
    }
  }

  linhas.forEach(function (l) {
    // resumo do andamento para os selos do cartão
    const ent = Array.isArray(l.job_interviews) ? l.job_interviews[0] : l.job_interviews;
    l.entrevista_em = ent ? ent.updated_at : null;
    const discs = (l.job_disc || []).filter(function (d) { return d.status !== "cancelado"; });
    l.disc_status = discs.some(function (d) { return d.status === "concluido"; }) ? "concluido"
      : (discs.length ? "pendente" : null);
    delete l.job_interviews;
    delete l.job_disc;
    l.tem_foto_separada = Boolean(l.foto_perfil_url);
    l.foto_url = l.foto_perfil_url ? (assinadas[l.foto_perfil_url] || null) : null;
    // o path do arquivo não precisa chegar ao navegador
    delete l.foto_perfil_url;
  });
}

function totalDoContentRange(cabecalho) {
  const m = String(cabecalho || "").match(/\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------- arquivo --
async function arquivo(res, cfg, body) {
  const id = cleanText(body.id, 40);
  const tipo = cleanText(body.tipo, 20);
  if (!/^[0-9a-f-]{36}$/i.test(id) || (tipo !== "curriculo" && tipo !== "foto")) {
    return res.status(400).json({ ok: false, error: "pedido_invalido" });
  }

  const r = await api(cfg, `/rest/v1/job_applications?select=curriculo_url,foto_perfil_url,curriculo_nome&id=eq.${id}`);
  if (!r.ok) return res.status(502).json({ ok: false, error: "falha_ao_buscar" });
  const linha = (await r.json())[0];
  if (!linha) return res.status(404).json({ ok: false, error: "nao_encontrada" });

  const bucket = tipo === "curriculo" ? "recruitment-resumes" : "recruitment-photos";
  const caminho = tipo === "curriculo" ? linha.curriculo_url : linha.foto_perfil_url;
  if (!caminho) return res.status(404).json({ ok: false, error: "sem_arquivo" });

  const assinado = await fetch(`${cfg.url}/storage/v1/object/sign/${bucket}/${caminho}`, {
    method: "POST",
    headers: supabaseHeaders(cfg.key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresIn: ARQUIVO_TTL }),
  });

  if (!assinado.ok) {
    console.error("[vagas/admin] falha ao assinar arquivo", assinado.status);
    return res.status(502).json({ ok: false, error: "falha_ao_abrir" });
  }

  const dados = await assinado.json();
  return res.status(200).json({
    ok: true,
    url: `${cfg.url}/storage/v1${dados.signedURL || dados.signedUrl}`,
    expiraEm: ARQUIVO_TTL,
    nome: tipo === "curriculo" ? (linha.curriculo_nome || "curriculo") : "foto",
  });
}

// ----------------------------------------------------------------- status --
async function mudarStatus(res, cfg, body) {
  const id = cleanText(body.id, 40);
  const status = cleanText(body.status, 20);
  if (!/^[0-9a-f-]{36}$/i.test(id) || STATUS_VALIDOS.indexOf(status) === -1) {
    return res.status(400).json({ ok: false, error: "pedido_invalido" });
  }
  const r = await api(cfg, `/rest/v1/job_applications?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status: status }),
  });
  if (!r.ok) return res.status(502).json({ ok: false, error: "falha_ao_salvar" });
  return res.status(200).json({ ok: true });
}

// ---------------------------------------------------------------- códigos --
async function listarCodigos(res, cfg) {
  const r = await api(cfg, "/rest/v1/job_admin_codes?select=id,label,ativo,created_at,last_used_at,usos&order=created_at.desc");
  if (!r.ok) return res.status(502).json({ ok: false, error: "falha_ao_listar" });
  return res.status(200).json({ ok: true, codigos: await r.json() });
}

async function criarCodigo(res, cfg, body, sessao) {
  const label = cleanText(body.label, 60);
  if (label.length < 2) {
    return res.status(422).json({ ok: false, error: "label_invalido", message: "Dê um nome para identificar quem vai usar o código." });
  }

  const codigo = gerarCodigo();
  const { hash } = hashCodigo(codigo);

  const r = await api(cfg, "/rest/v1/job_admin_codes", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ code_hash: hash, label: label, criado_por: sessao.id }),
  });

  if (!r.ok) {
    console.error("[vagas/admin] falha ao criar código", r.status, (await r.text()).slice(0, 200));
    return res.status(502).json({ ok: false, error: "falha_ao_criar" });
  }

  // Única vez que o código aparece: só o hash fica guardado.
  return res.status(200).json({ ok: true, codigo: codigo, label: label });
}

async function revogarCodigo(res, cfg, body, sessao) {
  const id = cleanText(body.id, 40);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ ok: false, error: "pedido_invalido" });
  if (id === sessao.id) {
    return res.status(422).json({ ok: false, error: "nao_pode_revogar_o_proprio", message: "Você não pode revogar o código que está usando agora." });
  }

  const r = await api(cfg, `/rest/v1/job_admin_codes?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ ativo: false }),
  });
  if (!r.ok) return res.status(502).json({ ok: false, error: "falha_ao_salvar" });
  return res.status(200).json({ ok: true });
}

// ----------------------------------------------------------------- ficha ---
// Tudo de uma candidatura: dados enviados por ela, arquivos, entrevista e DISC.
async function ficha(res, cfg, body) {
  const id = cleanText(body.id, 40);
  if (!UUID_RE.test(id)) return res.status(400).json({ ok: false, error: "pedido_invalido" });

  const campos = "id,nome_completo,email,telefone,data_nascimento,idade,sexo,cep,bairro,cidade,estado," +
    "curriculo_url,curriculo_nome,curriculo_tem_foto,foto_perfil_url,status,created_at";
  const [rCand, rEnt, rDisc] = await Promise.all([
    api(cfg, `/rest/v1/job_applications?select=${campos}&id=eq.${id}`),
    api(cfg, `/rest/v1/job_interviews?select=respostas,updated_at&application_id=eq.${id}`),
    api(cfg, `/rest/v1/job_disc?select=id,token,status,resultado,created_at,aberto_em,concluido_em,expires_at` +
      `&application_id=eq.${id}&status=neq.cancelado&order=created_at.desc`),
  ]);
  if (!rCand.ok || !rEnt.ok || !rDisc.ok) return res.status(502).json({ ok: false, error: "falha_ao_buscar" });

  const c = (await rCand.json())[0];
  if (!c) return res.status(404).json({ ok: false, error: "nao_encontrada" });
  const ent = (await rEnt.json())[0] || null;
  const discs = await rDisc.json();

  // foto em miniatura (link assinado); o path não sai do servidor
  const lista = [c];
  await anexarFotos(cfg, lista);
  const candidato = lista[0];
  candidato.tem_curriculo = Boolean(candidato.curriculo_url);
  delete candidato.curriculo_url;

  return res.status(200).json({
    ok: true,
    candidato: candidato,
    entrevista: ent,
    disc: resumoDisc(discs, candidato),
  });
}

function resumoDisc(discs, candidato) {
  const concluido = discs.find(function (d) { return d.status === "concluido"; }) || null;
  const pendente = discs.find(function (d) { return d.status === "pendente" && Date.parse(d.expires_at) > Date.now(); }) || null;
  const saida = { concluido: null, pendente: null, perfis: PERFIS };
  if (concluido) {
    saida.concluido = {
      resultado: concluido.resultado,
      concluido_em: concluido.concluido_em,
      // leitura calculada na hora: vale também para testes respondidos antes
      leitura: interpretar(concluido.resultado),
    };
  }
  if (pendente) {
    const link = `${SITE_PUBLICO}/vagas/disc/?t=${pendente.token}`;
    saida.pendente = {
      link: link,
      criado_em: pendente.created_at,
      aberto_em: pendente.aberto_em,
      expira_em: pendente.expires_at,
      whatsapp: linkWhatsapp(candidato, link),
    };
  }
  return saida;
}

function linkWhatsapp(candidato, link) {
  const tel = String(candidato.telefone || "").replace(/\D/g, "");
  if (tel.length < 10) return null;
  const nome = String(candidato.nome_completo || "").split(" ")[0];
  const texto = `Olá, ${nome}! Aqui é do Instituto Bruna Aguiar. Como próxima etapa do processo seletivo ` +
    `para Recepção, pedimos que você responda a este questionário rápido de perfil. Leva cerca de 5 minutos: ${link}`;
  return `https://wa.me/55${tel}?text=${encodeURIComponent(texto)}`;
}

// ------------------------------------------------------------ entrevista ---
// Chave: letras minúsculas, números e _. Valor: texto (quebras de linha
// preservadas), número ou booleano. Nada de objeto aninhado nem HTML.
const CHAVE_RE = /^[a-z0-9_]{1,40}$/;
const CONTROLE_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

function limparRespostas(entrada) {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return null;
  const saida = {};
  let n = 0;
  for (const chave of Object.keys(entrada)) {
    if (!CHAVE_RE.test(chave) || ++n > 120) continue;
    const v = entrada[chave];
    if (typeof v === "string") saida[chave] = v.replace(CONTROLE_RE, "").slice(0, 4000);
    else if (typeof v === "number" && Number.isFinite(v)) saida[chave] = v;
    else if (typeof v === "boolean" || v === null) saida[chave] = v;
  }
  return saida;
}

async function salvarEntrevista(res, cfg, body, sessao) {
  const id = cleanText(body.id, 40);
  const respostas = limparRespostas(body.respostas);
  if (!UUID_RE.test(id) || !respostas) return res.status(400).json({ ok: false, error: "pedido_invalido" });

  const r = await api(cfg, "/rest/v1/job_interviews?on_conflict=application_id", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ application_id: id, respostas: respostas, updated_by: sessao.id }),
  });
  if (!r.ok) {
    console.error("[vagas/admin] falha ao salvar entrevista", r.status, (await r.text()).slice(0, 200));
    return res.status(502).json({ ok: false, error: "falha_ao_salvar" });
  }
  const linha = (await r.json())[0] || {};
  return res.status(200).json({ ok: true, updated_at: linha.updated_at || new Date().toISOString() });
}

// ------------------------------------------------------------------ DISC ---
async function gerarDisc(res, cfg, body, sessao) {
  const id = cleanText(body.id, 40);
  if (!UUID_RE.test(id)) return res.status(400).json({ ok: false, error: "pedido_invalido" });

  const rc = await api(cfg, `/rest/v1/job_applications?select=id,nome_completo,telefone&id=eq.${id}`);
  const candidato = rc.ok ? (await rc.json())[0] : null;
  if (!candidato) return res.status(404).json({ ok: false, error: "nao_encontrada" });

  // "Gerar novo link" cancela o anterior, que para de funcionar na hora
  if (body.novo === true) {
    await api(cfg, `/rest/v1/job_disc?application_id=eq.${id}&status=eq.pendente`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "cancelado" }),
    });
  } else {
    // já existe um válido? devolve o mesmo, sem gerar outro
    const rp = await api(cfg, `/rest/v1/job_disc?select=token,status,expires_at&application_id=eq.${id}&status=eq.pendente`);
    const pend = rp.ok ? (await rp.json())[0] : null;
    if (pend && Date.parse(pend.expires_at) > Date.now()) {
      const link = `${SITE_PUBLICO}/vagas/disc/?t=${pend.token}`;
      return res.status(200).json({ ok: true, link: link, whatsapp: linkWhatsapp(candidato, link), reaproveitado: true });
    }
    if (pend) {
      await api(cfg, `/rest/v1/job_disc?application_id=eq.${id}&status=eq.pendente`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "cancelado" }),
      });
    }
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const r = await api(cfg, "/rest/v1/job_disc", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ application_id: id, token: token, created_by: sessao.id }),
  });
  if (!r.ok) {
    console.error("[vagas/admin] falha ao gerar DISC", r.status, (await r.text()).slice(0, 200));
    return res.status(502).json({ ok: false, error: "falha_ao_gerar" });
  }
  const link = `${SITE_PUBLICO}/vagas/disc/?t=${token}`;
  return res.status(200).json({ ok: true, link: link, whatsapp: linkWhatsapp(candidato, link) });
}

// ------------------------------------------------------ foto e currículo ---
// O RH pode trocar a foto ou o currículo pela ficha (seção 8 da entrevista).
// Mesmo cuidado do formulário público: tipo e tamanho conferidos antes, e a
// assinatura real do arquivo conferida depois do upload.
async function anexoUrl(res, cfg, body) {
  const id = cleanText(body.id, 40);
  const kind = cleanText(body.kind, 20);
  const spec = KINDS[kind];
  if (!UUID_RE.test(id) || !spec) return res.status(400).json({ ok: false, error: "pedido_invalido" });

  const tipo = resolveType(kind, body.filename, body.contentType);
  if (!tipo) {
    return res.status(415).json({ ok: false, error: "formato_nao_aceito",
      message: kind === "curriculo" ? "Aceitamos currículo em PDF, DOC ou DOCX." : "Aceitamos foto em JPG, PNG ou WEBP." });
  }
  const tamanho = Number(body.size);
  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > spec.maxBytes) {
    return res.status(413).json({ ok: false, error: "arquivo_muito_grande",
      message: `O arquivo precisa ter até ${Math.round(spec.maxBytes / 1024 / 1024)} MB.` });
  }

  const caminho = `${id}/${crypto.randomUUID()}.${tipo.ext}`;
  const r = await fetch(`${cfg.url}/storage/v1/object/upload/sign/${spec.bucket}/${caminho}`, {
    method: "POST",
    headers: supabaseHeaders(cfg.key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresIn: 600 }),
  });
  if (!r.ok) return res.status(502).json({ ok: false, error: "falha_ao_preparar_upload" });
  const dados = await r.json();
  return res.status(200).json({ ok: true, path: caminho, contentType: tipo.mime, uploadUrl: `${cfg.url}/storage/v1${dados.url}` });
}

async function anexoConfirmar(res, cfg, body) {
  const id = cleanText(body.id, 40);
  const kind = cleanText(body.kind, 20);
  const caminho = cleanText(body.path, 200);
  const spec = KINDS[kind];
  if (!UUID_RE.test(id) || !spec || caminho.indexOf(id + "/") !== 0 || caminho.indexOf("..") >= 0) {
    return res.status(400).json({ ok: false, error: "pedido_invalido" });
  }

  const info = await fetch(`${cfg.url}/storage/v1/object/info/${spec.bucket}/${caminho}`, { headers: supabaseHeaders(cfg.key) });
  const meta = info.ok ? await info.json() : null;
  const inicio = meta ? await fetch(`${cfg.url}/storage/v1/object/${spec.bucket}/${caminho}`,
    { headers: supabaseHeaders(cfg.key, { Range: "bytes=0-31" }) }) : null;
  const bytes = inicio && inicio.ok ? Buffer.from(await inicio.arrayBuffer()) : null;

  if (!meta || !(meta.size > 0 && meta.size <= spec.maxBytes) || !bytes || !matchesSignature(kind, extensionOf(caminho), bytes)) {
    await fetch(`${cfg.url}/storage/v1/object/${spec.bucket}/${caminho}`, { method: "DELETE", headers: supabaseHeaders(cfg.key) }).catch(function () {});
    return res.status(422).json({ ok: false, error: "arquivo_invalido",
      message: kind === "curriculo" ? "Esse arquivo não parece um PDF, DOC ou DOCX válido." : "Esse arquivo não parece uma imagem JPG, PNG ou WEBP válida." });
  }

  const mudanca = kind === "curriculo"
    ? { curriculo_url: caminho, curriculo_nome: safeFileName(body.nome) || null }
    : { foto_perfil_url: caminho };
  const r = await api(cfg, `/rest/v1/job_applications?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(mudanca),
  });
  if (!r.ok) return res.status(502).json({ ok: false, error: "falha_ao_salvar" });
  return res.status(200).json({ ok: true });
}

// ------------------------------------------------------------------ util ---
function api(cfg, caminho, opcoes) {
  const o = opcoes || {};
  return fetch(cfg.url + caminho, {
    method: o.method || "GET",
    headers: supabaseHeaders(cfg.key, o.headers || {}),
    body: o.body,
  });
}
