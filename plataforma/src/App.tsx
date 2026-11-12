import { useEffect, useMemo, useState } from "react";
import { SideNav, type SideNavItem } from "selenesdk/src/components/SideNav/SideNav";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { Spinner } from "selenesdk/src/components/Spinner/Spinner";
import { Catalogo } from "./Catalogo";
import { Visualizador } from "./Visualizador";
import { hrefCatalogo, useRota, type Filtros } from "./rotas";
import type { Catalogo as CatalogoDados, Prototipo } from "./tipos";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; catalogo: CatalogoDados };

export function App() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const rota = useRota();

  useEffect(() => {
    fetch("catalogo.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`catalogo.json respondeu ${r.status}`);
        return r.json();
      })
      .then((catalogo: CatalogoDados) => setEstado({ tipo: "pronto", catalogo }))
      .catch((e: Error) => setEstado({ tipo: "erro", mensagem: e.message }));
  }, []);

  if (estado.tipo === "carregando") {
    return (
      <div className="atlas-centro">
        <Spinner color="var(--acao-primaria)" decorative={false} accessibleLabel="Carregando catálogo" />
      </div>
    );
  }
  if (estado.tipo === "erro") {
    return (
      <div className="atlas-centro">
        <EmptyState
          icon="warning-circle"
          title="Não foi possível carregar o catálogo"
          description={`${estado.mensagem}. Rode "npm run dev" na raiz do repositório.`}
        />
      </div>
    );
  }

  const { catalogo } = estado;

  if (rota.tipo === "prototipo") {
    const prototipo = catalogo.prototipos.find((p) => p.id === rota.id);
    return <Visualizador prototipo={prototipo} tela={rota.tela} />;
  }

  return (
    <div className="atlas-layout">
      <Navegacao prototipos={catalogo.prototipos} filtros={rota.filtros} />
      <main className="atlas-principal">
        <Catalogo catalogo={catalogo} filtros={rota.filtros} />
      </main>
    </div>
  );
}

/** Árvore Projeto → Módulo → Fluxo, montada a partir dos próprios protótipos. */
function Navegacao({ prototipos, filtros }: { prototipos: Prototipo[]; filtros: Filtros }) {
  const arvore = useMemo(() => {
    const mapa = new Map<string, Map<string, Set<string>>>();
    for (const p of prototipos) {
      if (!mapa.has(p.projeto)) mapa.set(p.projeto, new Map());
      const modulos = mapa.get(p.projeto)!;
      if (!modulos.has(p.modulo)) modulos.set(p.modulo, new Set());
      modulos.get(p.modulo)!.add(p.fluxo);
    }
    return mapa;
  }, [prototipos]);

  const itens: SideNavItem[] = [
    {
      key: "todos",
      label: `Todos (${prototipos.length})`,
      href: hrefCatalogo({}),
      icon: "house",
      active: !filtros.projeto,
    },
    ...[...arvore].map(([projeto, modulos]) => ({
      key: `p:${projeto}`,
      label: projeto,
      children: [
        {
          key: `p:${projeto}:todos`,
          label: "Todo o projeto",
          href: hrefCatalogo({ projeto }),
          active: filtros.projeto === projeto && !filtros.modulo,
        },
        ...[...modulos].map(([modulo, fluxos]) => ({
          key: `m:${projeto}:${modulo}`,
          label: modulo,
          children: [...fluxos].map((fluxo) => ({
            key: `f:${projeto}:${modulo}:${fluxo}`,
            label: fluxo,
            href: hrefCatalogo({ projeto, modulo, fluxo }),
            active: filtros.projeto === projeto && filtros.modulo === modulo && filtros.fluxo === fluxo,
          })),
        })),
      ],
    })),
  ];

  const [abertos, setAbertos] = useState<string[]>(() =>
    filtros.projeto ? [`p:${filtros.projeto}`, `m:${filtros.projeto}:${filtros.modulo}`] : [...arvore.keys()].map((p) => `p:${p}`)
  );

  return (
    <SideNav
      items={itens}
      openKeys={abertos}
      onOpenKeysChange={setAbertos}
      accessibleLabel="Projetos"
      header={<span className="atlas-marca">Atlas</span>}
    />
  );
}
