import { Icon } from "selenesdk/src/components/Icon/Icon";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { hrefPrototipo } from "./rotas";
import { DISPOSITIVO_ROTULO, STATUS_ROTULO, formatarData, type Catalogo, type Prototipo } from "./tipos";

interface Props {
  catalogo: Catalogo;
  sobretitulo?: string;
  titulo: string;
  subtitulo?: string;
  prototipos: Prototipo[];
  /** Mostra "Programa › Projeto" em cada cartão (útil em Recentes e na busca). */
  mostrarOrigem?: boolean;
  vazio?: { titulo: string; descricao: string };
}

export function ListaPrototipos({ catalogo, sobretitulo, titulo, subtitulo, prototipos, mostrarOrigem, vazio }: Props) {
  const origem = (p: Prototipo) => {
    const programa = catalogo.programas.find((x) => x.id === p.programa);
    const projeto = programa?.projetos.find((x) => x.id === `${p.programa}/${p.projeto}`);
    return `${programa?.nome ?? p.programa} › ${projeto?.nome ?? p.projeto}`;
  };

  return (
    <div className="atlas-pagina">
      <header className="atlas-cabecalho">
        <div>
          {sobretitulo && <p className="atlas-sobretitulo">{sobretitulo}</p>}
          <h1 className="atlas-titulo">{titulo}</h1>
          <p className="atlas-subtitulo">
            {subtitulo ? `${subtitulo} · ` : ""}
            {prototipos.length} protótipo(s)
          </p>
        </div>
      </header>

      {prototipos.length === 0 ? (
        <EmptyState
          icon="magnifying-glass"
          title={vazio?.titulo ?? "Nenhum protótipo ainda"}
          description={vazio?.descricao ?? "Crie a pasta do primeiro protótipo seguindo o CONTRIBUTING.md."}
        />
      ) : (
        <ul className="atlas-grade">
          {prototipos.map((p) => (
            <li key={p.id}>
              <Cartao prototipo={p} origem={mostrarOrigem ? origem(p) : undefined} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Cartão no estilo "mídia + conteúdo". O cartão inteiro abre o protótipo no visualizador
 * do Atlas (o link do título se estende sobre o cartão), onde ficam Protótipo, Canvas e Mapa.
 */
function Cartao({ prototipo: p, origem }: { prototipo: Prototipo; origem?: string }) {
  return (
    <article className="atlas-cartao">
      <div className={`atlas-miniatura atlas-miniatura-${p.dispositivo}`}>
        {p.miniatura ? <img src={p.miniatura} alt="" loading="lazy" /> : <span>Sem miniatura</span>}
        <span className={`atlas-selo atlas-selo-${p.status}`}>
          <span className="atlas-selo-ponto" aria-hidden="true" />
          {STATUS_ROTULO[p.status]}
        </span>
        <span className="atlas-selo atlas-selo-dispositivo">
          <Icon name={p.dispositivo === "app" ? "device-mobile" : "desktop"} size="small" color="currentColor" decorative />
          {DISPOSITIVO_ROTULO[p.dispositivo]}
        </span>
        <span className="atlas-play" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        </span>
      </div>

      <div className="atlas-cartao-texto">
        <h2 className="atlas-cartao-titulo">
          <a className="atlas-cartao-link" href={hrefPrototipo(p.id)} aria-label={`Rodar o protótipo ${p.fluxo}`}>
            {p.fluxo}
          </a>
        </h2>
        {origem && <p className="atlas-sobretitulo">{origem}</p>}
      </div>

      <ul className="atlas-cartao-meta">
        <li>
          <Icon name="star" size="small" color="var(--icone-secundario)" decorative={false} accessibleLabel="Criado por" />
          <span>
            <strong>{p.git.criadoPor ?? "—"}</strong> em {formatarData(p.git.criadoEm)}
          </span>
        </li>
        <li>
          <Icon name="clock" size="small" color="var(--icone-secundario)" decorative={false} accessibleLabel="Atualizado por" />
          <span>
            <strong>{p.git.alteradoPor ?? "—"}</strong> em {formatarData(p.git.atualizadoEm)}
          </span>
        </li>
      </ul>

      {(p.situacao === "em-andamento" || p.emAndamento.length > 0) && (
        <p className="atlas-cartao-andamento">
          <span className="atlas-selo-ponto" aria-hidden="true" />
          {p.situacao === "em-andamento"
            ? "Alterado nesta mudança"
            : `Mudança em andamento: PR #${p.emAndamento.map((pr) => pr.numero).join(", #")}`}
        </p>
      )}
    </article>
  );
}
