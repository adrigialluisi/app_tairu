import { useEffect, useRef } from 'react';
import { useTrip, type UpdateSection } from '../context/TripContext';

/**
 * Novidades dos convidados (ajustes-89): enquanto a pessoa está na seção, o número do menu some
 * (BottomNav esconde o da seção aberta) e os itens novos continuam com o selo "Novo"; ao SAIR da
 * seção, ela conta como vista e os selos somem. Marcar na entrada apagaria o "Novo" antes de ela ver.
 * A marcação espera um instante: no modo de desenvolvimento o React desmonta e monta de novo na
 * hora (StrictMode), e isso não pode contar como "saiu da seção".
 */
export function useMarkSectionSeen(section: UpdateSection) {
  const trip = useTrip();
  const markRef = useRef(trip.markSectionSeen);
  markRef.current = trip.markSectionSeen;
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
    return () => {
      pending.current = setTimeout(() => markRef.current(section), 0);
    };
  }, [section]);
}
