# Tela 4b — Roteiro dia a dia + aba de Dicas locais


> **Atualizado em 10/set/2026:** esta tela ganha uma terceira aba, "Lugares" (era a Tela 4a/`tela-04a-selecionar-lugares.md`, agora incorporada aqui — ordem das abas: Lugares → Roteiro → Dicas locais). Também vira seção de topo do menu fixo, sem "Continuar" forçando pra próxima etapa. Ver `docs/ajustes-13-navegacao-menu-fixo.md`.
Ver `../../Site_Publicado/14-fluxo-proposto-mes2.html`, etapas 4 e 5, pro racional completo. No fluxo original são duas etapas (4: roteiro combinado: 5: dicas locais); no protótipo viram uma tela só com duas abas, seguindo a mesma numeração do roteiro de teste (`15-roteiro-teste-usabilidade-mes2.md`): Tela 4b cobre as tarefas 5 (roteiro) e 6 (dicas locais, "sem sair do roteiro").

## Como os dias da viagem viram dias por destino

**Atualizado em 10/set/2026 — substitui a versão anterior ("divide igualmente").** Agora cada destino tem suas próprias datas, definidas na Tela 1 (ver `docs/tela-01-criar-viagem.md`, seção "Datas"). Os dias por destino saem direto dessas datas, sem dividir nada por conta própria:

- Dia global 0 da viagem = a data de início do destino que começa mais cedo.
- Pra cada destino, seus dias locais vão da data de início até a data de fim daquele destino especificamente.
- Se sobrar um intervalo entre o fim de um destino e o começo do próximo (dia de viagem/trânsito que a pessoa deixou sem cidade), esse dia aparece no Roteiro como **"Dia N — [data] — Dia livre"**, sem lugares nem aba de dicas associada (só o cabeçalho do dia).
- **Dia de fronteira (datas se tocando, ex.: Buenos Aires termina 22/nov e Santiago começa 22/nov — mesmo dia):** esse dia único conta só uma vez no Roteiro, atribuído ao destino que **chega** naquele dia (o de data de início mais tardia entre os dois), não ao que está terminando. Faz sentido porque é o dia em que a pessoa já está vivendo a cidade nova, mesmo tendo saído da anterior de manhã.
- No cenário fixo de teste, se a Adriana/moderador orientar o participante a preencher Buenos Aires com 20-22/nov e Santiago com 23-25/nov (3 dias cada, sem intervalo), o resultado é o mesmo de antes: dias 1-3 = Buenos Aires, dias 4-6 = Santiago.

Isso substitui a função `splitDaysByDestination` antiga (que recebia `dateStartISO`/`dateEndISO` da viagem toda) — ver `docs/ajustes-09-datas-por-destino.md` pra assinatura nova.

## Aba "Roteiro"

- Lista os dias da viagem, um card por dia. **Atualizado em 10/set/2026 (ver `docs/ajustes-12-roteiro-data-mapa-por-dia-icones.md`): o título de cada card é o dia da semana + data completa ("Terça-feira, 08/09/2026"), não mais "Dia N —".** O número do dia (ex.: "Dia 1 de 6") e a cidade correspondente (regra acima) viram informação secundária, abaixo do título, junto com os lugares alocados naquele dia.
- **Alocação inicial dos lugares marcados na Tela 4a**: distribuir os lugares escolhidos de cada destino entre os dias daquele destino, na ordem em que foram marcados (round-robin simples: 1º lugar marcado vai pro 1º dia daquele destino, 2º lugar pro 2º dia, e assim por diante, voltando ao 1º dia se sobrar). Não precisa de lógica de distância/tempo real neste bloco — é só uma distribuição defensável pra ter algo navegável; documentar isso como simplificação deste bloco (o fluxo real prevê otimização por distância/tempo, fora de escopo aqui).
- **Mover lugar pra outro dia**: drag-and-drop (ou, como alternativa mais simples de acessibilidade/mobile, um menu "Mover pra..." com a lista de dias) — move o lugar do dia de origem pro dia de destino. Só permite mover entre dias da **mesma cidade** (não faz sentido colocar um lugar de Buenos Aires num dia alocado a Santiago).
- **Marcar como "pulei"**: cada lugar do dia tem uma ação de marcar como pulado (ícone + texto, nunca só cor). Ao marcar, o app recalcula: o lugar pulado sai da lista do dia (ou fica riscado/visualmente marcado como pulado, sem contar mais como item ativo do dia) e, se sobrar espaço, os lugares dos dias seguintes daquela cidade sobem uma posição (mesma lógica de redistribuição round-robin, agora ignorando os já pulados).
- Cada dia tem link/atalho pra abrir a aba "Dicas locais" já filtrada pra aquele dia (sem sair do roteiro — ver comportamento das abas abaixo).

## Visualização em mapa (adicionado em 10/set/2026, refinado em 10/set/2026)

Dentro da aba "Roteiro", além da lista de dias, um alternador Lista/Mapa mostra os lugares marcados num mapa real (OpenStreetMap via Leaflet). Ver `docs/ajustes-10-mapa-no-roteiro.md` pra especificação original (dependências, comportamento, coordenadas em `places.json`) — é a única parte do protótipo que depende de internet, exceção documentada no `CLAUDE.md`.

**Refinamentos (ver `docs/ajustes-12-roteiro-data-mapa-por-dia-icones.md`):**
- O alternador Lista/Mapa passa a usar só ícones (☰ / 🗺️), não mais texto — com texto acessível oculto pra leitor de tela e `title` de apoio.
- Dentro do modo Mapa, além de escolher o destino (cidade), agora também dá pra filtrar por dia específico daquele destino (ou "Todos os dias") — o mapa recentraliza só nos lugares do dia escolhido.

## Aba "Dicas locais"

- Abas dentro da tela (iOS: segmented control/pílula; Android: Material Tabs com sublinhado — mesmo padrão já documentado no `CLAUDE.md`). Trocar de aba não navega pra outra rota, é troca de conteúdo na mesma tela.
- Ao abrir a partir de um dia específico do Roteiro, a aba já abre filtrada pra cidade daquele dia; também dá pra trocar de cidade manualmente dentro da própria aba (seletor Buenos Aires/Santiago, igual à Tela 4a).
- Conteúdo vem de `src/data/localTips.json` (copiar de `docs/dados/local-tips.json`, sem alterar): dicas práticas reais e verificadas, agrupadas por categoria (Transporte, Dinheiro e câmbio, Segurança, Costumes locais) — não é agenda de eventos ao vivo (isso exigiria API externa, fora do princípio de protótipo offline-safe do `CLAUDE.md`).
- **Personalização por perfil (mesma hipótese da Tela 4a, não achado validado):** logo abaixo das dicas práticas, uma seção "Também vale visitar" com 2-3 lugares de `places.json` daquela cidade que o usuário **não** marcou na Tela 4a, priorizados pelos mesmos critérios de perfil (Interesses do quiz, depois pace relax→natureza / urbano→cultura-vida-noturna).

## Dados: `src/data/localTips.json`

Copiar `docs/dados/local-tips.json` pra `src/data/localTips.json`, sem alterar. Conteúdo curado de fontes reais sobre Buenos Aires e Santiago (transporte — SUBE em Buenos Aires, Tarjeta bip! em Santiago —, câmbio, segurança e costumes locais como gorjeta), não gerado por IA.

## Estado (TripContext)

Adicionar em `src/context/TripContext.tsx`:

```ts
export interface ItineraryOverride {
  placeSelectionId: string; // TripPlaceSelection.id
  dayIndex: number; // índice do dia dentro da cidade daquele lugar (0-based), depois de mover manualmente
  skipped: boolean;
}
```

- `itineraryOverrides: ItineraryOverride[]` no estado — só guarda o que o usuário mexeu manualmente (moveu de dia ou marcou como pulado); a alocação inicial (round-robin) é calculada, não precisa ser persistida por item.
- `moveItineraryItem(placeSelectionId: string, newDayIndex: number)`: cria/atualiza o override de dia daquele item.
- `toggleItinerarySkipped(placeSelectionId: string)`: cria/atualiza o override de `skipped`.

## Navegação

- Rota nova: `/roteiro`, depois de `/lugares`.
- `SelectPlaces` (Tela 4a): "Continuar" passa a navegar pra `/roteiro` (ver ajuste na spec da Tela 4a).
- Tela de Roteiro: back leva pra `/lugares`; como a próxima tela real (Reservas, Tela 6) ainda não existe neste bloco, um botão "Continuar" pode navegar pra `/em-construcao`, só pra fechar o fluxo clicável até aqui.
- Registrar `<Route path="/roteiro" element={<Itinerary />} />` em `App.tsx`, depois de `/lugares`.

## Acessibilidade

- Abas (Roteiro/Dicas locais) com padrão de tab acessível (`role="tablist"`/`role="tab"`/`role="tabpanel"`).
- Ação de "mover pra outro dia" precisa funcionar por teclado (não só drag-and-drop) — usar o menu "Mover pra..." como alternativa acessível, não só como fallback visual.
- "Pulei" nunca só ícone sem texto nem só cor.

## Checklist antes de considerar pronto

- `npm run build` limpo.
- Reproduzir o cenário fixo de teste: 6 dias, Buenos Aires + Santiago, 3 lugares marcados em Buenos Aires — dias 1-3 mostram Buenos Aires com os lugares distribuídos.
- Mover um lugar pra outro dia (dentro da mesma cidade) funciona e reflete na tela.
- Marcar um lugar como "pulei" recalcula visivelmente o resto do dia.
- Abrir a aba Dicas locais a partir do "Dia 2" mostra as dicas de Buenos Aires (conferir a lógica de mapeamento dia→cidade acima).
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
- Espaçamento segue a regra geral do `CLAUDE.md`.
- Cabeçalho de cada dia mostra a data por extenso como título principal, com "Dia N de X" como informação secundária (ver `docs/ajustes-12-roteiro-data-mapa-por-dia-icones.md`).
- No modo Mapa, dá pra filtrar por dia específico do destino ativo, e o alternador Lista/Mapa usa só ícones.
