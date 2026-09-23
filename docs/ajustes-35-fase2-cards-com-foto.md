# Ajuste 35 — Fase 2 do ajuste 34: cards com foto na Início e nos Lugares

Fase 2 do plano do `docs/ajustes-34-tokens-estilo-referencia.md` — aplica os tokens novos (`--radius-photo`, `--shadow-photo`, `--space-5`, escala tipográfica) nos dois lugares do protótipo que já têm foto de verdade: o card de destaque da Início e a lista de Lugares do Roteiro.

**Este ajuste substitui a parte visual (CSS) do `docs/ajustes-29-tela-inicio-refinamentos.md` e do `docs/ajustes-30-hero-card-atacama-documentos.md`** — como nenhum dos dois tinha sido construído ainda, em vez de aplicar os dois com os tokens antigos e depois restilizar de novo, já sai direto no formato novo. As decisões de CONTEÚDO dos dois continuam valendo (campos do card, único botão, Documentos como linha, foto do primeiro destino, Atacama no cenário — isso é dado/curadoria, não visual, não muda aqui).

## 1. Início — card de destaque (`TripHeroCard`) e viagens passadas com foto real

Foto grande no topo do card (180px, `--radius-photo`, `--shadow-photo`), selo "Sua viagem" sobreposto, conteúdo com respiro maior (`--space-5`). Os cards de "Viagens passadas" (exemplo) também ganham foto — busca ao vivo na Wikipedia pelo nome da cidade do exemplo (Rio de Janeiro, Lisboa), que é dado real (mesmo hook `usePlaceThumbnail`, não é dado fingido, só o roteiro/reserva em si que é fictício e já vem marcado "Exemplo").

**`src/screens/Home.tsx`** — substituir todo o conteúdo:

```tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shell/Button';
import { PlatformSwitcher } from '../components/shell/PlatformSwitcher';
import { useTrip } from '../context/TripContext';
import { usePlaceThumbnail } from '../hooks/usePlaceThumbnail';
import { formatCompanionsLabel, formatDatesLabel, formatDestinationsLabel } from '../utils/tripSummary';
import styles from './Home.module.css';

/**
 * O protótipo não guarda histórico real de viagens (tudo em memória) —
 * estas são viagens de exemplo fixas, só pra ilustrar o layout do
 * carrossel. Nunca vêm do TripContext, nunca são clicáveis, sempre
 * marcadas com o selo "Exemplo". Nomes de ocasião (não nome de cidade) e
 * destinos fora do cenário fixo de teste. `cityForPhoto` busca uma foto
 * real (Wikipedia) do destino real do exemplo — não é dado fingido, só a
 * "viagem" em si que é ilustrativa.
 */
const EXAMPLE_PAST_TRIPS = [
  {
    id: 'exemplo-1',
    name: 'Réveillon em família',
    cityForPhoto: 'Rio de Janeiro',
    destinationsLabel: 'Rio de Janeiro',
    datesLabel: '28/12 – 02/01',
    companionsLabel: '4 convidados',
  },
  {
    id: 'exemplo-2',
    name: 'Aniversário de 30 anos',
    cityForPhoto: 'Lisboa',
    destinationsLabel: 'Lisboa, Porto',
    datesLabel: '10/05 – 18/05',
    companionsLabel: '2 convidados',
  },
];

function TripHeroCard({ trip, onClick }: { trip: ReturnType<typeof useTrip>; onClick: () => void }) {
  const heroCity = trip.destinations[0]?.city ?? '';
  const thumbnailUrl = usePlaceThumbnail(heroCity);

  return (
    <button type="button" className={styles.heroCard} onClick={onClick}>
      <div className={styles.heroPhotoWrap}>
        {heroCity && thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.heroPhoto} />
        ) : (
          <span className={styles.heroPhotoFallback} aria-hidden="true">🧳</span>
        )}
        <span className={styles.heroBadge}>Sua viagem</span>
      </div>
      <div className={styles.heroContent}>
        <span className={styles.heroName}>{trip.name.trim() || 'Viagem sem nome'}</span>
        <span className={styles.heroMeta}>
          {formatDestinationsLabel(trip.destinations)} · {formatDatesLabel(trip.destinations)}
        </span>
        <span className={styles.heroMeta}>{formatCompanionsLabel(trip.companions.length)}</span>
      </div>
    </button>
  );
}

function PastTripCard({ trip }: { trip: (typeof EXAMPLE_PAST_TRIPS)[number] }) {
  const thumbnailUrl = usePlaceThumbnail(trip.cityForPhoto);

  return (
    <div className={styles.pastTripCard}>
      <div className={styles.pastTripPhotoWrap}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.pastTripPhoto} />
        ) : (
          <span className={styles.pastTripPhotoFallback} aria-hidden="true">🧳</span>
        )}
        <span className={styles.exampleBadge}>Exemplo</span>
      </div>
      <div className={styles.pastTripContent}>
        <p className={styles.pastTripName}>{trip.name}</p>
        <p className={styles.pastTripMeta}>
          {trip.destinationsLabel} · {trip.datesLabel}
        </p>
        <p className={styles.pastTripMeta}>{trip.companionsLabel}</p>
      </div>
    </div>
  );
}

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
        <div className={styles.headerActions}>
          <PlatformSwitcher inline />
          <button type="button" className={styles.profileButton} aria-label="Perfil (em breve)" disabled>
            <span aria-hidden="true">👤</span>
          </button>
        </div>
      </header>

      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>Olá! 👋</h1>
        <p className={styles.greetingSubtitle}>Pra onde vamos dessa vez?</p>
      </div>

      {hasActiveTrip && <TripHeroCard trip={trip} onClick={() => navigate('/destinos')} />}

      <section className={styles.pastTrips} aria-label="Viagens passadas (exemplo)">
        <h2 className={styles.sectionTitle}>Viagens passadas</h2>
        <div className={styles.carousel}>
          {EXAMPLE_PAST_TRIPS.map((t) => (
            <PastTripCard key={t.id} trip={t} />
          ))}
        </div>
        <p className={styles.pastTripsNote}>Suas viagens concluídas vão aparecer aqui.</p>
      </section>

      <button type="button" className={styles.documentsRow} onClick={() => navigate('/documentos')}>
        <span className={styles.documentsRowIcon} aria-hidden="true">📄</span>
        <span className={styles.documentsRowLabel}>Meus documentos</span>
        <span className={styles.documentsRowChevron} aria-hidden="true">›</span>
      </button>

      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={handleNewTrip}>
          Nova viagem
        </Button>
      </div>
    </div>
  );
}
```

**`src/screens/Home.module.css`** — substituir todo o conteúdo:

```css
.screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  background-color: #ffffff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logoMark {
  height: 28px;
  width: auto;
}

.profileButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target);
  height: var(--touch-target);
  border-radius: 999px;
  border: 1.5px solid var(--field-border);
  background: var(--card);
  font-size: 18px;
  opacity: 0.6;
}

.greeting {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.greetingTitle {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text);
}

.greetingSubtitle {
  margin: 0;
  font-size: var(--text-base);
  color: var(--muted);
}

.heroCard {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--card);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-photo);
  overflow: hidden;
  box-shadow: var(--shadow-photo);
  padding: 0;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.heroPhotoWrap {
  position: relative;
  width: 100%;
  height: 180px;
  background: var(--bg-top);
}

.heroPhoto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.heroPhotoFallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 40px;
}

.heroBadge {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  background: var(--accent);
  color: var(--text-on-dark);
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px var(--space-2);
  border-radius: 999px;
}

.heroContent {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-5);
}

.heroName {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text);
}

.heroMeta {
  font-size: var(--text-sm);
  color: var(--muted);
}

.pastTrips {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sectionTitle {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-weight-bold);
  color: var(--text);
}

.carousel {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}

.pastTripCard {
  flex: 0 0 auto;
  width: 180px;
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-photo);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.pastTripPhotoWrap {
  position: relative;
  width: 100%;
  height: 100px;
  background: var(--bg-top);
}

.pastTripPhoto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pastTripPhotoFallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 28px;
}

.exampleBadge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text);
  background: var(--card);
  border-radius: 999px;
  padding: 2px var(--space-2);
}

.pastTripContent {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3);
}

.pastTripName {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text);
}

.pastTripMeta {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
}

.pastTripsNote {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

.documentsRow {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--touch-target);
  background: var(--card);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-android-card);
  padding: var(--space-3) var(--space-4);
  color: var(--text);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-base);
  cursor: pointer;
}

.documentsRowIcon {
  font-size: 18px;
}

.documentsRowLabel {
  flex: 1;
}

.documentsRowChevron {
  color: var(--muted);
  font-size: 18px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: auto;
}
```

## 2. Lugares (Roteiro) — toque leve, não um redesenho grande

As referências mostram cards de lugar bem maiores (foto grande, avaliação, preço). **Decisão deliberada: não adoto esse formato aqui** — a lista de Lugares hoje é uma lista de seleção rápida (marcar vários lugares em sequência, formato checklist); transformar cada item num card grande de foto ia deixar a lista muito mais longa e mais lenta de escanear, prejudicando essa tarefa. Em vez disso, só um toque leve nos tokens novos: miniatura um pouco maior, cantos mais arredondados (herdado automaticamente do `--radius-android-card` que já mudou de 12 pra 16px na fase 1), sombra sutil de card, tipografia pela escala nova.

**`src/components/places/PlaceRow.module.css`** — trocar estes trechos:

```css
.row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  padding: var(--space-3) var(--space-4);
  background: var(--card);
  border: 1.5px solid var(--field-border);
  border-radius: var(--radius-android-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
}
```

```css
.thumbnail {
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-android-card);
  overflow: hidden;
  background: var(--bg-top);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

```css
.name {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
}

.neighborhood {
  font-size: var(--text-sm);
  color: var(--muted);
}
```

(Só isso — o resto do arquivo, incluindo `.rowSelected`, `.checkbox`, `.categories`, continua igual.)

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Início: card de destaque grande com foto real (quando há viagem em andamento), cantos bem arredondados, sombra suave — visualmente mais parecido com os cards de foto dos prints de referência.
- Viagens passadas (exemplo): cada card mostra uma foto real do destino do exemplo (Rio de Janeiro / Lisboa), selo "Exemplo" continua visível, cards continuam não clicáveis.
- "Meus documentos" continua como linha de lista entre o carrossel e o botão "Nova viagem".
- Lugares (Roteiro): lista continua compacta e rápida de escanear — só os cantos/tamanho da miniatura/tipografia mudaram, não virou lista de cards grandes.
- Testar em 375px/390px, nas duas plataformas.
