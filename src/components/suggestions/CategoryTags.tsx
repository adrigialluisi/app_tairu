import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Icon } from '../shell/Icon';
import styles from './CategoryTags.module.css';

export interface CategoryTag {
  key: string;
  icon?: LucideIcon;
  label: string;
}

interface CategoryTagsProps {
  tags: CategoryTag[];
  /** 'sm' nos cards e no Roteiro; 'md' na faixa do perfil */
  size?: 'sm' | 'md';
}

/**
 * Chips só de leitura (ícone + rótulo) — categorias de um lugar, ou o que
 * foi marcado no perfil. Não são interativos (não confundir com
 * OptionChipGroup, que é de seleção).
 */
export function CategoryTags({ tags, size = 'sm' }: CategoryTagsProps) {
  if (tags.length === 0) return null;
  return (
    <ul className={`${styles.tags} ${size === 'md' ? styles.tagsMd : ''}`}>
      {tags.map((t) => (
        <li key={t.key}>
          <Badge variant={size === 'md' ? 'neutral' : 'soft'}>
            {t.icon && <Icon icon={t.icon} />}
            {t.label}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
