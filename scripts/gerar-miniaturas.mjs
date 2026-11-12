#!/usr/bin/env node
// Tira um print da tela inicial de cada protótipo já montado no site e salva como
// <site>/p/<programa>/<projeto>/<nome>/miniatura.png.
//
// Se a pasta do protótipo tiver um miniatura.png commitado, ele já foi copiado pelo
// montar-site e é mantido (a pessoa escolheu a própria imagem).
//
// Usa o Google Chrome instalado na máquina (ou no agente de CI) via playwright-core.
// Sem Chrome, avisa e segue: os cartões mostram um espaço reservado.
//
// Uso: node scripts/gerar-miniaturas.mjs --site <pasta>

import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(import.meta.url), "..", "..");
const i = process.argv.indexOf("--site");
const SITE = resolve(RAIZ, i > -1 ? process.argv[i + 1] : "site");
const LARGURA = 1280;
const ALTURA = 800;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const pastas = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

// 1. Quais protótipos precisam de print
const pendentes = [];
for (const programa of pastas(join(SITE, "p")))
  for (const projeto of pastas(join(SITE, "p", programa)))
    for (const nome of pastas(join(SITE, "p", programa, projeto))) {
      const id = `${programa}/${projeto}/${nome}`;
      if (existsSync(join(SITE, "p", id, "miniatura.png"))) continue;
      const json = join(RAIZ, "prototipos", id, "prototype.json");
      if (!existsSync(json)) continue;
      pendentes.push({ id, entrada: JSON.parse(readFileSync(json, "utf8")).entrada });
    }

if (!pendentes.length) {
  console.log("✔ Miniaturas: nada a gerar.");
  process.exit(0);
}

// 2. Navegador
let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.warn("⚠ Miniaturas puladas: rode npm install na raiz (falta playwright-core).");
  process.exit(0);
}

let navegador;
try {
  navegador = await chromium.launch({ channel: "chrome", headless: true });
} catch {
  console.warn("⚠ Miniaturas puladas: Google Chrome não encontrado nesta máquina.");
  process.exit(0);
}

// 3. Servidor estático temporário, para o protótipo carregar como no site publicado
const servidor = createServer((req, res) => {
  let caminho = join(SITE, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(caminho) && statSync(caminho).isDirectory()) caminho = join(caminho, "index.html");
  if (!caminho.startsWith(SITE) || !existsSync(caminho)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TIPOS[extname(caminho)] ?? "application/octet-stream" });
  res.end(readFileSync(caminho));
});
await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${servidor.address().port}`;

// 4. Prints
const pagina = await navegador.newPage({ viewport: { width: LARGURA, height: ALTURA } });
for (const { id, entrada } of pendentes) {
  try {
    await pagina.goto(`${base}/p/${id}/${entrada}`, { waitUntil: "networkidle", timeout: 20000 });
    await pagina.waitForTimeout(300);
    await pagina.screenshot({ path: join(SITE, "p", id, "miniatura.png") });
    console.log(`✔ miniatura ${id}`);
  } catch (e) {
    console.warn(`⚠ miniatura ${id} não gerada: ${e.message.split("\n")[0]}`);
  }
}

await navegador.close();
servidor.close();
