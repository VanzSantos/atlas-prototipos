// Funções de git compartilhadas pelos scripts (neutras: funcionam em qualquer CI).
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(fileURLToPath(import.meta.url), "..", "..", "..");

export function git(args) {
  try {
    return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const PASTA = /^prototipos\/([^/]+)\/([^/]+)\/([^/]+)\//;

/** Arquivos alterados entre a base e o HEAD (com status: A, M, D, R...). */
export function arquivosAlterados(base) {
  return git(["diff", "--name-status", "--no-renames", `${base}...HEAD`])
    .split("\n")
    .filter(Boolean)
    .map((linha) => {
      const [status, caminho] = linha.split("\t");
      return { status, caminho };
    });
}

/** Pastas de protótipo (prototipos/<programa>/<projeto>/<nome>) alteradas desde a base. */
export function prototiposAlterados(base) {
  const ids = new Set();
  for (const { caminho } of arquivosAlterados(base)) {
    const m = caminho.match(PASTA);
    if (m) ids.add(`${m[1]}/${m[2]}/${m[3]}`);
  }
  return [...ids].sort();
}

/** Mudou algo fora de prototipos/ (plataforma, scripts, schema...)? Então tudo precisa ser montado. */
export function mudouAlemDosPrototipos(base) {
  return arquivosAlterados(base).some(({ caminho }) => !caminho.startsWith("prototipos/") && !caminho.endsWith(".md"));
}
