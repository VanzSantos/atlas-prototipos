#!/usr/bin/env node
// Tira um print da tela inicial de cada protótipo já montado no site (no tamanho de desktop ou
// de celular) e salva como <site>/p/<programa>/<projeto>/<nome>/miniatura.png.
//
// Se a pasta do protótipo tiver um miniatura.png commitado, ele já foi copiado pelo
// montar-site e é mantido (a pessoa escolheu a própria imagem).
// Sem Chrome, avisa e segue: os cartões mostram um espaço reservado.
//
// Uso: node scripts/gerar-miniaturas.mjs --site <pasta>

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { RAIZ } from "./lib/git.mjs";
import { abrirNavegador, servirPasta, tirarPrint } from "./lib/navegador.mjs";

const i = process.argv.indexOf("--site");
const SITE = resolve(RAIZ, i > -1 ? process.argv[i + 1] : "site");
const pastas = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

const pendentes = [];
for (const programa of pastas(join(SITE, "p")))
  for (const projeto of pastas(join(SITE, "p", programa)))
    for (const nome of pastas(join(SITE, "p", programa, projeto))) {
      const id = `${programa}/${projeto}/${nome}`;
      if (existsSync(join(SITE, "p", id, "miniatura.png"))) continue;
      const json = join(RAIZ, "prototipos", id, "prototype.json");
      if (!existsSync(json)) continue;
      const dados = JSON.parse(readFileSync(json, "utf8"));
      pendentes.push({ id, entrada: dados.entrada, dispositivo: dados.dispositivo });
    }

if (!pendentes.length) {
  console.log("✔ Miniaturas: nada a gerar.");
  process.exit(0);
}

const navegador = await abrirNavegador("Miniaturas");
if (!navegador) process.exit(0);
const servidor = await servirPasta(SITE);

for (const { id, entrada, dispositivo } of pendentes) {
  try {
    await tirarPrint(navegador, `${servidor.base}/p/${id}/${entrada}`, dispositivo, join(SITE, "p", id, "miniatura.png"));
    console.log(`✔ miniatura ${id}`);
  } catch (e) {
    console.warn(`⚠ miniatura ${id} não gerada: ${e.message.split("\n")[0]}`);
  }
}

await navegador.close();
servidor.fechar();
