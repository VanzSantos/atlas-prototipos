import { Select } from "selenesdk/src/components/Select/Select";
import { Badge } from "selenesdk/src/components/Badge/Badge";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { hrefCatalogo, hrefPrototipo } from "./rotas";
import { STATUS_COR, STATUS_ROTULO, type Prototipo } from "./tipos";

const INICIO = "*";

/** Abre o protótipo dentro do Atlas, com troca de tela e link compartilhável. */
export function Visualizador({ prototipo: p, tela }: { prototipo?: Prototipo; tela: string }) {
  if (!p) {
    return (
      <div className="atlas-centro">
        <EmptyState
          icon="warning-circle"
          title="Protótipo não encontrado"
          description="Ele pode ter sido renomeado ou ainda não estar nesta versão."
          actionLabel="Voltar ao catálogo"
          onAction={() => (window.location.hash = hrefCatalogo({}))}
        />
      </div>
    );
  }

  const telaAtual = p.telas.find((t) => t.id === tela);
  const src = `${p.url}${telaAtual?.rota ?? ""}`;

  return (
    <div className="atlas-visualizador">
      <header className="atlas-barra">
        <a className="atlas-botao atlas-botao-sutil" href={hrefCatalogo({ projeto: p.projeto, modulo: p.modulo, fluxo: p.fluxo })}>
          ← Catálogo
        </a>
        <div className="atlas-barra-titulo">
          <strong>{p.titulo}</strong>
          <span className="atlas-meta">
            {p.projeto} › {p.modulo} › {p.fluxo}
          </span>
        </div>
        <Badge variant={STATUS_COR[p.status]} label={STATUS_ROTULO[p.status]} />
        {p.telas.length > 0 && (
          <div className="atlas-barra-tela">
            <Select
              label="Tela"
              options={[{ value: INICIO, label: "Início" }, ...p.telas.map((t) => ({ value: t.id, label: t.titulo }))]}
              value={telaAtual?.id ?? INICIO}
              onChange={(id) => (window.location.hash = hrefPrototipo(p.id, id === INICIO ? "" : id))}
            />
          </div>
        )}
        <a className="atlas-botao" href={src} target="_blank" rel="noreferrer">
          Nova aba ↗
        </a>
      </header>
      <iframe key={src} className="atlas-quadro" src={src} title={p.titulo} />
    </div>
  );
}
