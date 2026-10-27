import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { Card } from '@/components/ui/card';
import { cities, places } from '../data';
import { EXAMPLE_PAST_TRIPS, photosOfStop } from '../data/examplePastTrips';

interface CreditLine {
  key: string;
  placeName: string;
  author: string;
  license: string;
  sourceUrl: string;
  /** foto de outro lugar, representando este (ajustes-87) */
  representative?: boolean;
}

interface CreditGroup {
  key: string;
  title: string;
  /** "Viagem passada de exemplo" nas cidades do exemplo Lisboa + Porto */
  note?: string;
  lines: CreditLine[];
}

/** fotos locais dos lugares (places.json), por cidade, na ordem do cities.json */
function placeGroups(): CreditGroup[] {
  return cities
    .map((city) => ({
      key: city.id,
      title: `${city.city}, ${city.country}`,
      lines: places
        .filter((p) => p.cityId === city.id && p.photo)
        .map((p) => ({
          key: p.id,
          placeName: p.name,
          author: p.photo!.author,
          license: p.photo!.license,
          sourceUrl: p.photo!.sourceUrl,
          representative: p.photo!.representative,
        })),
    }))
    .filter((g) => g.lines.length > 0);
}

/** fotos da viagem passada de exemplo (ajustes-78/79), por cidade do roteiro de exemplo */
function pastTripGroups(): CreditGroup[] {
  return EXAMPLE_PAST_TRIPS.flatMap((trip) =>
    (trip.cities ?? []).map((city) => ({
      key: `${trip.id}-${city.id}`,
      title: `${city.city}, ${city.country}`,
      note: `Viagem passada de exemplo · ${trip.name}`,
      lines: city.stops.flatMap((stop) =>
        photosOfStop(stop.id).map((photo) => ({
          key: photo.id,
          placeName: stop.name,
          author: photo.author,
          license: photo.license,
          sourceUrl: photo.sourcePage,
        })),
      ),
    })),
  ).filter((g) => g.lines.length > 0);
}

/**
 * Créditos das fotos (ajustes-99c): um lugar só pra todos os créditos, no lugar do rodapé recolhido
 * de cada seção das Sugestões (ajustes-87), do link no rodapé da viagem passada (ajustes-95) e do
 * crédito na foto aberta. Lista toda foto do app que tem licença a creditar — as dos lugares
 * (public/places) e as da viagem passada de exemplo (public/memorias-exemplo) —, por cidade:
 * "Lugar — autor · licença · Wikimedia Commons" (link pra página da foto). Rota /creditos, sem menu
 * fixo, voltar pra Início. As fotos dos hotéis (site oficial de cada um, ajustes-52) e as buscadas
 * ao vivo na Wikipedia não têm autor/licença guardados e não entram aqui.
 * --muted no branco 7.63:1; link --accent-dark 9.67:1.
 */
export function PhotoCredits() {
  const navigate = useNavigate();
  const groups = [...placeGroups(), ...pastTripGroups()];

  return (
    <ScreenShell appBar={<AppBar title="Créditos das fotos" onBack={() => navigate('/inicio')} />}>
      <p className="m-0 text-(length:--text-base) text-muted-foreground">
        As fotos dos lugares e da viagem de exemplo são do Wikimedia Commons, com licença livre. Toque em
        &quot;Wikimedia Commons&quot; pra ver a página de cada foto.
      </p>

      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`creditos-${group.key}`} className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h2 id={`creditos-${group.key}`} className="m-0 text-(length:--text-xl) leading-tight font-semibold text-foreground">
              {group.title}
            </h2>
            {group.note && <p className="m-0 text-(length:--text-sm) text-muted-foreground">{group.note}</p>}
          </div>
          <Card asChild className="gap-0 px-4 py-2">
            <ul className="m-0 list-none">
              {group.lines.map((line, i) => (
                <li
                  key={line.key}
                  className={`py-2 text-(length:--text-sm) text-foreground ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <span className="font-medium">{line.placeName}</span>
                  {line.representative && <span className="text-muted-foreground"> (foto ilustrativa)</span>} —{' '}
                  <span className="text-muted-foreground">
                    {line.author} · {line.license} ·{' '}
                  </span>
                  <a
                    href={line.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-(--accent-dark) underline underline-offset-4"
                  >
                    Wikimedia Commons
                    <span className="visually-hidden"> (abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </ScreenShell>
  );
}
