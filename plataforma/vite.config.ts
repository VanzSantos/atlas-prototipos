import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" = todos os caminhos são relativos. O mesmo build funciona na raiz do site,
// num subcaminho do GitHub Pages ou num preview de PR, sem configuração extra.
export default defineConfig(({ command }) => ({
  base: "./",
  plugins: [react()],
  // Em desenvolvimento, serve o catálogo e os protótipos montados em gerado/.
  publicDir: command === "serve" ? "gerado" : false,
  resolve: { dedupe: ["react", "react-dom"] },
  // O SeleneSDK vem como código-fonte (TSX + CSS Modules), então o Vite compila junto.
  optimizeDeps: {
    exclude: ["selenesdk"],
    include: ["react", "react-dom", "react-dom/client", "@floating-ui/react", "@phosphor-icons/react"],
  },
}));
