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

/**
 * Arquivos alterados desde o ponto em que a branch saiu da base (status: A, M, D...).
 * Inclui o que ainda não foi commitado, para a checagem funcionar antes do commit também.
 */
export function arquivosAlterados(base) {
  const inicio = git(["merge-base", base, "HEAD"]) || base;
  const mudados = git(["diff", "--name-status", "--no-renames", inicio])
    .split("\n")
    .filter(Boolean)
    .map((linha) => {
      const [status, caminho] = linha.split("\t");
      return { status, caminho };
    });
  const novos = git(["ls-files", "--others", "--exclude-standard"])
    .split("\n")
    .filter(Boolean)
    .map((caminho) => ({ status: "A", caminho }));
  return [...mudados, ...novos];
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
