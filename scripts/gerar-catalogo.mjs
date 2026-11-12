#!/usr/bin/env node
// Gera o catálogo do Atlas lendo todos os prototipos/<projeto>/<nome>/prototype.json
// e o histórico do git (autoria e datas). O resultado NÃO é commitado.
//
// Uso:
//   node scripts/gerar-catalogo.mjs --saida <arquivo.json> [--previews <arquivo.json>]
//
// --previews (opcional): lista de PRs abertos com preview, produzida pelo CI. Formato:
//   [{ "numero": 12, "titulo": "...", "branch": "...", "url": "https://.../", "pastas": ["prototipos/a/b"] }]
// Variáveis opcionais: ATLAS_AMBIENTE (ex.: oficial, preview), ATLAS_REF (branch ou PR).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(import.meta.url), "..", "..");
const PASTA_PROTOTIPOS = join(RAIZ, "prototipos");

function argumento(nome) {
  const i = process.argv.indexOf(nome);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function git(args) {
  try {
    return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function historico(caminho) {
  const linhas = git(["log", "--format=%H%x1f%an%x1f%aI", "--", caminho]).split("\n").filter(Boolean);
  if (!linhas.length) return { autores: [], criadoEm: null, atualizadoEm: null, ultimoCommit: null };
  const commits = linhas.map((l) => {
    const [sha, autor, data] = l.split("\x1f");
    return { sha, autor, data };
  });
  const contagem = new Map();
  for (const c of commits) contagem.set(c.autor, (contagem.get(c.autor) || 0) + 1);
  return {
    autores: [...contagem].map(([nome, total]) => ({ nome, commits: total })).sort((a, b) => b.commits - a.commits),
    criadoEm: commits.at(-1).data,
    atualizadoEm: commits[0].data,
    ultimoCommit: commits[0].sha.slice(0, 7),
  };
}

function subpastas(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
}

// 1. Só gera catálogo de protótipos válidos.
try {
  execFileSync(process.execPath, [join(RAIZ, "scripts", "validar-prototipos.mjs")], { stdio: ["ignore", "ignore", "inherit"] });
} catch {
  console.error("✖ Catálogo não gerado: corrija os erros de validação acima.");
  process.exit(1);
}

// 2. Lê os protótipos.
const prototipos = [];
for (const projeto of subpastas(PASTA_PROTOTIPOS)) {
  for (const nome of subpastas(join(PASTA_PROTOTIPOS, projeto))) {
    const caminho = `prototipos/${projeto}/${nome}`;
    const dados = JSON.parse(readFileSync(join(RAIZ, caminho, "prototype.json"), "utf8"));
    delete dados.$schema;
    prototipos.push({
      id: `${projeto}/${nome}`,
      nome,
      caminho,
      url: `p/${projeto}/${nome}/${dados.entrada}`,
      situacao: "oficial",
      ...dados,
      descricao: dados.descricao ?? "",
      tags: dados.tags ?? [],
      telas: dados.telas ?? [],
      git: historico(caminho),
    });
  }
}
prototipos.sort((a, b) => a.id.localeCompare(b.id));

// 3. PRs em andamento (opcional, vindos do CI).
const arquivoPreviews = argumento("--previews");
const emAndamento = arquivoPreviews && existsSync(arquivoPreviews) ? JSON.parse(readFileSync(arquivoPreviews, "utf8")) : [];

// 4. Grava.
const catalogo = {
  versao: 1,
  geradoEm: new Date().toISOString(),
  ambiente: process.env.ATLAS_AMBIENTE || "local",
  ref: process.env.ATLAS_REF || git(["rev-parse", "--abbrev-ref", "HEAD"]) || null,
  commit: git(["rev-parse", "--short", "HEAD"]) || null,
  prototipos,
  emAndamento,
};

const saida = resolve(argumento("--saida") || join(RAIZ, "plataforma", "gerado", "catalogo.json"));
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(catalogo, null, 2) + "\n");
console.log(`✔ Catálogo com ${prototipos.length} protótipo(s) em ${saida}`);
