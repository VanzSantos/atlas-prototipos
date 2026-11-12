# prototipos

Organização: `prototipos/<programa>/<projeto>/<nome>/`. Cada protótipo tem um `prototype.json`, o protótipo navegável, o
canvas (`canvas/index.html`) e o mapa do fluxo (`mapa/index.html`).

- `programa.json` (na pasta do programa) e `projeto.json` (na pasta do projeto) dão os nomes que
  aparecem na barra lateral.
- Contrato: `../schema/prototype.schema.json` e `../schema/grupo.schema.json`. Modelos em `exemplo/`.
- `historico/`: um arquivo `.md` por mudança, com o resumo em linguagem simples (ver AGENTS.md).
- Valide com `npm run validar`.
