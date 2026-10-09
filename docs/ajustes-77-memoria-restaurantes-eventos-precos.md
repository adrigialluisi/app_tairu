# Ajuste 77 — Memória da viagem passada com restaurantes, eventos e preços pagos

Pedido da Adriana (06/out/2026): a memória da viagem passada não pode ter só os lugares — entram também **restaurantes**, **eventos** e **quanto foi pago** em cada um. Isso é da **memória** (tela da viagem passada), **não** da recordação (stories).

## Dados — `src/data/examplePastTrips.ts`
- `PastTripStop` ganhou `kind` (`lugar` | `restaurante` | `evento`), `cost` (EUR, total do grupo; 0 = grátis), `costNote` ("3 ingressos", "almoço, 3 pessoas"), `time` e `sourceUrl` (eventos). `wikiTitle` virou opcional (sem artigo = ícone do tipo).
- `ExamplePastTrip.travelers` (3 no exemplo Lisboa + Porto) pra dividir por pessoa.
- **Restaurantes reais**: Time Out Market, Cervejaria Ramiro, Pastéis de Belém, Casa Piriquita (Sintra), Café Majestic, Mercado do Bolhão, Casa Guedes.
- **Eventos reais, nas datas da viagem** (conferidos em 06/out/2026): Final do Festival Termómetro, 10/05/2026, 16h, LAV – Lisboa ao Vivo (Av. Infante D. Henrique, Armazém 3) — fonte lisboaaovivo.com/agenda/mes/2026-05; Grande Gala de Baile e Cante Flamenco, 14/05/2026, Casa da Música — fonte portugal.com (12 Top Events in Porto, May 2026).
- **Valores são ilustrativos** (é viagem de exemplo) e a tela diz isso. A conversão pra real usa a cotação fixa do `exchangeRates.json` (ajustes-61), com data e fonte visíveis.

## Tela da viagem passada — `src/screens/PastTrip.tsx`
- Card novo **"Quanto custou"** (entre os números e a recordação): total em € + ≈ R$, valor por pessoa, uma linha por tipo (ícone + rótulo + quantidade + valor + barrinha proporcional), nota "Valores ilustrativos… Não inclui passagens nem hospedagem."
- Número "lugares" conta só `kind: 'lugar'`.
- Roteiro feito → Lista: filtro **Tudo / Lugares / Comida / Eventos** (Tabs segmentado). Cabeçalho da cidade com contagem por tipo e total em €; cada dia com "Gasto do dia". Cada item: rótulo de cima com tipo (e horário no evento), chip de preço ("€ 45,00 · 3 ingressos" ou "Grátis"), bairro/local, e no evento o link "Ver na agenda da época" (`sourceUrl`). Ícones lucide: Landmark (lugar), UtensilsCrossed (restaurante), Ticket (evento).
- Mapa: inclui todos os itens.

## Recordação — sem mudança visível
`StoryPlayer` filtra só os lugares (`withPlacesOnly` em `src/utils/pastTrip.ts`) pros mapas, fotos, contagens e dia mais cheio. Os km continuam calculados pelo roteiro completo, pra bater com a tela da viagem passada.
