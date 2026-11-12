# Decisões do Atlas

Registro das decisões do projeto. Cada decisão tem data, o que foi decidido e o porquê.
Quando uma decisão mudar, não apague: marque como **Substituída** e adicione a nova.

## Já decididas (pesquisa anterior)

| # | Decisão | Por quê |
|---|---------|---------|
| D1 | **Monorepo**: uma pasta por protótipo, uma branch e um PR por mudança. | Um só lugar para tudo; alternativas (repo por protótipo, híbrido) descartadas por ora. |
| D2 | Cada protótipo tem um `prototype.json`; o catálogo é **gerado** lendo todos eles. Nunca há lista central editada à mão. | Evita duas pessoas colidirem no mesmo arquivo (funcionou no SeleneSDK). |
| D3 | Cada protótipo gera saída estática (`dist/`). | A plataforma não depende do framework de cada protótipo; trocar GitHub por Azure mexe só no deploy. |
| D4 | `main` protegida: só por PR, build passando, 1 aprovação, squash merge, sem force push, branch apagada após merge, CODEOWNERS por pasta. | Segurança para várias pessoas, incluindo quem não conhece Git. |
| D5 | Cada PR gera link de preview. Plataforma mostra `main` como "oficial" e PRs abertos como "em andamento". | Revisão visual sem precisar rodar nada local. |
| D6 | Tudo que é específico do GitHub fica só em `.github/workflows/`. O resto é neutro. | Facilitar a migração futura para Azure DevOps. |

## Decididas em 12/11/2026 (passo 1)

| # | Pergunta | Resposta | Observação |
|---|----------|----------|------------|
| D7 | Os protótipos são confidenciais? | **Sim — repositório privado.** | |
| D8 | Hospedagem de preview (fase GitHub) | **GitHub Pages + `rossjrw/pr-preview-action`** | Links publicados ficam públicos — aceito (ver P1). |
| D9 | Nome | Plataforma **Atlas**, repositório **`atlas-prototipos`** | |
| D10 | Visual da plataforma | **Consumir o SeleneSDK como dependência** (SideNav, Select etc.) | Forma de instalação a definir — ver Pendência P2. O SeleneSDK continua intocado. |

## Decididas em 12/11/2026 (passo 3)

| # | Decisão | Por quê |
|---|---------|---------|
| D11 | Modelo de PR em `docs/pull_request_template.md` (não em `.github/`). | GitHub e Azure DevOps leem modelos de PR em `docs/`, então ele não precisa mudar na migração. |
| D12 | `CODEOWNERS` na raiz, com `@VanzSantos` como padrão. | GitHub lê na raiz. No Azure DevOps vira política de revisores por pasta (ver passo 9). |
| D13 | Branches: `prototipo/<projeto>/<nome>`, `plataforma/<descricao>`, `docs/<descricao>`. | Fácil de ler e de filtrar; uma branch por mudança. |

## Decididas em 12/11/2026 (passo 4)

| # | Decisão | Por quê |
|---|---------|---------|
| D14 | Contrato em `schema/prototype.schema.json` (JSON Schema). Obrigatórios: `versao`, `titulo`, `projeto`, `modulo`, `fluxo`, `status`, `donos`, `entrada`. | Fonte única: o editor autocompleta e o validador usa o mesmo arquivo. |
| D15 | Status: `rascunho`, `em-andamento`, `em-revisao`, `aprovado`, `arquivado`. | Cobre o ciclo de vida sem depender de "oficial/PR", que vem do git. |
| D16 | Autoria e datas **não** ficam no `prototype.json`; vêm do histórico do git. | Menos campo para esquecer e nenhuma informação duplicada. |
| D17 | Validador em Node puro, sem dependências (`npm run validar`). | Roda igual no computador, no GitHub Actions e no Azure Pipelines. |

## Pendências

### P1 — Repo privado × GitHub Pages
- GitHub Pages em repositório **privado** só funciona em plano pago (GitHub Pro, Team ou Enterprise).
- Mesmo pago, o site publicado fica **público na internet**: qualquer pessoa com o link vê o protótipo.
  Só o GitHub Enterprise Cloud permite restringir o acesso.
- Ou seja: com Pages, o código fica privado, mas os protótipos publicados não.
- Opções: (a) aceitar links públicos "difíceis de adivinhar"; (b) usar Cloudflare Pages com
  Cloudflare Access; (c) usar Azure Static Web Apps com autenticação (mais perto do destino final).
- **Status:** resolvida em 12/11/2026 — **manter GitHub Pages e aceitar links públicos** na fase
  de teste. Consequências: (1) a conta dona do repo precisa de plano pago (GitHub Pro ou Team);
  (2) não colocar dados reais ou sensíveis nos protótipos; (3) a proteção de acesso de verdade
  vem na migração para Azure Static Web Apps (passo 9).

### P2 — Como o Atlas recebe o SeleneSDK
- Opções: pacote npm publicado, dependência via Git (`github:VanzSantos/SeleneSDK`) ou pacote em
  registro privado (no Azure: Azure Artifacts).
- Se o SeleneSDK for privado, o CI do Atlas precisa de permissão de leitura nele.
- **Status:** resolver no passo 5 (plataforma).
