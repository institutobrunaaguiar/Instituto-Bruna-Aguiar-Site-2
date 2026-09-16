// Emite uma signed upload URL do Supabase Storage para o currículo ou a foto.
//
// Por que assim: o arquivo vai direto do navegador para o Storage, sem passar
// pela função. Isso contorna o limite de 4,5 MB de body das funções da Vercel
// e mantém a service role key só no servidor — o navegador recebe um token de
// uso único, válido por poucos minutos, para um caminho que o servidor definiu.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (ver docs/vagas-recrutamento.md).

const crypto = require("crypto");
const {
  KINDS,
  supabaseConfig,
  supabaseHeaders,
  signApplicationId,
  validApplicationToken,
  isUuid,
  resolveType,
  parseBody,
  isHoneypotFilled,
  methodGuard,
} = require("../_lib/recrutamento");

const UPLOAD_URL_TTL_SECONDS = 600; // 10 min: tempo de sobra para 3G ruim

module.exports = async (req, res) => {
  if (methodGuard(req, res, "POST")) return;

  const body = parseBody(req);

  if (isHoneypotFilled(body)) {
    return res.status(400).json({ ok: false, error: "requisicao_invalida" });
  }

  const { url, key, ok } = supabaseConfig();
  if (!ok) {
    console.error("[vagas] Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    return res.status(503).json({ ok: false, error: "servico_indisponivel" });
  }

  const kind = String(body.kind || "");
  const spec = KINDS[kind];
  if (!spec) {
    return res.status(400).json({ ok: false, error: "tipo_invalido" });
  }

  const type = resolveType(kind, body.filename, body.contentType);
  if (!type) {
    return res.status(415).json({
      ok: false,
      error: "formato_nao_aceito",
      message:
        kind === "curriculo"
          ? "Aceitamos currículo em PDF, DOC ou DOCX."
          : "Aceitamos foto em JPG, PNG ou WEBP.",
    });
  }

  const size = Number(body.size);
  if (!Number.isFinite(size) || size <= 0 || size > spec.maxBytes) {
    return res.status(413).json({
      ok: false,
      error: "arquivo_muito_grande",
      message: `O arquivo precisa ter até ${Math.round(spec.maxBytes / 1024 / 1024)} MB.`,
    });
  }

  // O id da candidatura agrupa os arquivos e, no fim, vira a chave primária da
  // linha no banco. Quem já tem um id assinado reaproveita; senão, emitimos um.
  let applicationId = String(body.applicationId || "");
  let applicationToken = String(body.applicationToken || "");

  if (!isUuid(applicationId) || !validApplicationToken(applicationId, applicationToken)) {
    applicationId = crypto.randomUUID();
    applicationToken = signApplicationId(applicationId);
  }

  // Nome de arquivo sempre gerado pelo servidor: o nome enviado pela pessoa
  // nunca vira caminho no Storage.
  const objectPath = `${applicationId}/${crypto.randomUUID()}.${type.ext}`;

  try {
    const signed = await fetch(
      `${url}/storage/v1/object/upload/sign/${spec.bucket}/${objectPath}`,
      {
        method: "POST",
        headers: supabaseHeaders(key, { "Content-Type": "application/json" }),
        body: JSON.stringify({ expiresIn: UPLOAD_URL_TTL_SECONDS }),
      }
    );

    if (!signed.ok) {
      const detail = (await signed.text()).slice(0, 300);
      console.error("[vagas] falha ao assinar upload", signed.status, detail);
      return res.status(502).json({ ok: false, error: "falha_ao_preparar_upload" });
    }

    const data = await signed.json();

    return res.status(200).json({
      ok: true,
      applicationId,
      applicationToken,
      bucket: spec.bucket,
      path: objectPath,
      contentType: type.mime,
      uploadUrl: `${url}/storage/v1${data.url}`,
    });
  } catch (e) {
    console.error("[vagas] erro ao preparar upload", String(e).slice(0, 200));
    return res.status(502).json({ ok: false, error: "falha_ao_preparar_upload" });
  }
};
