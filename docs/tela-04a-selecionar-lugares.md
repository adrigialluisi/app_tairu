# Tela 4a — Selecionar lugares


> **Superada em 10/set/2026:** o conteúdo desta tela virou a aba "Lugares" dentro do Roteiro (`docs/tela-04b-roteiro-e-dicas.md`) — não é mais uma rota/tela própria. Ver `docs/ajustes-13-navegacao-menu-fixo.md`. O conteúdo abaixo continua válido como especificação funcional (ordenação por perfil, adicionar por conta própria etc.), só a localização na navegação mudou.
Ver `../../Site_Publicado/14-fluxo-proposto-mes2.html`, etapa 4, pro racional completo.

## Escopo deste bloco (decisões de 10/set/2026)

- **Só fluxo de 1 pessoa por enquanto.** A etapa 4 real combina escolhas de vários membros da viagem, mas o protótipo não tem backend/contas reais — o roteiro de teste também só pede pro participante sozinho marcar os lugares dele. O roteiro dia a dia (Tela 4b) sai só das escolhas de quem está usando o protótipo. A combinação multi-membro fica documentada aqui como limitação conhecida deste bloco, não construída agora — e não simulamos um segundo participante fictício escolhendo por ele (mesmo princípio já usado no "Convite enviado" nunca virar "aceito").
- **Dados reais só pra Buenos Aires e Santiago** (os dois destinos do cenário fixo de teste). Outros destinos que o usuário eventualmente cadastre na Tela 1 aparecem aqui com uma mensagem de "sugestões ainda não disponíveis pra esse destino" — sem inventar lugares. Ver `docs/dados/places.json`.

## Dados: `src/data/places.json`

Copiar `docs/dados/places.json` pra `src/data/places.json`, sem alterar o conteúdo — é uma curadoria real (não gerada por IA), baseada em listas de pontos turísticos e restaurantes amplamente documentadas de Buenos Aires e Santiago (Casa Rosada, Teatro Colón, La Boca, Recoleta, Palermo, MALBA e Puerto Madero em Buenos Aires; Sky Costanera, La Moneda, Lastarria, Cerro San Cristóbal e Mercado Central em Santiago, entre outros). **Ampliado em 10/set/2026 (ver `docs/ajustes-11-lugares-add-topo-e-mais-opcoes.md`) de 29 pra 43 lugares** — a maior parte da ampliação foi em restaurantes/bares reais e reconhecidos (Don Julio, La Cabrera, Café Tortoni em Buenos Aires; Liguria, Bocanáriz, Confitería Torres em Santiago, entre outros), categoria que estava sub-representada antes. Cada item tem `id`, `cityId` (mesmo valor usado em `cities.json`: `buenos-aires-ar` / `santiago-cl`), `name`, `neighborhood`, `categories` (array com uma ou mais de: `gastronomia`, `cultura`, `natureza`, `vida-noturna`, `compras` — mesmos valores de `QuizInterest`), `description` (frase curta) e `lat`/`lng` (coordenadas reais, ver seção do mapa na Tela 4b).

## Conteúdo da tela

- Um seletor por destino da viagem, na ordem em que foram cadastrados na Tela 1 (ex.: abas ou segmented control "Buenos Aires" / "Santiago") — mostra as sugestões de um destino de cada vez.
- Lista de lugares sugeridos daquele destino, vindos de `places.json`, cada um com nome, bairro e um chip pequeno de categoria. Toque pra marcar/desmarcar (chip ou checkbox, com check visível — mesmo padrão de estado marcado já usado no Quiz).
- **Ordenação por perfil (hipótese de produto a testar, não achado de pesquisa):** dentro de cada destino, colocar primeiro os lugares cuja `categories` bate com os "Interesses da viagem" marcados no Quiz (Tela 3); como critério de desempate, se `pace` do quiz for "relax" priorizar lugares de categoria `natureza`, se for "urbano" priorizar `cultura`/`vida-noturna`. Os demais lugares continuam visíveis abaixo, só não vêm primeiro.
- **Adicionar por conta própria:** campo de texto simples **no topo do painel de cada destino** (logo abaixo das abas de destino, antes da lista de sugestões — atualizado em 10/set/2026, ver `docs/ajustes-11-lugares-add-topo-e-mais-opcoes.md`; antes ficava no fim da tela e passava despercebido), com o texto "Não achou o que procurava? Adicione um lugar" — adiciona um item customizado à lista de escolhidos, sem bairro/categoria do dataset (guardar como `customLabel`, categoria `null`). Lugares já adicionados por conta própria aparecem logo abaixo desse campo, também visíveis sem rolar a tela.
- Botão "Continuar" segue habilitado mesmo com 0 lugares marcados nesse destino (não é bloqueante — mas exibir uma nota discreta se seguir sem marcar nada em nenhum destino, avisando que o roteiro da Tela 4b vai ficar vazio até marcar algo).

## Estado (TripContext)

Adicionar em `src/context/TripContext.tsx`:

```ts
export interface TripPlaceSelection {
  id: string;
  destinationId: string; // TripDestination.id (não o cityId — é por destino da viagem, não por cidade genérica)
  placeId: string | null; // referência a places.json, ou null se for customLabel
  customLabel: string | null; // preenchido só quando placeId é null
  categories: string[]; // copiado do places.json no momento da seleção, ou [] se customLabel
}
```

- `selectedPlaces: TripPlaceSelection[]` no estado.
- `togglePlace(destinationId: string, place: { placeId: string; categories: string[] })`: adiciona se não estava marcado, remove se já estava (mesmo padrão de toggle já usado em Interesses do Quiz).
- `addCustomPlace(destinationId: string, label: string)`: adiciona um `TripPlaceSelection` com `placeId: null`, `customLabel: label`, `categories: []`.
- `removeSelectedPlace(id: string)`: remove pelo id da seleção (serve tanto pra desmarcar sugestão quanto remover item customizado).

## Navegação

- Rota nova: `/lugares`, depois do `/quiz`.
- `QuizProfile.tsx`: o botão "Continuar" passa a navegar pra `/lugares` (hoje vai pra `/em-construcao` — trocar).
- Tela de Selecionar lugares: back leva pro `/quiz`; "Continuar" leva pra `/roteiro` (Tela 4b, ver `docs/tela-04b-roteiro-e-dicas.md`).
- Registrar `<Route path="/lugares" element={<SelectPlaces />} />` em `App.tsx`, entre `/quiz` e `/roteiro`.

## Acessibilidade

- Seletor de destino (abas) com `role="tablist"`/`role="tab"` ou padrão equivalente acessível, indicando qual está ativo.
- Cada lugar marcável opera como checkbox acessível (`role="checkbox"`, `aria-checked`), igual ao padrão de Interesses do Quiz.
- Estado marcado não pode depender só de cor.

## Checklist antes de considerar pronto

- `npm run build` limpo.
- Dá pra marcar lugares nos dois destinos (Buenos Aires e Santiago) e ver os dois conjuntos de seleção guardados corretamente.
- Dá pra adicionar um lugar por conta própria e ele aparece na lista de escolhidos.
- Dá pra continuar com 0 lugares marcados, sem travar.
- Ordenação por perfil funciona (testar marcando "Natureza" nos Interesses do Quiz e conferir que os parques aparecem primeiro).
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
- Espaçamento segue a regra geral do `CLAUDE.md` (escala de 8px, grupo→grupo maior que item→item).
- `src/data/places.json` tem 43 lugares (22 Buenos Aires, 21 Santiago) e o campo de adicionar por conta própria aparece no topo do painel, visível sem rolar (ver `docs/ajustes-11-lugares-add-topo-e-mais-opcoes.md`).
