# Como contribuir com o Atlas

Guia curto para quem vai adicionar ou mudar um protótipo. Não precisa saber Git a fundo.

## Regras de ouro

1. **Nunca trabalhe direto na `main`.** Ela é protegida e só recebe mudanças por Pull Request (PR).
2. **Uma mudança = uma branch = um PR.** Não misture dois protótipos no mesmo PR.
3. **Mexa só na sua pasta.** Cada protótipo fica em `prototipos/<programa>/<projeto>/<nome>/`.
4. **Nada de dados reais ou sensíveis.** Os links de preview são públicos.
5. **Não edite listas centrais.** O catálogo é gerado a partir dos `prototype.json`.

## Nomes

| O quê | Padrão | Exemplo |
|-------|--------|---------|
| Pasta do programa | minúsculas, com hífen | `prototipos/exemplo/` |
| Pasta do projeto | minúsculas, com hífen | `prototipos/exemplo/portal-cliente/` |
| Pasta do protótipo (um fluxo) | minúsculas, com hífen | `prototipos/exemplo/portal-cliente/agendamento-consulta/` |
| Branch de protótipo | `prototipo/<programa>/<projeto>/<nome>` | `prototipo/exemplo/portal-cliente/agendamento-consulta` |
| Branch da plataforma | `plataforma/<descricao>` | `plataforma/filtro-por-tag` |
| Branch de documentação | `docs/<descricao>` | `docs/guia-codex` |

## Passo a passo

1. **Atualize sua cópia:** volte para a `main` e baixe as novidades.
   ```bash
   git switch main
   ```
   ```bash
   git pull
   ```
2. **Crie sua branch:**
   ```bash
   git switch -c prototipo/<programa>/<projeto>/<nome>
   ```
3. **Na primeira vez**, instale as dependências com `npm install`. Para ver o Atlas com o seu
   protótipo, rode `npm run dev` e abra http://localhost:5173.
4. **Trabalhe na sua pasta** `prototipos/<programa>/<projeto>/<nome>/`. Todo protótipo tem três peças, sempre atualizadas juntas:
   - o **protótipo navegável** (`index.html` ou o resultado do build);
   - o **canvas** (`canvas/index.html`), com as telas estáticas e as anotações;
   - o **mapa do fluxo** (`mapa/index.html`), com toda a navegação.

   Mantenha também o `prototype.json` atualizado. O Codex e o Claude já sabem disso pelo AGENTS.md.
   - **Histórico:** em toda mudança, crie um arquivo novo `historico/AAAA-MM-DD-descricao.md` na
     pasta do protótipo, com um título (`# ...`) e um resumo em linguagem simples do que mudou.
     Ele aparece na aba **Histórico** do Atlas, com a data, a hora e quem fez (isso vem do git).
5. **Valide localmente** (precisa do Node 20 ou mais novo):
   ```bash
   npm run validar
   ```
   Se aparecer ✖, a mensagem diz qual campo corrigir no `prototype.json`.
6. **Salve e envie:**
   ```bash
   git add prototipos/<programa>/<projeto>/<nome>
   ```
   ```bash
   git commit -m "agendamento: adiciona tela de confirmação"
   ```
   ```bash
   git push -u origin HEAD
   ```
7. **Abra o PR** no site e preencha o modelo. Em poucos minutos, o GitHub:
   - confere tudo (o PR fica vermelho se faltar algum campo ou o resumo no histórico);
   - comenta no PR um **link de preview** com a sua versão;
   - mostra o PR na seção **Em andamento** da versão oficial do Atlas.
8. **Peça revisão.** O PR só pode entrar quando:
   - a verificação **Validar e montar** estiver verde;
   - **1 pessoa** tiver aprovado, de preferência o dono da pasta (veja o [CODEOWNERS](CODEOWNERS)).
     Se você mudar o PR depois da aprovação, é preciso aprovar de novo.

   O merge é sempre **Squash and merge**, e a branch é apagada sozinha depois.

## Mensagens de commit

Formato: `<nome-do-prototipo ou area>: <o que mudou, no presente>`.
Exemplo: `plataforma: adiciona filtro por status`.

## Dúvidas

Abra uma *issue* ou fale com o dono da pasta (veja o [CODEOWNERS](CODEOWNERS)).
