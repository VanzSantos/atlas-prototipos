export type Status = "rascunho" | "em-andamento" | "em-revisao" | "aprovado" | "arquivado";

export interface Tela {
  id: string;
  titulo: string;
  rota?: string;
}

export interface Prototipo {
  id: string;
  nome: string;
  caminho: string;
  url: string;
  situacao: "oficial" | "em-andamento";
  titulo: string;
  descricao: string;
  projeto: string;
  modulo: string;
  fluxo: string;
  status: Status;
  donos: string[];
  tags: string[];
  entrada: string;
  origem?: string;
  telas: Tela[];
  git: {
    autores: { nome: string; commits: number }[];
    criadoEm: string | null;
    atualizadoEm: string | null;
    ultimoCommit: string | null;
  };
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
