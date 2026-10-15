import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Icon } from './Icon';

/**
 * Selo "Novo" (ajustes-89): o que os convidados trouxeram na simulação "2 dias depois", até a
 * pessoa sair da seção. Variante accent do Badge: --accent-dark no --accent-soft, 8.62:1, com ícone.
 */
export function NewBadge({ className }: { className?: string }) {
  return (
    <Badge variant="accent" className={className}>
      <Icon icon={Sparkles} /> Novo
    </Badge>
  );
}
