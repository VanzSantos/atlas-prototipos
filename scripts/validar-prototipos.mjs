#!/usr/bin/env node
// Valida todos os prototipos/<programa>/<projeto>/<nome>/prototype.json contra schema/prototype.schema.json,
// e os programa.json / projeto.json opcionais contra schema/grupo.schema.json.
// Sem dependências: roda com Node puro, em qualquer CI (GitHub, Azure) ou localmente.
//
// Uso:
//   node scripts/validar-prototipos.mjs              valida todos
//   node scripts/validar-prototipos.mjs <pasta> ...  valida só as pastas indicadas
//
// Sai com código 1 se houver qualquer erro (isso faz o build falhar).

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(import.meta.url), "..", "..");
const PASTA_PROTOTIPOS = join(RAIZ, "prototipos");
const SCHEMA = JSON.parse(readFileSync(join(RAIZ, "schema", "prototype.schema.json"), "utf8"));
const SCHEMA_GRUPO = JSON.parse(readFileSync(join(RAIZ, "schema", "grupo.schema.json"), "utf8"));
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---------- Validador mínimo de JSON Schema (só o que o nosso schema usa) ----------

function tipoDe(valor) {
  if (valor === null) return "null";
  if (Array.isArray(valor)) return "array";
  if (Number.isInteger(valor)) return "integer";
  return typeof valor;
}

function validarSchema(valor, schema, caminho, erros) {
  const onde = caminho || "(raiz)";

  if ("const" in schema && valor !== schema.const) {
    erros.push(`${onde}: deve ser ${JSON.stringify(schema.const)}`);
    return;
  }
  if (schema.enum && !schema.enum.includes(valor)) {
    erros.push(`${onde}: valor "${valor}" inválido. Use um destes: ${schema.enum.join(", ")}`);
    return;
  }
  if (schema.type) {
    const aceitos = [].concat(schema.type);
    const tipo = tipoDe(valor);
    const ok = aceitos.includes(tipo) || (tipo === "integer" && aceitos.includes("number"));
    if (!ok) {
      erros.push(`${onde}: deve ser ${aceitos.join(" ou ")} (veio ${tipo})`);
      return;
    }
  }

  if (typeof valor === "string") {
    if (schema.minLength && valor.length < schema.minLength)
      erros.push(`${onde}: muito curto (mínimo ${schema.minLength} caracteres)`);
    if (schema.maxLength && valor.length > schema.maxLength)
      erros.push(`${onde}: muito longo (máximo ${schema.maxLength} caracteres)`);
    if (schema.pattern && !new RegExp(schema.pattern).test(valor))
      erros.push(`${onde}: formato inválido ("${valor}")`);
  }

  if (Array.isArray(valor)) {
    if (schema.minItems && valor.length < schema.minItems)
      erros.push(`${onde}: precisa de pelo menos ${schema.minItems} item(ns)`);
    if (schema.uniqueItems && new Set(valor.map((v) => JSON.stringify(v))).size !== valor.length)
      erros.push(`${onde}: tem itens repetidos`);
    if (schema.items)
      valor.forEach((item, i) => validarSchema(item, schema.items, `${onde}[${i}]`, erros));
  }

  if (tipoDe(valor) === "object") {
    for (const campo of schema.required || []) {
      if (!(campo in valor)) erros.push(`${caminho ? caminho + "." : ""}${campo}: campo obrigatório faltando`);
    }
    const props = schema.properties || {};
    for (const [campo, sub] of Object.entries(valor)) {
      const dentro = caminho ? `${caminho}.${campo}` : campo;
      if (props[campo]) validarSchema(sub, props[campo], dentro, erros);
      else if (schema.additionalProperties === false)
        erros.push(`${dentro}: campo desconhecido (confira se o nome está certo)`);
    }
  }
}

// ---------- Regras do Atlas que vão além do schema ----------

function regrasDoAtlas(dados, pasta, erros, avisos) {
  const [programa, projeto, nome] = relative(PASTA_PROTOTIPOS, pasta).split(sep);

  for (const [rotulo, valor] of [["programa", programa], ["projeto", projeto], ["protótipo", nome]])
    if (!SLUG.test(valor)) erros.push(`pasta do ${rotulo} "${valor}": use minúsculas e hífen, sem acento`);
  if (typeof dados.programa === "string" && dados.programa !== programa)
    erros.push(`programa: deve ser igual ao nome da pasta ("${programa}"), veio "${dados.programa}"`);
  if (typeof dados.projeto === "string" && dados.projeto !== projeto)
    erros.push(`projeto: deve ser igual ao nome da pasta ("${projeto}"), veio "${dados.projeto}"`);

  validarHistorico(pasta, erros);

  // Canvas e mapa do fluxo são feitos junto com o protótipo. Em rascunho, só avisa.
  for (const campo of ["canvas", "mapa"]) {
    if (typeof dados[campo] === "string" && !existsSync(join(pasta, dados[campo]))) {
      const msg = `${campo}: arquivo "${dados[campo]}" não encontrado na pasta`;
      if (dados.status === "rascunho") avisos.push(`${msg} (obrigatório ao sair de rascunho)`);
      else erros.push(msg);
    }
  }

  if (Array.isArray(dados.telas)) {
    const ids = dados.telas.map((t) => t && t.id);
    const repetidos = ids.filter((id, i) => id && ids.indexOf(id) !== i);
    if (repetidos.length) erros.push(`telas: ids repetidos: ${[...new Set(repetidos)].join(", ")}`);
  }

  // Sem build, a pasta já é a saída estática: o arquivo de entrada precisa existir.
  if (dados.build === null || dados.build === undefined) {
    if (typeof dados.entrada === "string" && !existsSync(join(pasta, dados.entrada)))
      erros.push(`entrada: arquivo "${dados.entrada}" não encontrado na pasta (sem build, ele precisa existir)`);
  }
}

// ---------- Histórico: um arquivo de resumo por mudança ----------
// historico/AAAA-MM-DD-descricao.md, começando com "# Título" e um texto em linguagem simples.

const NOME_HISTORICO = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/;
const MAX_RESUMO = 1500;

function validarHistorico(pasta, erros) {
  const dir = join(pasta, "historico");
  if (!existsSync(dir)) return;
  for (const arquivo of readdirSync(dir)) {
    if (arquivo.startsWith(".")) continue;
    const onde = `historico/${arquivo}`;
    if (!NOME_HISTORICO.test(arquivo)) {
      erros.push(`${onde}: nome deve ser AAAA-MM-DD-descricao.md (ex.: 2026-11-12-tela-de-confirmacao.md)`);
      continue;
    }
    const texto = readFileSync(join(dir, arquivo), "utf8").trim();
    const [primeira, ...resto] = texto.split("\n");
    if (!/^# \S/.test(primeira ?? "")) erros.push(`${onde}: a primeira linha deve ser o título, começando com "# "`);
    const corpo = resto.join("\n").trim();
    if (corpo.length < 20) erros.push(`${onde}: escreva um resumo do que mudou (pelo menos uma frase)`);
    if (corpo.length > MAX_RESUMO) erros.push(`${onde}: resumo longo demais (máximo ${MAX_RESUMO} caracteres)`);
  }
}

// ---------- Descoberta das pastas ----------

function subpastas(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => join(dir, d.name));
}

function encontrarPrototipos() {
  return subpastas(PASTA_PROTOTIPOS).flatMap((programa) => subpastas(programa).flatMap((projeto) => subpastas(projeto)));
}

function validarGrupos() {
  let erros = 0;
  for (const programa of subpastas(PASTA_PROTOTIPOS)) {
    const arquivos = [join(programa, "programa.json"), ...subpastas(programa).map((p) => join(p, "projeto.json"))];
    for (const arquivo of arquivos.filter((a) => existsSync(a))) {
      const lista = [];
      try {
        validarSchema(JSON.parse(readFileSync(arquivo, "utf8")), SCHEMA_GRUPO, "", lista);
      } catch (e) {
        lista.push(`não é um JSON válido: ${e.message}`);
      }
      if (lista.length) {
        erros += lista.length;
        console.error(`✖ ${relative(RAIZ, arquivo)}`);
        for (const e of lista) console.error(`    - ${e}`);
      }
    }
  }
  return erros;
}

function pastasPedidas(args) {
  return args.map((a) => {
    const abs = resolve(a);
    const partes = relative(PASTA_PROTOTIPOS, abs).split(sep);
    if (partes[0] === ".." || partes.length < 3) {
      console.error(`✖ "${a}" não é uma pasta prototipos/<programa>/<projeto>/<nome>`);
      process.exit(1);
    }
    return join(PASTA_PROTOTIPOS, partes[0], partes[1], partes[2]);
  });
}

// ---------- Execução ----------

const args = process.argv.slice(2);
const pastas = [...new Set(args.length ? pastasPedidas(args) : encontrarPrototipos())].filter(
  (p) => existsSync(p) && statSync(p).isDirectory()
);

let totalErros = validarGrupos();
for (const pasta of pastas) {
  const rel = relative(RAIZ, pasta);
  const arquivo = join(pasta, "prototype.json");
  const erros = [];
  const avisos = [];

  if (!existsSync(arquivo)) {
    erros.push("prototype.json não encontrado (toda pasta de protótipo precisa de um)");
  } else {
    let dados;
    try {
      dados = JSON.parse(readFileSync(arquivo, "utf8"));
    } catch (e) {
      erros.push(`prototype.json não é um JSON válido: ${e.message}`);
    }
    if (dados !== undefined) {
      validarSchema(dados, SCHEMA, "", erros);
      if (tipoDe(dados) === "object") regrasDoAtlas(dados, pasta, erros, avisos);
    }
  }

  if (erros.length) {
    totalErros += erros.length;
    console.error(`✖ ${rel}`);
    for (const e of erros) console.error(`    - ${e}`);
  } else {
    console.log(`✔ ${rel}`);
  }
  for (const a of avisos) console.log(`    ⚠ ${a}`);
}

if (pastas.length === 0) console.log("Nenhum protótipo encontrado em prototipos/.");

if (totalErros) {
  console.error(`\n${totalErros} erro(s). Corrija o prototype.json indicado e rode de novo.`);
  process.exit(1);
}
console.log(`\nTudo certo: ${pastas.length} protótipo(s) válido(s).`);
