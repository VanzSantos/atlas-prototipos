import { useEffect, useState } from "react";
import { SideNav, type SideNavItem } from "selenesdk/src/components/SideNav/SideNav";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { Spinner } from "selenesdk/src/components/Spinner/Spinner";
import { Marca } from "./Marca";
import { ListaPrototipos } from "./ListaPrototipos";
import { Visualizador } from "./Visualizador";
import { hrefProjeto, hrefRecentes, useRota, type Rota } from "./rotas";
import type { Catalogo } from "./tipos";

type Estado = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "pronto"; catalogo: Catalogo };

const QUANTIDADE_RECENTES = 30;

export function App() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const rota = useRota();

  useEffect(() => {
    fetch("catalogo.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`catalogo.json respondeu ${r.status}`);
        return r.json();
      })
      .then((catalogo: Catalogo) => setEstado({ tipo: "pronto", catalogo }))
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
    return <Visualizador catalogo={catalogo} id={rota.id} aba={rota.aba} tela={rota.tela} />;
  }

  return (
    <div className="atlas-layout">
      <Navegacao catalogo={catalogo} rota={rota} />
      <main className="atlas-principal">
        {rota.tipo === "recentes" ? (
          <ListaPrototipos
            key="recentes"
            catalogo={catalogo}
            titulo="Recentes"
            subtitulo="Protótipos alterados por último, em todos os programas"
            prototipos={recentes(catalogo).slice(0, QUANTIDADE_RECENTES)}
            mostrarOrigem
            vista={rota.vista}
            filtros={rota.filtros}
            href={(vista, filtros) => hrefRecentes(vista, filtros)}
          />
        ) : (
          <PaginaProjeto catalogo={catalogo} rota={rota} />
        )}
      </main>
    </div>
  );
}

/** Mais recentes primeiro. O que ainda não foi commitado (trabalho local) vem no topo. */
function recentes(catalogo: Catalogo) {
  const data = (iso: string | null) => (iso ? Date.parse(iso) : Infinity);
  return [...catalogo.prototipos].sort((a, b) => data(b.git.atualizadoEm) - data(a.git.atualizadoEm));
}

function PaginaProjeto({ catalogo, rota }: { catalogo: Catalogo; rota: Extract<Rota, { tipo: "projeto" }> }) {
  const [programaId] = rota.id.split("/");
  const programa = catalogo.programas.find((p) => p.id === programaId);
  const projeto = programa?.projetos.find((p) => p.id === rota.id);

  if (!programa || !projeto) {
    return (
      <div className="atlas-centro">
        <EmptyState
          icon="warning-circle"
          title="Projeto não encontrado"
          description="Ele pode ter sido renomeado ou ainda não estar nesta versão."
          actionLabel="Ver recentes"
          onAction={() => (window.location.hash = hrefRecentes())}
        />
      </div>
    );
  }

  return (
    <ListaPrototipos
      key={rota.id}
      catalogo={catalogo}
      sobretitulo={programa.nome}
      titulo={projeto.nome}
      subtitulo={projeto.descricao}
      prototipos={catalogo.prototipos.filter((p) => `${p.programa}/${p.projeto}` === rota.id)}
      vista={rota.vista}
      filtros={rota.filtros}
      href={(vista, filtros) => hrefProjeto(rota.id, vista, filtros)}
    />
  );
}

/** Recentes + categoria Programas → programa → projetos. */
function Navegacao({ catalogo, rota }: { catalogo: Catalogo; rota: Rota }) {
  const projetoAtual = rota.tipo === "projeto" ? rota.id : "";

  const itens: SideNavItem[] = [
    { key: "recentes", label: "Recentes", href: hrefRecentes(), icon: "clock", active: rota.tipo === "recentes" },
    {
      key: "programas",
      label: "Programas",
      children: catalogo.programas.map((programa) => ({
        key: `programa:${programa.id}`,
        label: programa.nome,
        children: programa.projetos.map((projeto) => ({
          key: `projeto:${projeto.id}`,
          label: `${projeto.nome} (${projeto.total})`,
          href: hrefProjeto(projeto.id),
          active: projeto.id === projetoAtual,
        })),
      })),
    },
  ];

  // Começa com a categoria e todos os programas abertos.
  const [abertos, setAbertos] = useState<string[]>(() => ["programas", ...catalogo.programas.map((p) => `programa:${p.id}`)]);

  return <SideNav items={itens} openKeys={abertos} onOpenKeysChange={setAbertos} accessibleLabel="Navegação do Atlas" header={<Marca />} />;
}
