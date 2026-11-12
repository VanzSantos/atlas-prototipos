#!/usr/bin/env node
// Gera o catálogo do Atlas a partir de:
//   prototipos/<programa>/programa.json             nome do programa (opcional)
//   prototipos/<programa>/<projeto>/projeto.json    nome do projeto (opcional)
//   prototipos/<programa>/<projeto>/<nome>/prototype.json
//   histórico do git (quem criou, quem alterou, datas)
// O resultado NÃO é commitado.
//
// Uso:
//   node scripts/gerar-catalogo.mjs --saida <arquivo.json> [--site <pasta>] [--previews <arquivo.json>]
//
// --site (opcional): pasta do site montado, para saber quais miniaturas existem.
// --previews (opcional): PRs abertos com preview, produzido pelo CI. Formato:
//   [{ "numero": 12, "titulo": "...", "branch": "...", "url": "https://.../", "pastas": ["prototipos/a/b/c"] }]
// Variáveis opcionais: ATLAS_AMBIENTE (ex.: oficial, preview), ATLAS_REF (branch ou PR).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(import.meta.url), "..", "..");
const PASTA_PROTOTIPOS = join(RAIZ, "prototipos");

const argumento = (nome) => {
  const i = process.argv.indexOf(nome);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function git(args) {
  try {
    return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function historico(caminho) {
  const commits = git(["log", "--format=%h%x1f%aN%x1f%aI", "--", caminho])
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [sha, autor, data] = l.split("\x1f");
      return { sha, autor, data };
    });
  if (!commits.length) return { criadoEm: null, criadoPor: null, atualizadoEm: null, alteradoPor: null, ultimoCommit: null, autores: [] };
  // Data de criação segue o prototype.json mesmo se a pasta foi renomeada ou movida.
  const [shaCriacao, autorCriacao, dataCriacao] =
    git(["log", "--follow", "--format=%h%x1f%aN%x1f%aI", "--", `${caminho}/prototype.json`]).split("\n").filter(Boolean).at(-1)?.split("\x1f") ?? [];
  const primeiro = dataCriacao ? { sha: shaCriacao, autor: autorCriacao, data: dataCriacao } : commits.at(-1);
  const ultimo = commits[0];
  return {
    criadoEm: primeiro.data,
    criadoPor: primeiro.autor,
    atualizadoEm: ultimo.data,
    alteradoPor: ultimo.autor,
    ultimoCommit: ultimo.sha,
    autores: [...new Set(commits.map((c) => c.autor))],
  };
}

const subpastas = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name)
    : [];

const lerJson = (arquivo) => (existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, "utf8")) : {});

// "portal-cliente" → "Portal cliente" (quando não há programa.json / projeto.json)
const humanizar = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

// 1. Só gera catálogo de protótipos válidos.
try {
  execFileSync(process.execPath, [join(RAIZ, "scripts", "validar-prototipos.mjs")], { stdio: ["ignore", "ignore", "inherit"] });
} catch {
  console.error("✖ Catálogo não gerado: corrija os erros de validação acima.");
  process.exit(1);
}

const site = argumento("--site") ? resolve(argumento("--site")) : null;

// 2. Programas, projetos e protótipos
const programas = [];
const prototipos = [];
for (const programa of subpastas(PASTA_PROTOTIPOS)) {
  const infoPrograma = lerJson(join(PASTA_PROTOTIPOS, programa, "programa.json"));
  const projetos = [];
  for (const projeto of subpastas(join(PASTA_PROTOTIPOS, programa))) {
    const infoProjeto = lerJson(join(PASTA_PROTOTIPOS, programa, projeto, "projeto.json"));
    const nomes = subpastas(join(PASTA_PROTOTIPOS, programa, projeto));
    projetos.push({
      id: `${programa}/${projeto}`,
      nome: infoProjeto.nome ?? humanizar(projeto),
      descricao: infoProjeto.descricao ?? "",
      total: nomes.length,
    });
    for (const nome of nomes) {
      const id = `${programa}/${projeto}/${nome}`;
      const caminho = `prototipos/${id}`;
      const dados = lerJson(join(RAIZ, caminho, "prototype.json"));
      delete dados.$schema;
      const base = `p/${id}/`;
      prototipos.push({
        id,
        nome,
        caminho,
        situacao: "oficial",
        ...dados,
        modulo: dados.modulo ?? "",
        descricao: dados.descricao ?? "",
        tags: dados.tags ?? [],
        telas: dados.telas ?? [],
        url: base + dados.entrada,
        canvasUrl: base + dados.canvas,
        mapaUrl: base + dados.mapa,
        miniatura: site && existsSync(join(site, base, "miniatura.png")) ? base + "miniatura.png" : null,
        git: historico(caminho),
      });
    }
  }
  programas.push({
    id: programa,
    nome: infoPrograma.nome ?? humanizar(programa),
    descricao: infoPrograma.descricao ?? "",
    projetos: projetos.sort((a, b) => a.nome.localeCompare(b.nome)),
  });
}
programas.sort((a, b) => a.nome.localeCompare(b.nome));

// 3. PRs em andamento (opcional, vindos do CI)
const arquivoPreviews = argumento("--previews");
const emAndamento = arquivoPreviews && existsSync(arquivoPreviews) ? JSON.parse(readFileSync(arquivoPreviews, "utf8")) : [];

// 4. Grava
const catalogo = {
  versao: 1,
  geradoEm: new Date().toISOString(),
  ambiente: process.env.ATLAS_AMBIENTE || "local",
  ref: process.env.ATLAS_REF || git(["rev-parse", "--abbrev-ref", "HEAD"]) || null,
  commit: git(["rev-parse", "--short", "HEAD"]) || null,
  programas,
  prototipos,
  emAndamento,
};

const saida = resolve(argumento("--saida") || join(RAIZ, "plataforma", "gerado", "catalogo.json"));
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(catalogo, null, 2) + "\n");
console.log(`✔ Catálogo: ${programas.length} programa(s), ${prototipos.length} protótipo(s) em ${saida}`);
