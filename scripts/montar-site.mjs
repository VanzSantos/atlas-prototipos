#!/usr/bin/env node
// Monta o site estático completo do Atlas numa pasta:
//   <saida>/index.html, assets/   → plataforma (catálogo)
//   <saida>/catalogo.json         → gerado pelos prototype.json + git
//   <saida>/p/<projeto>/<nome>/   → saída estática de cada protótipo
//
// Neutro: qualquer CI (GitHub, Azure) só precisa rodar este script e publicar a pasta.
//
// Uso:
//   node scripts/montar-site.mjs [--saida site] [--sem-plataforma] [--previews arquivo.json]

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(import.meta.url), "..", "..");
const args = process.argv.slice(2);
const valor = (nome, padrao) => (args.includes(nome) ? args[args.indexOf(nome) + 1] : padrao);
const SAIDA = resolve(RAIZ, valor("--saida", "site"));
const SEM_PLATAFORMA = args.includes("--sem-plataforma");
const PREVIEWS = valor("--previews");

const rodar = (cmd, cwd = RAIZ) => execSync(cmd, { cwd, stdio: "inherit" });
const pastas = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name) : [];

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

// 1. Plataforma
if (!SEM_PLATAFORMA) {
  console.log("\n▶ Plataforma");
  if (!existsSync(join(RAIZ, "plataforma", "node_modules"))) rodar("npm ci --ignore-scripts --no-audit --no-fund", join(RAIZ, "plataforma"));
  rodar(`npx vite build --outDir "${SAIDA}" --emptyOutDir false`, join(RAIZ, "plataforma"));
}

// 2. Catálogo (já valida todos os protótipos)
console.log("\n▶ Catálogo");
rodar(`node scripts/gerar-catalogo.mjs --saida "${join(SAIDA, "catalogo.json")}"${PREVIEWS ? ` --previews "${resolve(PREVIEWS)}"` : ""}`);

// 3. Protótipos
for (const projeto of pastas(join(RAIZ, "prototipos"))) {
  for (const nome of pastas(join(RAIZ, "prototipos", projeto))) {
    const pasta = join(RAIZ, "prototipos", projeto, nome);
    const dados = JSON.parse(readFileSync(join(pasta, "prototype.json"), "utf8"));
    const destino = join(SAIDA, "p", projeto, nome);
    console.log(`\n▶ ${projeto}/${nome}`);

    if (dados.build) {
      if (existsSync(join(pasta, "package.json")) && !existsSync(join(pasta, "node_modules"))) {
        rodar(existsSync(join(pasta, "package-lock.json")) ? "npm ci --no-audit --no-fund" : "npm install --no-audit --no-fund", pasta);
      }
      rodar(dados.build.comando, pasta);
      const origem = join(pasta, dados.build.saida || "dist");
      if (!existsSync(join(origem, dados.entrada))) {
        console.error(`✖ ${projeto}/${nome}: o build não gerou ${dados.build.saida || "dist"}/${dados.entrada}`);
        process.exit(1);
      }
      cpSync(origem, destino, { recursive: true });
    } else {
      cpSync(pasta, destino, {
        recursive: true,
        filter: (src) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(src) && !src.endsWith("prototype.json"),
      });
    }
  }
}

console.log(`\n✔ Site montado em ${SAIDA}`);
