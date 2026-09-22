// Autenticação do painel /vagas/admin.
//
// O acesso é por código (não há e-mail/senha, nem usuários do Supabase Auth).
// Cada código vive na tabela job_admin_codes como hash scrypt — nem quem abre
// o banco consegue ler o código de alguém. A sessão é um cookie HttpOnly
// assinado com HMAC; a cada request conferimos a assinatura, a validade e se
// o código continua ativo, para que revogar um código derrube a sessão dele.

const crypto = require("crypto");

const COOKIE = "iba_vagas_admin";
const SESSAO_HORAS = 8;
// A sessão é renovada a cada uso do painel (quem está trabalhando não cai),
// mas nunca passa deste teto contado a partir do login.
const SESSAO_MAX_DIAS = 7;

// Tentativas de login erradas por IP antes de travar.
const LOGIN_MAX_ERROS = 8;
const LOGIN_JANELA_MS = 15 * 60 * 1000;

function segredo() {
  return process.env.RECRUITMENT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

// --------------------------------------------------------------- hash ------
// scrypt é built-in do Node: nada de dependência nova no projeto.
function hashCodigo(codigo, saltHex) {
  const salt = saltHex || crypto.randomBytes(16).toString("hex");
  const derivado = crypto.scryptSync(String(codigo), salt, 32).toString("hex");
  return { hash: `scrypt:${salt}:${derivado}`, salt: salt };
}

function confereCodigo(codigo, guardado) {
  const partes = String(guardado || "").split(":");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;
  const recalculado = hashCodigo(codigo, partes[1]).hash;
  const a = Buffer.from(recalculado);
  const b = Buffer.from(guardado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// -------------------------------------------------------------- sessão -----
function assinar(texto) {
  return crypto.createHmac("sha256", segredo()).update(texto).digest("base64url");
}

// `inicio` é o momento do login. Na renovação ele é preservado, para o teto de
// SESSAO_MAX_DIAS continuar valendo.
function criarSessao(codeId, inicio) {
  const corpo = Buffer.from(JSON.stringify({
    cid: codeId,
    exp: Date.now() + SESSAO_HORAS * 3600 * 1000,
    ini: typeof inicio === "number" ? inicio : Date.now(),
  })).toString("base64url");
  return corpo + "." + assinar(corpo);
}

function lerSessao(token) {
  const partes = String(token || "").split(".");
  if (partes.length !== 2) return null;
  const esperado = Buffer.from(assinar(partes[0]));
  const recebido = Buffer.from(partes[1]);
  if (esperado.length !== recebido.length || !crypto.timingSafeEqual(esperado, recebido)) return null;
  let dados;
  try {
    dados = JSON.parse(Buffer.from(partes[0], "base64url").toString("utf8"));
  } catch (e) {
    return null;
  }
  if (!dados || typeof dados.exp !== "number" || dados.exp < Date.now()) return null;
  if (typeof dados.ini === "number" && Date.now() - dados.ini > SESSAO_MAX_DIAS * 86400 * 1000) return null;
  return dados;
}

function lerCookie(req, nome) {
  const cru = String(req.headers.cookie || "");
  for (const parte of cru.split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nome) {
      return decodeURIComponent(parte.slice(i + 1).trim());
    }
  }
  return "";
}

// Em produção a conexão é sempre https e o cookie vai com Secure. No
// `vercel dev` (http://localhost) o Safari se recusa a mandar cookie Secure de
// volta, então lá ele sai sem a flag — HttpOnly e SameSite continuam valendo.
function ehHttps(req) {
  const proto = String((req && req.headers && req.headers["x-forwarded-proto"]) || "")
    .split(",")[0].trim().toLowerCase();
  if (proto) return proto === "https";
  return process.env.VERCEL_ENV ? process.env.VERCEL_ENV !== "development" : false;
}

function setCookieSessao(res, valor, maxAgeSegundos, req) {
  // HttpOnly + SameSite=Strict: o cookie não chega ao JavaScript da página nem
  // viaja em requisição vinda de outro site.
  const partes = [
    `${COOKIE}=${encodeURIComponent(valor)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSegundos}`,
  ];
  if (ehHttps(req)) partes.splice(3, 0, "Secure");
  res.setHeader("Set-Cookie", partes.join("; "));
}

// ------------------------------------------------------ código novo --------
// Sem caracteres que se confundem na leitura (0/O, 1/I/L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function gerarCodigo() {
  const bytes = crypto.randomBytes(12);
  let saida = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) saida += "-";
    saida += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return saida; // ex.: K7QM-3XPT-9WRD
}

module.exports = {
  COOKIE,
  ehHttps,
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
};
