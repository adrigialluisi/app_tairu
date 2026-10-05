import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

interface EmptyTripStateProps {
  message: string;
}

/**
 * Rede de segurança visual (ver docs/ajustes-08-estado-vazio-lugares-roteiro.md):
 * como o estado é só em memória, um refresh de página ou navegação direta
 * pra /roteiro sem nenhum destino cadastrado ainda zeraria o estado — em
 * vez de renderizar abas/seções vazias e confusas, mostra isso no lugar.
 */
export function EmptyTripState({ message }: EmptyTripStateProps) {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<MapPin />}
      action={
        <Button variant="primary" fullWidth onClick={() => navigate('/destinos')}>
          Ir pra Destinos
        </Button>
      }
    >
      {message}
    </EmptyState>
  );
}
