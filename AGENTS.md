# AGENTS.md — regras para agentes (Codex, Claude e outros)

Este arquivo é lido automaticamente por agentes de IA. Siga estas regras sempre que trabalhar
neste repositório. Muitas pessoas que usam o agente **não conhecem Git**: explique em português
simples, um passo por vez, e diga qual é o próximo passo.

## Idioma

- Responda e escreva documentação em **português do Brasil**.
- Nomes de pastas e arquivos: minúsculas, com hífen, sem acento.

## Escopo: onde mexer

- Trabalho em protótipo: **só** dentro de `prototipos/<projeto>/<nome>/`.
- Não altere pastas de outros protótipos, `plataforma/`, `.github/`, `CODEOWNERS` ou arquivos da
  raiz, a menos que a pessoa peça isso explicitamente.
- **Nunca** crie ou edite uma lista central de protótipos. O catálogo é gerado lendo os
  `prototype.json`.
- **Nunca** commite arquivos gerados (`dist/`, `node_modules/`, `plataforma/gerado/`).

## Git: fluxo obrigatório

1. Nunca commite na `main`. Antes de mudar qualquer coisa, confira a branch atual.
   Se estiver na `main`, atualize (`git switch main && git pull`) e crie a branch:
   `prototipo/<projeto>/<nome>` (protótipo), `plataforma/<descricao>` ou `docs/<descricao>`.
2. Uma mudança = uma branch = um PR. Não misture protótipos.
3. Commits curtos no formato `<nome ou area>: <o que mudou>`.
4. **Peça confirmação antes de:** `git push`, abrir PR, apagar arquivos ou branches, e qualquer
   comando que reescreva histórico.
5. **Proibido:** `git push --force`, `git reset --hard` em trabalho de outra pessoa, mudar regras
   do repositório.

## Protótipo: contrato

- Toda pasta de protótipo tem um `prototype.json` válido (schema definido no passo 4).
- O protótipo precisa gerar uma saída **estática** em `dist/` (HTML, CSS, JS e imagens).
- Rode o validador antes de finalizar (comando definido no passo 4).
- **Nada de dados reais ou sensíveis**: os links de preview são públicos. Use dados fictícios.

## Neutralidade de plataforma

- O que é específico do GitHub fica **só** em `.github/workflows/`.
- Scripts de build e validação ficam fora de `.github/` e não dependem de recursos do GitHub,
  para a migração ao Azure DevOps mexer só no deploy.

## Ao finalizar

Diga à pessoa, em passos numerados: o que mudou, como conferir, e o próximo passo concreto
(normalmente: "posso enviar e abrir o PR?").
