import { useEffect, useState } from "react";
import { Icon } from "selenesdk/src/components/Icon/Icon";
import type { Tela } from "./tipos";

const CHAVE = "atlas:painel-telas-aberto";

function lerAberto(): boolean {
  try {
    return localStorage.getItem(CHAVE) !== "nao";
  } catch {
    return true;
  }
}

interface Props {
  telas: Tela[];
  /** id da tela ativa (a que está aparecendo no protótipo). */
  ativa: string;
  aoEscolher: (id: string) => void;
}

/** Navegação flutuante pelas telas do protótipo, fixa à esquerda, sobre o conteúdo. */
export function PainelTelas({ telas, ativa, aoEscolher }: Props) {
  const [aberto, setAberto] = useState(lerAberto);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, aberto ? "sim" : "nao");
    } catch {
      /* sem armazenamento: só não lembra */
    }
  }, [aberto]);

  if (!aberto) {
    return (
      <button type="button" className="atlas-telas atlas-telas-recolhido" onClick={() => setAberto(true)} aria-expanded={false} aria-controls="atlas-telas-lista">
        <Icon name="list" size="small" color="currentColor" decorative />
        Telas
        <span className="atlas-nav-contagem">{telas.length}</span>
      </button>
    );
  }

  return (
    <nav className="atlas-telas" aria-label="Telas do protótipo">
      <div className="atlas-telas-topo">
        <span className="atlas-telas-titulo">Telas</span>
        <button type="button" className="atlas-telas-recolher" onClick={() => setAberto(false)} aria-expanded aria-controls="atlas-telas-lista" aria-label="Recolher lista de telas">
          <Icon name="caret-left" size="small" color="currentColor" decorative />
        </button>
      </div>
      <ol id="atlas-telas-lista" className="atlas-telas-lista">
        {telas.map((t, i) => (
          <li key={t.id}>
            <button type="button" aria-current={t.id === ativa ? "page" : undefined} onClick={() => aoEscolher(t.id)}>
              <span className="atlas-telas-numero">{i + 1}</span>
              <span className="atlas-telas-nome">{t.titulo}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
