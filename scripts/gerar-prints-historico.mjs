#!/usr/bin/env node
// Grava como ficaram as telas dos protótipos alterados num commit, para o Histórico:
//   <site>/p/<programa>/<projeto>/<nome>/historico/<commit>/<n>-<tela>.png
// Tira um print de cada tela listada em "telas" do prototype.json (ou só da entrada, se não houver).
// Roda no CI depois de cada mudança que entra na main. Sem Chrome, avisa e segue.
//
// Uso: node scripts/gerar-prints-historico.mjs --site <pasta> --commit <sha completo> <id> [<id>...]

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { RAIZ, git } from "./lib/git.mjs";
import { abrirNavegador, servirPasta, tirarPrint } from "./lib/navegador.mjs";

const args = process.argv.slice(2);
const valor = (nome) => (args.includes(nome) ? args[args.indexOf(nome) + 1] : undefined);
const SITE = resolve(RAIZ, valor("--site") ?? "site");
const COMMIT = valor("--commit") ?? git(["rev-parse", "HEAD"]);
const ids = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));

const alvos = ids.filter((id) => existsSync(join(SITE, "p", id)) && existsSync(join(RAIZ, "prototipos", id, "prototype.json")));
if (!alvos.length) {
  console.log("✔ Prints do histórico: nenhum protótipo alterado.");
  process.exit(0);
}

const navegador = await abrirNavegador("Prints do histórico");
if (!navegador) process.exit(0);
const servidor = await servirPasta(SITE);

for (const id of alvos) {
  const dados = JSON.parse(readFileSync(join(RAIZ, "prototipos", id, "prototype.json"), "utf8"));
  const destino = join(SITE, "p", id, "historico", COMMIT);
  mkdirSync(destino, { recursive: true });
  const telas = dados.telas?.length ? dados.telas : [{ id: "inicio", rota: "" }];
  for (const [n, tela] of telas.entries()) {
    const arquivo = join(destino, `${n + 1}-${tela.id}.png`);
    try {
      await tirarPrint(navegador, `${servidor.base}/p/${id}/${dados.entrada}${tela.rota ?? ""}`, dados.dispositivo, arquivo);
      console.log(`✔ print ${id} · ${tela.id}`);
    } catch (e) {
      console.warn(`⚠ print ${id} · ${tela.id} não gerado: ${e.message.split("\n")[0]}`);
    }
  }
}

await navegador.close();
servidor.fechar();
