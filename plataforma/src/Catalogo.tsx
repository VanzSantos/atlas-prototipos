import { useMemo } from "react";
import { Select, type SelectOption } from "selenesdk/src/components/Select/Select";
import { TextField } from "selenesdk/src/components/TextField/TextField";
import { Card } from "selenesdk/src/components/Card/Card";
import { Badge } from "selenesdk/src/components/Badge/Badge";
import { EmptyState } from "selenesdk/src/components/EmptyState/EmptyState";
import { Button } from "selenesdk/src/components/Button/Button";
import { hrefCatalogo, hrefPrototipo, type CampoFiltro, type Filtros } from "./rotas";
import { STATUS_COR, STATUS_ROTULO, type Catalogo as CatalogoDados, type Prototipo, type Status } from "./tipos";

/** O Select não mostra rótulo para valor vazio, então "Todos" usa um valor próprio. */
const TODOS = "*";

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function opcoes(valores: Iterable<string>, rotulo: (v: string) => string = (v) => v): SelectOption[] {
  return [
    { value: TODOS, label: "Todos" },
    ...[...new Set(valores)].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: rotulo(v) })),
  ];
}

function combina(p: Prototipo, f: Filtros) {
  if (f.projeto && p.projeto !== f.projeto) return false;
  if (f.modulo && p.modulo !== f.modulo) return false;
  if (f.fluxo && p.fluxo !== f.fluxo) return false;
  if (f.status && p.status !== f.status) return false;
  if (f.dono && !p.donos.includes(f.dono)) return false;
  if (f.tag && !p.tags.includes(f.tag)) return false;
  if (f.busca) {
    const alvo = normalizar([p.titulo, p.descricao, p.projeto, p.modulo, p.fluxo, ...p.tags].join(" "));
    if (!normalizar(f.busca).split(/\s+/).every((termo) => alvo.includes(termo))) return false;
  }
  return true;
}

export function Catalogo({ catalogo, filtros }: { catalogo: CatalogoDados; filtros: Filtros }) {
  const todos = catalogo.prototipos;

  // Atualiza um filtro e, ao trocar um nível da hierarquia, limpa os níveis abaixo dele.
  function mudar(campo: CampoFiltro, valor: string) {
    const novo: Filtros = { ...filtros, [campo]: valor === TODOS ? "" : valor };
    if (campo === "projeto") Object.assign(novo, { modulo: "", fluxo: "" });
    if (campo === "modulo") novo.fluxo = "";
    window.location.hash = hrefCatalogo(novo);
  }

  const doProjeto = todos.filter((p) => !filtros.projeto || p.projeto === filtros.projeto);
  const doModulo = doProjeto.filter((p) => !filtros.modulo || p.modulo === filtros.modulo);
  const lista = useMemo(() => todos.filter((p) => combina(p, filtros)), [todos, filtros]);
  const temFiltro = Object.values(filtros).some(Boolean);

  return (
    <div className="atlas-catalogo">
      <header className="atlas-cabecalho">
        <div>
          <h1 className="atlas-titulo">Protótipos</h1>
          <p className="atlas-subtitulo">
            {lista.length} de {todos.length} · {catalogo.ambiente === "oficial" ? "versão oficial (main)" : `ambiente: ${catalogo.ambiente}`}
            {catalogo.ref ? ` · ${catalogo.ref}` : ""}
          </p>
        </div>
        {temFiltro && <Button variant="subtle" label="Limpar filtros" leftIcon="x" onPress={() => (window.location.hash = hrefCatalogo({}))} />}
      </header>

      <section className="atlas-filtros" aria-label="Filtros">
        <div className="atlas-busca">
          <TextField
            accessibleLabel="Buscar protótipos"
            placeholder="Buscar por título, descrição ou tag"
            leftIcon="magnifying-glass"
            value={filtros.busca}
            onChange={(v) => mudar("busca", v)}
          />
        </div>
        <Select label="Projeto" options={opcoes(todos.map((p) => p.projeto))} value={filtros.projeto || TODOS} onChange={(v) => mudar("projeto", v)} />
        <Select label="Módulo" options={opcoes(doProjeto.map((p) => p.modulo))} value={filtros.modulo || TODOS} onChange={(v) => mudar("modulo", v)} />
        <Select label="Fluxo" options={opcoes(doModulo.map((p) => p.fluxo))} value={filtros.fluxo || TODOS} onChange={(v) => mudar("fluxo", v)} />
        <Select
          label="Status"
          options={opcoes(todos.map((p) => p.status), (v) => STATUS_ROTULO[v as Status])}
          value={filtros.status || TODOS}
          onChange={(v) => mudar("status", v)}
        />
        <Select label="Dono" options={opcoes(todos.flatMap((p) => p.donos))} value={filtros.dono || TODOS} onChange={(v) => mudar("dono", v)} />
        <Select label="Tag" options={opcoes(todos.flatMap((p) => p.tags))} value={filtros.tag || TODOS} onChange={(v) => mudar("tag", v)} />
      </section>

      {lista.length === 0 ? (
        <EmptyState
          icon="magnifying-glass"
          title="Nenhum protótipo encontrado"
          description="Tente remover algum filtro."
          actionLabel="Limpar filtros"
          onAction={() => (window.location.hash = hrefCatalogo({}))}
        />
      ) : (
        <ul className="atlas-grade">
          {lista.map((p) => (
            <li key={p.id}>
              <CartaoPrototipo prototipo={p} />
            </li>
          ))}
        </ul>
      )}

      {catalogo.emAndamento.length > 0 && (
        <section className="atlas-andamento">
          <h2 className="atlas-titulo-secao">Em andamento (PRs abertos)</h2>
          <ul>
            {catalogo.emAndamento.map((pr) => (
              <li key={pr.numero}>
                <a href={pr.url} target="_blank" rel="noreferrer">
                  #{pr.numero} · {pr.titulo}
                </a>
                <span className="atlas-meta"> {pr.pastas.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CartaoPrototipo({ prototipo: p }: { prototipo: Prototipo }) {
  const atualizado = p.git.atualizadoEm ? new Date(p.git.atualizadoEm).toLocaleDateString("pt-BR") : "ainda não commitado";
  return (
    <Card padding="medium" elevation="low">
      <article className="atlas-cartao">
        <div className="atlas-cartao-selos">
          <Badge variant={STATUS_COR[p.status]} label={STATUS_ROTULO[p.status]} />
          <Badge variant={p.situacao === "oficial" ? "success" : "accent2"} label={p.situacao === "oficial" ? "Oficial" : "Em andamento"} inverted />
        </div>
        <h2 className="atlas-cartao-titulo">
          <a href={hrefPrototipo(p.id)}>{p.titulo}</a>
        </h2>
        <p className="atlas-meta">
          {p.projeto} › {p.modulo} › {p.fluxo}
        </p>
        {p.descricao && <p className="atlas-cartao-descricao">{p.descricao}</p>}
        {p.tags.length > 0 && (
          <p className="atlas-tags">
            {p.tags.map((t) => (
              <a key={t} href={hrefCatalogo({ tag: t })} className="atlas-tag">
                #{t}
              </a>
            ))}
          </p>
        )}
        <p className="atlas-meta">
          {p.donos.map((d) => `@${d}`).join(", ")} · atualizado em {atualizado}
          {p.telas.length > 0 ? ` · ${p.telas.length} tela(s)` : ""}
        </p>
        <div className="atlas-cartao-acoes">
          <a className="atlas-botao" href={hrefPrototipo(p.id)}>
            Abrir
          </a>
          <a className="atlas-botao atlas-botao-sutil" href={p.url} target="_blank" rel="noreferrer">
            Nova aba ↗
          </a>
        </div>
      </article>
    </Card>
  );
}
