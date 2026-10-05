import { CalendarDays, ChevronDown, Pencil, Plus, Users } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '../shell/Button';
import { EmptyState } from '../shell/EmptyState';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TextField } from '../inputs/TextField';
import { CategoryTags, type CategoryTag } from './CategoryTags';
import { EventCard } from './EventCard';
import { PlaceCard } from './PlaceCard';
import { SuggestionCarousel, SuggestionSection } from './SuggestionSection';
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
import { formatISOToDisplay } from '../../utils/dateMask';
import { YOU, getMembers, memberLabel } from '../../utils/costs';
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
  const customId = useId();
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const { discovery, interests } = trip.quiz;
  const profileEmpty = discovery.length === 0 && interests.length === 0;

  const cityPlaces = getPlacesForCity(destination.cityId);
  const ranked = rankPlacesByProfile(cityPlaces, interests, discovery);
  const cityEvents = getEventsForDestination(destination.cityId, destination.dateStart, destination.dateEnd);
  const hasDates = Boolean(destination.dateStart && destination.dateEnd);

  const selectedPlaceIds = new Set(
    trip.selectedPlaces.filter((s) => s.destinationId === destination.id && s.placeId).map((s) => s.placeId as string),
  );
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
  const groupPlaces = cityPlaces.filter((p) => {
    const sel = selectionByPlaceId.get(p.id);
    return sel !== undefined && sel.addedBy !== YOU;
  });

  // --- quais seções de lugar entram (perfil vazio → todas, nunca tela vazia) ---
  const wantTuristico = profileEmpty || discovery.includes('turistico') || discovery.includes('equilibrado');
  const wantFora = profileEmpty || discovery.includes('fora-do-circuito') || discovery.includes('equilibrado');
  const interestSections = profileEmpty ? INTEREST_ORDER : INTEREST_ORDER.filter((i) => interests.includes(i));

  /*
    Cada lugar aparece em UMA seção só (docs/ajustes-73-...md, item 4) — antes a
    Feira de San Telmo estava em Pontos turísticos, Cultura e Compras ao mesmo
    tempo, e marcar numa acendia o ✓ nas outras, parecendo que o app marcava
    sozinho. Prioridade: "Escolhas do grupo" (lá em cima) > primeira seção de
    interesse do perfil que bate com uma categoria do lugar (na ordem da tela) >
    Pontos turísticos / Fora do circuito pela `popularity`, se a seção estiver
    ativa. Com o perfil vazio a ordem inverte (decisão da Adriana, ajuste 73b):
    Pontos turísticos / Fora do circuito primeiro, depois os interesses. O que
    não cabe em nenhuma seção ativa não aparece.
  */
  const groupPlaceIds = new Set(groupPlaces.map((p) => p.id));
  const placesBySection = new Map<PlaceSectionKey, PlaceEntry[]>();
  for (const place of ranked) {
    if (groupPlaceIds.has(place.id)) continue;
    const interest = interestSections.find((i) => place.categories.includes(i));
    const byPopularity: PlaceSectionKey | undefined =
      place.popularity === 'turistico' && wantTuristico
        ? 'turistico'
        : place.popularity === 'fora-do-circuito' && wantFora
          ? 'fora-do-circuito'
          : undefined;
    const key = profileEmpty ? (byPopularity ?? interest) : (interest ?? byPopularity);
    if (key) placesBySection.set(key, [...(placesBySection.get(key) ?? []), place]);
  }

  const placeSections: PlaceSection[] = [];
  if (wantTuristico) {
    placeSections.push({
      key: 'turistico',
      title: 'Pontos turísticos',
      description: 'Os lugares mais conhecidos da cidade.',
      places: placesBySection.get('turistico') ?? [],
    });
  }
  if (wantFora) {
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
      ? [{ key: 'grupo', icon: Users, label: 'Escolhas do grupo', count: groupPlaces.length }]
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

  function handleTogglePlace(place: PlaceEntry) {
    const sel = selectionByPlaceId.get(place.id);
    trip.togglePlace(destination.id, { placeId: place.id, categories: place.categories });
    if (!sel) onToast('Lugar adicionado');
    else if (sel.addedBy !== YOU) {
      onToast(`Removido do roteiro. ${memberLabel(members, sel.addedBy).split(' ')[0]} tinha sugerido esse lugar.`);
    }
  }

  function handleToggleEvent(event: EventEntry) {
    const wasSelected = trip.selectedEventIds.includes(event.id);
    trip.toggleEvent(event.id);
    if (!wasSelected) onToast(`Evento adicionado ao dia ${formatISOToDisplay(event.date).slice(0, 5)}`);
  }

  function handleAddCustom() {
    const trimmed = customText.trim();
    if (trimmed.length === 0) return;
    trip.addCustomPlace(destination.id, trimmed);
    setCustomText('');
    onToast('Lugar adicionado');
  }

  function handleCustomKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
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

        {/* 3. Adicionar por conta própria — compacto, expande ao tocar */}
        {/* Collapsible do shadcn (docs/ajustes-74-...md): o Radix liga aria-expanded/aria-controls */}
        <Collapsible open={customOpen} onOpenChange={setCustomOpen} className={styles.customBlock}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 text-left text-(length:--text-sm) font-semibold text-foreground"
            >
              <Icon icon={Plus} />
              <span className="flex-1">Não achou? Adicione um lugar por conta própria</span>
              <Icon
                icon={ChevronDown}
                className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className={styles.customForm}>
            <TextField
              id={`${customId}-input`}
              label="Nome do lugar"
              placeholder="Ex.: Um restaurante ou lugar que você já conhece"
              value={customText}
              onChange={setCustomText}
              onKeyDown={handleCustomKeyDown}
              autoComplete="off"
            />
            <Button variant="secondary" fullWidth disabled={customText.trim().length === 0} onClick={handleAddCustom}>
              Adicionar
            </Button>
          </CollapsibleContent>

          {customPlaces.length > 0 && (
            <ul className={styles.customList}>
              {customPlaces.map((s) => (
                <li key={s.id} className={styles.customRow}>
                  <Icon icon={Pencil} />
                  <span className={styles.customLabel}>{s.customLabel}</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => trip.removeSelectedPlace(s.id)}
                    aria-label={`Remover ${s.customLabel}`}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Collapsible>
      </div>

      {/* 4. Seções */}
      <div className={styles.sections}>
        {groupPlaces.length > 0 && (
          <SuggestionSection
            id={sectionId('grupo')}
            icon={Users}
            title="Escolhas do grupo"
            countLabel={countLabel(groupPlaces.length, 'lugar', 'lugares')}
            description={`O que quem você convidou quer fazer em ${destination.city}.`}
          >
            <SuggestionCarousel label={`Escolhas do grupo em ${destination.city}`}>
              {groupPlaces.map((place) => (
                <li key={place.id}>
                  <PlaceCard
                    place={place}
                    selected={selectedPlaceIds.has(place.id)}
                    wanters={wantersFor(place.id)}
                    onToggle={() => handleTogglePlace(place)}
                  />
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
          description={`Acontecendo em ${destination.city} enquanto você estiver lá.`}
        >
          {cityEvents.length > 0 ? (
            <SuggestionCarousel label={`Eventos em ${destination.city}`}>
              {cityEvents.map((event) => (
                <li key={event.id}>
                  <EventCard
                    event={event}
                    selected={trip.selectedEventIds.includes(event.id)}
                    onToggle={() => handleToggleEvent(event)}
                  />
                </li>
              ))}
            </SuggestionCarousel>
          ) : (
            <EmptyState
              icon={<CalendarDays />}
              tone="muted"
              action={
                hasDates ? undefined : (
                  <button type="button" className={styles.linkButton} onClick={() => navigate('/destinos')}>
                    Ir pra Destinos
                  </button>
                )
              }
            >
              {hasDates
                ? `Nenhum evento encontrado em ${destination.city} nas suas datas.`
                : `Preencha as datas de ${destination.city} em Destinos pra ver eventos.`}
            </EmptyState>
          )}
        </SuggestionSection>

        {cityPlaces.length === 0 ? (
          <p className={styles.noData}>
            Sugestões de lugares ainda não disponíveis pra {destination.city}. Você pode adicionar lugares por conta
            própria acima.
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
                  <li key={place.id}>
                    <PlaceCard
                      place={place}
                      selected={selectedPlaceIds.has(place.id)}
                      wanters={wantersFor(place.id)}
                      onToggle={() => handleTogglePlace(place)}
                    />
                  </li>
                ))}
              </SuggestionCarousel>
            </SuggestionSection>
          ))
        )}
      </div>
    </>
  );
}
