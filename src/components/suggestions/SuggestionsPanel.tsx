import { CalendarDays, PencilLine, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '../shell/Button';
import { EmptyState } from '../shell/EmptyState';
import { ConflictDialog } from '../shell/ConflictDialog';
import { activityConflict, firstTime } from '../../utils/activityConflicts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddedPlaceCard } from './AddedPlaceCard';
import { CategoryTags, type CategoryTag } from './CategoryTags';
import { EventCard } from './EventCard';
import { GuestChoicesList, type GuestChoice } from './GuestChoicesList';
import { PhotoCredits } from './PhotoCredits';
import { PlaceCard } from './PlaceCard';
import { SuggestionCarousel, SuggestionSection } from './SuggestionSection';
import { addedCardId, focusCard, placeCardId } from '../../utils/focusCard';
import {
  INTEREST_LABELS,
  getEventsForDestination,
  getPlacesForCity,
  rankPlacesByProfile,
  type EventEntry,
  type PlaceEntry,
} from '../../data';
import { useTrip, type QuizInterest, type TripDestination } from '../../context/TripContext';
import { EQUILIBRADO_ICON, SECTION_ICONS } from '../../utils/categoryVisuals';
import { formatISOToDisplay, formatISOToWeekdayShortDate } from '../../utils/dateMask';
import { YOU, getMembers } from '../../utils/costs';
import { joinPt } from '../../utils/retrospective';
import { wantersOf } from '../../utils/members';
import { Icon } from '../shell/Icon';
import styles from './SuggestionsPanel.module.css';

/** Ordem fixa das seções de interesse (mesma da tabela do ajustes-60). */
const INTEREST_ORDER: QuizInterest[] = ['gastronomia', 'cultura', 'natureza', 'vida-noturna', 'compras'];

type PlaceSectionKey = 'turistico' | 'fora-do-circuito' | QuizInterest;

interface PlaceSection {
  key: PlaceSectionKey;
  title: string;
  description: string;
  places: PlaceEntry[];
}

function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

interface SuggestionsPanelProps {
  destination: TripDestination;
  /** dispara o toast "Salvo"/mensagem da tela (useSaveToast do Itinerary) */
  onToast: (message: string) => void;
}

/**
 * Aba "Sugestões" do Roteiro, por seções do perfil da viagem + eventos
 * locais reais nas datas do destino. Ver
 * docs/ajustes-60-sugestoes-por-categoria-e-eventos.md.
 */
export function SuggestionsPanel({ destination, onToast }: SuggestionsPanelProps) {
  const trip = useTrip();
  const navigate = useNavigate();

  const { discovery, interests } = trip.quiz;
  const profileEmpty = discovery.length === 0 && interests.length === 0;

  const cityPlaces = getPlacesForCity(destination.cityId);
  const ranked = rankPlacesByProfile(cityPlaces, interests, discovery);
  const cityEvents = getEventsForDestination(destination.cityId, destination.dateStart, destination.dateEnd, destination.city);

  const customPlaces = trip.selectedPlaces.filter((s) => s.destinationId === destination.id && !s.placeId);

  // Convidados (ajustes-67): quem quer cada lugar desta cidade e o que eles adicionaram
  const members = getMembers(trip);
  const selectionByPlaceId = new Map(
    trip.selectedPlaces
      .filter((s) => s.destinationId === destination.id && s.placeId)
      .map((s) => [s.placeId as string, s]),
  );
  const wantersFor = (placeId: string) => {
    const sel = selectionByPlaceId.get(placeId);
    return sel ? wantersOf(sel, members) : [];
  };
  /** convidado que escolheu primeiro (ajustes-94): a tag e a cor do cartão */
  const suggestedByFor = (placeId: string) => {
    const sel = selectionByPlaceId.get(placeId);
    return sel && sel.addedBy !== YOU ? members.find((m) => m.id === sel.addedBy) : undefined;
  };
  /** você escolheu (adicionou ou tocou "Eu também") — o ✓ bordô do cartão */
  const isMine = (placeId: string) => {
    const sel = selectionByPlaceId.get(placeId);
    return !!sel && (sel.addedBy === YOU || sel.alsoWantedBy.includes(YOU));
  };
  // escolhidos por algum convidado (ajustes-87: lista compacta "Escolhas dos convidados")
  const groupPlaces = cityPlaces.filter((p) => wantersFor(p.id).some((m) => m.id !== YOU));

  // --- quais seções de lugar entram (perfil vazio → todas, nunca tela vazia) ---
  const wantTuristico = profileEmpty || discovery.includes('turistico') || discovery.includes('equilibrado');
  const wantFora = profileEmpty || discovery.includes('fora-do-circuito') || discovery.includes('equilibrado');
  const interestSections = profileEmpty ? INTEREST_ORDER : INTEREST_ORDER.filter((i) => interests.includes(i));

  /*
    Cada lugar aparece em UMA seção de cartões só (docs/ajustes-73-...md, item 4) — antes a
    Feira de San Telmo estava em Pontos turísticos, Cultura e Compras ao mesmo
    tempo, e marcar numa acendia o ✓ nas outras, parecendo que o app marcava
    sozinho. Prioridade: primeira seção de interesse do perfil que bate com uma
    categoria do lugar (na ordem da tela) > Pontos turísticos / Fora do circuito
    pela `popularity`, se a seção estiver ativa. Com o perfil vazio a ordem inverte
    (decisão da Adriana, ajuste 73b): Pontos turísticos / Fora do circuito primeiro,
    depois os interesses. O que não cabe em nenhuma seção ativa não aparece.
    Exceção (ajustes-87): o escolhido por convidado fica na categoria dele E na lista
    compacta "Escolhas dos convidados" (com o "+" / ✓ dela); e, se não
    couber em nenhuma seção ativa, entra na seção da sua `popularity` mesmo assim —
    a linha da lista sempre tem um cartão pra onde levar.
  */
  const groupPlaceIds = new Set(groupPlaces.map((p) => p.id));
  const placesBySection = new Map<PlaceSectionKey, PlaceEntry[]>();
  /*
    Reserva (08/out/2026): com interesses marcados, eles "puxavam" quase todos os
    lugares e as seções Pontos turísticos / Fora do circuito sumiam (em Buenos
    Aires 15 de 22 lugares são de cultura). Agora, antes dos interesses, cada
    seção de popularidade ativa fica com os POPULARITY_RESERVE lugares mais bem
    ranqueados daquele tipo; o resto segue a regra de sempre.
  */
  const POPULARITY_RESERVE = 4;
  const reserved = new Set<string>();
  if (!profileEmpty) {
    for (const [key, want] of [['turistico', wantTuristico], ['fora-do-circuito', wantFora]] as const) {
      if (!want) continue;
      const picks = ranked
        .filter((p) => p.popularity === key)
        .slice(0, POPULARITY_RESERVE);
      for (const p of picks) reserved.add(p.id);
      placesBySection.set(key, picks);
    }
  }
  for (const place of ranked) {
    if (reserved.has(place.id)) continue;
    const interest = interestSections.find((i) => place.categories.includes(i));
    const byPopularity: PlaceSectionKey | undefined =
      place.popularity === 'turistico' && wantTuristico
        ? 'turistico'
        : place.popularity === 'fora-do-circuito' && wantFora
          ? 'fora-do-circuito'
          : undefined;
    const key =
      (profileEmpty ? (byPopularity ?? interest) : (interest ?? byPopularity)) ??
      (groupPlaceIds.has(place.id) ? place.popularity : undefined);
    if (key) placesBySection.set(key, [...(placesBySection.get(key) ?? []), place]);
  }

  const placeSections: PlaceSection[] = [];
  if (wantTuristico || placesBySection.has('turistico')) {
    placeSections.push({
      key: 'turistico',
      title: 'Pontos turísticos',
      description: 'Os lugares mais conhecidos da cidade.',
      places: placesBySection.get('turistico') ?? [],
    });
  }
  if (wantFora || placesBySection.has('fora-do-circuito')) {
    placeSections.push({
      key: 'fora-do-circuito',
      title: 'Fora do circuito',
      description: 'O que os moradores frequentam.',
      places: placesBySection.get('fora-do-circuito') ?? [],
    });
  }
  for (const interest of interestSections) {
    const label = INTEREST_LABELS[interest];
    placeSections.push({
      key: interest,
      title: label,
      description: profileEmpty
        ? `Lugares de ${label.toLowerCase()} em ${destination.city}.`
        : `Porque você marcou ${label} no perfil.`,
      places: placesBySection.get(interest) ?? [],
    });
  }
  // seção sem nenhum lugar nessa cidade some (Eventos é a exceção, tem estado vazio próprio)
  const visibleSections = placeSections.filter((s) => s.places.length > 0);

  const sectionId = (key: string) => `sugestoes-${destination.id}-${key}`;

  const profileTags: CategoryTag[] = [
    ...(['turistico', 'equilibrado', 'fora-do-circuito'] as const)
      .filter((d) => discovery.includes(d))
      .map((d) => ({
        key: d,
        icon: d === 'equilibrado' ? EQUILIBRADO_ICON : SECTION_ICONS[d],
        label: d === 'turistico' ? 'Turístico' : d === 'equilibrado' ? 'Equilibrado' : 'Fora do circuito',
      })),
    ...INTEREST_ORDER.filter((i) => interests.includes(i)).map((i) => ({
      key: i,
      icon: SECTION_ICONS[i],
      label: INTEREST_LABELS[i],
    })),
  ];

  const shortcuts = [
    ...(groupPlaces.length > 0
      ? [{ key: 'grupo', icon: Users, label: 'Convidados', count: groupPlaces.length }]
      : []),
    ...(customPlaces.length > 0
      ? [{ key: 'adicionados', icon: PencilLine, label: 'Adicionados', count: customPlaces.length }]
      : []),
    {
      key: 'eventos',
      icon: SECTION_ICONS.eventos,
      label: 'Eventos',
      count: cityEvents.length,
    },
    ...visibleSections.map((s) => ({
      key: s.key,
      icon: SECTION_ICONS[s.key],
      label: s.title,
      count: s.places.length,
    })),
  ];

  function scrollToSection(key: string) {
    document.getElementById(sectionId(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** "Voltou a ser plano da Marina" — o lugar sai do seu roteiro e fica só como plano do grupo (ajustes-95b) */
  const backToPlanToast = (placeId: string) => {
    const guests = wantersFor(placeId).filter((m) => m.id !== YOU);
    return `Saiu do seu roteiro. Continua como plano ${guests.length === 1 ? 'da' : 'de'} ${joinPt(guests.map((m) => m.shortName))}.`;
  };

  /*
    ✓ / + do cartão. Lugar que um convidado também quer: tirar o ✓ só tira VOCÊ — ele sai do seu
    roteiro e volta a ser plano provisório do convidado (ajustes-95b). Sem convidado, sai de vez.
  */
  function handleTogglePlace(place: PlaceEntry) {
    const sel = selectionByPlaceId.get(place.id);
    const guests = wantersFor(place.id).filter((m) => m.id !== YOU);
    if (sel && guests.length > 0) {
      trip.toggleMyInterest(sel.id);
      onToast(backToPlanToast(place.id));
      return;
    }
    trip.togglePlace(destination.id, { placeId: place.id, categories: place.categories });
    if (!sel) onToast('Lugar adicionado');
  }

  /** "+" num plano do grupo: o lugar entra no SEU roteiro (ajustes-95b) */
  function handleJoinPlace(place: PlaceEntry) {
    const sel = selectionByPlaceId.get(place.id);
    if (!sel) return;
    trip.toggleMyInterest(sel.id);
    onToast('Lugar adicionado ao seu roteiro');
  }

  const placeCard = (place: PlaceEntry) => (
    <PlaceCard
      id={placeCardId(destination.id, place.id)}
      place={place}
      selected={isMine(place.id)}
      wanters={wantersFor(place.id)}
      suggestedBy={suggestedByFor(place.id)}
      onToggle={() => handleTogglePlace(place)}
      onJoin={() => handleJoinPlace(place)}
      isNew={(() => {
        const sel = selectionByPlaceId.get(place.id);
        return !!sel && trip.unseenUpdates.roteiro.includes(sel.id);
      })()}
    />
  );

  const guestChoices: GuestChoice[] = groupPlaces.map((place) => ({
    place,
    wanters: wantersFor(place.id),
    mine: isMine(place.id),
    cardId: placeCardId(destination.id, place.id),
    suggestedBy: suggestedByFor(place.id),
  }));

  /** "+" / ✓ direto na lista (ajustes-94): mesmo estado do cartão na categoria */
  function handleToggleMineFromList(choice: GuestChoice) {
    const sel = selectionByPlaceId.get(choice.place.id);
    if (!sel) return;
    trip.toggleMyInterest(sel.id);
    onToast(choice.mine ? backToPlanToast(choice.place.id) : 'Lugar adicionado ao seu roteiro');
  }

  /** evento num horário em que o grupo está viajando (ajustes-94): selo no cartão e confirmação ao adicionar */
  const eventConflict = (event: EventEntry) =>
    activityConflict(trip, { cityId: event.cityId, dateISO: event.date, time: firstTime(event.time) });
  const [pendingEvent, setPendingEvent] = useState<{ event: EventEntry; message: string } | null>(null);

  function addEvent(event: EventEntry) {
    trip.toggleEvent(event.id);
    onToast(`Evento adicionado ao dia ${formatISOToDisplay(event.date).slice(0, 5)}`);
  }

  function handleToggleEvent(event: EventEntry) {
    if (trip.selectedEventIds.includes(event.id)) {
      trip.toggleEvent(event.id);
      return;
    }
    const conflict = eventConflict(event);
    if (conflict) setPendingEvent({ event, message: conflict.message });
    else addEvent(event);
  }

  return (
    <>
      <div className={styles.top}>
        {/* 1. De onde vêm as sugestões */}
        <div className={styles.profileStrip}>
          {profileEmpty ? (
            <>
              <p className={styles.profileTitle}>Responda o perfil da viagem pra ver sugestões do seu jeito</p>
              <p className={styles.profileHint}>Enquanto isso, mostramos todas as categorias.</p>
              <Button variant="secondary" onClick={() => navigate('/destinos')}>
                Responder perfil
              </Button>
            </>
          ) : (
            <>
              <p className={styles.profileTitle}>Sugestões com base no seu perfil</p>
              <CategoryTags tags={profileTags} size="md" />
              <button type="button" className={styles.linkButton} onClick={() => navigate('/destinos')}>
                Editar perfil
              </button>
            </>
          )}
        </div>

        {/* 2. Atalhos pras seções */}
        <nav aria-label="Ir para a seção">
          <ScrollArea type="scroll" orientation="horizontal" className="-mx-4">
            <ul className={styles.shortcuts}>
              {shortcuts.map((s) => (
                <li key={s.key}>
                  <button type="button" className={styles.shortcut} onClick={() => scrollToSection(s.key)}>
                    <Icon icon={s.icon} />
                    {s.label}
                    <Badge variant="soft" className={styles.shortcutCount}>
                      {s.count}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </nav>

      </div>

      {/* 4. Seções */}
      <div className={styles.sections}>
        {groupPlaces.length > 0 && (
          <SuggestionSection
            id={sectionId('grupo')}
            icon={Users}
            title="Escolhas dos convidados"
            countLabel={countLabel(groupPlaces.length, 'lugar', 'lugares')}
            description={`O que quem você convidou quer fazer em ${destination.city}.`}
          >
            <GuestChoicesList choices={guestChoices} onOpen={focusCard} onToggleMine={handleToggleMineFromList} />
          </SuggestionSection>
        )}

        {customPlaces.length > 0 && (
          <SuggestionSection
            id={sectionId('adicionados')}
            icon={PencilLine}
            title="Adicionados"
            countLabel={countLabel(customPlaces.length, 'lugar', 'lugares')}
            description="Lugares que você adicionou por conta própria."
          >
            <SuggestionCarousel label={`Lugares adicionados em ${destination.city}`}>
              {customPlaces.map((s) => (
                <li key={s.id}>
                  <AddedPlaceCard selection={s} id={addedCardId(s.id)} onRemove={() => trip.removeSelectedPlace(s.id)} />
                </li>
              ))}
            </SuggestionCarousel>
          </SuggestionSection>
        )}

        <SuggestionSection
          id={sectionId('eventos')}
          icon={SECTION_ICONS.eventos}
          title="Eventos nas suas datas"
          countLabel={countLabel(cityEvents.length, 'evento', 'eventos')}
          description={`Festivais, feiras e shows acontecendo em ${destination.city} enquanto você estiver lá.`}
        >
          {cityEvents.length > 0 ? (
            <SuggestionCarousel label={`Eventos em ${destination.city}`}>
              {/* agrupado por dia (ajustes-80): rótulo antes do 1º card de cada dia; os outros
                  levam um espaço do mesmo tamanho, pra os cards continuarem alinhados */}
              {cityEvents.map((event, i) => {
                const firstOfDay = i === 0 || cityEvents[i - 1].date !== event.date;
                return (
                  <li key={event.id} className="flex-col gap-1.5">
                    <p
                      className={`m-0 h-5 text-(length:--text-sm) font-semibold text-foreground ${firstOfDay ? '' : 'invisible'}`}
                      aria-hidden={firstOfDay ? undefined : true}
                    >
                      {formatISOToWeekdayShortDate(event.date)}
                    </p>
                    <EventCard
                      event={event}
                      selected={trip.selectedEventIds.includes(event.id)}
                      onToggle={() => handleToggleEvent(event)}
                      conflictBadge={eventConflict(event)?.eventBadge}
                    />
                  </li>
                );
              })}
            </SuggestionCarousel>
          ) : (
            <EmptyState
              icon={<CalendarDays />}
              tone="muted"
              action={
                <button type="button" className={styles.linkButton} onClick={() => navigate('/destinos')}>
                  Ir pra Destinos
                </button>
              }
            >
              {/* com datas sempre há evento (modelos por dia da semana, ajustes-81): o vazio é só sem datas */}
              {`Preencha as datas de ${destination.city} em Destinos pra ver o que vai rolar.`}
            </EmptyState>
          )}
        </SuggestionSection>

        {cityPlaces.length === 0 ? (
          <p className={styles.noData}>
            Sugestões de lugares ainda não disponíveis pra {destination.city}. Você pode adicionar lugares por conta
            própria na busca acima.
          </p>
        ) : (
          visibleSections.map((section) => (
            <SuggestionSection
              key={section.key}
              id={sectionId(section.key)}
              icon={SECTION_ICONS[section.key]}
              title={section.title}
              countLabel={countLabel(section.places.length, 'lugar', 'lugares')}
              description={section.description}
            >
              <SuggestionCarousel label={`${section.title} em ${destination.city}`}>
                {section.places.map((place) => (
                  <li key={place.id}>{placeCard(place)}</li>
                ))}
              </SuggestionCarousel>
              <PhotoCredits places={section.places} />
            </SuggestionSection>
          ))
        )}
      </div>
      <ConflictDialog
        message={pendingEvent?.message ?? null}
        onCancel={() => setPendingEvent(null)}
        onConfirm={() => {
          if (pendingEvent) addEvent(pendingEvent.event);
          setPendingEvent(null);
        }}
      />
    </>
  );
}
