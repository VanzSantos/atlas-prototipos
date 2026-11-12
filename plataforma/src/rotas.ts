// Navegação por hash (funciona em qualquer hospedagem estática, sem configurar servidor):
//   #/recentes                                 protótipos alterados por último
//   #/busca?q=texto                            busca em todos os programas
//   #/projeto/<programa>/<projeto>             protótipos de um projeto
//   #/p/<programa>/<projeto>/<nome>?aba=canvas protótipo aberto dentro do Atlas
import { useEffect, useState } from "react";

export type Aba = "prototipo" | "canvas" | "mapa" | "historico";

export type Rota =
  | { tipo: "recentes" }
  | { tipo: "busca"; termo: string }
  | { tipo: "projeto"; id: string }
  | { tipo: "prototipo"; id: string; aba: Aba; tela: string };

export function lerRota(hash = window.location.hash): Rota {
  const [caminho, consulta = ""] = hash.replace(/^#/, "").split("?");
  const params = new URLSearchParams(consulta);
  const partes = caminho.split("/").filter(Boolean).map(decodeURIComponent);

  if (partes[0] === "p" && partes.length >= 4) {
    const aba = params.get("aba");
    return {
      tipo: "prototipo",
      id: partes.slice(1, 4).join("/"),
      aba: aba === "canvas" || aba === "mapa" || aba === "historico" ? aba : "prototipo",
      tela: params.get("tela") ?? "",
    };
  }
  if (partes[0] === "projeto" && partes.length >= 3) return { tipo: "projeto", id: `${partes[1]}/${partes[2]}` };
  if (partes[0] === "busca" && params.get("q")) return { tipo: "busca", termo: params.get("q")! };
  return { tipo: "recentes" };
}

export const hrefRecentes = () => "#/recentes";
export const hrefProjeto = (id: string) => `#/projeto/${id}`;
export const hrefBusca = (termo: string) => (termo ? `#/busca?${new URLSearchParams({ q: termo })}` : hrefRecentes());

export function hrefPrototipo(id: string, aba: Aba = "prototipo", tela?: string): string {
  const params = new URLSearchParams();
  if (aba !== "prototipo") params.set("aba", aba);
  if (tela) params.set("tela", tela);
  const q = params.toString();
  return `#/p/${id}${q ? `?${q}` : ""}`;
}

/** Troca o endereço sem criar um item no histórico a cada letra digitada. */
export function substituirRota(hash: string) {
  history.replaceState(null, "", hash);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function useRota(): Rota {
  const [rota, setRota] = useState(() => lerRota());
  useEffect(() => {
    const aoMudar = () => setRota(lerRota());
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);
  return rota;
}
