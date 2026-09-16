// Utilidades compartilhadas pelas funções de recrutamento (/api/vagas/*).
// Sem dependências externas — só built-ins do Node + fetch global.

const crypto = require("crypto");

// ------------------------------------------------------------------ Supabase
function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { url, key, ok: Boolean(url && key) };
}

function supabaseHeaders(key, extra) {
  return Object.assign({ apikey: key, Authorization: `Bearer ${key}` }, extra || {});
}

// ---------------------------------------------------------------------- HMAC
// O id da candidatura é emitido pelo servidor e assinado, para que os uploads
// só possam ir para uma pasta que o servidor autorizou.
function signApplicationId(id) {
  const secret = process.env.RECRUITMENT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret).update("vagas:" + id).digest("hex").slice(0, 32);
}

function isUuid(v) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function validApplicationToken(id, token) {
  if (!isUuid(id) || typeof token !== "string") return false;
  const a = Buffer.from(signApplicationId(id));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// --------------------------------------------------------------- arquivos ---
// Cada tipo aceito é descrito pelo MIME, pela extensão e pela assinatura real
// do arquivo (magic bytes). Extensão e content-type vêm do navegador e não são
// confiáveis: a assinatura é conferida no servidor depois do upload.
const RESUME_TYPES = [
  { ext: "pdf", mime: "application/pdf", magic: ["25504446"] },
  {
    ext: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    magic: ["504b0304"],
  },
  { ext: "doc", mime: "application/msword", magic: ["d0cf11e0a1b11ae1"] },
];

const PHOTO_TYPES = [
  { ext: "jpg", mime: "image/jpeg", magic: ["ffd8ff"] },
  { ext: "jpeg", mime: "image/jpeg", magic: ["ffd8ff"] },
  { ext: "png", mime: "image/png", magic: ["89504e470d0a1a0a"] },
  { ext: "webp", mime: "image/webp", magic: ["52494646"] }, // RIFF + "WEBP" em 8..11
];

const KINDS = {
  curriculo: {
    bucket: "recruitment-resumes",
    maxBytes: 10 * 1024 * 1024,
    types: RESUME_TYPES,
    label: "currículo",
  },
  foto: {
    bucket: "recruitment-photos",
    maxBytes: 5 * 1024 * 1024,
    types: PHOTO_TYPES,
    label: "foto",
  },
};

function extensionOf(filename) {
  const m = String(filename || "").toLowerCase().match(/\.([a-z0-9]{1,5})$/);
  return m ? m[1] : "";
}

// Aceita o arquivo só quando extensão E content-type combinam com o mesmo tipo.
function resolveType(kind, filename, contentType) {
  const spec = KINDS[kind];
  if (!spec) return null;
  const ext = extensionOf(filename);
  const mime = String(contentType || "").toLowerCase().split(";")[0].trim();
  return spec.types.find(function (t) { return t.ext === ext && t.mime === mime; }) || null;
}

// Confere a assinatura real dos primeiros bytes do arquivo já enviado.
function matchesSignature(kind, ext, head) {
  const spec = KINDS[kind];
  if (!spec) return false;
  const type = spec.types.find(function (t) { return t.ext === ext; });
  if (!type) return false;
  const hex = head.toString("hex").toLowerCase();
  if (!type.magic.some(function (sig) { return hex.indexOf(sig) === 0; })) return false;
  // WEBP: "RIFF....WEBP" — o RIFF sozinho também serve para .avi e .wav
  if (type.ext === "webp") return head.slice(8, 12).toString("ascii") === "WEBP";
  return true;
}

// --------------------------------------------------------------- sanitize ---
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

function cleanText(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength || 200);
}

function digitsOnly(value, maxLength) {
  return String(value == null ? "" : value).replace(/\D/g, "").slice(0, maxLength || 20);
}

// Guarda o nome original só para o RH reconhecer o arquivo — nunca vira chave
// no Storage.
function safeFileName(filename) {
  return cleanText(filename, 120).replace(/[\/\\]/g, "-");
}

// ------------------------------------------------------------------ request --
function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  return body && typeof body === "object" ? body : {};
}

function clientIpHash(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = fwd || String(req.headers["x-real-ip"] || "") || "desconhecido";
  const secret = process.env.RECRUITMENT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret).update("ip:" + ip).digest("hex").slice(0, 40);
}

// Campo escondido no formulário: pessoa nenhuma preenche, bot preenche.
function isHoneypotFilled(body) {
  return Boolean(cleanText(body.website, 50) || cleanText(body.empresa_site, 50));
}

function methodGuard(req, res, method) {
  if (req.method === method) return false;
  res.setHeader("Allow", method);
  res.status(405).json({ ok: false, error: "method_not_allowed" });
  return true;
}

module.exports = {
  KINDS,
  supabaseConfig,
  supabaseHeaders,
  signApplicationId,
  validApplicationToken,
  isUuid,
  resolveType,
  matchesSignature,
  extensionOf,
  cleanText,
  digitsOnly,
  safeFileName,
  parseBody,
  clientIpHash,
  isHoneypotFilled,
  methodGuard,
};
