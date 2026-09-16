#!/usr/bin/env node
/**
 * Cria um código de acesso ao painel /vagas/admin direto pelo terminal.
 *
 * Serve para o primeiro código (quando ainda não dá para entrar no painel) e
 * para recuperar o acesso caso todos os códigos se percam. No dia a dia, use o
 * próprio painel.
 *
 *   node scripts/criar-codigo-admin.js "Nome de quem vai usar"
 *   node scripts/criar-codigo-admin.js "Nome" "CODIGO-ESCOLHIDO"
 *
 * Precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente:
 *   set -a && . ./.env.local && set +a
 */

const path = require("path");
const { hashCodigo, gerarCodigo } = require(path.join(__dirname, "..", "api", "_lib", "admin.js"));

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url || !key) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  console.error("Rode antes:  set -a && . ./.env.local && set +a");
  process.exit(1);
}

const label = (process.argv[2] || "").trim();
const codigoEscolhido = (process.argv[3] || "").trim();

if (label.length < 2) {
  console.error('Informe um nome: node scripts/criar-codigo-admin.js "Recepção RH"');
  process.exit(1);
}

const codigo = codigoEscolhido || gerarCodigo();
const { hash } = hashCodigo(codigo);

fetch(`${url}/rest/v1/job_admin_codes`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({ code_hash: hash, label: label }),
})
  .then(async (r) => {
    if (!r.ok) {
      console.error("Falhou:", r.status, (await r.text()).slice(0, 300));
      process.exit(1);
    }
    const [linha] = await r.json();
    console.log("");
    console.log("  Código criado para:", label);
    console.log("  Código de acesso  :", codigo);
    console.log("  id                :", linha.id);
    console.log("");
    console.log("  Guarde agora: só o hash fica no banco, o código não pode ser recuperado depois.");
    console.log("");
  })
  .catch((e) => {
    console.error("Erro:", String(e).slice(0, 200));
    process.exit(1);
  });
