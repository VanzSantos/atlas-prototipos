import { Icon } from "selenesdk/src/components/Icon/Icon";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { formatarDataHora, type EntradaHistorico } from "./tipos";

/** Texto do resumo: parágrafos, listas com "- " e **negrito**. Sem HTML, para ficar seguro. */
function Resumo({ texto }: { texto: string }) {
  const negrito = (linha: string) =>
    linha.split(/(\*\*[^*]+\*\*)/g).map((parte, i) => (parte.startsWith("**") && parte.endsWith("**") ? <strong key={i}>{parte.slice(2, -2)}</strong> : parte));

  return (
    <div className="atlas-historico-resumo">
      {texto.split(/\n\s*\n/).map((bloco, i) => {
        const linhas = bloco.split("\n").map((l) => l.trim()).filter(Boolean);
        if (linhas.length && linhas.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {linhas.map((l, j) => (
                <li key={j}>{negrito(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{negrito(linhas.join(" "))}</p>;
      })}
    </div>
  );
}

/** Linha do tempo das mudanças do protótipo, da mais recente para a mais antiga. */
export function Historico({ entradas }: { entradas: EntradaHistorico[] }) {
  if (!entradas.length) {
    return (
      <div className="atlas-centro">
        <EmptyState icon="clock" title="Nenhuma mudança registrada" description="As mudanças aparecem aqui assim que entram no repositório." />
      </div>
    );
  }

  return (
    <div className="atlas-historico">
      <ol className="atlas-historico-lista">
        {entradas.map((h, i) => (
          <li key={h.sha ?? `local-${i}`} className="atlas-historico-item">
            <span className="atlas-historico-marco" aria-hidden="true" />
            <article>
              <header className="atlas-historico-cabecalho">
                <span className="atlas-historico-quando">
                  <Icon name="clock" size="small" color="var(--icone-secundario)" decorative />
                  {h.data ? formatarDataHora(h.data) : "Ainda não enviado"}
                </span>
                {h.autor && (
                  <span className="atlas-historico-quem">
                    <Icon name="user" size="small" color="var(--icone-secundario)" decorative />
                    {h.autor}
                  </span>
                )}
                {h.prUrl ? (
                  <a className="atlas-historico-pr" href={h.prUrl} target="_blank" rel="noreferrer">
                    PR #{h.pr} ↗
                  </a>
                ) : h.pr ? (
                  <span className="atlas-historico-pr">PR #{h.pr}</span>
                ) : null}
              </header>

              <h2 className="atlas-historico-titulo">{h.titulo}</h2>
              {h.tecnico ? (
                <p className="atlas-historico-aviso">Resumo técnico: esta mudança foi registrada antes dos resumos escritos.</p>
              ) : (
                h.resumo && <Resumo texto={h.resumo} />
              )}

              {h.prints.length > 0 && (
                <ul className="atlas-historico-prints" aria-label="Como as telas ficaram">
                  {h.prints.map((src) => (
                    <li key={src}>
                      <a href={src} target="_blank" rel="noreferrer">
                        <img src={src} alt={`Tela após a mudança: ${src.split("/").pop()?.replace(/\.png$/, "")}`} loading="lazy" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
