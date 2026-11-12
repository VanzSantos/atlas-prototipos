import { useMemo } from "react";
import { Select, type SelectOption } from "selenesdk/src/components/Select/Select";
import { TextField } from "selenesdk/src/components/TextField/TextField";
import { SegmentedControl } from "selenesdk/src/components/SegmentedControl/SegmentedControl";
import { Icon } from "selenesdk/src/components/Icon/Icon";
import { Badge } from "selenesdk/src/components/Badge/Badge";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { Button } from "selenesdk/src/components/Button/Button";
import { hrefPrototipo, lembrarVista, type CampoFiltro, type Filtros, type Vista } from "./rotas";
import { STATUS_COR, STATUS_ROTULO, formatarData, type Catalogo, type Prototipo, type Status } from "./tipos";

/** O Select não mostra rótulo para valor vazio, então "Todos" usa um valor próprio. */
const TODOS = "*";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function opcoes(valores: Iterable<string>, rotulo: (v: string) => string = (v) => v): SelectOption[] {
  const unicos = [...new Set(valores)].filter(Boolean).sort((a, b) => a.localeCompare(b));
  return [{ value: TODOS, label: "Todos" }, ...unicos.map((v) => ({ value: v, label: rotulo(v) }))];
}

function combina(p: Prototipo, f: Filtros) {
  if (f.modulo && p.modulo !== f.modulo) return false;
  if (f.status && p.status !== f.status) return false;
  if (f.dono && !p.donos.includes(f.dono)) return false;
  if (f.tag && !p.tags.includes(f.tag)) return false;
  if (f.busca) {
    const alvo = normalizar([p.fluxo, p.descricao, p.modulo, p.git.alteradoPor ?? "", ...p.tags].join(" "));
    if (!normalizar(f.busca).split(/\s+/).every((termo) => alvo.includes(termo))) return false;
  }
  return true;
}

interface Props {
  catalogo: Catalogo;
  sobretitulo?: string;
  titulo: string;
  subtitulo?: string;
  prototipos: Prototipo[];
  /** Mostra "Programa › Projeto" em cada item (útil em Recentes). */
  mostrarOrigem?: boolean;
  vista: Vista;
  filtros: Filtros;
  href: (vista: Vista, filtros: Partial<Filtros>) => string;
}

export function ListaPrototipos({ catalogo, sobretitulo, titulo, subtitulo, prototipos, mostrarOrigem, vista, filtros, href }: Props) {
  const lista = useMemo(() => prototipos.filter((p) => combina(p, filtros)), [prototipos, filtros]);
  const temFiltro = Object.values(filtros).some(Boolean);
  const temModulo = prototipos.some((p) => p.modulo);

  const ir = (v: Vista, f: Partial<Filtros>) => (window.location.hash = href(v, f));
  const mudar = (campo: CampoFiltro, valor: string) => ir(vista, { ...filtros, [campo]: valor === TODOS ? "" : valor });
  const mudarVista = (v: string) => {
    lembrarVista(v as Vista);
    ir(v as Vista, filtros);
  };

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
            {lista.length} protótipo(s)
          </p>
        </div>
        <SegmentedControl
          accessibleLabel="Forma de visualizar"
          value={vista}
          onChange={mudarVista}
          items={[
            { value: "grade", label: "Miniaturas", icon: "image" },
            { value: "lista", label: "Lista", icon: "rows" },
          ]}
        />
      </header>

      <section className="atlas-filtros" aria-label="Filtros">
        <div className="atlas-busca">
          <TextField
            accessibleLabel="Buscar protótipos"
            placeholder="Buscar por fluxo, descrição, tag ou pessoa"
            leftIcon="magnifying-glass"
            value={filtros.busca}
            onChange={(v) => mudar("busca", v)}
          />
        </div>
        {temModulo && (
          <Select label="Módulo" options={opcoes(prototipos.map((p) => p.modulo))} value={filtros.modulo || TODOS} onChange={(v) => mudar("modulo", v)} />
        )}
        <Select
          label="Status"
          options={opcoes(prototipos.map((p) => p.status), (v) => STATUS_ROTULO[v as Status])}
          value={filtros.status || TODOS}
          onChange={(v) => mudar("status", v)}
        />
        <Select label="Dono" options={opcoes(prototipos.flatMap((p) => p.donos))} value={filtros.dono || TODOS} onChange={(v) => mudar("dono", v)} />
        <Select label="Tag" options={opcoes(prototipos.flatMap((p) => p.tags))} value={filtros.tag || TODOS} onChange={(v) => mudar("tag", v)} />
        {temFiltro && (
          <div className="atlas-limpar">
            <Button variant="subtle" label="Limpar filtros" leftIcon="x" onPress={() => ir(vista, {})} />
          </div>
        )}
      </section>

      {lista.length === 0 ? (
        <EmptyState
          icon="magnifying-glass"
          title={prototipos.length ? "Nenhum protótipo com esses filtros" : "Nenhum protótipo ainda"}
          description={prototipos.length ? "Tente remover algum filtro." : "Crie a pasta do primeiro protótipo seguindo o CONTRIBUTING.md."}
        />
      ) : vista === "grade" ? (
        <ul className="atlas-grade">
          {lista.map((p) => (
            <li key={p.id}>
              <Cartao prototipo={p} origem={mostrarOrigem ? origem(p) : undefined} />
            </li>
          ))}
        </ul>
      ) : (
        <Tabela prototipos={lista} origem={mostrarOrigem ? origem : undefined} />
      )}
    </div>
  );
}

/** Ações da lista: abrem o visualizador do Atlas já na aba certa. */
function Acoes({ prototipo: p }: { prototipo: Prototipo }) {
  return (
    <div className="atlas-acoes atlas-acoes-compactas">
      <a className="atlas-botao" href={hrefPrototipo(p.id)}>
        Rodar
      </a>
      <a className="atlas-botao atlas-botao-sutil" href={hrefPrototipo(p.id, "canvas")}>
        Canvas
      </a>
      <a className="atlas-botao atlas-botao-sutil" href={hrefPrototipo(p.id, "mapa")}>
        Mapa
      </a>
    </div>
  );
}

/**
 * Cartão no estilo "mídia + conteúdo". O cartão inteiro abre o protótipo no visualizador
 * do Atlas (o link do título se estende sobre o cartão), onde ficam Protótipo, Canvas e Mapa.
 */
/** Dispositivo vem das tags: "desktop" ou "mobile". */
const DISPOSITIVOS = { desktop: "Desktop", mobile: "Mobile" } as const;

function dispositivo(p: Prototipo) {
  const tag = p.tags.find((t): t is keyof typeof DISPOSITIVOS => t in DISPOSITIVOS);
  return tag ? { tag, rotulo: DISPOSITIVOS[tag] } : null;
}

function Cartao({ prototipo: p, origem }: { prototipo: Prototipo; origem?: string }) {
  const disp = dispositivo(p);

  return (
    <article className="atlas-cartao">
      <div className="atlas-miniatura">
        {p.miniatura ? <img src={p.miniatura} alt="" loading="lazy" /> : <span>Sem miniatura</span>}
        <span className={`atlas-selo atlas-selo-${p.status}`}>
          <span className="atlas-selo-ponto" aria-hidden="true" />
          {STATUS_ROTULO[p.status]}
        </span>
        {disp && (
          <span className="atlas-selo atlas-selo-dispositivo">
            <Icon name={disp.tag === "mobile" ? "device-mobile" : "desktop"} size="small" color="currentColor" decorative />
            {disp.rotulo}
          </span>
        )}
        <span className="atlas-play" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        </span>
      </div>

      <div className="atlas-cartao-texto">
        {origem && <p className="atlas-sobretitulo">{origem}</p>}
        <h2 className="atlas-cartao-titulo">
          <a className="atlas-cartao-link" href={hrefPrototipo(p.id)} aria-label={`Rodar o protótipo ${p.fluxo}`}>
            {p.fluxo}
          </a>
        </h2>
      </div>

      <ul className="atlas-cartao-meta">
        <li>
          <Icon name="star" size="small" color="var(--icone-secundario)" decorative />
          <span>
            Criado por <strong>{p.git.criadoPor ?? "—"}</strong> em {formatarData(p.git.criadoEm)}
          </span>
        </li>
        <li>
          <Icon name="clock" size="small" color="var(--icone-secundario)" decorative />
          <span>
            Atualizado por <strong>{p.git.alteradoPor ?? "—"}</strong> em {formatarData(p.git.atualizadoEm)}
          </span>
        </li>
      </ul>
    </article>
  );
}

function Tabela({ prototipos, origem }: { prototipos: Prototipo[]; origem?: (p: Prototipo) => string }) {
  return (
    <div className="atlas-tabela-moldura">
      <table className="atlas-tabela">
        <thead>
          <tr>
            <th>Fluxo</th>
            {origem && <th>Programa › Projeto</th>}
            <th>Status</th>
            <th>Criado em</th>
            <th>Alterado em</th>
            <th>Alterado por</th>
            <th>
              <span className="atlas-oculto">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {prototipos.map((p) => (
            <tr key={p.id}>
              <td>
                <a className="atlas-tabela-fluxo" href={hrefPrototipo(p.id)}>
                  {p.fluxo}
                </a>
                {p.modulo && <span className="atlas-meta">{p.modulo}</span>}
              </td>
              {origem && <td className="atlas-meta">{origem(p)}</td>}
              <td>
                <Badge variant={STATUS_COR[p.status]} label={STATUS_ROTULO[p.status]} />
              </td>
              <td>{formatarData(p.git.criadoEm)}</td>
              <td>{formatarData(p.git.atualizadoEm)}</td>
              <td>{p.git.alteradoPor ?? "—"}</td>
              <td>
                <Acoes prototipo={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
