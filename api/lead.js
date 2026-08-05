// Recebe o lead da landing /campanha-co2 e grava no Kommo (CRM).
// Sempre responde 200: o front redireciona pro WhatsApp independentemente do
// resultado, então uma falha aqui nunca trava o usuário.
//
// Env vars (Vercel):
//   KOMMO_SUBDOMAIN  ex.: "institutobrunaaguiar" ou "institutobrunaaguiar.kommo.com"
//   KOMMO_TOKEN      token de longa duração (integração privada do Kommo)
//   KOMMO_PIPELINE_ID  (opcional) funil de destino
//   KOMMO_STATUS_ID    (opcional) etapa de destino
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

  const nome = String(body.nome || "").trim();
  const telefone = String(body.telefone || "").trim();
  const uf = String(body.uf || "").trim();
  const jaFez = String(body.jaFez || "").trim();
  const conhece = String(body.conhece || "").trim();
  const ocupacao = String(body.ocupacao || "").trim();

  const subdomain = process.env.KOMMO_SUBDOMAIN;
  const token = process.env.KOMMO_TOKEN;

  // Sem credenciais: nada a salvar, mas o front segue pro WhatsApp.
  if (!subdomain || !token) {
    return res.status(200).json({ ok: true, saved: false, reason: "kommo_not_configured" });
  }

  const base = subdomain.includes(".")
    ? `https://${subdomain}`
    : `https://${subdomain}.kommo.com`;

  const digits = telefone.replace(/\D/g, "");
  const phoneE164 = digits ? (digits.startsWith("55") ? `+${digits}` : `+55${digits}`) : "";

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const lead = {
      name: `Campanha CO2 — ${nome || "Lead"}`,
      _embedded: {
        tags: [{ name: "Campanha CO2" }],
        contacts: [
          {
            name: nome || "Lead",
            custom_fields_values: phoneE164
              ? [{ field_code: "PHONE", values: [{ value: phoneE164, enum_code: "WORK" }] }]
              : undefined,
          },
        ],
      },
    };
    if (process.env.KOMMO_PIPELINE_ID) lead.pipeline_id = Number(process.env.KOMMO_PIPELINE_ID);
    if (process.env.KOMMO_STATUS_ID) lead.status_id = Number(process.env.KOMMO_STATUS_ID);

    const r = await fetch(`${base}/api/v4/leads/complex`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify([lead]),
    });

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      return res.status(200).json({ ok: true, saved: false, reason: "kommo_error", status: r.status, detail });
    }

    const data = await r.json();
    const leadId = Array.isArray(data)
      ? data[0] && data[0].id
      : data && data._embedded && data._embedded.leads && data._embedded.leads[0] && data._embedded.leads[0].id;

    // Nota com todas as respostas (não depende de IDs de campos personalizados).
    if (leadId) {
      const noteText = [
        "Origem: Campanha CO2 (landing)",
        `Nome: ${nome}`,
        `Telefone: ${phoneE164 || telefone}`,
        `Estado (UF): ${uf}`,
        `Já fez procedimento estético? ${jaFez}`,
        `Conhece o Instituto / Bruna Aguiar? ${conhece}`,
        `Ocupação: ${ocupacao}`,
      ].join("\n");

      await fetch(`${base}/api/v4/leads/${leadId}/notes`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify([{ note_type: "common", params: { text: noteText } }]),
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true, saved: true, leadId: leadId || null });
  } catch (e) {
    return res.status(200).json({ ok: true, saved: false, reason: "exception", detail: String(e).slice(0, 200) });
  }
};
