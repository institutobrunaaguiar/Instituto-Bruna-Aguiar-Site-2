// Recebe o lead da landing /campanha-co2 e grava em dois destinos, em paralelo:
//   1) Supabase (fonte de verdade — tabela leads_campanha_co2)
//   2) Kommo (CRM — lead + contato + nota)
// Ambos são opcionais e gated por env vars. A função SEMPRE responde 200: o front
// redireciona pro WhatsApp independentemente do resultado, então uma falha aqui
// nunca trava o usuário. Sem dependências — só Node built-ins + fetch global.
//
// Env vars (Vercel):
//   SUPABASE_URL                ex.: https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   service role key (fica só no servidor; bypassa RLS)
//   KOMMO_SUBDOMAIN             ex.: "institutobrunaaguiar" ou "...kommo.com" (opcional)
//   KOMMO_TOKEN                token de longa duração (opcional)
//   KOMMO_PIPELINE_ID / KOMMO_STATUS_ID  (opcionais)

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const lead = {
    nome: String(body.nome || "").trim(),
    telefone: String(body.telefone || "").trim(),
    uf: String(body.uf || "").trim(),
    jaFez: String(body.jaFez || "").trim(),
    conhece: String(body.conhece || "").trim(),
    ocupacao: String(body.ocupacao || "").trim(),
  };

  const digits = lead.telefone.replace(/\D/g, "");
  const phoneE164 = digits ? (digits.startsWith("55") ? `+${digits}` : `+55${digits}`) : "";
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 400);

  const [supabase, kommo] = await Promise.all([
    saveToSupabase(lead, phoneE164, userAgent),
    saveToKommo(lead, phoneE164),
  ]);

  return res.status(200).json({ ok: true, supabase, kommo });
};

// ---------- Supabase (PostgREST REST API) ----------
async function saveToSupabase(lead, phoneE164, userAgent) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { saved: false, reason: "not_configured" };

  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/leads_campanha_co2`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        nome: lead.nome || null,
        telefone: phoneE164 || lead.telefone || null,
        uf: lead.uf || null,
        ja_fez_procedimento: lead.jaFez || null,
        conhece_instituto: lead.conhece || null,
        ocupacao: lead.ocupacao || null,
        user_agent: userAgent || null,
      }),
    });
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      return { saved: false, reason: "error", status: r.status, detail };
    }
    return { saved: true };
  } catch (e) {
    return { saved: false, reason: "exception", detail: String(e).slice(0, 200) };
  }
}

// ---------- Kommo (CRM) ----------
async function saveToKommo(lead, phoneE164) {
  const subdomain = process.env.KOMMO_SUBDOMAIN;
  const token = process.env.KOMMO_TOKEN;
  if (!subdomain || !token) return { saved: false, reason: "not_configured" };

  const base = subdomain.includes(".") ? `https://${subdomain}` : `https://${subdomain}.kommo.com`;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  try {
    const payload = {
      name: `Campanha CO2 — ${lead.nome || "Lead"}`,
      _embedded: {
        tags: [{ name: "Campanha CO2" }],
        contacts: [
          {
            name: lead.nome || "Lead",
            custom_fields_values: phoneE164
              ? [{ field_code: "PHONE", values: [{ value: phoneE164, enum_code: "WORK" }] }]
              : undefined,
          },
        ],
      },
    };
    if (process.env.KOMMO_PIPELINE_ID) payload.pipeline_id = Number(process.env.KOMMO_PIPELINE_ID);
    if (process.env.KOMMO_STATUS_ID) payload.status_id = Number(process.env.KOMMO_STATUS_ID);

    const r = await fetch(`${base}/api/v4/leads/complex`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify([payload]),
    });
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      return { saved: false, reason: "error", status: r.status, detail };
    }

    const data = await r.json();
    const leadId = Array.isArray(data)
      ? data[0] && data[0].id
      : data && data._embedded && data._embedded.leads && data._embedded.leads[0] && data._embedded.leads[0].id;

    if (leadId) {
      const noteText = [
        "Origem: Campanha CO2 (landing)",
        `Nome: ${lead.nome}`,
        `Telefone: ${phoneE164 || lead.telefone}`,
        `Estado (UF): ${lead.uf}`,
        `Já fez procedimento estético? ${lead.jaFez}`,
        `Conhece o Instituto / Bruna Aguiar? ${lead.conhece}`,
        `Ocupação: ${lead.ocupacao}`,
      ].join("\n");
      await fetch(`${base}/api/v4/leads/${leadId}/notes`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify([{ note_type: "common", params: { text: noteText } }]),
      }).catch(() => {});
    }

    return { saved: true, leadId: leadId || null };
  } catch (e) {
    return { saved: false, reason: "exception", detail: String(e).slice(0, 200) };
  }
}
