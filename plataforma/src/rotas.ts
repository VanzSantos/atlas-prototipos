// Navegação por hash (funciona em qualquer hospedagem estática, sem configurar servidor):
//   #/recentes?vista=grade                         protótipos alterados por último
//   #/projeto/<programa>/<projeto>?vista=lista      protótipos de um projeto (com filtros)
//   #/p/<programa>/<projeto>/<nome>?aba=canvas      protótipo aberto dentro do Atlas
import { useEffect, useState } from "react";

export const CAMPOS_FILTRO = ["busca", "modulo", "status", "dono", "tag"] as const;
export type CampoFiltro = (typeof CAMPOS_FILTRO)[number];
export type Filtros = Record<CampoFiltro, string>;
export type Vista = "grade" | "lista";
export type Aba = "prototipo" | "canvas" | "mapa";

export type Rota =
  | { tipo: "recentes"; vista: Vista; filtros: Filtros }
  | { tipo: "projeto"; id: string; vista: Vista; filtros: Filtros }
  | { tipo: "prototipo"; id: string; aba: Aba; tela: string };

const CHAVE_VISTA = "atlas:vista";

export function vistaPreferida(): Vista {
  try {
    return localStorage.getItem(CHAVE_VISTA) === "lista" ? "lista" : "grade";
  } catch {
    return "grade";
  }
}

export function lembrarVista(vista: Vista) {
  try {
    localStorage.setItem(CHAVE_VISTA, vista);
  } catch {
    /* sem armazenamento: só não lembra */
  }
}

export function lerRota(hash = window.location.hash): Rota {
  const [caminho, consulta = ""] = hash.replace(/^#/, "").split("?");
  const params = new URLSearchParams(consulta);
  const partes = caminho.split("/").filter(Boolean).map(decodeURIComponent);
  const vista: Vista = params.get("vista") === "lista" ? "lista" : params.get("vista") === "grade" ? "grade" : vistaPreferida();
  const filtros = Object.fromEntries(CAMPOS_FILTRO.map((c) => [c, params.get(c) ?? ""])) as Filtros;

  if (partes[0] === "p" && partes.length >= 4) {
    const aba = params.get("aba");
    return {
      tipo: "prototipo",
      id: partes.slice(1, 4).join("/"),
      aba: aba === "canvas" || aba === "mapa" ? aba : "prototipo",
      tela: params.get("tela") ?? "",
    };
  }
  if (partes[0] === "projeto" && partes.length >= 3) return { tipo: "projeto", id: `${partes[1]}/${partes[2]}`, vista, filtros };
  return { tipo: "recentes", vista, filtros };
}

function consulta(vista?: Vista, filtros: Partial<Filtros> = {}) {
  const params = new URLSearchParams();
  if (vista) params.set("vista", vista);
  for (const c of CAMPOS_FILTRO) if (filtros[c]) params.set(c, filtros[c]!);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export const hrefRecentes = (vista?: Vista, filtros?: Partial<Filtros>) => `#/recentes${consulta(vista, filtros)}`;
export const hrefProjeto = (id: string, vista?: Vista, filtros?: Partial<Filtros>) => `#/projeto/${id}${consulta(vista, filtros)}`;

export function hrefPrototipo(id: string, aba: Aba = "prototipo", tela?: string): string {
  const params = new URLSearchParams();
  if (aba !== "prototipo") params.set("aba", aba);
  if (tela) params.set("tela", tela);
  const q = params.toString();
  return `#/p/${id}${q ? `?${q}` : ""}`;
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
