# plataforma

App do Atlas (React + Vite). Lê o `catalogo.json` gerado a partir dos `prototype.json` e do git,
e permite listar, filtrar (projeto, módulo, fluxo, status, dono, tag, busca) e abrir cada protótipo.

- Rode tudo pela raiz do repositório: `npm install` e depois `npm run dev`.
- Componentes visuais vêm do [SeleneSDK](https://github.com/VanzSantos/SeleneSDK), fixado num commit
  em `package.json` (ver DECISOES.md, D18). Para atualizar, troque o commit, rode `npm install` e teste.
- `gerado/` (catálogo e protótipos montados para o modo dev) não é commitado.

| Arquivo | O quê |
|---------|-------|
| `src/App.tsx` | Carrega o catálogo e monta o menu Projeto → Módulo → Fluxo |
| `src/Catalogo.tsx` | Filtros e cartões |
| `src/Visualizador.tsx` | Abre o protótipo num quadro, com troca de tela |
| `src/rotas.ts` | Navegação por hash (links compartilháveis) |
