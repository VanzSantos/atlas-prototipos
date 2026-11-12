# Atlas

Plataforma central de protótipos. Reúne num só lugar todos os protótipos feitos com IA e com
código, que hoje estão espalhados em links e repositórios diferentes.

> ⚠️ **Repositório privado, mas os links publicados são públicos.** Nunca coloque dados reais de
> clientes, pacientes ou informações sensíveis em um protótipo. Veja [DECISOES.md](DECISOES.md).

## Como funciona

- Cada protótipo vive na sua própria pasta: `prototipos/<projeto>/<nome>/`.
- Cada pasta tem um `prototype.json` que descreve o protótipo (dono, projeto, módulo, fluxo,
  status, tags, entrada).
- A plataforma lê todos os `prototype.json` e monta o catálogo sozinha. **Não existe lista
  central para editar.**
- Toda mudança entra por uma branch e um Pull Request (PR). Cada PR ganha um link de preview.
- A plataforma mostra o que está na `main` como **oficial** e os PRs abertos como **em andamento**.

## Estrutura

```
atlas-prototipos/
├─ plataforma/                 app do catálogo (Atlas)
├─ prototipos/<projeto>/<nome>/
│    ├─ prototype.json         metadados do protótipo
│    └─ código do protótipo    gera uma saída estática em dist/
├─ docs/                       guias e modelo de PR
├─ .github/workflows/          build e preview (único lugar específico do GitHub)
├─ CODEOWNERS                  quem revisa cada pasta
├─ CONTRIBUTING.md             como contribuir, passo a passo
├─ AGENTS.md                   regras para Codex, Claude e outros agentes
└─ DECISOES.md                 decisões do projeto e o porquê
```

## Começando

- Vai contribuir? Leia o [CONTRIBUTING.md](CONTRIBUTING.md).
- Usa Codex ou Claude? O agente lê o [AGENTS.md](AGENTS.md) sozinho. Basta pedir.

## Hierarquia

`Projeto → Módulo → Fluxo → Tela`, herdada do ProtoTable (SeleneSDK).
