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
| D7 | Os protótipos são confidenciais? | ~~Sim — repositório privado.~~ **Substituída pela D35.** | |
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

## Decididas em 12/11/2026 (passo 5)

| # | Decisão | Por quê |
|---|---------|---------|
| D18 | SeleneSDK entra como **dependência Git fixa num commit** (`plataforma/package.json`, hoje `512045c`). Os componentes são importados do código-fonte (`selenesdk/src/components/...`). | O SeleneSDK é público, mas não é publicado como pacote. Assim não copiamos código nem mexemos nele. Atualizar = trocar o commit e testar. |
| D19 | Instalação com `ignore-scripts` (`plataforma/.npmrc`). | O `postinstall` do SeleneSDK gera o manifesto do ProtoTable, que não serve ao Atlas e falharia fora do repositório dele. |
| D20 | Plataforma em React + Vite, com `base: "./"` e navegação por hash (`#/?projeto=...`, `#/p/<projeto>/<nome>?tela=<id>`). | O mesmo build funciona na raiz, num subcaminho do Pages ou num preview de PR, sem configurar servidor. Links de filtro e de tela são compartilháveis. |
| D21 | `scripts/montar-site.mjs` monta o site inteiro (`site/`): plataforma, `catalogo.json` e `p/<projeto>/<nome>/`. | O CI só precisa rodar `npm run build` e publicar `site/`. Isso é igual no GitHub e no Azure. |
| D22 | O catálogo aceita uma lista de PRs abertos (`--previews`), fornecida pelo CI. | "Em andamento" vem do CI (passo 6), sem lista editada à mão. |

## Decididas em 12/11/2026 (passo 5, revisão da estrutura)

| # | Decisão | Por quê |
|---|---------|---------|
| D23 | Hierarquia **Programa → Projeto → Protótipo (um fluxo)**, nas pastas `prototipos/<programa>/<projeto>/<nome>/`. Substitui a parte de "projeto" da D14. | É como a empresa se organiza. A pasta mostra a hierarquia e o CODEOWNERS pode dar dono por programa inteiro. |
| D24 | O campo `programa` passou a ser obrigatório. O `modulo` ficou opcional, e o `titulo` saiu: o nome exibido é o `fluxo`. | Um protótipo é um fluxo, então não faz sentido repetir o nome. O módulo fica só como filtro. |
| D25 | Os nomes de exibição ficam em `programa.json` e `projeto.json`, cada um na sua pasta. | Não é uma lista central: cada arquivo pertence à sua pasta e muda pouco. Sem esses arquivos, o nome vem da pasta. |
| D26 | Três peças obrigatórias por protótipo: o **protótipo navegável**, o **canvas** (`canvas/index.html`) e o **mapa do fluxo** (`mapa/index.html`), feitas em paralelo pela IA. Em rascunho, a falta delas só gera aviso. | O canvas é usado para anotações e detalhamento, e o mapa mostra toda a navegação. O AGENTS.md obriga a atualizar as três juntas. |
| D27 | A **miniatura** é um print automático da tela inicial (1280×800), feito no build com o Chrome via `playwright-core`. Um `miniatura.png` na pasta substitui o print. Sem Chrome, o build segue sem miniatura. | A grade fica sempre atualizada sem esforço, e a pessoa ainda pode escolher outra imagem. |
| D28 | Barra lateral: **Recentes** (os 30 alterados por último), depois a categoria **Programas** → programas → projetos. A página do projeto tem **Miniaturas** e **Lista**, mostrando fluxo, status, data de criação, data da última alteração e quem alterou. A escolha de vista fica no link e é lembrada no navegador. | Pedido da responsável pelo produto (12/11/2026). |
| D30 | **Substitui parte da D28.** Só a vista em **cartões**: a vista em lista saiu. Também saíram os filtros por módulo, status, dono e tag. Ficou uma **busca genérica na barra lateral**, entre a marca e Recentes, que procura em todos os programas (fluxo, descrição, módulo, programa, projeto, tags e pessoas). O cartão inteiro abre o visualizador com Protótipo, Canvas e Mapa. | Pedido da responsável pelo produto (12/11/2026): menos controles e um só caminho para abrir o protótipo. |
| D31 | Novo campo obrigatório `dispositivo`, com os valores `desktop` ou `app`. Ele substitui as tags desktop/mobile. Protótipo **desktop precisa ser responsivo**, e o visualizador tem o botão **Desktop / Mobile** para conferir. Protótipo **app** não é responsivo e aparece sempre numa moldura de celular de 390px, sem o botão. A miniatura é gerada no tamanho de cada dispositivo (1280×800 ou 390×844). | Pedido da responsável pelo produto (12/11/2026). |
| D32 | **Histórico** em cada protótipo, com a aba "Histórico" no visualizador. Data, hora, autor e PR vêm do git: é um commit por PR com squash, e o número sai do "(#N)" da mensagem. O texto vem de um **arquivo novo por mudança** em `historico/AAAA-MM-DD-descricao.md`, em linguagem simples, escrito pela pessoa ou pelo agente. Mudanças sem esse arquivo aparecem como "resumo técnico". | Ninguém edita o mesmo arquivo, então não há conflito. É neutro: não depende das configurações do GitHub e continua igual no Azure. Fica revisável no próprio PR. |
| D33 | **Prints das telas no histórico**: o catálogo já lê `p/<id>/historico/<commit>/*.png`. A captura automática do "como ficou" (só o depois, de todas as telas) será feita no CI, no passo 6. No Azure (passo 9), vai precisar de um armazenamento à parte, porque cada publicação substitui a anterior. | Viável e barato de capturar. O difícil é guardar para sempre sem pesar o repositório nem furar a proteção da `main`. |
| D34 | **CI e preview no GitHub**, com só dois arquivos específicos do GitHub: `.github/workflows/preview.yml` e `publicar.yml`. A cada PR: valida, exige um resumo novo no histórico de cada protótipo alterado, monta **só o que mudou** (os outros protótipos apontam para a versão oficial), publica em `gh-pages/pr-preview/pr-N/` e comenta o link no PR. A cada merge na `main`: monta tudo, grava os prints das telas alteradas, inclui os PRs em andamento e publica na raiz da `gh-pages`, sem apagar os previews. Toda a lógica fica em scripts neutros (`scripts/montar-site.mjs`, `pastas-alteradas.mjs`, `verificar-historico.mjs`, `gerar-prints-historico.mjs`). | Na migração para o Azure, só os dois workflows mudam. Os prints antigos sobrevivem porque cada publicação traz de volta os que já estavam publicados. |
| D35 | **Substitui a D7.** Na fase de teste, o repositório fica **público**, para usar o GitHub Pages no plano gratuito. O código e os protótipos ficam visíveis para qualquer pessoa. Por isso: **nada de dados reais, marcas de clientes ou informações internas** nos protótipos. Antes de entrar conteúdo confidencial, ou na migração para o Azure, volta a ser privado. | A conta é do plano Free, e o Pages não publica repositório privado nesse plano. Decisão da responsável pelo produto em 12/11/2026, ciente de que não dá para "despublicar": cópias e caches podem ficar. |
| D29 | Datas e autoria vêm do git. A data de criação segue o `prototype.json` mesmo quando a pasta é movida ou renomeada. | Mover uma pasta não pode "zerar" a data de criação. |

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
- **Status:** resolvida em 12/11/2026 — ver D18.
