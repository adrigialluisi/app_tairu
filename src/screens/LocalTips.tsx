import { Banknote } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { EmptyTripState } from '../components/shell/EmptyTripState';
import { Icon } from '../components/shell/Icon';
import { Card } from '@/components/ui/card';
import { formatCategories, getAlsoWorthVisiting, getLocalTipsForCity } from '../data';
import { useTrip } from '../context/TripContext';
import styles from './LocalTips.module.css';

/**
 * Dicas locais de UMA cidade (ajustes-100): era a 3ª sub-aba do Roteiro, no mesmo nível do roteiro,
 * e virou tela própria aberta pelo botão "Dicas" ao lado do select de cidade. Sem menu fixo; o
 * voltar volta pro Roteiro na mesma cidade (o Roteiro guardou cidade, dia e Lista/Mapa no state da
 * própria entrada do histórico antes de abrir esta tela, então o voltar do Safari também acerta).
 */
export function LocalTips() {
  const trip = useTrip();
  const navigate = useNavigate();
  const location = useLocation();
  const { destinationId } = useParams<{ destinationId: string }>();
  const destination = trip.destinations.find((d) => d.id === destinationId);

  function back() {
    // aberta direto (sem histórico do app): vai pro Roteiro já na cidade
    if (location.key === 'default') navigate('/roteiro', { replace: true, state: { destinationId } });
    else navigate(-1);
  }

  const appBar = (
    <AppBar title={destination ? `Dicas de ${destination.city}` : 'Dicas locais'} subtitle={trip.name || undefined} onBack={back} />
  );

  if (!destination) {
    return (
      <ScreenShell appBar={appBar}>
        <EmptyTripState message="Essa cidade não está mais na viagem. Volte pro Roteiro e escolha outra." />
      </ScreenShell>
    );
  }

  const tipsForCity = getLocalTipsForCity(destination.cityId);
  const alsoVisit = getAlsoWorthVisiting(
    destination.cityId,
    new Set(
      trip.selectedPlaces.filter((s) => s.destinationId === destination.id && s.placeId).map((s) => s.placeId as string),
    ),
    trip.quiz.interests,
    trip.quiz.discovery,
  );

  /** Atalho pro Conversor de Custos já com a moeda da cidade (docs/ajustes-62-conversor-de-moedas.md). */
  const converterLink = (
    <button
      type="button"
      className={styles.converterLink}
      onClick={() => navigate('/custos', { replace: true, state: { tab: 'conversor', currencyCode: destination.currencyCode } })}
    >
      <Icon icon={Banknote} /> Abrir conversor ({destination.currencyCode} → BRL)
    </button>
  );

  return (
    <ScreenShell appBar={appBar}>
      <div className={styles.panel}>
        {!tipsForCity ? (
          <p className={styles.noData}>Dicas locais ainda não disponíveis pra {destination.city}.</p>
        ) : (
          tipsForCity.categories.map((cat) => (
            <Card asChild className="px-4" key={cat.category}>
              <div className={styles.tipsCategory}>
                <h2 className={styles.tipsCategoryTitle}>{cat.label}</h2>
                <ul className={styles.tipsList}>
                  {cat.tips.map((tip, i) => (
                    <li key={i} className={styles.tipsItem}>
                      <span className={styles.bullet} aria-hidden="true">
                        •
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
                {cat.category === 'dinheiro' && converterLink}
              </div>
            </Card>
          ))
        )}

        {/* cidade sem bloco "Dinheiro e câmbio": o atalho vai no fim das dicas */}
        {!tipsForCity?.categories.some((c) => c.category === 'dinheiro') && converterLink}

        {alsoVisit.length > 0 && (
          <Card asChild className="px-4">
            <div className={styles.alsoVisit}>
              <h2 className={styles.alsoVisitTitle}>Também vale visitar</h2>
              {alsoVisit.map((place) => (
                <div key={place.id} className={styles.alsoVisitItem}>
                  <span className={styles.alsoVisitName}>{place.name}</span>
                  <span className={styles.alsoVisitMeta}>
                    {place.neighborhood} · {formatCategories(place.categories)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </ScreenShell>
  );
}
