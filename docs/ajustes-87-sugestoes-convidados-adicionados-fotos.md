# Ajuste 87 — Roteiro → Sugestões: escolhas dos convidados, "Adicionar lugar" no topo, seção "Adicionados", fotos em todos os lugares

Origem: teste de 13/out/2026. A Adriana achou a aba Sugestões confusa: não fica claro o que foi ela que escolheu e o que veio dos convidados; o campo de adicionar lugar por conta própria passa despercebido; e restaurantes aparecem sem foto.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint` e `npm run build`. Commit: `ajuste 87: sugestões com escolhas dos convidados, adicionados e fotos locais`.

**Não mexer aqui** no *momento* em que as contribuições dos convidados chegam (isso é o ajuste 89). Este ajuste só muda **como** elas aparecem.

---

## 1. Escolhas dos convidados: seção compacta + estado "Selecionado pelo grupo" nas categorias

**Hoje:**
- "Escolhas do grupo" é a primeira seção, com cartões grandes, e os cartões chegam com o ✓ vermelho, como se a participante tivesse escolhido.
- Pela regra do ajuste 73 (cada lugar em uma seção só), o lugar escolhido por convidado **sai da sua categoria**. No teste, a participante procurou o Café Tortoni em Gastronomia e não achou, porque ele estava só em "Escolhas do grupo".

**Fazer:**
- **Renomear** a seção para **"Escolhas dos convidados"**, com a descrição "O que quem você convidou quer fazer em {cidade}."
- **Seção compacta:** em vez do carrossel de cartões grandes, uma lista de linhas pequenas (miniatura 48px + nome + avatar e nome de quem escolheu + categoria). Tocar na linha rola até o cartão do lugar na categoria dele, com um destaque rápido.
- **O lugar continua na categoria dele.** Exceção à regra do ajuste 73: lugares escolhidos por convidado aparecem na sua seção normal **e** na lista compacta. Os dois mostram o mesmo estado, sempre sincronizados. (O problema que o ajuste 73 resolveu era o ✓ acender em várias seções e parecer que o app marcava sozinho. Aqui a repetição é só da lista-atalho, que não tem botão próprio de marcar.)
- **Três estados visuais no cartão do lugar (`PlaceCard.tsx`):**
  1. **Ninguém escolheu:** botão `+` (como hoje).
  2. **Selecionado pelo grupo** (escolhido por convidado, a participante ainda não): **sem** o ✓ bordô. Selo no canto da foto com o avatar de quem escolheu e o texto "Selecionado pelo grupo"; borda neutra. Botão **"Eu também"**, que adiciona `'voce'` em `alsoWantedBy`.
  3. **Eu escolhi** (a participante adicionou, ou tocou "Eu também"): ✓ bordô, como hoje. Se também há convidados, mantém o avatar deles ("Você e Marina querem ir").
- O lugar escolhido por convidado **continua entrando no roteiro dia a dia** (é um plano do grupo). Na parada do roteiro, ele segue com "Sugerido por Marina".
- A tag de quem escolheu usa o `MemberAvatars` existente, com o nome ao lado.

## 2. "Adicionar um lugar por conta própria" fixo no topo, com destaque

**Hoje:** é um item recolhido ("Não achou? Adicione um lugar por conta própria ⌄"), no meio da tela, depois das pílulas de atalho. No teste, passou despercebido.

**Fazer:**
- Vira um **campo de busca sempre visível no topo da aba Sugestões**, logo abaixo das abas de cidade: ícone de busca + placeholder "Buscar ou adicionar um lugar em {cidade}".
- Ao digitar, a lista mostra primeiro os lugares do `places.json` daquela cidade que batem com o texto (atalho pra achar o Caminito sem rolar). No fim, sempre aparece "+ Adicionar '{texto}' como lugar seu".
- Fica fixo (sticky) junto com as abas de cidade, seguindo a regra de navegação fixa do ajuste 85.
- Visual com destaque: altura 48px, fundo branco, borda bordô suave, sombra leve. Não pode parecer um campo qualquer de formulário.

## 3. Seção "Adicionados"

**Fazer:**
- Seção nova **"Adicionados"**, no mesmo formato das outras (`SuggestionSection` + carrossel), logo abaixo da lista de "Escolhas dos convidados".
- Mostra os lugares que a participante adicionou **por conta própria** (`placeId === null`, `customLabel` preenchido), com cartão simples: ícone da categoria, nome e um botão de remover.
- Só aparece quando há pelo menos 1 lugar adicionado.
- Ao adicionar pelo campo do topo, a tela rola até a seção e o cartão novo pisca rapidamente.

## 4. Todos os lugares com foto, salvas no protótipo

**Hoje:** a foto vem ao vivo da Wikipedia pelo `wikiTitle` (`usePlaceThumbnail`). Dos 53 lugares, 17 não têm `wikiTitle` (a maioria restaurantes) e mostram só o ícone da categoria.

**Fazer:**
1. Para **cada lugar** do `src/data/places.json` (todos, não só os 17), buscar uma foto **real do próprio lugar** no **Wikimedia Commons** (busca pelo nome + cidade). Preferir foto da fachada ou do salão; para restaurante sem foto do local, foto de um prato típico da casa só se a foto for de fato daquele restaurante.
2. Se não existir foto real do lugar no Commons, usar uma foto **representativa** do Commons (ex.: parrilla argentina, para La Brigada), marcada como representativa.
3. Baixar cada foto em `public/places/{id}.jpg`, redimensionada para ~800px de largura, qualidade ~80.
4. No `places.json`, campo novo `photo: { src, author, license, sourceUrl, representative?: boolean }`. Atualizar também `docs/dados/places.json`.
5. `usePlaceThumbnail` passa a usar `photo.src` local primeiro; a busca na Wikipedia fica só como reserva, para lugares que ainda não tenham foto.
6. Créditos: uma linha discreta no detalhe do lugar (ou no rodapé da seção), "Foto: {author} · {license} · Wikimedia Commons". Quando for representativa: "Foto ilustrativa".
7. Nunca inventar foto e nunca usar imagem sem licença livre. Listar no fim da tarefa os lugares que ficaram com foto representativa.

Benefício extra: as fotos deixam de depender da internet e carregam na hora no teste.

---

## Checklist de aceite
- [ ] Cartões de convidados **não** chegam com o ✓ bordô; mostram "Selecionado pelo grupo" com avatar.
- [ ] "Eu também" transforma o cartão em ✓ ("Você e Marina querem ir").
- [ ] Café Tortoni aparece em Gastronomia **e** na lista compacta de "Escolhas dos convidados", com o mesmo estado.
- [ ] Campo "Buscar ou adicionar um lugar" fixo no topo; achar "caminito" por ele funciona.
- [ ] Seção "Adicionados" aparece com o primeiro lugar próprio.
- [ ] Os 53 lugares com foto local; créditos registrados; lista de representativas no resumo.
- [ ] `npm run lint` e `npm run build` ok.
