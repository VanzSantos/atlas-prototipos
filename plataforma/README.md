# plataforma

App do Atlas (React + Vite). Lê o `catalogo.json` gerado a partir dos `prototype.json` e do git,
e organiza tudo em Programas → Projetos, com Recentes, lista ou miniaturas, filtros e acesso ao
protótipo navegável, ao canvas e ao mapa do fluxo.

- Rode tudo pela raiz do repositório: `npm install` e depois `npm run dev`.
- Componentes visuais vêm do [SeleneSDK](https://github.com/VanzSantos/SeleneSDK), fixado num commit
  em `package.json` (ver DECISOES.md, D18). Para atualizar, troque o commit, rode `npm install` e teste.
- `gerado/` (catálogo e protótipos montados para o modo dev) não é commitado.

| Arquivo | O quê |
|---------|-------|
| `src/App.tsx` | Carrega o catálogo; barra lateral com Recentes e Programas → Projetos |
| `src/ListaPrototipos.tsx` | Lista e miniaturas, filtros, ações Rodar / Canvas / Mapa |
| `src/Visualizador.tsx` | Abre protótipo, canvas ou mapa dentro do Atlas, com troca de tela |
| `src/Marca.tsx` | Marca do Atlas (titã sustentando o globo) |
| `src/rotas.ts` | Navegação por hash (links compartilháveis) |
