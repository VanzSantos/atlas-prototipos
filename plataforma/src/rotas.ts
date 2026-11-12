// Navegação por hash (funciona em qualquer hospedagem estática, sem configurar servidor):
//   #/?projeto=x&modulo=y&status=z     catálogo filtrado (link compartilhável)
//   #/p/<projeto>/<nome>?tela=<id>     protótipo aberto (opcionalmente numa tela)
import { useEffect, useState } from "react";

export const CAMPOS_FILTRO = ["projeto", "modulo", "fluxo", "status", "dono", "tag", "busca"] as const;
export type CampoFiltro = (typeof CAMPOS_FILTRO)[number];
export type Filtros = Record<CampoFiltro, string>;

export type Rota =
  | { tipo: "catalogo"; filtros: Filtros }
  | { tipo: "prototipo"; id: string; tela: string };

export function lerRota(hash = window.location.hash): Rota {
  const [caminho, consulta = ""] = hash.replace(/^#/, "").split("?");
  const params = new URLSearchParams(consulta);
  const partes = caminho.split("/").filter(Boolean);
  if (partes[0] === "p" && partes.length >= 3) {
    return { tipo: "prototipo", id: `${partes[1]}/${partes[2]}`, tela: params.get("tela") ?? "" };
  }
  const filtros = Object.fromEntries(CAMPOS_FILTRO.map((c) => [c, params.get(c) ?? ""])) as Filtros;
  return { tipo: "catalogo", filtros };
}

export function hrefCatalogo(filtros: Partial<Filtros>): string {
  const params = new URLSearchParams();
  for (const c of CAMPOS_FILTRO) if (filtros[c]) params.set(c, filtros[c]!);
  const q = params.toString();
  return `#/${q ? `?${q}` : ""}`;
}

export function hrefPrototipo(id: string, tela?: string): string {
  return `#/p/${id}${tela ? `?tela=${encodeURIComponent(tela)}` : ""}`;
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
