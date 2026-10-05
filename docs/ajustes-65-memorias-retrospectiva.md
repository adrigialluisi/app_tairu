# Ajuste 65 — Memórias, parte 2: Retrospectiva opcional e editável

Quinta parte faltante (02/out/2026): **etapa 11 do fluxo proposto, "Retrospectiva"**: opcional (a pessoa escolhe se quer gerar, por um convite simples), surpresa no final e **editável** (trocar fotos, reordenar destaques, ajustar texto antes de compartilhar). A versão automática é o ponto de partida, não a final.

Regras:
- **Sem IA generativa.** O texto é montado com frases-modelo preenchidas com dados reais da viagem (cidades, dias, lugares, eventos, fotos, gastos). Nada é inventado: se não tem dado, o card não aparece.
- Fica na aba **Retrospectiva** de Memórias (criada no ajuste 64), trocando o card provisório.
- **Gastos são privados por padrão**: só entram se a pessoa ligar "Mostrar gastos".

---

## 1. Modelo — `src/context/TripContext.tsx`

```ts
export type RetroCardKind = 'capa' | 'numeros' | 'cidade' | 'destaques' | 'fecho';

export interface RetroCard {
  id: string;
  kind: RetroCardKind;
  title: string;
  text: string;
  /** TripPhoto.id da foto principal do card (capa e cidade); null = sem foto */
  photoId: string | null;
  /** só no kind 'cidade' */
  destinationId?: string;
  hidden: boolean;
}

export interface Retrospective {
  generatedAtISO: string;
  showCosts: boolean;
  cards: RetroCard[];   // a ordem do array é a ordem de exibição
}
```
Estado `retrospective: Retrospective | null` e `retroDismissed: boolean` ("Agora não"). Contexto: `setRetrospective(r | null)`, `updateRetroCard(card)`, `moveRetroCard(id, -1 | 1)`, `setRetroShowCosts(bool)`, `setRetroDismissed(bool)`. Zerar no `resetTrip()`. Se uma foto usada num card for removida, o `photoId` daquele card vira `null` (tratar no `removePhoto`).

## 2. Montagem — `src/utils/retrospective.ts` (novo)

```ts
export function buildRetrospective(trip): Retrospective;
export function retroStats(trip): {
  days: number; cities: string[]; visitedPlaces: number; events: number;
  photos: number; favorites: number; totalBRL: number | null; topCategory: { label: string; icon: string } | null;
};
```
**Lugares visitados** = `selectedPlaces` que não estão marcados como pulados (`itineraryOverrides` com `skipped: true`).

Cards gerados, nesta ordem (cada um só se tiver dado):

| Card | Foto | Título (padrão) | Texto (padrão, montado) |
|---|---|---|---|
| **capa** | 1º destaque ⭐; senão 1ª foto; senão nenhuma (usa a foto da cidade via `usePlaceThumbnail`, como no hero da Início) | nome da viagem | "{data início} a {data fim} · {cidade 1}, {cidade 2} e {cidade 3}" |
| **numeros** | — | "A viagem em números" | grade de números (ver 3.2), não é texto livre; o `text` fica como observação opcional, vazio por padrão |
| **cidade** (1 por destino com dias) | 1º destaque daquele destino; senão 1ª foto do destino; senão foto da cidade | "{cidade}" | "{n} dias em {cidade}. Vocês passaram por {lugar 1}, {lugar 2} e {lugar 3}{, e foram em {evento}}." (até 3 lugares; sem lugares: "{n} dias em {cidade}.") |
| **destaques** | grade com até 6 fotos ⭐ (se tiver menos de 2 destaques, o card não é gerado) | "Os melhores momentos" | "" |
| **fecho** | — | "Até a próxima!" | com convidados: "Uma viagem de {você e marina.duarte e rodrigo.antunes}." Sem: "Uma viagem sua." |

## 3. Tela — aba Retrospectiva em `src/screens/Memories.tsx`

### 3.1 Antes de gerar: convite (opcional)
Card centralizado: ✨, título "Quer gerar a retrospectiva da viagem?", texto "Juntamos fotos, lugares e números da viagem num resumo que você pode editar e compartilhar." Botões: **"Gerar retrospectiva"** (primário) e **"Agora não"** (texto, marca `retroDismissed`). Linha `--text-sm`/`--muted`: "No app de verdade, esse convite chega quando a viagem termina. No protótipo dá pra gerar a qualquer momento."
Com `retroDismissed`, o card vira uma linha discreta "Retrospectiva não gerada · Gerar agora".
Sem nenhum dado (sem destino com data), o convite diz "Preencha os destinos e datas da viagem pra gerar a retrospectiva." e não tem botão de gerar.

### 3.2 Depois de gerar: os cards
Lista vertical de cards grandes (estilo stories, um embaixo do outro), `gap: var(--space-6)`, cada um com `--radius-ios-card`/`--radius-android-card` e `--shadow-card`:
- **capa**: foto em largura cheia (altura 280px, `object-fit: cover`) com degradê escuro embaixo e título + texto em branco por cima (contraste AA garantido pelo degradê).
- **numeros**: grade 2×3 de "tiles": número grande (`--text-2xl`, bold) + rótulo com ícone: `📅 dias`, `📍 cidades`, `🗺️ lugares visitados`, `🎟️ eventos`, `📷 fotos`, e (se `showCosts`) `💰 gastos` com o total em BRL + "mais com {ícone} {categoria}". Tile com valor zero não aparece.
- **cidade**: foto no topo (200px), título e texto abaixo.
- **destaques**: título + grade 3 colunas com as fotos ⭐.
- **fecho**: card simples centralizado, com o logo do Tairu pequeno embaixo.

Card oculto (`hidden`) não aparece no modo de ver.

### 3.3 Editar (inline, sem tela separada)
No topo da aba, um alternador **"Ver" / "Editar"** (dois botões de texto, o ativo sublinhado, mesmo estilo sutil já usado no projeto). No modo **Editar**, cada card ganha uma barra de ações embaixo:
- **↑ / ↓** (44px, `aria-label="Subir card"`/`"Descer card"`): reordenam (`moveRetroCard`). A capa pode ser movida também, sem trava.
- **"Trocar foto"** (só capa e cidade): abre uma grade com todas as fotos da viagem; tocar escolhe; opção "Sem foto".
- **Título** e **texto**: viram `TextField` editáveis no próprio card.
- **"Ocultar" / "Mostrar"**: card oculto fica com opacidade 0.5 e selo "Oculto" no modo Editar.
- No topo do modo Editar: toggle **"Mostrar gastos"** (`setRetroShowCosts`), com hint "Desligado, ninguém vê quanto vocês gastaram."
- Botão de texto **"Gerar de novo"**: avisa inline "Isso desfaz suas edições. Gerar de novo?" com "Sim, gerar de novo" / "Cancelar". (Aqui o "Cancelar" faz sentido: é uma confirmação destrutiva, não um formulário.)
Edições salvam na hora.

### 3.4 Compartilhar
No modo Ver, no fim da lista: botão secundário **"Compartilhar"**. Usa `navigator.share({ title, text })` quando existir, com um texto-resumo montado dos cards visíveis (título da capa, cidades, números). Sem `navigator.share`: copia o texto (`navigator.clipboard.writeText`) e mostra toast "Resumo copiado". Não gera imagem nesta leva.

## 4. Início
Sem mudança obrigatória. Opcional, se for simples: com retrospectiva gerada, o subtítulo da linha "Memórias da viagem" vira "{n} fotos · retrospectiva pronta".

## 5. `CLAUDE.md`
No item 7 (Memórias): aba Retrospectiva construída (`docs/ajustes-65-memorias-retrospectiva.md`), opcional com convite, montada com frases-modelo e dados reais (sem IA generativa), editável (reordenar, trocar foto, editar texto, ocultar), gastos escondidos por padrão.

## 6. Conferir
- [ ] Sem gerar: convite com "Gerar" e "Agora não"; "Agora não" vira linha discreta.
- [ ] Cenário completo (3 destinos, lugares escolhidos, 1 pulado, 1 evento, fotos com 2+ destaques, gastos): gera capa, números, 3 cidades, destaques e fecho.
- [ ] Lugar marcado "Pulei" não conta em "lugares visitados" nem aparece no texto da cidade.
- [ ] Gastos não aparecem até ligar "Mostrar gastos".
- [ ] Editar: ↑/↓ reordena, trocar foto, editar título/texto, ocultar; tudo continua ao voltar pra aba Fotos e voltar.
- [ ] "Gerar de novo" pede confirmação e refaz.
- [ ] Compartilhar: no celular abre o menu de compartilhar; no computador copia o resumo.
- [ ] Remover em Fotos uma foto usada na capa → capa cai pra foto da cidade, sem quebrar.
- [ ] `npm run lint` e `npm run build` sem erro.
