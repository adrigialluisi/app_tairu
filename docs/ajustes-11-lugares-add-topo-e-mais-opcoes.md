# Ajuste 11 — Tela 4a: mais opções de lugares + "adicionar por conta própria" com visibilidade

Feedback da Adriana (10/set/2026), vendo a Tela 4b já funcionando: ela vai marcar mais lugares e precisa de mais opções pra escolher — incluindo restaurantes famosos, não só pontos turísticos — e o campo de "adicionar um lugar por conta própria" está no fim da tela, sem visibilidade nenhuma. As duas coisas juntas resolvem também o pedido de "ter mais de uma atração por dia" no Roteiro (Tela 4b): com mais opções marcáveis, a distribuição round-robin já existente naturalmente põe mais de um lugar por dia — **não precisa mexer no algoritmo de distribuição, só no volume/variedade de dados**.

## 1. `docs/dados/places.json` — dataset ampliado (29 → 43 lugares)

Já atualizado neste arquivo (curadoria real, mesma metodologia documentada no `CLAUDE.md`: nomes verificados por pesquisa, coordenadas aproximadas de bairro/quarteirão). Entraram 14 lugares novos, 7 por cidade — a maioria restaurantes/bares reais e reconhecidos, que era a categoria mais fraca do dataset anterior (só 3 lugares com `gastronomia` antes; agora 13):

**Buenos Aires (+7):** Café Tortoni (Microcentro, confeitaria histórica de 1858), Don Julio (Palermo, parrilla premiada mundialmente), La Cabrera (Palermo Soho, parrilla), La Brigada (San Telmo, parrilla clássica), El Desnivel (San Telmo, parrilla simples), El Ateneo Grand Splendid (Recoleta, livraria dentro de teatro histórico — cultura+compras), Ciudad Cultural Konex (Abasto, centro cultural/vida noturna).

**Santiago (+7):** Liguria (Providencia, bar-restaurante tradicional), Bocanáriz (Lastarria, wine bar), Peumayen Ancestral Food (Bellavista, cozinha ancestral chilena), Confitería Torres (Centro, restaurante/bar mais antigo da cidade, 1879), La Cabrera — unidade Las Condes (parrilla), Casa Museo La Chascona (Bellavista, casa de Pablo Neruda), Costanera Center (Providencia, maior shopping da América do Sul — compras).

**Instrução pra Claude Code:** recopiar `docs/dados/places.json` por cima de `src/data/places.json` (o arquivo já está pronto, é só sobrescrever — não precisa editar o conteúdo, só copiar). Nenhuma mudança de schema: mesmos campos (`id`, `cityId`, `name`, `neighborhood`, `categories`, `description`, `lat`, `lng`) de antes.

## 2. `SelectPlaces.tsx` — mover "adicionar por conta própria" pro topo, com visibilidade

Hoje (`src/screens/SelectPlaces.tsx`) o bloco de adicionar lugar por conta própria (`.addCustom`, `TextField` + botão "Adicionar") fica **depois** da lista inteira de sugestões e da lista de lugares já customizados — ou seja, só aparece pra quem rola a tela até o fim. A Adriana relatou que "o usuário fica sem visibilidade" disso.

Mudar a ordem de renderização dentro do painel de cada destino pra:

1. Intro da tela (inalterado).
2. Abas de destino (inalterado).
3. **Bloco "Adicionar por conta própria" — sobe pro topo do painel, logo abaixo das abas de destino, antes da lista de sugestões.** Não precisa virar modal nem accordion escondido — é pra ficar sempre visível, um campo simples e compacto (label + input + botão, como já é hoje), só que em outra posição. Se algum lugar customizado já foi adicionado naquele destino, a lista deles (`customPlacesForDestination`) aparece logo abaixo desse bloco, ainda acima da lista de sugestões — assim o usuário vê imediatamente o que já adicionou por conta própria, sem precisar rolar.
4. Lista de lugares sugeridos (`rankedPlaces`, ordenados por perfil) — continua depois, como conteúdo principal/mais longo da tela.

Manter toda a lógica existente (`handleAddCustom`, `handleCustomKeyDown`, `customText` state, `trip.addCustomPlace`, `trip.removeSelectedPlace`) — é só reordenar o JSX, não a lógica.

**Por que no topo e não, por exemplo, um botão flutuante:** o padrão de navegação do resto do protótipo já usa campos visíveis e diretos (sem esconder ações atrás de menus) — manter consistência, ver regra nova de reaproveitar componentes/padrões no `CLAUDE.md`.

## 3. Ajuste de texto (pequeno)

Na label do campo, hoje "Não achou o que procurava? Adicione um lugar" — manter o texto (já está bom e vai continuar fazendo sentido no topo). Se quiser reforçar que vale pra restaurantes também, pode trocar o placeholder de "Ex.: Um restaurante que você já conhece" por algo que também sugira ponto turístico, tipo "Ex.: Um restaurante ou lugar que você já conhece" — ajuste opcional, não bloqueante.

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- `src/data/places.json` tem 43 lugares (22 Buenos Aires, 21 Santiago) — conferir com os dois destinos do cenário de teste.
- O campo "Adicionar por conta própria" aparece **antes** da lista de sugestões, visível sem rolar a tela (testar em 375px).
- Lugares customizados já adicionados aparecem logo abaixo do campo de adicionar, não escondidos no fim.
- Restaurantes novos aparecem na lista de sugestões de cada cidade, com a categoria "Gastronomia" no chip.
- Ordenação por perfil continua funcionando (testar marcando "Gastronomia" nos Interesses do Quiz e conferir que os restaurantes sobem na lista).
- Espaçamento segue a regra geral do `CLAUDE.md`.
