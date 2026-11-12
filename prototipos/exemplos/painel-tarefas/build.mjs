// Build de exemplo: copia src/ para dist/ e carimba a data.
// Num protótipo real, aqui estaria o "npm run build" do Vite, Next export etc.
import { cpSync, rmSync, readFileSync, writeFileSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
cpSync("src", "dist", { recursive: true });
const html = readFileSync("dist/index.html", "utf8").replace("{{GERADO_EM}}", new Date().toISOString());
writeFileSync("dist/index.html", html);
console.log("dist/ gerado.");
