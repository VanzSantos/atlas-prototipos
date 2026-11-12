import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "selenesdk/tokens/tokens.css";
import "selenesdk/src/base.css";
import "./atlas.css";
import { App } from "./App";

// Acompanha o tema do sistema (claro/escuro), como o SeleneSDK espera: data-theme no <html>.
const escuro = window.matchMedia("(prefers-color-scheme: dark)");
const aplicarTema = () => (document.documentElement.dataset.theme = escuro.matches ? "dark" : "light");
aplicarTema();
escuro.addEventListener("change", aplicarTema);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
