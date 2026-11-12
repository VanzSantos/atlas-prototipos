export type Dispositivo = "desktop" | "app";

export const DISPOSITIVO_ROTULO: Record<Dispositivo, string> = { desktop: "Desktop", app: "App" };

export type Status = "rascunho" | "em-andamento" | "em-revisao" | "aprovado" | "arquivado";

export interface Tela {
  id: string;
  titulo: string;
  rota?: string;
}

export interface Historico {
  criadoEm: string | null;
  criadoPor: string | null;
  atualizadoEm: string | null;
  alteradoPor: string | null;
  ultimoCommit: string | null;
  autores: string[];
}

export interface Prototipo {
  id: string; // programa/projeto/nome
  nome: string;
  caminho: string;
  situacao: "oficial" | "em-andamento";
  programa: string;
  projeto: string;
  modulo: string;
  fluxo: string;
  descricao: string;
  status: Status;
  dispositivo: Dispositivo;
  donos: string[];
  tags: string[];
  origem?: string;
  telas: Tela[];
  url: string;
  canvasUrl: string;
  mapaUrl: string;
  miniatura: string | null;
  git: Historico;
}

export interface Projeto {
  id: string; // programa/projeto
  nome: string;
  descricao: string;
  total: number;
}

export interface Programa {
  id: string;
  nome: string;
  descricao: string;
  projetos: Projeto[];
}

export interface PreviewEmAndamento {
  numero: number;
  titulo: string;
  branch: string;
  url: string;
  pastas: string[];
}

export interface Catalogo {
  versao: 1;
  geradoEm: string;
  ambiente: string;
  ref: string | null;
  commit: string | null;
  programas: Programa[];
  prototipos: Prototipo[];
  emAndamento: PreviewEmAndamento[];
}

export const STATUS_ROTULO: Record<Status, string> = {
  rascunho: "Rascunho",
  "em-andamento": "Em andamento",
  "em-revisao": "Em revisão",
  aprovado: "Aprovado",
  arquivado: "Arquivado",
};

export const STATUS_COR: Record<Status, "neutral" | "info" | "warning" | "success" | "dark"> = {
  rascunho: "neutral",
  "em-andamento": "info",
  "em-revisao": "warning",
  aprovado: "success",
  arquivado: "dark",
};

export function formatarData(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
}

/** Versão curta para espaços apertados: 12/11/26. */
export function formatarDataCurta(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
}
