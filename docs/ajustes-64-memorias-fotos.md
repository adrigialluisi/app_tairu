# Ajuste 64 — Memórias, parte 1: Fotos da viagem organizadas por dia

Quarta parte faltante (02/out/2026): **etapa 10 do fluxo proposto, "Fotos"**: galeria da viagem com envio direto, **com tag automática** (no fluxo, "Fotos/galeria + tag automática" estava como item Modificado).

Decisões:
- **Nova área "Memórias"** (rota `/memorias`), que vai juntar Fotos (este ajuste) e Retrospectiva (ajuste 65). **Fora do menu fixo**: o menu continua com 5 itens (Destinos, Central, Convidados, Roteiro, Custos). Mais de 5 itens no menu de baixo fica apertado no celular.
- Acesso por dois caminhos: **Início** (linha "Memórias da viagem", igual à de Meus documentos) e **cada dia do Roteiro** ("📷 Fotos do dia").
- **Tag automática = dia da viagem + cidade**, a partir da data do arquivo. O protótipo não lê EXIF: usa `file.lastModified`, que no celular costuma ser a data da foto. No teste, as fotos da pessoa vão ter data de hoje, fora de 20–25/11/2026. Por isso, quando a foto cai fora da viagem, **o app pergunta de qual dia ela é** (seção 4.3), em vez de inventar.
- Fotos em memória (`URL.createObjectURL`), como os anexos: valem enquanto o app estiver aberto.

---

## 1. Modelo — `src/context/TripContext.tsx`

```ts
export interface TripPhoto {
  id: string;
  url: string;                 // URL.createObjectURL(file)
  fileName: string;
  /** data do arquivo (lastModified), ISO yyyy-mm-dd */
  fileDateISO: string;
  /** dia da viagem atribuído (automático ou escolhido); null = sem dia */
  dayISO: string | null;
  /** true se a pessoa escolheu o dia na mão */
  dayManual: boolean;
  /** lugar/evento do dia escolhido pela pessoa (rótulo), opcional */
  placeLabel: string | null;
  caption: string;
  /** destaque: usado pela Retrospectiva (ajuste 65) */
  favorite: boolean;
}
```
Estado `photos: TripPhoto[]`; contexto `addPhotos(photos: TripPhoto[])`, `updatePhoto(photo)`, `removePhoto(id)` (revoga a URL). `resetTrip()` revoga todas e zera. Incluir no `useMemo`.

## 2. Utilidades — `src/utils/photos.ts` (novo)

```ts
/** dayISO automático: a data do arquivo, se estiver dentro das datas da viagem; senão null */
export function autoDayForDate(fileDateISO: string, tripStartISO: string | null, tripEndISO: string | null): string | null;

/** cidade daquele dia, usando splitDaysByDestination (quem chega fica com o dia de fronteira, mesma regra do Roteiro) */
export function cityForDay(dayISO: string, destinations: TripDestination[]): string | null;

/** grupos na ordem da viagem; "Sem dia da viagem" por último */
export function groupPhotosByDay(photos: TripPhoto[]): { dayISO: string | null; photos: TripPhoto[] }[];

/** opções de "lugar" pro dia: lugares alocados naquele dia no Roteiro + eventos escolhidos daquela data (só rótulos) */
export function placeOptionsForDay(dayISO: string, trip): string[];
```

## 3. Rota e acessos

- `src/App.tsx`: `<Route path="/memorias" element={<Memories />} />`.
- **Início** (`src/screens/Home.tsx`): quando houver viagem em andamento, uma linha **"📷 Memórias da viagem"** logo acima de "Meus documentos", mesmo componente/visual da linha de documentos. Subtítulo: "Fotos organizadas por dia" (sem fotos) ou "{n} fotos".
- **Roteiro → Lista** (`src/screens/Itinerary.tsx`): em cada card de dia, ao lado de "💡 Ver dicas locais desse dia", um link **"📷 Fotos do dia ({n})"** → `navigate('/memorias', { state: { dayISO } })`. Sem fotos: "📷 Adicionar fotos do dia".

## 4. Tela — `src/screens/Memories.tsx` (novo)

`ScreenShell` com `AppBar` "Memórias" + subtítulo nome da viagem, `onBack={() => navigate(-1)}` e `onHome`. Sem `BottomNav` (fora do menu, igual Documentos). `SaveToast`.

### 4.1 Topo
- Abas `Tabs`: **Fotos** · **Retrospectiva**. Neste ajuste, a aba Retrospectiva mostra só um card "✨ Sua retrospectiva vai aparecer aqui" (vira de verdade no ajuste 65).
- Botão primário **"📷 Adicionar fotos"**, largura cheia: `<input type="file" accept="image/*" multiple hidden>`. Um único `<Button>` primário na tela.
- Filtro por dia: as mesmas pills de data do Roteiro (`Tabs variant="pill-date"`), com "Todos os dias" + cada dia da viagem + "Sem dia" (só se houver). Abrindo com `state.dayISO`, começa filtrado naquele dia.

### 4.2 Galeria
- Por grupo (dia): cabeçalho `📅 Sáb, 21/11 · 📍 Buenos Aires` e contador "6 fotos"; grupo "Sem dia da viagem" por último, com o texto "Toque numa foto pra escolher o dia."
- Grade de 3 colunas, quadrados (`aspect-ratio: 1`, `object-fit: cover`), `gap: var(--space-1)`, cantos `--radius-photo` só nos cantos externos é opcional (simples: raio 8px em cada).
- Foto com destaque mostra ⭐ pequeno no canto. Cada foto é um `<button>` com `aria-label` = legenda ou "Foto de {cidade}, {data}".
- Espaço entre grupos: `--space-8`.
- **Estado vazio**: card com 📷, "Suas fotos da viagem ficam aqui, organizadas por dia sozinhas." e o botão "Adicionar fotos".

### 4.3 Depois de enviar: "De qual dia são essas fotos?"
Ao selecionar arquivos:
1. Pra cada arquivo: `fileDateISO` de `lastModified`; `dayISO = autoDayForDate(...)`.
2. Fotos com dia automático entram direto. Toast "3 fotos adicionadas em Sáb, 21/11".
3. **Se alguma ficou sem dia**, abre um painel inline logo abaixo do botão (não modal): "{n} fotos não são das datas da viagem. De qual dia elas são?" + pills dos dias da viagem (com a cidade embaixo de cada) + link "Deixar sem dia". Escolher um dia aplica a todas aquelas fotos (`dayManual: true`).
4. Se a pessoa entrou por "Fotos do dia" de um dia específico (`state.dayISO`), as fotos sem dia automático vão **direto pra esse dia**, sem perguntar.

### 4.4 Ver e editar uma foto — `src/components/memories/PhotoViewer.tsx` (novo)
Ao tocar numa foto, abre por cima da tela (painel em tela cheia, fundo escuro, botão fechar ✕ 44px, `Esc` fecha, foco preso dentro enquanto aberto):
- Foto grande (`object-fit: contain`).
- Abaixo, em card claro:
  - `📅 {dia} · 📍 {cidade}` e, se automático, selo pequeno "🏷️ Marcada automaticamente pela data".
  - **"Dia"**: select com os dias da viagem + "Sem dia" (muda `dayISO`, `dayManual: true`).
  - **"Onde foi?"** (opcional): chips com `placeOptionsForDay` + "Outro" (abre `TextField`). Grava em `placeLabel`.
  - **"Legenda"** (opcional): `TextField`.
  - **"⭐ Destaque da viagem"**: toggle (`aria-pressed`). Hint: "Os destaques entram primeiro na retrospectiva."
  - Setas ‹ › (44px) pra ir pra anterior/próxima dentro do filtro atual.
  - "Remover foto" (texto em `--accent-dark`), sem confirmação dupla, com toast "Foto removida".
- Mudanças salvam na hora (`updatePhoto`), sem botão salvar.

## 5. `CLAUDE.md`
Nova linha na listagem de telas: "7. Memórias (`/memorias`), fora do menu fixo, acessada pela Início e por 'Fotos do dia' no Roteiro. Fotos por dia com tag automática pela data do arquivo (`docs/ajustes-64-memorias-fotos.md`); aba Retrospectiva no ajuste 65." Em "Dados reais": o app não inventa o dia da foto; se a data do arquivo não estiver na viagem, pergunta.

## 6. Conferir
- [ ] Início mostra "Memórias da viagem" (com viagem em andamento); abre Memórias na aba Fotos.
- [ ] Enviar 3 fotos de hoje → painel "3 fotos não são das datas da viagem"; escolher Sáb 21/11 → aparecem no grupo "Sáb, 21/11 · Buenos Aires".
- [ ] Roteiro → 23/11 → "Adicionar fotos do dia" → enviar → vão direto pro 23/11 (Santiago), sem pergunta.
- [ ] Abrir foto: trocar dia, escolher lugar (aparecem os lugares/eventos daquele dia), legenda, destaque ⭐; setas navegam; Esc fecha.
- [ ] Filtro por dia funciona; "Sem dia" só aparece se houver foto sem dia.
- [ ] Nova viagem apaga as fotos.
- [ ] `npm run lint` e `npm run build` sem erro.
