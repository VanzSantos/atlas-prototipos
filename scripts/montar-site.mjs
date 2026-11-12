#!/usr/bin/env node
// Monta o site estático completo do Atlas numa pasta:
//   <saida>/index.html, assets/                      → plataforma (catálogo)
//   <saida>/catalogo.json                            → gerado dos .json + git
//   <saida>/p/<programa>/<projeto>/<nome>/           → protótipo navegável
//   <saida>/p/<programa>/<projeto>/<nome>/canvas/... → canvas (telas estáticas e anotações)
//   <saida>/p/<programa>/<projeto>/<nome>/mapa/...   → mapa do fluxo
//   <saida>/p/<programa>/<projeto>/<nome>/miniatura.png
//   <saida>/p/<programa>/<projeto>/<nome>/historico/<commit>/*.png → prints do histórico
//
// Neutro: qualquer CI (GitHub, Azure) só precisa rodar este script e publicar a pasta.
//
// Uso:
//   node scripts/montar-site.mjs [--saida site] [--sem-plataforma] [--sem-miniaturas]
//     [--apenas id,id]        monta só esses protótipos (o preview de um PR)
//     [--alterados id,id]     marca esses como "em andamento" no catálogo
//     [--oficial-url <url>]   protótipos não montados apontam para a versão oficial
//     [--publicado <pasta>]   cópia do site publicado: de onde vêm prints antigos e imagens
//     [--prints id,id]        grava os prints do histórico desses protótipos para o commit atual
//     [--previews arquivo]    PRs em andamento (lista produzida pelo CI)

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { RAIZ } from "./lib/git.mjs";

const args = process.argv.slice(2);
const valor = (nome, padrao) => (args.includes(nome) ? args[args.indexOf(nome) + 1] : padrao);
const lista = (nome) => (valor(nome) ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const SAIDA = resolve(RAIZ, valor("--saida", "site"));
const APENAS = args.includes("--apenas") ? new Set(lista("--apenas")) : null;
const PUBLICADO = valor("--publicado") ? resolve(valor("--publicado")) : null;

const rodar = (cmd, cwd = RAIZ) => execSync(cmd, { cwd, stdio: "inherit" });
const pastas = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name) : [];
const semDependencias = (src) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(src);
const aspas = (x) => `"${x}"`;

// 0. Validação de todos os protótipos, antes de qualquer coisa
rodar("node scripts/validar-prototipos.mjs");

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });
// Sem processamento extra do servidor (ex.: Jekyll no GitHub Pages): publica os arquivos como estão.
writeFileSync(join(SAIDA, ".nojekyll"), "");

// 1. Plataforma
if (!args.includes("--sem-plataforma")) {
  console.log("\n▶ Plataforma");
  if (!existsSync(join(RAIZ, "plataforma", "node_modules"))) rodar("npm ci --ignore-scripts --no-audit --no-fund", join(RAIZ, "plataforma"));
  rodar(`npx vite build --outDir ${aspas(SAIDA)} --emptyOutDir false`, join(RAIZ, "plataforma"));
}

// 2. Protótipos, canvas e mapas
const montados = [];
for (const programa of pastas(join(RAIZ, "prototipos")))
  for (const projeto of pastas(join(RAIZ, "prototipos", programa)))
    for (const nome of pastas(join(RAIZ, "prototipos", programa, projeto))) {
      const id = `${programa}/${projeto}/${nome}`;
      if (APENAS && !APENAS.has(id)) continue;
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
        cpSync(pasta, destino, {
          recursive: true,
          filter: (src) => semDependencias(src) && !src.endsWith("prototype.json") && !/[\\/]historico([\\/]|$)/.test(src),
        });
      }

      // Prints antigos do histórico ficam no site publicado: traz de volta para não se perderem.
      const printsAntigos = PUBLICADO && join(PUBLICADO, "p", id, "historico");
      if (printsAntigos && existsSync(printsAntigos)) cpSync(printsAntigos, join(destino, "historico"), { recursive: true });
      montados.push(id);
    }

// 3. Miniaturas (print automático de quem não tem miniatura.png)
if (!args.includes("--sem-miniaturas") && montados.length) {
  console.log("\n▶ Miniaturas");
  rodar(`node scripts/gerar-miniaturas.mjs --site ${aspas(SAIDA)}`);
}

// 4. Prints do histórico para o commit atual
const prints = lista("--prints").filter((id) => montados.includes(id));
if (prints.length) {
  console.log("\n▶ Prints do histórico");
  rodar(`node scripts/gerar-prints-historico.mjs --site ${aspas(SAIDA)} ${prints.join(" ")}`);
}

// 5. Catálogo
console.log("\n▶ Catálogo");
const repassar = ["--alterados", "--oficial-url"].filter((o) => valor(o)).map((o) => `${o} ${aspas(valor(o))}`);
if (PUBLICADO) repassar.push(`--publicado ${aspas(PUBLICADO)}`);
if (valor("--previews")) repassar.push(`--previews ${aspas(resolve(valor("--previews")))}`);
rodar(`node scripts/gerar-catalogo.mjs --saida ${aspas(join(SAIDA, "catalogo.json"))} --site ${aspas(SAIDA)} ${repassar.join(" ")}`);

console.log(`\n✔ Site montado em ${SAIDA} (${montados.length} protótipo(s))`);
