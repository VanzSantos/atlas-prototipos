#!/usr/bin/env node
// Lista os protótipos alterados desde uma base (ex.: origin/main), um por linha.
// Uso: node scripts/pastas-alteradas.mjs --base origin/main [--json]
import { mudouAlemDosPrototipos, prototiposAlterados } from "./lib/git.mjs";

const i = process.argv.indexOf("--base");
const base = i > -1 ? process.argv[i + 1] : "origin/main";
const ids = prototiposAlterados(base);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ base, prototipos: ids, tudo: mudouAlemDosPrototipos(base) }));
} else {
  for (const id of ids) console.log(id);
}
