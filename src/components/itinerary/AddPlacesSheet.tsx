import { ChevronLeft, ChevronRight, MapPin, PencilLine, Plus, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { TextField } from '../inputs/TextField';
import { Button } from '../shell/Button';
import { Icon } from '../shell/Icon';
import { MiniMap } from './MiniMap';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import {
  INTEREST_LABELS,
  cityCenter,
  getPlaceById,
  getPlacesForCity,
  placePhotoUrl,
  searchPlacesInCity,
  type PlaceEntry,
} from '../../data';
import { useTrip, type QuizInterest, type TripDestination, type TripPlaceSelection } from '../../context/TripContext';
import { categoryIcon } from '../../utils/categoryVisuals';
import { formatISOToShortDay } from '../../utils/dateMask';
import { globalDayToISO, isMyPlace, selectionCoords, type DestinationDayRange } from '../../utils/itinerary';
import { normalizeName, searchPhoton, type OsmPlace } from '../../utils/photon';

/** a busca começa com 2 letras e espera 300 ms entre teclas (ajustes-97) */
const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;
const MAX_APP_RESULTS = 5;

interface AddPlacesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** destinos com dias no roteiro (os de dayRanges) */
  destinations: TripDestination[];
  dayRanges: DestinationDayRange[];
  tripStartISO: string;
  /** cidade da aba do Roteiro; null = "Todas" (a folha mostra o seletor de cidade) */
  cityId: string | null;
  /** cidade sugerida quando a aba é "Todas" (a do dia selecionado, ou a primeira) */
  fallbackDestinationId: string;
  /** dia selecionado nas pílulas da tela (yyyy-mm-dd); null = "Todos os dias" → nenhum dia marcado (ajustes-99) */
  selectedDayISO: string | null;
  /** dia em que a parada está hoje no roteiro (pra "Já no seu roteiro") */
  dayOfSelection: (selectionId: string) => string | null;
  onAdded: (selectionId: string, destinationId: string, dayISO: string | null) => void;
  onGoTo: (selectionId: string, destinationId: string) => void;
}

/** resultado aberto na prévia + a cidade dele (pode ser outra da viagem, "Em outras cidades da viagem", ajustes-99) */
type Preview = ({ kind: 'app'; place: PlaceEntry } | { kind: 'osm'; place: OsmPlace }) & { destinationId: string };

/** "Qua 18/11" — mesmas datas das pílulas e da legenda do mapa */
const dayLabel = (iso: string) => formatISOToShortDay(iso).replace(',', '');
const categoryLabel = (category: string | undefined) =>
  (category && INTEREST_LABELS[category as QuizInterest]) || 'Lugar';
const categoryIconOf = (category: string | undefined): LucideIcon => (category && categoryIcon(category)) || MapPin;

/** linha de resultado: 44px no mínimo, ícone/foto à esquerda, texto e o › */
function ResultRow({
  leading,
  title,
  meta,
  onClick,
  trailing,
  disabled = false,
}: {
  leading: ReactNode;
  title: string;
  meta?: string;
  onClick: () => void;
  trailing?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent px-2 py-2 text-left text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
      >
        {leading}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-(length:--text-base) font-medium">{title}</span>
          {meta && <span className="truncate text-(length:--text-sm) text-muted-foreground">{meta}</span>}
        </span>
        {trailing ?? <ChevronRight className="size-4 flex-none text-muted-foreground" aria-hidden="true" />}
      </button>
    </li>
  );
}

/** ícone num quadrado de 40px (resultado sem foto) */
function IconBox({ icon }: { icon: LucideIcon }) {
  return (
    <span className="inline-flex size-10 flex-none items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden="true">
      <Icon icon={icon} />
    </span>
  );
}

function Group({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1">
      <h3 id={id} className="m-0 px-2 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="m-0 flex list-none flex-col p-0">{children}</ul>
      {footer}
    </section>
  );
}

/** foto da prévia: a local (lugar do app) ou a da Wikipedia pelo nome; sem foto, o ícone grande */
function PreviewPhoto({ title, localUrl, category }: { title: string; localUrl: string | null; category: string | undefined }) {
  const url = usePlaceThumbnail(title, localUrl);
  return url ? (
    <img src={url} alt="" className="h-40 w-full rounded-lg object-cover" />
  ) : (
    <span className="flex h-40 w-full items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-12" aria-hidden="true">
      <Icon icon={categoryIconOf(category)} />
    </span>
  );
}

/**
 * "Adicionar lugares" (ajustes-97, revisto no 99): folha de baixo pra cima, 90% da altura, aberta
 * pelo botão flutuante da aba Roteiro. Cidade (só quando a aba é "Todas"), "Em qual dia?" (só os dias
 * da cidade, obrigatório: começa no dia das pílulas da tela; em "Todos os dias", nenhum — e o botão
 * diz "Escolha um dia") e a busca em tempo real em 4 grupos — "Já no seu roteiro", "Sugestões do
 * app", "Em outras cidades da viagem" (o MALBA buscado na folha de Santiago; a prévia avisa a
 * cidade e troca as pílulas pelas dela) e "Outros lugares em {cidade}" (Photon/OpenStreetMap, ao
 * vivo, só nomes que batem com o texto; se falhar, o grupo some) —, com "+ Adicionar '{texto}' como
 * lugar meu" sempre no fim. Tocar abre a prévia (foto, categoria, endereço, mini mapa e o dia) com
 * "Adicionar ao dia …". O lugar entra fixado no dia escolhido.
 */
export function AddPlacesSheet({
  open,
  onOpenChange,
  destinations,
  dayRanges,
  tripStartISO,
  cityId,
  fallbackDestinationId,
  selectedDayISO,
  dayOfSelection,
  onAdded,
  onGoTo,
}: AddPlacesSheetProps) {
  const trip = useTrip();
  const baseId = useId();
  const searchId = `${baseId}-busca`;
  const [destinationId, setDestinationId] = useState(cityId ?? fallbackDestinationId);
  const destination = destinations.find((d) => d.id === destinationId);
  /** dias (yyyy-mm-dd) de um destino no roteiro */
  const daysOf = (id: string) =>
    (dayRanges.find((r) => r.destinationId === id)?.globalDayIndexes ?? []).map((g) => globalDayToISO(tripStartISO, g));
  /** o dia das pílulas da tela, se ele for desse destino; senão nenhum */
  const startDayFor = (id: string) => (selectedDayISO && daysOf(id).includes(selectedDayISO) ? selectedDayISO : null);
  const dayISOs = daysOf(destinationId);
  // sem "Deixar o app escolher" (ajustes-99): o dia é obrigatório; começa no dia das pílulas, se for desta cidade
  const [day, setDay] = useState<string | null>(() => startDayFor(destinationId));
  // dia da prévia de um lugar de OUTRA cidade (as pílulas passam a ser as dela)
  const [otherCityDay, setOtherCityDay] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [osm, setOsm] = useState<{ text: string; places: OsmPlace[] }>({ text: '', places: [] });
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const text = debounced.length >= MIN_CHARS ? debounced : '';
  const q = normalizeName(text);

  // 1. já no seu roteiro (nesta cidade)
  const mine: TripPlaceSelection[] = text
    ? trip.selectedPlaces.filter((s) => {
        if (s.destinationId !== destinationId || !isMyPlace(s)) return false;
        const place = s.placeId ? getPlaceById(s.placeId) : undefined;
        return normalizeName(s.customLabel ?? place?.name ?? '').includes(q);
      })
    : [];
  const minePlaceIds = new Set(mine.map((s) => s.placeId).filter(Boolean));

  // 2. sugestões do app: nome, bairro (searchPlacesInCity) e categoria
  const appResults: PlaceEntry[] = [];
  if (text && destination) {
    const byCategory = getPlacesForCity(destination.cityId).filter((p) =>
      p.categories.some((c) => normalizeName(categoryLabel(c)).includes(q)),
    );
    for (const p of [...searchPlacesInCity(destination.cityId, text), ...byCategory]) {
      if (appResults.length >= MAX_APP_RESULTS) break;
      if (minePlaceIds.has(p.id) || appResults.includes(p)) continue;
      appResults.push(p);
    }
  }

  // 3. em outras cidades da viagem (ajustes-99): "malba" na folha de Santiago acha o MALBA de Buenos Aires
  const otherMine: { selection: TripPlaceSelection; destination: TripDestination }[] = [];
  const otherApp: { place: PlaceEntry; destination: TripDestination }[] = [];
  if (text) {
    for (const other of destinations.filter((d) => d.id !== destinationId)) {
      const mineThere = trip.selectedPlaces.filter((s) => s.destinationId === other.id && isMyPlace(s));
      for (const s of mineThere) {
        const name = s.customLabel ?? getPlaceById(s.placeId ?? '')?.name ?? '';
        if (normalizeName(name).includes(q)) otherMine.push({ selection: s, destination: other });
      }
      const minePlaceIdsThere = new Set(mineThere.map((s) => s.placeId).filter(Boolean));
      for (const p of searchPlacesInCity(other.cityId, text)) {
        if (otherApp.length >= MAX_APP_RESULTS) break;
        if (!minePlaceIdsThere.has(p.id)) otherApp.push({ place: p, destination: other });
      }
    }
  }

  // 4. outros lugares (Photon), descartando o que já apareceu nos grupos 1 e 2
  const shownKey = [...mine.map((s) => s.id), ...appResults.map((p) => p.id)].join('|');
  useEffect(() => {
    if (!text || !destination) return;
    const exclude = [
      ...mine.flatMap((s) => {
        const c = selectionCoords(s);
        return c ? [{ name: s.customLabel ?? getPlaceById(s.placeId ?? '')?.name ?? '', ...c }] : [];
      }),
      ...appResults.map((p) => ({ name: p.name, lat: p.lat, lng: p.lng })),
    ];
    const controller = new AbortController();
    void searchPhoton(text, cityCenter(destination.cityId), destination.city, exclude, controller.signal).then(
      (places) => {
        if (!controller.signal.aborted) setOsm({ text, places });
      },
    );
    return () => controller.abort();
    // o que exclui muda junto com o texto e a cidade (shownKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, destinationId, shownKey]);
  // resultado de uma busca anterior não aparece com o texto novo
  const osmResults = text && osm.text === text ? osm.places : [];

  function changeCity(id: string) {
    setDestinationId(id);
    setDay(null);
    setPreview(null);
  }

  function focusSearch() {
    requestAnimationFrame(() => document.getElementById(searchId)?.focus());
  }

  /** a prévia é de outra cidade? então o dia é o dela */
  const previewElsewhere = !!preview && preview.destinationId !== destinationId;
  const chosenDay = previewElsewhere ? otherCityDay : day;
  // sem dia, o próprio botão desabilitado explica (ajustes-99)
  const addLabel = chosenDay ? `Adicionar ao dia ${dayLabel(chosenDay).split(' ')[1]}` : 'Escolha um dia';

  function openPreview(next: Preview) {
    if (next.destinationId !== destinationId) setOtherCityDay(startDayFor(next.destinationId));
    setPreview(next);
  }

  function add(place: Parameters<typeof trip.addPlaceToItinerary>[1], targetId: string, dayISO: string | null) {
    if (!dayISO) return;
    const id = trip.addPlaceToItinerary(targetId, place, dayISO);
    onAdded(id, targetId, dayISO);
  }

  const typed = query.trim();
  const title = destination ? `Adicionar a ${destination.city}` : 'Adicionar lugares';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="h-[90dvh]"
        onOpenAutoFocus={(e) => {
          // foco direto na busca (o 1º foco do Radix seria o 1º chip)
          e.preventDefault();
          focusSearch();
        }}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Busque um restaurante, museu, bar ou endereço e escolha o dia.</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
          {preview ? (
            <PreviewPanel
              preview={preview}
              addLabel={addLabel}
              canAdd={!!chosenDay}
              elsewhere={
                previewElsewhere ? destinations.find((d) => d.id === preview.destinationId)?.city ?? null : null
              }
              dayPicker={
                <OptionChipGroup
                  legend="Em qual dia?"
                  options={daysOf(preview.destinationId).map((iso) => ({ value: iso, label: dayLabel(iso) }))}
                  value={chosenDay}
                  onChange={previewElsewhere ? setOtherCityDay : setDay}
                />
              }
              onBack={() => {
                setPreview(null);
                focusSearch();
              }}
              onAdd={() =>
                preview.kind === 'app'
                  ? add(
                      { kind: 'app', placeId: preview.place.id, categories: preview.place.categories },
                      preview.destinationId,
                      chosenDay,
                    )
                  : add({ kind: 'osm', ...preview.place }, preview.destinationId, chosenDay)
              }
            />
          ) : (
            <>
              {cityId === null && destinations.length > 1 && (
                <OptionChipGroup
                  legend="Cidade"
                  options={destinations.map((d) => ({ value: d.id, label: d.city }))}
                  value={destinationId}
                  onChange={changeCity}
                />
              )}

              {dayISOs.length > 0 && (
                <OptionChipGroup
                  legend="Em qual dia?"
                  options={dayISOs.map((iso) => ({ value: iso, label: dayLabel(iso) }))}
                  value={day}
                  onChange={setDay}
                />
              )}

              <div className="flex flex-col gap-4">
                <TextField
                  id={searchId}
                  label="O que você quer adicionar?"
                  placeholder="Restaurante, museu, bar, endereço…"
                  value={query}
                  onChange={setQuery}
                  autoComplete="off"
                  enterKeyHint="search"
                  type="search"
                />

                {text && (
                  <div className="flex flex-col gap-4" aria-live="polite">
                    {mine.length > 0 && (
                      <Group title="Já no seu roteiro">
                        {mine.map((s) => {
                          const place = s.placeId ? getPlaceById(s.placeId) : undefined;
                          const at = dayOfSelection(s.id);
                          return (
                            <ResultRow
                              key={s.id}
                              leading={<IconBox icon={MapPin} />}
                              title={s.customLabel ?? place?.name ?? 'Lugar'}
                              meta={at ? `No dia ${dayLabel(at)}` : undefined}
                              onClick={() => onGoTo(s.id, destinationId)}
                            />
                          );
                        })}
                      </Group>
                    )}

                    {appResults.length > 0 && (
                      <Group title="Sugestões do app">
                        {appResults.map((p) => {
                          const photo = placePhotoUrl(p);
                          return (
                            <ResultRow
                              key={p.id}
                              leading={
                                photo ? (
                                  <img src={photo} alt="" className="size-10 flex-none rounded-md object-cover" />
                                ) : (
                                  <IconBox icon={categoryIconOf(p.categories[0])} />
                                )
                              }
                              title={p.name}
                              meta={`${categoryLabel(p.categories[0])} · ${p.neighborhood}`}
                              onClick={() => openPreview({ kind: 'app', place: p, destinationId })}
                            />
                          );
                        })}
                      </Group>
                    )}

                    {(otherMine.length > 0 || otherApp.length > 0) && (
                      <Group title="Em outras cidades da viagem">
                        {otherMine.map(({ selection: sel, destination: d }) => {
                          const at = dayOfSelection(sel.id);
                          return (
                            <ResultRow
                              key={sel.id}
                              leading={<IconBox icon={MapPin} />}
                              title={sel.customLabel ?? getPlaceById(sel.placeId ?? '')?.name ?? 'Lugar'}
                              meta={`${d.city} · já no seu roteiro${at ? `, dia ${dayLabel(at)}` : ''}`}
                              onClick={() => onGoTo(sel.id, d.id)}
                            />
                          );
                        })}
                        {otherApp.map(({ place: p, destination: d }) => {
                          const photo = placePhotoUrl(p);
                          return (
                            <ResultRow
                              key={`${d.id}-${p.id}`}
                              leading={
                                photo ? (
                                  <img src={photo} alt="" className="size-10 flex-none rounded-md object-cover" />
                                ) : (
                                  <IconBox icon={categoryIconOf(p.categories[0])} />
                                )
                              }
                              title={p.name}
                              meta={`${d.city} · ${categoryLabel(p.categories[0])}`}
                              onClick={() => openPreview({ kind: 'app', place: p, destinationId: d.id })}
                            />
                          );
                        })}
                      </Group>
                    )}

                    {osmResults.length > 0 && destination && (
                      <Group
                        title={`Outros lugares em ${destination.city}`}
                        footer={
                          <p className="m-0 px-2 text-[12px] text-muted-foreground">Resultados © OpenStreetMap</p>
                        }
                      >
                        {osmResults.map((p) => (
                          <ResultRow
                            key={p.osmId}
                            leading={<IconBox icon={categoryIconOf(p.category)} />}
                            title={p.name}
                            meta={p.address || categoryLabel(p.category)}
                            onClick={() => openPreview({ kind: 'osm', place: p, destinationId })}
                          />
                        ))}
                      </Group>
                    )}
                  </div>
                )}

                {typed && (
                  <ul className="m-0 list-none p-0">
                    <ResultRow
                      leading={<IconBox icon={PencilLine} />}
                      title={`Adicionar "${typed}" como lugar meu`}
                      meta="Sem endereço"
                      trailing={<Plus className="size-4 flex-none text-(--accent-dark)" aria-hidden="true" />}
                      onClick={() => add({ kind: 'custom', label: typed }, destinationId, day)}
                      disabled={!day}
                    />
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PreviewPanel({
  preview,
  addLabel,
  canAdd,
  elsewhere,
  dayPicker,
  onBack,
  onAdd,
}: {
  preview: Preview;
  addLabel: string;
  canAdd: boolean;
  /** cidade do lugar, quando não é a da folha ("Esse lugar fica em Buenos Aires") */
  elsewhere: string | null;
  /** "Em qual dia?" com os dias da cidade do lugar */
  dayPicker: ReactNode;
  onBack: () => void;
  onAdd: () => void;
}) {
  const isApp = preview.kind === 'app';
  const name = preview.place.name;
  const category = isApp ? preview.place.categories[0] : preview.place.category;
  const address = isApp ? preview.place.neighborhood : preview.place.address;
  const localUrl = isApp ? placePhotoUrl(preview.place) : null;
  const photoTitle = isApp ? (preview.place.wikiTitle ?? preview.place.name) : preview.place.name;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="link" className="self-start" onClick={onBack}>
        <Icon icon={ChevronLeft} /> Voltar
      </Button>
      <PreviewPhoto title={photoTitle} localUrl={localUrl} category={category} />
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-(length:--text-lg) leading-tight font-semibold text-foreground">{name}</h3>
        <p className="m-0 flex items-center gap-1.5 text-(length:--text-sm) text-muted-foreground">
          <Icon icon={categoryIconOf(category)} /> {categoryLabel(category)}
        </p>
        {address && <p className="m-0 text-(length:--text-sm) text-muted-foreground">{address}</p>}
      </div>
      {/* lugar de outra cidade da viagem (ajustes-99): âmbar com ícone (--warning, 5.89:1), não bloqueia */}
      {elsewhere && (
        <p className="m-0 flex items-center gap-1.5 text-(length:--text-sm) font-medium text-warning" role="status">
          <Icon icon={MapPin} /> Esse lugar fica em {elsewhere}
        </p>
      )}
      <MiniMap lat={preview.place.lat} lng={preview.place.lng} label={name} />
      {dayPicker}
      <Button fullWidth disabled={!canAdd} onClick={onAdd}>
        <Icon icon={Plus} /> {addLabel}
      </Button>
    </div>
  );
}
