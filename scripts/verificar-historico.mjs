#!/usr/bin/env node
// Garante que todo protótipo alterado num PR ganhou um resumo NOVO em historico/.
// Falha (código 1) se faltar. Neutro: roda em qualquer CI, comparando com a branch de destino.
//
// Uso: node scripts/verificar-historico.mjs --base origin/main
import { existsSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, arquivosAlterados, prototiposAlterados } from "./lib/git.mjs";

const i = process.argv.indexOf("--base");
const base = i > -1 ? process.argv[i + 1] : "origin/main";
const alterados = prototiposAlterados(base);
const novos = arquivosAlterados(base).filter(({ status }) => status === "A").map(({ caminho }) => caminho);

let faltando = 0;
for (const id of alterados) {
  // Protótipo apagado no PR não precisa de resumo.
  if (!existsSync(join(RAIZ, "prototipos", id))) continue;
  const temResumo = novos.some((c) => c.startsWith(`prototipos/${id}/historico/`) && c.endsWith(".md"));
  if (temResumo) {
    console.log(`✔ ${id}: resumo no histórico`);
  } else {
    faltando++;
    console.error(`✖ ${id}: falta o resumo desta mudança`);
    console.error(`    Crie prototipos/${id}/historico/AAAA-MM-DD-descricao.md com "# Título" e um resumo em linguagem simples.`);
  }
}

if (!alterados.length) console.log("Nenhum protótipo alterado neste PR.");
if (faltando) {
  console.error(`\n${faltando} protótipo(s) sem resumo no histórico. Veja o modelo no AGENTS.md.`);
  process.exit(1);
}
