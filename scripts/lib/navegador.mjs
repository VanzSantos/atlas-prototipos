// Navegador sem janela (Chrome via playwright-core) e servidor estático temporário,
// usados para tirar prints dos protótipos já montados no site.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

/** Tamanho da tela de cada dispositivo. */
export const TELAS = {
  desktop: { width: 1280, height: 800, deviceScaleFactor: 1 },
  app: { width: 390, height: 844, deviceScaleFactor: 2 },
};

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/** Abre o Chrome. Sem playwright-core ou sem Chrome, devolve null e explica o motivo. */
export async function abrirNavegador(rotulo) {
  let chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    console.warn(`⚠ ${rotulo} pulados: rode npm install na raiz (falta playwright-core).`);
    return null;
  }
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    console.warn(`⚠ ${rotulo} pulados: Google Chrome não encontrado nesta máquina.`);
    return null;
  }
}

/** Serve uma pasta em 127.0.0.1 numa porta livre. Devolve { base, fechar }. */
export async function servirPasta(pasta) {
  const servidor = createServer((req, res) => {
    let caminho = join(pasta, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (existsSync(caminho) && statSync(caminho).isDirectory()) caminho = join(caminho, "index.html");
    if (!caminho.startsWith(pasta) || !existsSync(caminho)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TIPOS[extname(caminho)] ?? "application/octet-stream" });
    res.end(readFileSync(caminho));
  });
  await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
  return { base: `http://127.0.0.1:${servidor.address().port}`, fechar: () => servidor.close() };
}

/** Abre a URL no tamanho do dispositivo e salva o print. */
export async function tirarPrint(navegador, url, dispositivo, arquivo) {
  const { width, height, deviceScaleFactor } = TELAS[dispositivo === "app" ? "app" : "desktop"];
  const pagina = await navegador.newPage({ viewport: { width, height }, deviceScaleFactor, isMobile: dispositivo === "app" });
  try {
    await pagina.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    await pagina.waitForTimeout(300);
    await pagina.screenshot({ path: arquivo });
  } finally {
    await pagina.close();
  }
}
