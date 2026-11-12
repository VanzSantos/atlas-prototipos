# plataforma

App do Atlas (React + Vite). Lê o `catalogo.json` gerado a partir dos `prototype.json` e do git,
e organiza tudo em Programas → Projetos, com Recentes, busca e cartões que abrem o protótipo
navegável, o canvas e o mapa do fluxo.

- Rode tudo pela raiz do repositório: `npm install` e depois `npm run dev`.
- Componentes visuais vêm do [SeleneSDK](https://github.com/VanzSantos/SeleneSDK), fixado num commit
  em `package.json` (ver DECISOES.md, D18). Para atualizar, troque o commit, rode `npm install` e teste.
- `gerado/` (catálogo e protótipos montados para o modo dev) não é commitado.

| Arquivo | O quê |
|---------|-------|
| `src/App.tsx` | Carrega o catálogo; barra lateral com busca, Recentes e Programas → Projetos |
| `src/ListaPrototipos.tsx` | Grade de cartões (miniatura, status, dispositivo, autoria e datas) |
| `src/Visualizador.tsx` | Abre protótipo, canvas ou mapa dentro do Atlas, com troca de tela |
| `src/Marca.tsx` | Marca do Atlas (titã sustentando o globo) |
| `src/rotas.ts` | Navegação por hash (links compartilháveis) |
