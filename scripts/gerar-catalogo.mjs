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
//        [--alterados id,id] [--oficial-url <url>] [--publicado <pasta>]
//
// --site (opcional): pasta do site montado, para saber quais miniaturas e prints existem.
// --alterados: protótipos mudados neste PR (aparecem como "em andamento" no preview).
// --oficial-url + --publicado: no preview, protótipos que não foram montados apontam para a
//   versão oficial (url) e as imagens são procuradas na cópia do site publicado (pasta).
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

// ---------- Histórico de mudanças ----------
// Cada mudança que entra (normalmente um PR com squash) é um commit na pasta do protótipo.
// O texto vem de historico/*.md, adicionado no mesmo commit. Sem esse arquivo, usa a mensagem
// do commit e marca como "resumo técnico". Data, hora, autor e número do PR vêm do git.

/** Endereço web do repositório, para montar o link do PR (GitHub ou Azure DevOps). */
function enderecoRepositorio() {
  if (process.env.ATLAS_REPO_URL) return process.env.ATLAS_REPO_URL.replace(/\/$/, "");
  const remoto = git(["remote", "get-url", "origin"]);
  const github = remoto.match(/github\.com[:/](.+?)(\.git)?$/);
  if (github) return `https://github.com/${github[1]}`;
  const azure = remoto.match(/dev\.azure\.com[:/](?:v3\/)?(.+?)$/);
  if (azure) return `https://dev.azure.com/${azure[1].replace(/^([^/]+)\/([^/]+)\/([^/]+)$/, "$1/$2/_git/$3")}`;
  return null;
}
const REPOSITORIO = enderecoRepositorio();

function linkDoPr(numero) {
  if (!REPOSITORIO || !numero) return null;
  return REPOSITORIO.includes("dev.azure.com") ? `${REPOSITORIO}/pullrequest/${numero}` : `${REPOSITORIO}/pull/${numero}`;
}

/** "# Título\n\ntexto" → { titulo, resumo } */
function lerResumo(arquivo) {
  const [primeira = "", ...resto] = readFileSync(arquivo, "utf8").trim().split("\n");
  return { titulo: primeira.replace(/^#\s*/, "").trim(), resumo: resto.join("\n").trim() };
}

function historicoDoPrototipo(caminho, imagens, id) {
  const saida = git(["log", "--name-status", "--format=@@%H%x1f%aN%x1f%cI%x1f%s", "--", caminho]);
  const entradas = [];
  const usados = new Set();
  for (const bloco of saida.split("@@").filter(Boolean)) {
    const [cabecalho, ...linhas] = bloco.trim().split("\n");
    const [shaCompleto, autor, data, assunto] = cabecalho.split("\x1f");
    const sha = shaCompleto.slice(0, 7);
    const pr = Number(assunto.match(/\(#(\d+)\)\s*$/)?.[1]) || null;
    const adicionados = linhas
      .map((l) => l.split("\t"))
      .filter(([status, arq]) => status === "A" && arq?.startsWith(`${caminho}/historico/`) && arq.endsWith(".md"))
      .map(([, arq]) => arq);
    const prints = prints_de(imagens.pasta, id, shaCompleto).map((src) => imagens.prefixo + src);
    const base = { sha, data, autor, pr, prUrl: linkDoPr(pr), prints };
    const existentes = adicionados.filter((arq) => existsSync(join(RAIZ, arq)));
    if (existentes.length) {
      for (const arq of existentes) {
        usados.add(arq);
        entradas.push({ ...base, ...lerResumo(join(RAIZ, arq)), tecnico: false });
      }
    } else {
      entradas.push({ ...base, titulo: assunto.replace(/\s*\(#\d+\)\s*$/, ""), resumo: "", tecnico: true });
    }
  }
  // Resumos ainda não commitados (trabalho local ou PR em preparação)
  const dir = join(RAIZ, caminho, "historico");
  if (existsSync(dir)) {
    for (const nome of readdirSync(dir).filter((n) => n.endsWith(".md")).sort().reverse()) {
      const arq = `${caminho}/historico/${nome}`;
      if (usados.has(arq) || git(["log", "-1", "--format=%h", "--", arq])) continue;
      entradas.unshift({ sha: null, data: null, autor: null, pr: null, prUrl: null, prints: [], ...lerResumo(join(RAIZ, arq)), tecnico: false });
    }
  }
  return entradas;
}

/** Prints de "como ficou" após a mudança, gravados pelo CI em <site>/p/<id>/historico/<sha>/*.png */
function prints_de(site, id, sha) {
  if (!site) return [];
  const dir = join(site, "p", id, "historico", sha);
  return existsSync(dir)
    ? readdirSync(dir).filter((n) => n.endsWith(".png")).sort().map((n) => `p/${id}/historico/${sha}/${n}`)
    : [];
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
const alterados = new Set((argumento("--alterados") ?? "").split(",").filter(Boolean));
const oficialUrl = argumento("--oficial-url") ? argumento("--oficial-url").replace(/\/?$/, "/") : null;
const publicado = argumento("--publicado") ? resolve(argumento("--publicado")) : null;

/** De onde vêm as páginas e imagens de um protótipo: deste site ou da versão oficial publicada. */
function origemDe(id) {
  const montadoAqui = site && existsSync(join(site, "p", id));
  return !montadoAqui && oficialUrl ? { prefixo: oficialUrl, pasta: publicado } : { prefixo: "", pasta: site };
}

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
      const imagens = origemDe(id);
      const url = (arquivo) => imagens.prefixo + base + arquivo;
      prototipos.push({
        id,
        nome,
        caminho,
        situacao: alterados.has(id) ? "em-andamento" : "oficial",
        ...dados,
        modulo: dados.modulo ?? "",
        descricao: dados.descricao ?? "",
        tags: dados.tags ?? [],
        telas: dados.telas ?? [],
        url: url(dados.entrada),
        canvasUrl: url(dados.canvas),
        mapaUrl: url(dados.mapa),
        miniatura: imagens.pasta && existsSync(join(imagens.pasta, base, "miniatura.png")) ? url("miniatura.png") : null,
        git: historico(caminho),
        historico: historicoDoPrototipo(caminho, imagens, id),
        emAndamento: [],
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
for (const pr of emAndamento) {
  for (const p of prototipos) {
    if (pr.pastas?.some((pasta) => pasta === p.caminho || pasta.startsWith(`${p.caminho}/`)))
      p.emAndamento.push({ numero: pr.numero, titulo: pr.titulo, autor: pr.autor ?? null, url: pr.url });
  }
}

// 4. Grava
const catalogo = {
  versao: 1,
  geradoEm: new Date().toISOString(),
  ambiente: process.env.ATLAS_AMBIENTE || "local",
  ref: process.env.ATLAS_REF || git(["rev-parse", "--abbrev-ref", "HEAD"]) || null,
  commit: git(["rev-parse", "--short", "HEAD"]) || null,
  repositorio: REPOSITORIO,
  programas,
  prototipos,
  emAndamento,
};

const saida = resolve(argumento("--saida") || join(RAIZ, "plataforma", "gerado", "catalogo.json"));
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(catalogo, null, 2) + "\n");
console.log(`✔ Catálogo: ${programas.length} programa(s), ${prototipos.length} protótipo(s) em ${saida}`);
