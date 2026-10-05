import { Briefcase, Check, Compass, MapPin, Users, Wallet, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { isCustosComplete, isDestinosComplete, isRoteiroComplete } from '../../utils/tripProgress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import styles from './BottomNav.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

/*
  Selos de progresso: Badge do shadcn (ajustes-71) no tamanho de antes (14px).
  Fundo cheio — bordô no ✓ (branco 6.08:1), stone-600 no contador (7.63:1) —
  porque um selo suave nesse tamanho não se leria sobre o ícone.
*/
const progressBadgeClass = 'h-3.5 min-w-3.5 gap-0 px-0.5 py-0 text-[9px] leading-none font-semibold';

const ITEMS: NavItem[] = [
  { path: '/destinos', label: 'Destinos', icon: MapPin },
  { path: '/central', label: 'Central', icon: Briefcase },
  { path: '/convidar', label: 'Convidados', icon: Users },
  { path: '/roteiro', label: 'Roteiro', icon: Compass },
  { path: '/custos', label: 'Custos', icon: Wallet },
];

/**
 * Menu fixo — sempre visível em todas as 5 seções, sem pré-requisito (ver
 * docs/ajustes-21-menu-sempre-visivel.md). Selos de progresso por item
 * (ver docs/ajustes-22-trilha-progresso-e-salvo.md): Destinos/Roteiro
 * ganham um ✓ quando "completos" (critério de src/utils/tripProgress.ts);
 * Custos também, desde docs/ajustes-61-custos-lancamentos-e-rateio.md
 * (1 gasto manual ou 1 custo vindo da Central). Convidados ganha uma
 * contagem (convite não é uma meta a cumprir). Central fica sem selo — sem
 * critério de completude definido (ver docs/ajustes-26-central-inicio-documentos-splash.md;
 * Documentos saiu do menu fixo, só acessível pela Início).
 */
export function BottomNav() {
  const location = useLocation();
  const trip = useTrip();

  const badgeByPath: Record<string, { type: 'check' } | { type: 'count'; value: number } | undefined> = {
    '/destinos': isDestinosComplete(trip) ? { type: 'check' } : undefined,
    '/convidar': trip.companions.length > 0 ? { type: 'count', value: trip.companions.length } : undefined,
    '/roteiro': isRoteiroComplete(trip) ? { type: 'check' } : undefined,
    '/custos': isCustosComplete(trip) ? { type: 'check' } : undefined,
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
              <item.icon className={styles.icon} aria-hidden="true" />
              {badge?.type === 'check' && (
                <Badge className={cn(styles.progressBadge, progressBadgeClass)} aria-hidden="true">
                  <Check className="size-2.5!" strokeWidth={3} />
                </Badge>
              )}
              {badge?.type === 'count' && (
                <Badge className={cn(styles.progressBadge, progressBadgeClass, 'bg-muted-foreground')} aria-hidden="true">
                  {badge.value}
                </Badge>
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
