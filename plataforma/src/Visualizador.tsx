import { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "selenesdk/src/components/SegmentedControl/SegmentedControl";
import { Tabs } from "selenesdk/src/components/Tabs/Tabs";
import { Badge } from "selenesdk/src/components/Badge/Badge";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { hrefPrototipo, hrefProjeto, hrefRecentes, type Aba } from "./rotas";
import { PainelTelas } from "./PainelTelas";
import { Historico } from "./Historico";
import { STATUS_COR, STATUS_ROTULO, formatarData, type Catalogo } from "./tipos";

type Tamanho = "desktop" | "mobile";
const CHAVE_TAMANHO = "atlas:tamanho";

function lerTamanho(): Tamanho {
  try {
    return localStorage.getItem(CHAVE_TAMANHO) === "mobile" ? "mobile" : "desktop";
  } catch {
    return "desktop";
  }
}

/** Abre o protótipo dentro do Atlas, com abas Protótipo / Canvas / Mapa do fluxo. */
export function Visualizador({ catalogo, id, aba, tela }: { catalogo: Catalogo; id: string; aba: Aba; tela: string }) {
  const p = catalogo.prototipos.find((x) => x.id === id);
  const quadro = useRef<HTMLIFrameElement>(null);
  // Rota atual dentro do protótipo (muda quando a pessoa navega clicando no próprio protótipo).
  const [rotaInterna, setRotaInterna] = useState<string | null>(null);
  // Protótipo desktop é responsivo: dá para alternar entre tela cheia e largura de celular.
  const [tamanho, setTamanho] = useState<Tamanho>(lerTamanho);
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_TAMANHO, tamanho);
    } catch {
      /* sem armazenamento: só não lembra */
    }
  }, [tamanho]);

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
  // App é sempre mostrado numa moldura de celular; desktop, conforme o botão.
  const emCelular = aba === "prototipo" && (p.dispositivo === "app" || tamanho === "mobile");
  const telaAtiva =
    p.telas.find((t) => rotaInterna !== null && t.rota === rotaInterna)?.id ?? telaAtual?.id ?? p.telas[0]?.id ?? "";

  // O protótipo é servido do mesmo endereço do Atlas, então dá para acompanhar a navegação dentro dele.
  function acompanharQuadro() {
    setRotaInterna(null);
    try {
      const janela = quadro.current?.contentWindow;
      if (!janela) return;
      const atualizar = () => setRotaInterna(janela.location.hash || null);
      atualizar();
      janela.addEventListener("hashchange", atualizar);
    } catch {
      /* outro endereço: só não acompanha */
    }
  }

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
        {aba === "prototipo" && p.dispositivo === "desktop" && (
          <SegmentedControl
            accessibleLabel="Tamanho da tela"
            value={tamanho}
            onChange={(v) => setTamanho(v as Tamanho)}
            items={[
              { value: "desktop", label: "Desktop", icon: "desktop" },
              { value: "mobile", label: "Mobile", icon: "device-mobile" },
            ]}
          />
        )}
        {aba !== "historico" && (
          <a className="atlas-botao" href={src} target="_blank" rel="noreferrer">
            Nova aba ↗
          </a>
        )}
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
            { value: "historico", label: "Histórico" },
          ]}
        />
      </div>
      {aba === "historico" ? (
        <Historico entradas={p.historico} />
      ) : (
        <div className={`atlas-area${emCelular ? " atlas-area-celular" : ""}`}>
          <div className="atlas-moldura">
            <iframe key={src} ref={quadro} className="atlas-quadro" src={src} title={`${p.fluxo} · ${aba}`} onLoad={acompanharQuadro} />
          </div>
          {aba === "prototipo" && p.telas.length > 0 && (
            <PainelTelas
              telas={p.telas}
              ativa={telaAtiva}
              aoEscolher={(idTela) => (window.location.hash = hrefPrototipo(p.id, "prototipo", idTela))}
            />
          )}
        </div>
      )}
    </div>
  );
}
