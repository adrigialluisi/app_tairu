# Ajuste 81 — "Eventos nas suas datas" sempre com acontecimentos da cidade (festivais, feiras, shows), em qualquer data

> **Pra quem vai aplicar (Claude Code no Antigravity):** substitui a seção 3 do ajuste 80 (eventos simulados com data fixa). Arquivos: `src/data/events.json`, `src/data/index.ts`, `src/utils/categoryVisuals.ts`, `src/components/suggestions/SuggestionsPanel.tsx`, `src/components/suggestions/EventCard.tsx`, e quem usa `getEventById` (Roteiro/Agenda do dia).

Pedido da Adriana (08/out/2026): a seção **"Eventos nas suas datas"** está aparecendo vazia ("nenhum evento"). Ela quer ali **acontecimentos da cidade naquela janela de datas**: festivais, feiras, shows, exposições, jogos. **Não** ponto turístico, **não** restaurante, **não** passeio guiado (isso já está nas outras seções de Sugestões). Pode ser fictício.

**Causa do vazio:** todos os eventos de `events.json` têm data fixa entre 20 e 25/11/2026. Qualquer viagem com outra data (ou outra cidade) não encontra nada.

## 1. Dados: eventos que se adaptam às datas da viagem

Novo arquivo pronto (feito pelo Claude/Cowork): **`docs/dados/eventos-da-cidade-simulados.json`** → copiar pra `src/data/cityEventTemplates.json`.
- `cities[cityId]`: 5 a 7 modelos de evento por cidade do cenário (Buenos Aires, Santiago, San Pedro de Atacama), cada um com `weekdays` (0 = domingo … 6 = sábado) em que acontece, horário, local real com coordenada aproximada, preço, descrição.
- `generic`: 5 modelos pra **qualquer outra cidade** (`{city}` no texto vira o nome da cidade; sem coordenada → não aparece pino no mapa).
- Conferido: toda cidade tem pelo menos 1 evento em cada dia da semana.

**Em `src/data/events.json`:** apagar os 13 eventos `sim-…` que entraram no ajuste 80 (foram substituídos por estes). Os 7 eventos **reais** continuam (data fixa, com fonte).

## 2. Geração das ocorrências — `src/data/index.ts`

Reescrever `getEventsForDestination(cityId, startISO, endISO, cityName?)`:
1. Eventos reais de `events.json` dentro do intervalo (como hoje).
2. Para **cada dia** do intervalo: pegar os modelos da cidade (ou `generic`, trocando `{city}` por `cityName`) cujo `weekdays` inclui o dia da semana. Gerar um `EventEntry` por modelo com:
   - `id`: `${template.id}--${dateISO}` (estável: marcar/desmarcar e o Roteiro continuam funcionando)
   - `date`: o dia; `simulated: true`; sem `sourceUrl`.
3. **No máximo 2 por dia vindos de modelo** (contando com os reais do dia: se já tem 1 real, entra só 1 modelo). Escolha determinística: rodar a lista pelo índice do dia (`(dayIndex + i) % n`), pra não repetir sempre o mesmo evento em dias seguidos.
4. Ordenar por data e horário.

`getEventById(id)`: se tiver `--`, separar `templateId` e `dateISO` e remontar o evento (precisa achar a cidade do modelo; guardar um índice `templateId → cityId`). Para `generic`, o nome da cidade vem do destino: passar `cityName` opcional, ou guardar no `selectedEventIds` o evento já resolvido. **Escolher a forma mais simples que mantenha o evento aparecendo certo na Agenda do dia do Roteiro.**

## 3. Tipos e ícones
- `EventKind` ganha `'festival' | 'exposicao' | 'cinema' | 'esporte' | 'celebracao'`. Ícones lucide em `EVENT_KIND_ICONS`: festival `Sparkles`, exposicao `Frame`, cinema `Clapperboard`, esporte `Trophy`, celebracao `PartyPopper`. (`passeio` e `gastronomia` do ajuste 80 podem sair se nada mais usar.)

## 4. Na tela (Sugestões → "Eventos nas suas datas")
- Mantém o card atual (bloco de data, "Sex, 20/11 · 21:30", local, preço, botão **"Adicionar ao roteiro"** → evento entra no dia dele na Agenda do dia).
- Carrossel agrupado por dia, com o rótulo do dia antes do primeiro card ("Sexta, 20/11"), como pedia o ajuste 80.
- Descrição da seção: "Festivais, feiras e shows acontecendo em {cidade} enquanto você estiver lá."
- Estado vazio passa a existir só quando a cidade não tem datas: "Preencha as datas de {cidade} em Destinos pra ver o que vai rolar."
- Sem selo de "fictício" pro participante (o roteiro de teste do moderador registra isso).

## 5. Regras de sempre
- Testar com o cenário fixo (20–25/11) **e** com outras datas e outra cidade (ex.: Lisboa em março): a seção nunca pode ficar vazia com datas preenchidas.
- `npm run lint` e `npm run build` sem erro.
- `CLAUDE.md`: eventos simulados agora são modelos por dia da semana (`cityEventTemplates.json`), gerados nas datas da viagem; ponto turístico, restaurante e passeio não entram em Eventos.
- Commit: `ajuste 81: eventos da cidade em qualquer data`.
