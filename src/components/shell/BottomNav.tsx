import { Link, useLocation } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { isDestinosComplete, isRoteiroComplete } from '../../utils/tripProgress';
import styles from './BottomNav.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const ITEMS: NavItem[] = [
  { path: '/destinos', label: 'Destinos', icon: '📍' },
  { path: '/central', label: 'Central', icon: '🧳' },
  { path: '/convidar', label: 'Convidados', icon: '👥' },
  { path: '/roteiro', label: 'Roteiro', icon: '🧭' },
  { path: '/custos', label: 'Custos', icon: '💰' },
];

/**
 * Menu fixo — sempre visível em todas as 5 seções, sem pré-requisito (ver
 * docs/ajustes-21-menu-sempre-visivel.md). Selos de progresso por item
 * (ver docs/ajustes-22-trilha-progresso-e-salvo.md): Destinos/Roteiro
 * ganham um ✓ quando "completos" (critério de src/utils/tripProgress.ts);
 * Convidados ganha uma contagem (convite não é uma meta a cumprir). Central/
 * Custos ficam sem selo — ainda são seções sem critério de completude
 * definido (ver docs/ajustes-26-central-inicio-documentos-splash.md;
 * Documentos saiu do menu fixo, só acessível pela Início).
 */
export function BottomNav() {
  const location = useLocation();
  const trip = useTrip();

  const badgeByPath: Record<string, { type: 'check' } | { type: 'count'; value: number } | undefined> = {
    '/destinos': isDestinosComplete(trip) ? { type: 'check' } : undefined,
    '/convidar': trip.companions.length > 0 ? { type: 'count', value: trip.companions.length } : undefined,
    '/roteiro': isRoteiroComplete(trip) ? { type: 'check' } : undefined,
  };

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {ITEMS.map((item) => {
        const active = location.pathname === item.path;
        const badge = badgeByPath[item.path];
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.item} ${active ? styles.itemActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.iconWrap}>
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              {badge?.type === 'check' && (
                <span className={styles.badgeCheck} aria-hidden="true">
                  ✓
                </span>
              )}
              {badge?.type === 'count' && (
                <span className={styles.badgeCount} aria-hidden="true">
                  {badge.value}
                </span>
              )}
            </span>
            <span className={styles.label}>{item.label}</span>
            {badge?.type === 'check' && <span className="visually-hidden"> — concluído</span>}
            {badge?.type === 'count' && (
              <span className="visually-hidden"> — {badge.value} convite{badge.value > 1 ? 's' : ''}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
