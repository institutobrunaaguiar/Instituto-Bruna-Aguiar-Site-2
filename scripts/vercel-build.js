#!/usr/bin/env node
/** Copia o site estático para dist/ (deploy Vercel). */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "breathiva.webflow.io");
const dest = path.join(root, "dist");

function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}

if (!fs.existsSync(src)) {
  console.error("Pasta breathiva.webflow.io não encontrada.");
  process.exit(1);
}

copyRecursive(src, dest);
console.log("Build concluído: breathiva.webflow.io → dist/");
