#!/usr/bin/env node
// Monta o site estático completo do Atlas numa pasta:
//   <saida>/index.html, assets/                      → plataforma (catálogo)
//   <saida>/catalogo.json                            → gerado dos .json + git
//   <saida>/p/<programa>/<projeto>/<nome>/           → protótipo navegável
//   <saida>/p/<programa>/<projeto>/<nome>/canvas/... → canvas (telas estáticas e anotações)
//   <saida>/p/<programa>/<projeto>/<nome>/mapa/...   → mapa do fluxo
//   <saida>/p/<programa>/<projeto>/<nome>/miniatura.png
//
// Neutro: qualquer CI (GitHub, Azure) só precisa rodar este script e publicar a pasta.
//
// Uso:
//   node scripts/montar-site.mjs [--saida site] [--sem-plataforma] [--sem-miniaturas] [--previews arquivo.json]

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(import.meta.url), "..", "..");
const args = process.argv.slice(2);
const valor = (nome, padrao) => (args.includes(nome) ? args[args.indexOf(nome) + 1] : padrao);
const SAIDA = resolve(RAIZ, valor("--saida", "site"));
const PREVIEWS = valor("--previews");

const rodar = (cmd, cwd = RAIZ) => execSync(cmd, { cwd, stdio: "inherit" });
const pastas = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name) : [];
const semDependencias = (src) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(src);

// 0. Validação antes de qualquer coisa
rodar("node scripts/validar-prototipos.mjs");

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

// 1. Plataforma
if (!args.includes("--sem-plataforma")) {
  console.log("\n▶ Plataforma");
  if (!existsSync(join(RAIZ, "plataforma", "node_modules"))) rodar("npm ci --ignore-scripts --no-audit --no-fund", join(RAIZ, "plataforma"));
  rodar(`npx vite build --outDir "${SAIDA}" --emptyOutDir false`, join(RAIZ, "plataforma"));
}

// 2. Protótipos, canvas e mapas
for (const programa of pastas(join(RAIZ, "prototipos")))
  for (const projeto of pastas(join(RAIZ, "prototipos", programa)))
    for (const nome of pastas(join(RAIZ, "prototipos", programa, projeto))) {
      const id = `${programa}/${projeto}/${nome}`;
      const pasta = join(RAIZ, "prototipos", id);
      const dados = JSON.parse(readFileSync(join(pasta, "prototype.json"), "utf8"));
      const destino = join(SAIDA, "p", id);
      console.log(`\n▶ ${id}`);

      if (dados.build) {
        if (existsSync(join(pasta, "package.json")) && !existsSync(join(pasta, "node_modules"))) {
          rodar(existsSync(join(pasta, "package-lock.json")) ? "npm ci --no-audit --no-fund" : "npm install --no-audit --no-fund", pasta);
        }
        rodar(dados.build.comando, pasta);
        const origem = join(pasta, dados.build.saida || "dist");
        if (!existsSync(join(origem, dados.entrada))) {
          console.error(`✖ ${id}: o build não gerou ${dados.build.saida || "dist"}/${dados.entrada}`);
          process.exit(1);
        }
        cpSync(origem, destino, { recursive: true });
        // Canvas, mapa e miniatura ficam fora do build: copia à parte.
        for (const arquivo of [dados.canvas, dados.mapa]) {
          const dir = dirname(arquivo);
          if (existsSync(join(pasta, arquivo)))
            cpSync(join(pasta, dir === "." ? arquivo : dir), join(destino, dir === "." ? arquivo : dir), { recursive: true, filter: semDependencias });
        }
        if (existsSync(join(pasta, "miniatura.png"))) cpSync(join(pasta, "miniatura.png"), join(destino, "miniatura.png"));
      } else {
        cpSync(pasta, destino, { recursive: true, filter: (src) => semDependencias(src) && !src.endsWith("prototype.json") });
      }
    }

// 3. Miniaturas (print automático de quem não tem miniatura.png)
if (!args.includes("--sem-miniaturas")) {
  console.log("\n▶ Miniaturas");
  rodar(`node scripts/gerar-miniaturas.mjs --site "${SAIDA}"`);
}

// 4. Catálogo
console.log("\n▶ Catálogo");
rodar(
  `node scripts/gerar-catalogo.mjs --saida "${join(SAIDA, "catalogo.json")}" --site "${SAIDA}"${PREVIEWS ? ` --previews "${resolve(PREVIEWS)}"` : ""}`
);

console.log(`\n✔ Site montado em ${SAIDA}`);
