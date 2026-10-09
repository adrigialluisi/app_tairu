import { Check, ImagePlus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AppBar } from '../components/shell/AppBar';
import { Button } from '../components/shell/Button';
import { Icon } from '../components/shell/Icon';
import { ScreenShell } from '../components/shell/ScreenShell';
import { OptionChipGroup } from '../components/quiz/OptionChipGroup';
import { StoryPlayer, type RecapPhoto } from '../components/recap/StoryPlayer';
import { TravelerAvatar } from '../components/recap/TravelerAvatar';
import { EXAMPLE_TRAVELERS, getExamplePastTrip, photosOfStop } from '../data/examplePastTrips';
import { formatISOToDisplay } from '../utils/dateMask';
import { cityDays, photosOfCity, shortName, suggestedSelection } from '../utils/pastTrip';

/** limite por cidade — 2 slides de 4 fotos, pra história não ficar longa demais */
const MAX_PER_CITY = 8;

/** foto da grade: as de exemplo trazem o rótulo acessível pronto ("Torre de Belém, foto 2, adicionada por Camila") */
interface GridPhoto extends RecapPhoto {
  label: string;
  addedBy: string;
  fromDevice: boolean;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Gerar recordação (rota /viagem-passada/:id/recordacao) — docs/ajustes-76-...,
 * reescrito nos ajustes-78 e 79 (onde discordam, vale o 79).
 * A tela já abre com as fotos que o grupo adicionou no roteiro (de exemplo,
 * Wikimedia Commons) marcadas, até 8 por cidade alternando entre as pessoas; a
 * pessoa desmarca o que não quiser e pode mandar mais do celular. Fotos do
 * celular ficam só em memória (object URL), revogadas ao tirar e ao sair da
 * tela — nada é enviado nem guardado.
 */
export function PastTripRecap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = getExamplePastTrip(id);
  const cities = useMemo(() => trip?.cities ?? [], [trip]);

  // fotos de exemplo de cada cidade, na ordem do roteiro (dia → parada → foto 1, 2)
  const examples = useMemo(() => {
    const byCity: Record<string, GridPhoto[]> = {};
    for (const city of cities) {
      byCity[city.id] = city.stops.flatMap((stop) =>
        photosOfStop(stop.id).map((p, i) => ({
          id: p.id,
          url: p.url,
          name: stop.name,
          placeName: stop.name,
          credit: `${p.author} · ${p.license}`,
          addedBy: p.addedBy,
          label: `${stop.name}, foto ${i + 1}, adicionada por ${shortName(p.addedBy)}`,
          fromDevice: false,
        })),
      );
    }
    return byCity;
  }, [cities]);

  const suggested = useMemo(
    () => Object.fromEntries(cities.map((c) => [c.id, suggestedSelection(photosOfCity(c), MAX_PER_CITY)])),
    [cities],
  );

  const [selected, setSelected] = useState<Record<string, string[]>>(suggested);
  const [devicePhotos, setDevicePhotos] = useState<Record<string, GridPhoto[]>>({});
  const [personFilter, setPersonFilter] = useState('todos');
  const [playingWith, setPlayingWith] = useState<Record<string, RecapPhoto[]> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const targetCity = useRef<string | null>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  if (!trip?.cities) return <Navigate to="/inicio" replace />;

  const allOf = (cityId: string): GridPhoto[] => [...(examples[cityId] ?? []), ...(devicePhotos[cityId] ?? [])];
  /** escolhidas, sempre na ordem do roteiro (exemplo primeiro, celular no fim) */
  const chosenOf = (cityId: string): GridPhoto[] => {
    const ids = selected[cityId] ?? [];
    return allOf(cityId).filter((p) => ids.includes(p.id));
  };

  function toggle(cityId: string, photoId: string) {
    setSelected((prev) => {
      const current = prev[cityId] ?? [];
      if (current.includes(photoId)) return { ...prev, [cityId]: current.filter((x) => x !== photoId) };
      if (current.length >= MAX_PER_CITY) return prev;
      return { ...prev, [cityId]: [...current, photoId] };
    });
  }

  function pickFor(cityId: string) {
    targetCity.current = cityId;
    inputRef.current?.click();
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const cityId = targetCity.current;
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (!cityId || files.length === 0) return;
    const start = (devicePhotos[cityId] ?? []).length;
    const added: GridPhoto[] = files.map((file, i) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      return {
        id: `recap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        name: file.name,
        addedBy: 'voce',
        label: `Foto do celular ${start + i + 1}, adicionada por você`,
        fromDevice: true,
      };
    });
    setDevicePhotos((prev) => ({ ...prev, [cityId]: [...(prev[cityId] ?? []), ...added] }));
    // entram já marcadas enquanto houver vaga; passando de 8, entram desmarcadas
    setSelected((prev) => {
      const current = prev[cityId] ?? [];
      const room = Math.max(0, MAX_PER_CITY - current.length);
      return { ...prev, [cityId]: [...current, ...added.slice(0, room).map((p) => p.id)] };
    });
  }

  function removeDevicePhoto(cityId: string, photo: GridPhoto) {
    URL.revokeObjectURL(photo.url);
    setDevicePhotos((prev) => ({ ...prev, [cityId]: (prev[cityId] ?? []).filter((p) => p.id !== photo.id) }));
    setSelected((prev) => ({ ...prev, [cityId]: (prev[cityId] ?? []).filter((x) => x !== photo.id) }));
  }

  function play() {
    const photos: Record<string, RecapPhoto[]> = {};
    for (const city of cities) photos[city.id] = chosenOf(city.id);
    setPlayingWith(photos);
  }

  const filterOptions = [
    { value: 'todos', label: 'Todos' },
    ...EXAMPLE_TRAVELERS.map((t) => ({ value: t.id, label: capitalize(shortName(t.id)) })),
  ];

  return (
    <>
      <ScreenShell
        appBar={<AppBar title="Gerar recordação" subtitle={trip.name} onBack={() => navigate(`/viagem-passada/${trip.id}`)} />}
        footer={
          <Button variant="primary" fullWidth onClick={play}>
            Ver recordação
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-(length:--text-xl) font-semibold text-foreground">Escolha as fotos de cada cidade</h2>
            <p className="m-0 text-(length:--text-base) text-muted-foreground">
              Já separamos as fotos que o grupo adicionou no roteiro. Desmarque as que não quiser ou adicione mais do
              celular. Até {MAX_PER_CITY} por cidade.
            </p>
          </div>

          {/* só filtra o que aparece na grade; a seleção não muda */}
          <OptionChipGroup legend="Mostrar fotos de" options={filterOptions} value={personFilter} onChange={setPersonFilter} />

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleFiles}
          />

          {cities.map((city) => {
            const days = cityDays(city);
            const all = allOf(city.id);
            const shown = personFilter === 'todos' ? all : all.filter((p) => p.addedBy === personFilter);
            const ids = selected[city.id] ?? [];
            const chosen = chosenOf(city.id);
            const people = new Set(chosen.map((p) => p.addedBy)).size;
            const full = ids.length >= MAX_PER_CITY;
            return (
              <Card key={city.id} className="gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <h3 className="m-0 text-(length:--text-lg) font-semibold text-foreground">{city.city}</h3>
                    <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                      {formatISOToDisplay(days[0]).slice(0, 5)} – {formatISOToDisplay(days[days.length - 1]).slice(0, 5)} ·{' '}
                      {chosen.length} de {MAX_PER_CITY} escolhidas
                      {people > 0 && ` · fotos de ${people} ${people === 1 ? 'pessoa' : 'pessoas'}`}
                    </p>
                  </div>
                  <Button
                    variant="link"
                    className="-mt-2.5 flex-none"
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [city.id]: ids.length > 0 ? [] : (suggested[city.id] ?? []) }))
                    }
                  >
                    {ids.length > 0 ? 'Limpar' : 'Escolher sugeridas'}
                  </Button>
                </div>

                {shown.length === 0 ? (
                  <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                    Nenhuma foto de {shortName(personFilter)} em {city.city}.
                  </p>
                ) : (
                  <ul className="m-0 grid list-none grid-cols-3 gap-1 p-0" aria-label={`Fotos de ${city.city}`}>
                    {shown.map((p) => {
                      const isSelected = ids.includes(p.id);
                      const blocked = full && !isSelected;
                      return (
                        <li key={p.id} className="relative aspect-square">
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            // aria-disabled (não disabled): o foco continua chegando e o leitor de tela lê o motivo abaixo
                            aria-disabled={blocked || undefined}
                            aria-label={p.label}
                            onClick={() => !blocked && toggle(city.id, p.id)}
                            className={cn(
                              'relative block size-full overflow-hidden rounded-md border-0 bg-(--placeholder) p-0',
                              blocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                            )}
                          >
                            <img src={p.url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                            {isSelected && (
                              <>
                                <span
                                  className="pointer-events-none absolute inset-0 rounded-md border-2 border-solid border-primary"
                                  aria-hidden="true"
                                />
                                {/* check branco sobre bordô: 6.08:1 */}
                                <span
                                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-primary text-(length:--text-sm) text-primary-foreground"
                                  aria-hidden="true"
                                >
                                  <Icon icon={Check} />
                                </span>
                              </>
                            )}
                            <span className="absolute inset-x-0 bottom-0 flex flex-col items-start" aria-hidden="true">
                              <span className="mb-1 ml-1 flex">
                                <TravelerAvatar travelerId={p.addedBy} />
                              </span>
                              {/* branco 13px sobre preto 60%: ≥ 5.7:1 mesmo sobre foto branca */}
                              <span className="block w-full truncate bg-black/60 px-1.5 py-0.5 text-left text-(length:--text-sm) text-white">
                                {p.fromDevice ? 'Do celular' : p.placeName}
                              </span>
                            </span>
                          </button>
                          {p.fromDevice && (
                            <button
                              type="button"
                              onClick={() => removeDevicePhoto(city.id, p)}
                              aria-label={`Tirar ${p.label.split(',')[0].toLowerCase()} de ${city.city}`}
                              className="absolute top-0 left-0 flex size-11 cursor-pointer items-start justify-start border-0 bg-transparent p-1"
                            >
                              <span className="flex size-6 items-center justify-center rounded-full bg-black/70 text-white">
                                <Icon icon={X} />
                              </span>
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {full && (
                  <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                    Limite de {MAX_PER_CITY} fotos por cidade. Desmarque uma pra trocar.
                  </p>
                )}
                {ids.length === 0 && (
                  <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                    Sem fotos escolhidas: a história usa fotos dos lugares da Wikipedia.
                  </p>
                )}

                <Button variant="secondary" fullWidth onClick={() => pickFor(city.id)}>
                  <Icon icon={ImagePlus} /> Adicionar do celular
                </Button>
              </Card>
            );
          })}
        </div>
      </ScreenShell>
      {playingWith && (
        <StoryPlayer
          trip={trip as typeof trip & { cities: typeof cities }}
          photos={playingWith}
          onClose={() => setPlayingWith(null)}
        />
      )}
    </>
  );
}
