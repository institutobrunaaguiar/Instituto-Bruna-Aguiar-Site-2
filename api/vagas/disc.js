// Questionário DISC respondido pelo candidato no link /vagas/disc/?t=<token>.
//
// O token é a única credencial: ele aponta para um DISC pendente de uma
// candidatura e só permite abrir e enviar aquele questionário. O cálculo do
// perfil é feito aqui, com o gabarito que nunca sai do servidor.
//
// Antes do DISC, a mesma página faz algumas perguntas da ficha de entrevista
// (api/_lib/questionario.js). As respostas vão direto para a ficha da
// candidatura (job_interviews), sem apagar o que o RH já tiver preenchido.
//
// Env vars: SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.

const { supabaseConfig, supabaseHeaders, cleanText, parseBody, methodGuard } = require("../_lib/recrutamento");
const { perguntasPublicas, calcular } = require("../_lib/disc");
const questionario = require("../_lib/questionario");

module.exports = async (req, res) => {
  if (methodGuard(req, res, "POST")) return;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  const cfg = supabaseConfig();
  if (!cfg.ok) return res.status(503).json({ ok: false, error: "servico_indisponivel" });

  const body = parseBody(req);
  const token = cleanText(body.token, 80);
  if (!/^[A-Za-z0-9_-]{32,80}$/.test(token)) {
    return res.status(404).json({ ok: false, error: "link_invalido" });
  }

  try {
    const r = await api(cfg,
      `/rest/v1/job_disc?select=id,status,expires_at,aberto_em,application_id,job_applications(nome_completo)&token=eq.${encodeURIComponent(token)}&limit=1`);
    if (!r.ok) return res.status(502).json({ ok: false, error: "falha_ao_buscar" });
    const disc = (await r.json())[0];

    if (!disc || disc.status === "cancelado") return res.status(404).json({ ok: false, error: "link_invalido" });
    if (disc.status === "concluido") return res.status(200).json({ ok: true, status: "concluido" });
    if (Date.parse(disc.expires_at) < Date.now()) return res.status(410).json({ ok: false, error: "link_expirado" });

    const nome = (disc.job_applications && disc.job_applications.nome_completo) || "";
    const primeiroNome = nome.trim().split(/\s+/)[0] || "";

    // Ficha atual: diz se as perguntas já foram respondidas (e guarda o que o
    // RH já preencheu, para não sobrescrever no envio).
    const rf = await api(cfg, `/rest/v1/job_interviews?select=respostas&application_id=eq.${disc.application_id}`);
    if (!rf.ok) return res.status(502).json({ ok: false, error: "falha_ao_buscar" });
    const fichaAtual = ((await rf.json())[0] || {}).respostas || {};
    const pedirPerguntas = !fichaAtual[questionario.MARCA];

    if (body.action === "abrir") {
      if (!disc.aberto_em) {
        await api(cfg, `/rest/v1/job_disc?id=eq.${disc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ aberto_em: new Date().toISOString() }),
        });
      }
      return res.status(200).json({
        ok: true,
        status: "pendente",
        nome: primeiroNome,
        perguntas: pedirPerguntas ? questionario.SECOES : [],
        grupos: perguntasPublicas(),
      });
    }

    if (body.action === "enviar") {
      const resultado = calcular(body.respostas);
      if (!resultado) {
        return res.status(422).json({ ok: false, error: "respostas_invalidas", message: "Responda todos os grupos antes de enviar." });
      }
      const respostas = body.respostas.map(function (x) { return { mais: Number(x.mais), menos: Number(x.menos) }; });

      // As perguntas vão para a ficha antes de o DISC ser fechado: se algo
      // falhar no meio, a pessoa ainda consegue reenviar pelo mesmo link.
      if (pedirPerguntas) {
        const v = questionario.validar(body.ficha);
        if (v.faltando) {
          return res.status(422).json({
            ok: false, error: "perguntas_incompletas", faltando: v.faltando,
            message: "Faltou responder algumas perguntas. Confira e envie de novo.",
          });
        }
        const sf = await api(cfg, "/rest/v1/job_interviews?on_conflict=application_id", {
          method: "POST",
          headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({ application_id: disc.application_id, respostas: questionario.mesclar(fichaAtual, v.respostas) }),
        });
        if (!sf.ok) {
          console.error("[vagas/disc] falha ao salvar perguntas", sf.status, (await sf.text()).slice(0, 200));
          return res.status(502).json({ ok: false, error: "falha_ao_salvar", message: "Não foi possível enviar agora. Tente novamente." });
        }
      }

      // status=eq.pendente no filtro: dois envios ao mesmo tempo não gravam duas vezes
      const up = await api(cfg, `/rest/v1/job_disc?id=eq.${disc.id}&status=eq.pendente`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ status: "concluido", respostas: respostas, resultado: resultado, concluido_em: new Date().toISOString() }),
      });
      if (!up.ok) {
        console.error("[vagas/disc] falha ao salvar", up.status, (await up.text()).slice(0, 200));
        return res.status(502).json({ ok: false, error: "falha_ao_salvar", message: "Não foi possível enviar agora. Tente novamente." });
      }
      return res.status(200).json({ ok: true, status: "concluido" });
    }

    return res.status(400).json({ ok: false, error: "acao_desconhecida" });
  } catch (e) {
    console.error("[vagas/disc] erro", String(e).slice(0, 200));
    return res.status(500).json({ ok: false, error: "erro_interno" });
  }
};

function api(cfg, caminho, opcoes) {
  const o = opcoes || {};
  return fetch(cfg.url + caminho, { method: o.method || "GET", headers: supabaseHeaders(cfg.key, o.headers || {}), body: o.body });
}
