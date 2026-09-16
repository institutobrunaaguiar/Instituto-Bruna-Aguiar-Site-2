// Recebe a candidatura da landing /vagas, revalida tudo e grava no Supabase.
//
// Nada aqui confia no navegador: os campos são validados de novo, a idade é
// recalculada a partir da data de nascimento, a cidade é reconferida na
// BrasilAPI e os arquivos já enviados ao Storage têm tamanho e assinatura
// (magic bytes) verificados antes do insert.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (ver docs/vagas-recrutamento.md).

const {
  KINDS,
  supabaseConfig,
  supabaseHeaders,
  validApplicationToken,
  isUuid,
  matchesSignature,
  extensionOf,
  cleanText,
  digitsOnly,
  safeFileName,
  parseBody,
  clientIpHash,
  isHoneypotFilled,
  methodGuard,
} = require("../_lib/recrutamento");

const SEXOS = ["feminino", "masculino", "outro", "nao_informado"];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const JOB_SLUGS = ["recepcao"];

// Proteção básica contra abuso: no máximo N candidaturas por IP por hora.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

module.exports = async (req, res) => {
  if (methodGuard(req, res, "POST")) return;

  const body = parseBody(req);

  // Bot preencheu o campo escondido: respondemos como sucesso e não gravamos.
  if (isHoneypotFilled(body)) {
    return res.status(200).json({ ok: true, id: null });
  }

  const { url, key, ok } = supabaseConfig();
  if (!ok) {
    console.error("[vagas] Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    return res.status(503).json({
      ok: false,
      error: "servico_indisponivel",
      message: "Não conseguimos registrar sua candidatura agora. Tente novamente em instantes.",
    });
  }

  // ------------------------------------------------------------- identidade --
  const applicationId = String(body.applicationId || "");
  if (!isUuid(applicationId) || !validApplicationToken(applicationId, String(body.applicationToken || ""))) {
    return res.status(400).json({ ok: false, error: "sessao_invalida" });
  }

  // ----------------------------------------------------------------- campos --
  const erros = {};

  const nomeCompleto = cleanText(body.nome_completo, 120);
  const partesNome = nomeCompleto.split(" ").filter(function (p) { return p.length >= 2; });
  if (partesNome.length < 2) erros.nome_completo = "Informe nome e sobrenome.";

  const email = cleanText(body.email, 160).toLowerCase();
  if (!EMAIL_RE.test(email)) erros.email = "Informe um e-mail válido.";

  const telefone = digitsOnly(body.telefone, 11);
  if (telefone.length < 10) erros.telefone = "Informe o telefone com DDD.";

  const dataNascimento = cleanText(body.data_nascimento, 10);
  const idade = idadeCompleta(dataNascimento);
  if (idade === null) erros.data_nascimento = "Informe uma data de nascimento válida.";
  else if (idade < 14 || idade > 100) erros.data_nascimento = "Confira a data de nascimento.";

  let sexo = cleanText(body.sexo, 20).toLowerCase();
  if (sexo && SEXOS.indexOf(sexo) === -1) sexo = null;
  if (!sexo) sexo = null;

  const cep = digitsOnly(body.cep, 8);
  if (cep.length !== 8) erros.cep = "Informe um CEP válido.";

  let bairro = cleanText(body.bairro, 90);
  let cidade = cleanText(body.cidade, 80);
  let estado = cleanText(body.estado, 2).toUpperCase();
  if (!cidade) erros.cidade = "Não conseguimos identificar sua cidade pelo CEP.";

  const curriculoTemFoto = body.curriculo_tem_foto === true;
  const consentimento = body.consentimento === true;
  if (!consentimento) erros.consentimento = "É preciso aceitar a declaração para enviar.";

  const jobSlug = JOB_SLUGS.indexOf(cleanText(body.job_slug, 40)) >= 0 ? cleanText(body.job_slug, 40) : "recepcao";

  if (Object.keys(erros).length) {
    return res.status(422).json({ ok: false, error: "dados_invalidos", campos: erros });
  }

  // ------------------------------------------------------- regra dos arquivos --
  const curriculoPath = cleanText(body.curriculo_path, 200);
  if (!pathPertenceA(curriculoPath, applicationId)) {
    return res.status(422).json({
      ok: false,
      error: "curriculo_obrigatorio",
      message: "Envie seu currículo para concluir a candidatura.",
    });
  }

  const fotoPath = cleanText(body.foto_perfil_path, 200);
  if (!curriculoTemFoto && !pathPertenceA(fotoPath, applicationId)) {
    return res.status(422).json({
      ok: false,
      error: "foto_obrigatoria",
      message: "Como seu currículo não tem foto, envie uma foto de perfil.",
    });
  }

  // ------------------------------------------- conferência real dos arquivos --
  const curriculoCheck = await verificarArquivo(url, key, "curriculo", curriculoPath);
  if (!curriculoCheck.ok) {
    await removerObjeto(url, key, KINDS.curriculo.bucket, curriculoPath, curriculoCheck.motivo);
    return res.status(422).json({ ok: false, error: curriculoCheck.error, message: curriculoCheck.message });
  }

  let fotoValida = null;
  if (!curriculoTemFoto) {
    const fotoCheck = await verificarArquivo(url, key, "foto", fotoPath);
    if (!fotoCheck.ok) {
      await removerObjeto(url, key, KINDS.foto.bucket, fotoPath, fotoCheck.motivo);
      return res.status(422).json({ ok: false, error: fotoCheck.error, message: fotoCheck.message });
    }
    fotoValida = fotoPath;
  }

  // ------------------------------------------------------------ rate limit ---
  const ipHash = clientIpHash(req);
  if (await excedeuLimite(url, key, ipHash)) {
    return res.status(429).json({
      ok: false,
      error: "muitas_tentativas",
      message: "Recebemos várias candidaturas deste acesso. Tente novamente mais tarde.",
    });
  }

  // ----------------------------------- cidade conferida na fonte, não no client
  const local = await consultarCep(cep);
  if (local) {
    bairro = local.bairro;
    cidade = local.cidade;
    estado = local.estado;
  }

  // ---------------------------------------------------------------- insert ---
  const registro = {
    id: applicationId, // duplo envio esbarra na PK em vez de gerar duas linhas
    job_slug: jobSlug,
    nome_completo: nomeCompleto,
    email: email,
    telefone: telefone,
    data_nascimento: dataNascimento,
    idade: idade,
    sexo: sexo,
    cep: cep,
    bairro: bairro || null,
    cidade: cidade,
    estado: /^[A-Z]{2}$/.test(estado) ? estado : null,
    curriculo_url: curriculoPath,
    curriculo_nome: safeFileName(body.curriculo_nome) || null,
    curriculo_tem_foto: curriculoTemFoto,
    foto_perfil_url: fotoValida,
    consentimento: true,
    origem: "site",
    user_agent: cleanText(req.headers["user-agent"], 400) || null,
    ip_hash: ipHash,
  };

  try {
    const r = await fetch(`${url}/rest/v1/job_applications`, {
      method: "POST",
      headers: supabaseHeaders(key, {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      }),
      body: JSON.stringify(registro),
    });

    if (r.status === 409) {
      // Já gravada (duplo clique, retry do navegador): tratamos como sucesso.
      return res.status(200).json({ ok: true, id: applicationId, duplicada: true });
    }

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      console.error("[vagas] insert falhou", r.status, detail);
      return res.status(502).json({
        ok: false,
        error: "falha_ao_salvar",
        message: "Não foi possível concluir sua candidatura. Seus dados continuam aqui — tente novamente.",
      });
    }

    return res.status(200).json({ ok: true, id: applicationId });
  } catch (e) {
    console.error("[vagas] exceção no insert", String(e).slice(0, 200));
    return res.status(502).json({
      ok: false,
      error: "falha_ao_salvar",
      message: "Não foi possível concluir sua candidatura. Seus dados continuam aqui — tente novamente.",
    });
  }
};

// ---------------------------------------------------------------- helpers ----

// Idade completa de verdade: só conta o aniversário que já passou.
function idadeCompleta(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [ano, mes, dia] = iso.split("-").map(Number);
  const nascimento = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    nascimento.getUTCFullYear() !== ano ||
    nascimento.getUTCMonth() !== mes - 1 ||
    nascimento.getUTCDate() !== dia
  ) {
    return null; // data inexistente, ex.: 31/02
  }

  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - ano;
  const mesAtual = hoje.getUTCMonth() + 1;
  const diaAtual = hoje.getUTCDate();
  if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) idade -= 1;

  if (idade < 0 || idade > 120) return null;
  return idade;
}

// O caminho precisa estar na pasta desta candidatura — nada de apontar para
// arquivo de outra pessoa.
function pathPertenceA(objectPath, applicationId) {
  if (!objectPath || objectPath.indexOf("..") >= 0) return false;
  return objectPath.indexOf(applicationId + "/") === 0;
}

// Confere no Storage: o objeto existe, cabe no limite e os primeiros bytes
// batem com o formato que a extensão promete.
async function verificarArquivo(url, key, kind, objectPath) {
  const spec = KINDS[kind];
  const ext = extensionOf(objectPath);
  const rotulo = spec.label;

  try {
    const info = await fetch(`${url}/storage/v1/object/info/${spec.bucket}/${objectPath}`, {
      headers: supabaseHeaders(key),
    });

    if (!info.ok) {
      return {
        ok: false,
        error: "arquivo_nao_encontrado",
        motivo: "info_falhou",
        message: `Não encontramos o ${rotulo} enviado. Selecione o arquivo de novo.`,
      };
    }

    const meta = await info.json();
    if (!Number.isFinite(meta.size) || meta.size <= 0 || meta.size > spec.maxBytes) {
      return {
        ok: false,
        error: "arquivo_muito_grande",
        motivo: "tamanho",
        message: `O ${rotulo} precisa ter até ${Math.round(spec.maxBytes / 1024 / 1024)} MB.`,
      };
    }

    const head = await fetch(`${url}/storage/v1/object/${spec.bucket}/${objectPath}`, {
      headers: supabaseHeaders(key, { Range: "bytes=0-31" }),
    });

    if (!head.ok) {
      return {
        ok: false,
        error: "arquivo_nao_encontrado",
        motivo: "leitura_falhou",
        message: `Não encontramos o ${rotulo} enviado. Selecione o arquivo de novo.`,
      };
    }

    const bytes = Buffer.from(await head.arrayBuffer());
    if (!matchesSignature(kind, ext, bytes)) {
      return {
        ok: false,
        error: "formato_nao_aceito",
        motivo: "assinatura",
        message:
          kind === "curriculo"
            ? "Esse arquivo não parece um PDF, DOC ou DOCX válido."
            : "Esse arquivo não parece uma imagem JPG, PNG ou WEBP válida.",
      };
    }

    return { ok: true };
  } catch (e) {
    console.error("[vagas] erro ao verificar arquivo", String(e).slice(0, 200));
    return {
      ok: false,
      error: "falha_ao_verificar",
      motivo: "excecao",
      message: `Não conseguimos validar o ${rotulo}. Tente enviar novamente.`,
    };
  }
}

// Arquivo reprovado não fica ocupando o bucket.
async function removerObjeto(url, key, bucket, objectPath, motivo) {
  if (!objectPath || motivo === "info_falhou") return;
  try {
    await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "DELETE",
      headers: supabaseHeaders(key),
    });
  } catch (e) {
    /* limpeza é best-effort */
  }
}

async function excedeuLimite(url, key, ipHash) {
  const desde = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  try {
    const r = await fetch(
      `${url}/rest/v1/job_applications?select=id&ip_hash=eq.${encodeURIComponent(ipHash)}&created_at=gte.${encodeURIComponent(desde)}&limit=${RATE_LIMIT_MAX}`,
      { headers: supabaseHeaders(key, { Prefer: "count=exact" }) }
    );
    if (!r.ok) return false; // na dúvida, não bloqueia candidato legítimo
    const linhas = await r.json();
    return Array.isArray(linhas) && linhas.length >= RATE_LIMIT_MAX;
  } catch (e) {
    return false;
  }
}

// Mesma fonte usada no formulário, conferida de novo no servidor.
async function consultarCep(cep) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 3500);
    const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    const data = await r.json();
    const cidade = cleanText(data.city, 80);
    const estado = cleanText(data.state, 2).toUpperCase();
    const bairro = cleanText(data.neighborhood, 90);
    if (!cidade) return null;
    return { bairro: bairro, cidade: cidade, estado: estado };
  } catch (e) {
    return null; // BrasilAPI fora do ar não pode travar a candidatura
  }
}
