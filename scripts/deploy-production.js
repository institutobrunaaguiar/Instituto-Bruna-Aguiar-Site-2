#!/usr/bin/env node
/**
 * Publica em https://instituto-bruna-aguiar-site-2.vercel.app/
 * Esse domínio é atualizado pelo deploy Git (push na branch main).
 * Deploy via `vercel --prod` sozinho vai para outro projeto (-delta).
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const PRODUCTION_URL = "https://instituto-bruna-aguiar-site-2.vercel.app/";

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
}

console.log("1/3 Build local…");
run("npm run build");

const status = runCapture("git status --porcelain");
if (status) {
  console.error(
    "\nHá alterações não commitadas. Faça commit antes de publicar:\n" +
      "  git add -A && git commit -m \"sua mensagem\"\n"
  );
  process.exit(1);
}

console.log("2/3 Push para origin/main…");
run("git push origin main");
run("git push origin main:feat/site-instituto");

console.log("3/3 Aguardando deploy Git na Vercel…");
console.log(`Verifique em ~1 min: ${PRODUCTION_URL}`);
