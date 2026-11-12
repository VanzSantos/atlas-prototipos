# Atlas

Plataforma central de protótipos. Reúne num só lugar todos os protótipos feitos com IA e com
código, que hoje estão espalhados em links e repositórios diferentes.

> ⚠️ **Repositório privado, mas os links publicados são públicos.** Nunca coloque dados reais de
> clientes, pacientes ou informações sensíveis em um protótipo. Veja [DECISOES.md](DECISOES.md).

## Como funciona

- A organização é **Programa → Projeto → Protótipo** (um protótipo = um fluxo).
- Cada protótipo vive na sua própria pasta: `prototipos/<programa>/<projeto>/<nome>/`, com três peças: o protótipo
  navegável, o **canvas** (telas estáticas com anotações) e o **mapa do fluxo** (toda a navegação).
- Cada pasta tem um `prototype.json` que descreve o protótipo (programa, projeto, fluxo, status,
  donos, tags e os caminhos de entrada, canvas e mapa).
- A plataforma lê todos os `prototype.json` e monta o catálogo sozinha. **Não existe lista
  central para editar.**
- Toda mudança entra por uma branch e um Pull Request (PR). Cada PR ganha um link de preview.
- A plataforma mostra o que está na `main` como **oficial** e os PRs abertos como **em andamento**.

## Estrutura

```
atlas-prototipos/
├─ plataforma/                 app do catálogo (Atlas)
├─ prototipos/<programa>/
│    ├─ programa.json          nome do programa
│    └─ <projeto>/
│         ├─ projeto.json      nome do projeto
│         └─ <nome>/           um protótipo (um fluxo)
│              ├─ prototype.json
│              ├─ index.html   protótipo navegável (ou código + build)
│              ├─ canvas/      telas estáticas com anotações
│              └─ mapa/        mapa do fluxo
├─ schema/                     contrato do prototype.json
├─ scripts/                    validação e build (neutros, rodam em qualquer CI)
├─ docs/                       guias e modelo de PR
├─ .github/workflows/          build e preview (único lugar específico do GitHub)
├─ CODEOWNERS                  quem revisa cada pasta
├─ CONTRIBUTING.md             como contribuir, passo a passo
├─ AGENTS.md                   regras para Codex, Claude e outros agentes
└─ DECISOES.md                 decisões do projeto e o porquê
```

## Começando

Precisa do Node 20 ou mais novo.

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5173. Outros comandos: `npm run validar` (confere os `prototype.json`) e
`npm run build` (monta o site completo em `site/`, igual ao publicado).

- Vai contribuir? Leia o [CONTRIBUTING.md](CONTRIBUTING.md).
- Usa Codex ou Claude? O agente lê o [AGENTS.md](AGENTS.md) sozinho. Basta pedir.

## Hierarquia

`Programa → Projeto → Fluxo (protótipo) → Tela`. O módulo é opcional e serve de filtro dentro do projeto.
