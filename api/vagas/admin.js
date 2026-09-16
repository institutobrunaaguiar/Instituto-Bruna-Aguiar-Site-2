// Painel de recrutamento (/vagas/admin): lista as candidaturas, abre currículo
// e foto por link temporário, move o status e administra os códigos de acesso.
//
// Tudo passa por aqui porque a página é estática: o navegador nunca fala com o
// Supabase direto, nunca vê a service role key e nunca recebe o path de um
// arquivo sem que o servidor tenha conferido a sessão antes.
//
// Env vars: SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
// RECRUITMENT_SECRET — ver docs/vagas-recrutamento.md.

const {
  supabaseConfig,
  supabaseHeaders,
  cleanText,
  parseBody,
  clientIpHash,
  methodGuard,
} = require("../_lib/recrutamento");

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

    if (acao === "sessao") return res.status(200).json({ ok: true, usuario: sessao.label });
    if (acao === "candidaturas") return await listar(res, cfg, body);
    if (acao === "arquivo") return await arquivo(res, cfg, body);
    if (acao === "status") return await mudarStatus(res, cfg, body);
    if (acao === "codigos") return await listarCodigos(res, cfg);
    if (acao === "codigo_novo") return await criarCodigo(res, cfg, body, sessao);
    if (acao === "codigo_revogar") return await revogarCodigo(res, cfg, body, sessao);

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
  return c && c.ativo ? { id: c.id, label: c.label } : null;
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
    "curriculo_nome,curriculo_tem_foto,foto_perfil_url,status,created_at";
  let url = `/rest/v1/job_applications?select=${campos}&order=created_at.desc` +
    `&limit=${POR_PAGINA}&offset=${pagina * POR_PAGINA}`;
  if (status) url += `&status=eq.${status}`;
  if (busca) {
    // PostgREST: vírgula separa alternativas dentro do or(...)
    const alvo = encodeURIComponent("*" + busca.replace(/[(),*]/g, " ").trim() + "*");
    url += `&or=(nome_completo.ilike.${alvo},email.ilike.${alvo},telefone.ilike.${alvo})`;
  }

  const r = await api(cfg, url, { headers: { Prefer: "count=exact" } });
  if (!r.ok) {
    console.error("[vagas/admin] falha ao listar", r.status, (await r.text()).slice(0, 200));
    return res.status(502).json({ ok: false, error: "falha_ao_listar" });
  }

  const linhas = await r.json();
  await anexarFotos(cfg, linhas);
  const total = totalDoContentRange(r.headers.get("content-range"));
  return res.status(200).json({ ok: true, candidaturas: linhas, total: total, pagina: pagina, porPagina: POR_PAGINA });
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

// ------------------------------------------------------------------ util ---
function api(cfg, caminho, opcoes) {
  const o = opcoes || {};
  return fetch(cfg.url + caminho, {
    method: o.method || "GET",
    headers: supabaseHeaders(cfg.key, o.headers || {}),
    body: o.body,
  });
}
