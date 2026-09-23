# Ajuste 29 — Refinamentos na tela Início (depois de ver o ajuste 28 construído)

Feedback da Adriana (14/set/2026), depois de ver o `ajustes-28` já aplicado:

> "Remover o pattern dessa tela inicial. Viagens passadas vamos determinar outros lugares. Fazer sugestões de nomes que não seja o nome da cidade. No card tem que ter: Nome da viagem, Destinos/Datas, Quantos convidados. Deixar só um botão principal de nova viagem. Documentos tem que ser um link na tela."

Cinco mudanças, todas dentro de `Home.tsx`/`Home.module.css` (o arquivo criado no `ajustes-28`) — nenhuma mexe em `TripContext.tsx` nem em nenhuma outra tela.

## 1. Remover o grafismo de pontinhos do fundo

`Home.module.css` — `.screen` perde `background-image`/`background-size`/`background-position` (o grafismo que veio do `ajustes-26`, reaproveitado da Splash). Fica só o fundo branco liso:

```css
.screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  background-color: #FFFFFF;
}
```

(A Splash continua com o grafismo dela — a mudança é só na Início.)

## 2. Card com Nome da viagem, Destinos/Datas e Quantos convidados

Tanto o card "Sua viagem" (real) quanto os cards de "Viagens passadas" (exemplo) precisam mostrar as 3 informações. Pra centralizar a lógica de formatação da parte real (que os cards de exemplo não usam, porque são strings fixas), novo arquivo:

**`src/utils/tripSummary.ts`** (novo):

```ts
import { formatISOToDisplay } from './dateMask';
import type { TripDestination } from '../context/TripContext';

export function formatDestinationsLabel(destinations: TripDestination[]): string {
  if (destinations.length === 0) return 'Nenhum destino ainda';
  return destinations.map((d) => d.city).join(', ');
}

/** Menor dateStart até maior dateEnd entre os destinos que já têm as duas datas — ignora os que não têm. */
export function formatDatesLabel(destinations: TripDestination[]): string {
  const withDates = destinations.filter((d) => d.dateStart && d.dateEnd);
  if (withDates.length === 0) return 'Datas a definir';
  const earliest = [...withDates].sort((a, b) => (a.dateStart as string).localeCompare(b.dateStart as string))[0]
    .dateStart as string;
  const latest = [...withDates].sort((a, b) => (b.dateEnd as string).localeCompare(a.dateEnd as string))[0]
    .dateEnd as string;
  return `${formatISOToDisplay(earliest).slice(0, 5)} – ${formatISOToDisplay(latest).slice(0, 5)}`;
}

export function formatCompanionsLabel(count: number): string {
  if (count === 0) return 'Só você, por enquanto';
  return count === 1 ? '1 convidado' : `${count} convidados`;
}
```

## 3. Viagens de exemplo: nomes de viagem de verdade (não cidade) + destinos diferentes do cenário de teste

As duas viagens de exemplo de hoje usavam o nome da própria cidade como "nome da viagem" (`'Buenos Aires, Argentina'`) — exatamente o que a Adriana pediu pra tirar. Também usavam Buenos Aires/Santiago, que são o cenário fixo do teste de usabilidade — jeito ruim de exemplo, porque pode confundir com a viagem real que a pessoa está montando durante o teste. Troca por nomes de viagem no mesmo espírito do campo "Nome da viagem" que já existe em Destinos (uma ocasião, não um lugar) e destinos de fora do cenário de teste:

```ts
/**
 * O protótipo não guarda histórico real de viagens (tudo em memória, ver
 * docs/ajustes-26-central-inicio-documentos-splash.md) — estas são viagens
 * de exemplo fixas, só pra ilustrar o layout do carrossel. Nunca vêm do
 * TripContext, nunca são clicáveis, sempre marcadas com o selo "Exemplo".
 * Nomes de ocasião (não nome de cidade) e destinos fora do cenário fixo de
 * teste (Buenos Aires/Santiago), pra nunca confundir com a viagem real que
 * a pessoa está montando durante o teste — ver docs/ajustes-29-...md.
 */
const EXAMPLE_PAST_TRIPS = [
  {
    id: 'exemplo-1',
    name: 'Réveillon em família',
    destinationsLabel: 'Rio de Janeiro',
    datesLabel: '28/12 – 02/01',
    companionsLabel: '4 convidados',
  },
  {
    id: 'exemplo-2',
    name: 'Aniversário de 30 anos',
    destinationsLabel: 'Lisboa, Porto',
    datesLabel: '10/05 – 18/05',
    companionsLabel: '2 convidados',
  },
];
```

(Sugestões de nome adicionais, caso prefira trocar: "Escapada de fim de semana", "Lua de mel", "Despedida de solteira", "Viagem com os pais", "Intercâmbio de 3 meses" — qualquer uma serve, o importante é ser um nome de ocasião, igual ao padrão do campo "Nome da viagem" em Destinos.)

## 4. Um só botão principal — "Sua viagem" vira card clicável, sem botão dentro

Hoje o card "Sua viagem" tinha um `<Button variant="primary">Continuar viagem</Button>` dentro, competindo com o `<Button>` de "Nova viagem" logo abaixo — dois botões principais na mesma tela. Trocado por: o card inteiro vira clicável (elemento `<button>` de verdade, pra manter acessibilidade — teclado, leitor de tela — sem precisar de um botão visual a mais dentro dele), e "Nova viagem" passa a ser o único `<Button>` da tela, sempre `variant="primary"` (antes variava entre `primary`/`secondary` dependendo de já ter viagem ou não — não faz mais sentido, já que agora é o único).

```tsx
{hasActiveTrip && (
  <button type="button" className={styles.tripCard} onClick={() => navigate('/destinos')}>
    <span className={styles.tripCardLabel}>Sua viagem</span>
    <span className={styles.tripCardName}>{trip.name.trim() || 'Viagem sem nome'}</span>
    <span className={styles.tripCardMeta}>
      {formatDestinationsLabel(trip.destinations)} · {formatDatesLabel(trip.destinations)}
    </span>
    <span className={styles.tripCardMeta}>{formatCompanionsLabel(trip.companions.length)}</span>
  </button>
)}
```

(Trocado `<p>` por `<span>` de propósito — um `<button>` não pode conter elementos de bloco como `<p>` em HTML válido; `.tripCardLabel`/`.tripCardName`/`.tripCardMeta` ganham `display: block` no CSS pra continuar com a mesma quebra de linha visual.)

```tsx
<div className={styles.actions}>
  <Button variant="primary" fullWidth onClick={handleNewTrip}>
    Nova viagem
  </Button>
</div>
```

**`Home.module.css`** — `.tripCard` precisa virar clicável de verdade (reset de aparência padrão de `<button>`) e ganhar `.tripCardMeta`:

```css
.tripCard {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--card);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-android-card);
  padding: var(--space-4);
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.tripCardLabel,
.tripCardName,
.tripCardMeta {
  display: block;
}

.tripCardMeta {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
```

(`.tripCardLabel`/`.tripCardName` já existem — só ganham `display: block` a mais, sem mudar o resto.)

Os cards de exemplo também ganham as duas linhas de meta, mesmo padrão visual:

```tsx
<div key={t.id} className={styles.pastTripCard}>
  <span className={styles.exampleBadge}>Exemplo</span>
  <p className={styles.pastTripName}>{t.name}</p>
  <p className={styles.pastTripMeta}>{t.destinationsLabel} · {t.datesLabel}</p>
  <p className={styles.pastTripMeta}>{t.companionsLabel}</p>
</div>
```

(Esses continuam `<div>`, não `<button>` — não são clicáveis, então não têm a mesma restrição de conteúdo.)

## 5. Documentos vira link, não botão — sobe pro topo da tela

Hoje "Documentos" estava lá embaixo, ao lado visual de "Nova viagem", com a mesma largura cheia — parecia outro botão, não um link. Sobe pra perto do cabeçalho, ao lado da saudação, com estilo de link de verdade (texto, sem fundo/borda, sem `fullWidth`):

```tsx
<div className={styles.greetingRow}>
  <div className={styles.greeting}>
    <h1 className={styles.greetingTitle}>Olá! 👋</h1>
    <p className={styles.greetingSubtitle}>Pra onde vamos dessa vez?</p>
  </div>
  <button type="button" className={styles.documentsLink} onClick={() => navigate('/documentos')}>
    📄 Documentos
  </button>
</div>
```

**`Home.module.css`**:

```css
.greetingRow {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.documentsLink {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: none;
  padding: var(--space-2);
  color: var(--accent-dark);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
```

(O `.documentsLink` antigo, com `min-height: var(--touch-target)`/`justify-content: center`/`fullWidth`, é substituído por esse — apaga o antigo.)

## Estrutura final de `Home.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shell/Button';
import { useTrip } from '../context/TripContext';
import { formatCompanionsLabel, formatDatesLabel, formatDestinationsLabel } from '../utils/tripSummary';
import styles from './Home.module.css';

const EXAMPLE_PAST_TRIPS = [ /* ver item 3 */ ];

export function Home() {
  const trip = useTrip();
  const navigate = useNavigate();
  const hasActiveTrip = trip.name.trim().length > 0 || trip.destinations.length > 0;

  function handleNewTrip() {
    trip.resetTrip();
    navigate('/destinos');
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <img src="/logo/LogoTairu.svg" alt="Tairu" className={styles.logoMark} />
        <button type="button" className={styles.profileButton} aria-label="Perfil (em breve)" disabled>
          <span aria-hidden="true">👤</span>
        </button>
      </header>

      <div className={styles.greetingRow}>
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>Olá! 👋</h1>
          <p className={styles.greetingSubtitle}>Pra onde vamos dessa vez?</p>
        </div>
        <button type="button" className={styles.documentsLink} onClick={() => navigate('/documentos')}>
          📄 Documentos
        </button>
      </div>

      {hasActiveTrip && ( /* ver item 4 */ )}

      <section className={styles.pastTrips} aria-label="Viagens passadas (exemplo)">
        <h2 className={styles.sectionTitle}>Viagens passadas</h2>
        <div className={styles.carousel}>
          {EXAMPLE_PAST_TRIPS.map((t) => ( /* ver item 3/4 */ ))}
        </div>
        <p className={styles.pastTripsNote}>Suas viagens concluídas vão aparecer aqui.</p>
      </section>

      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={handleNewTrip}>
          Nova viagem
        </Button>
      </div>
    </div>
  );
}
```

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Fundo da Início é branco liso, sem o padrão de pontinhos (a Splash continua com o grafismo dela, sem mudança).
- Card "Sua viagem" (quando existe viagem real) mostra nome da viagem, destinos + datas, e número de convidados — e é clicável no card inteiro (funciona com clique e com Tab+Enter), levando pra Destinos.
- Cards de "Viagens passadas" mostram nome de ocasião (não nome de cidade), destinos + datas, número de convidados, e o selo "Exemplo" — não são clicáveis.
- Só existe **um** `<Button>` na tela ("Nova viagem"), sempre estilo primário.
- "Documentos" aparece como link de texto perto do cabeçalho, não mais como botão de largura cheia lá embaixo.
- Viagem sem nenhum destino com data completa mostra "Datas a definir" no lugar do período (mesmo espírito do aviso já existente em Destinos, `ajustes-25`).
- Viagem sem nenhum convidado mostra "Só você, por enquanto", não "0 convidados".
- Testar em 375px e 390px, e nas duas variantes iOS/Android — o link de Documentos ao lado da saudação não pode quebrar de forma estranha em telas menores.
