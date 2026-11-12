import { useEffect, useState } from "react";
import { SideNav, type SideNavItem } from "selenesdk/src/components/SideNav/SideNav";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { Spinner } from "selenesdk/src/components/Spinner/Spinner";
import { TextField } from "selenesdk/src/components/TextField/TextField";
import { Marca } from "./Marca";
import { ListaPrototipos } from "./ListaPrototipos";
import { Visualizador } from "./Visualizador";
import { hrefBusca, hrefProjeto, hrefRecentes, substituirRota, useRota, type Rota } from "./rotas";
import type { Catalogo, Prototipo } from "./tipos";

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
        {rota.tipo === "recentes" && (
          <ListaPrototipos
            catalogo={catalogo}
            titulo="Recentes"
            subtitulo="Protótipos alterados por último, em todos os programas"
            prototipos={recentes(catalogo).slice(0, QUANTIDADE_RECENTES)}
            mostrarOrigem
          />
        )}
        {rota.tipo === "busca" && (
          <ListaPrototipos
            catalogo={catalogo}
            titulo={`Resultados para “${rota.termo}”`}
            subtitulo="Em todos os programas"
            prototipos={buscar(catalogo, rota.termo)}
            mostrarOrigem
            vazio={{ titulo: "Nada encontrado", descricao: "Tente outro termo: nome do fluxo, projeto, programa, tag ou pessoa." }}
          />
        )}
        {rota.tipo === "projeto" && <PaginaProjeto catalogo={catalogo} rota={rota} />}
      </main>
    </div>
  );
}

const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Busca genérica: fluxo, descrição, módulo, programa, projeto, tags e pessoas. Todos os termos precisam aparecer. */
function buscar(catalogo: Catalogo, termo: string): Prototipo[] {
  const termos = normalizar(termo).split(/\s+/).filter(Boolean);
  const nomes = new Map<string, string>();
  for (const prog of catalogo.programas) {
    nomes.set(prog.id, prog.nome);
    for (const proj of prog.projetos) nomes.set(proj.id, proj.nome);
  }
  return recentes(catalogo).filter((p) => {
    const alvo = normalizar(
      [p.fluxo, p.descricao, p.modulo, nomes.get(p.programa), nomes.get(`${p.programa}/${p.projeto}`), ...p.tags, ...p.git.autores, ...p.donos].join(" ")
    );
    return termos.every((t) => alvo.includes(t));
  });
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
      catalogo={catalogo}
      sobretitulo={programa.nome}
      titulo={projeto.nome}
      subtitulo={projeto.descricao}
      prototipos={catalogo.prototipos.filter((p) => `${p.programa}/${p.projeto}` === rota.id)}
    />
  );
}

/**
 * Rótulo com a quantidade num chip discreto.
 * O SideNav do SeleneSDK tipa `label` como texto, mas só o desenha dentro de um <span>;
 * por isso um elemento funciona aqui. Se o SideNav ganhar suporte a contagem, trocar por ele.
 */
function rotuloComContagem(texto: string, total: number): string {
  return (
    <span className="atlas-nav-rotulo">
      <span>{texto}</span>
      <span className="atlas-nav-contagem" aria-label={`${total} protótipo(s)`}>
        {total}
      </span>
    </span>
  ) as unknown as string;
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
          label: rotuloComContagem(projeto.nome, projeto.total),
          href: hrefProjeto(projeto.id),
          active: projeto.id === projetoAtual,
        })),
      })),
    },
  ];

  // Começa com a categoria e todos os programas abertos.
  const [abertos, setAbertos] = useState<string[]>(() => ["programas", ...catalogo.programas.map((p) => `programa:${p.id}`)]);

  const termo = rota.tipo === "busca" ? rota.termo : "";
  const cabecalho = (
    <div className="atlas-nav-cabecalho">
      <Marca />
      <div role="search">
        <TextField
          accessibleLabel="Buscar protótipos"
          placeholder="Buscar"
          leftIcon="magnifying-glass"
          value={termo}
          onChange={(v) => substituirRota(hrefBusca(v.trimStart()))}
        />
      </div>
    </div>
  );

  // "Programas" é só o título da categoria: fica sempre aberto. Programas e projetos recolhem.
  const mudarAbertos = (chaves: string[]) => setAbertos(chaves.includes("programas") ? chaves : ["programas", ...chaves]);

  return <SideNav items={itens} openKeys={abertos} onOpenKeysChange={mudarAbertos} accessibleLabel="Navegação do Atlas" header={cabecalho} />;
}
