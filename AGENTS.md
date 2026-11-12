# AGENTS.md — regras para agentes (Codex, Claude e outros)

Este arquivo é lido automaticamente por agentes de IA. Siga estas regras sempre que trabalhar
neste repositório. Muitas pessoas que usam o agente **não conhecem Git**: explique em português
simples, um passo por vez, e diga qual é o próximo passo.

## Idioma

- Responda e escreva documentação em **português do Brasil**.
- Nomes de pastas e arquivos: minúsculas, com hífen, sem acento.

## Escopo: onde mexer

- Trabalho em protótipo: **só** dentro de `prototipos/<programa>/<projeto>/<nome>/`.
- Não altere pastas de outros protótipos, `plataforma/`, `.github/`, `CODEOWNERS` ou arquivos da
  raiz, a menos que a pessoa peça isso explicitamente.
- **Nunca** crie ou edite uma lista central de protótipos. O catálogo é gerado lendo os
  `prototype.json`.
- **Nunca** commite arquivos gerados (`dist/`, `node_modules/`, `plataforma/gerado/`).

## Git: fluxo obrigatório

1. Nunca commite na `main`. Antes de mudar qualquer coisa, confira a branch atual.
   Se estiver na `main`, atualize (`git switch main && git pull`) e crie a branch:
   `prototipo/<programa>/<projeto>/<nome>` (protótipo), `plataforma/<descricao>` ou `docs/<descricao>`.
2. Uma mudança = uma branch = um PR. Não misture protótipos.
3. Commits curtos no formato `<nome ou area>: <o que mudou>`.
4. **Peça confirmação antes de:** `git push`, abrir PR, apagar arquivos ou branches, e qualquer
   comando que reescreva histórico.
5. **Proibido:** `git push --force`, `git reset --hard` em trabalho de outra pessoa, mudar regras
   do repositório.

## Protótipo: contrato

- Toda pasta de protótipo tem um `prototype.json` válido, conforme `schema/prototype.schema.json`.
  Use `prototipos/exemplo/` como modelo. Os campos `programa` e `projeto` são iguais aos nomes das pastas.
- Programa novo: crie `prototipos/<programa>/programa.json` com o nome de exibição. Projeto novo:
  `prototipos/<programa>/<projeto>/projeto.json` (ver `schema/grupo.schema.json`).

## Protótipo: as três peças (sempre juntas)

Todo protótipo tem **três peças** que você cria e mantém **em paralelo**, no mesmo PR:

1. **Protótipo navegável**: a entrada (`entrada`, normalmente `index.html`), que roda no navegador.
2. **Canvas** (`canvas/index.html`): as mesmas telas, **estáticas**, lado a lado, com notas de
   regra, conteúdo, dúvidas e detalhamentos, para anotação e revisão.
3. **Mapa do fluxo** (`mapa/index.html`): flowmap/sitemap com **toda a navegação** do fluxo
   (telas, caminhos, rótulos das ações, e o que ainda não foi prototipado em tracejado).

Regras:
- Toda tela nova ou alterada no protótipo navegável aparece também no canvas e no mapa.
- Todo caminho novo (botão, link, voltar, erro) aparece no mapa.
- Se alguma peça não puder ser atualizada agora, diga isso à pessoa antes de finalizar.
- Em `status: "rascunho"`, o validador só avisa se canvas ou mapa faltarem; nos outros status, falha.
- Use os exemplos em `prototipos/exemplo/` como modelo de canvas e mapa.

## Histórico: um resumo por mudança (obrigatório)

Todo PR que muda um protótipo **acrescenta um arquivo novo** em `historico/`, dentro da pasta dele.
Nunca edite nem apague resumos antigos: cada arquivo é o registro de uma mudança.

- Nome: `historico/AAAA-MM-DD-descricao-curta.md`, com a data de hoje. Exemplo:
  `historico/2026-11-12-tela-de-confirmacao.md`.
- Primeira linha: `# Título curto do que mudou`.
- Depois, de 1 a 5 frases ou itens `- ` em **linguagem simples**, para qualquer pessoa entender,
  sem termos técnicos (nada de "refatora", "CSS", "componente", "props"). Diga **o que mudou para
  quem usa** e, se ajudar, **por quê**. Pode usar `**negrito**`.
- Não escreva data, hora, autor ou número do PR: o Atlas pega isso do git sozinho.
- Modelo:

  ```markdown
  # Tela de confirmação adicionada

  Depois de escolher o horário, a pessoa agora vê um resumo da consulta antes de confirmar.
  - **Novo:** botão para trocar o horário sem voltar ao início.
  - **Ajuste:** o texto do lembrete ficou mais claro.
  ```

## Protótipo: build e validação

- O protótipo precisa gerar uma saída **estática** em `dist/` (HTML, CSS, JS e imagens).
- `build: null` = a pasta já é estática e o arquivo de `entrada` existe nela.
  `build: {"comando": "..."}` = o comando, rodado na pasta, gera a saída (padrão `dist/`).
- Rode `npm run validar` antes de finalizar e só siga se não houver ✖.
- Não coloque autoria nem datas no `prototype.json`: elas vêm do histórico do git.
- Preencha `dispositivo` no `prototype.json`:
  - `desktop`: o protótipo **precisa ser responsivo**, funcionando bem de 360px a 1440px ou mais.
    Use `<meta name="viewport" content="width=device-width, initial-scale=1">`, larguras fluidas,
    `box-sizing: border-box` e media queries. No Atlas, a pessoa alterna entre Desktop e Mobile para conferir.
  - `app`: feito para celular, com largura de **390px**. Não precisa ser responsivo, porque o Atlas sempre
    mostra numa moldura de celular.
- A miniatura do catálogo é um print automático da tela inicial. Para escolher outra imagem, salve
  `miniatura.png` (1280×800) na pasta do protótipo.
- **Nada de dados reais ou sensíveis**: os links de preview são públicos. Use dados fictícios.

## Neutralidade de plataforma

- O que é específico do GitHub fica **só** em `.github/workflows/`.
- Scripts de build e validação ficam fora de `.github/` e não dependem de recursos do GitHub,
  para a migração ao Azure DevOps mexer só no deploy.

## Ao finalizar

Diga à pessoa, em passos numerados: o que mudou, como conferir, e o próximo passo concreto
(normalmente: "posso enviar e abrir o PR?").
