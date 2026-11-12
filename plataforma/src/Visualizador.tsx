import { Select } from "selenesdk/src/components/Select/Select";
import { Tabs } from "selenesdk/src/components/Tabs/Tabs";
import { Badge } from "selenesdk/src/components/Badge/Badge";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { hrefPrototipo, hrefProjeto, hrefRecentes, type Aba } from "./rotas";
import { STATUS_COR, STATUS_ROTULO, formatarData, type Catalogo } from "./tipos";

const INICIO = "*";

/** Abre o protótipo dentro do Atlas, com abas Protótipo / Canvas / Mapa do fluxo. */
export function Visualizador({ catalogo, id, aba, tela }: { catalogo: Catalogo; id: string; aba: Aba; tela: string }) {
  const p = catalogo.prototipos.find((x) => x.id === id);

  if (!p) {
    return (
      <div className="atlas-centro">
        <EmptyState
          icon="warning-circle"
          title="Protótipo não encontrado"
          description="Ele pode ter sido renomeado ou ainda não estar nesta versão."
          actionLabel="Ver recentes"
          onAction={() => (window.location.hash = hrefRecentes())}
        />
      </div>
    );
  }

  const programa = catalogo.programas.find((x) => x.id === p.programa);
  const projeto = programa?.projetos.find((x) => x.id === `${p.programa}/${p.projeto}`);
  const telaAtual = p.telas.find((t) => t.id === tela);
  const src = aba === "canvas" ? p.canvasUrl : aba === "mapa" ? p.mapaUrl : `${p.url}${telaAtual?.rota ?? ""}`;

  return (
    <div className="atlas-visualizador">
      <header className="atlas-barra">
        <a className="atlas-botao atlas-botao-sutil" href={hrefProjeto(`${p.programa}/${p.projeto}`)}>
          ← {projeto?.nome ?? p.projeto}
        </a>
        <div className="atlas-barra-titulo">
          <strong>{p.fluxo}</strong>
          <span className="atlas-meta">
            {programa?.nome ?? p.programa} › {projeto?.nome ?? p.projeto} · alterado em {formatarData(p.git.atualizadoEm)} por{" "}
            {p.git.alteradoPor ?? "—"}
          </span>
        </div>
        <Badge variant={STATUS_COR[p.status]} label={STATUS_ROTULO[p.status]} />
        {aba === "prototipo" && p.telas.length > 0 && (
          <div className="atlas-barra-tela">
            <Select
              label="Tela"
              options={[{ value: INICIO, label: "Início" }, ...p.telas.map((t) => ({ value: t.id, label: t.titulo }))]}
              value={telaAtual?.id ?? INICIO}
              onChange={(v) => (window.location.hash = hrefPrototipo(p.id, "prototipo", v === INICIO ? "" : v))}
            />
          </div>
        )}
        <a className="atlas-botao" href={src} target="_blank" rel="noreferrer">
          Nova aba ↗
        </a>
      </header>
      <div className="atlas-barra-abas">
        <Tabs
          accessibleLabel="O que ver"
          value={aba}
          onChange={(v) => (window.location.hash = hrefPrototipo(p.id, v as Aba))}
          items={[
            { value: "prototipo", label: "Protótipo" },
            { value: "canvas", label: "Canvas" },
            { value: "mapa", label: "Mapa do fluxo" },
          ]}
        />
      </div>
      <iframe key={src} className="atlas-quadro" src={src} title={`${p.fluxo} · ${aba}`} />
    </div>
  );
}
