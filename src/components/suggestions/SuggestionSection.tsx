import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '../shell/Icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import styles from './SuggestionSection.module.css';

interface SuggestionSectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  /** ex.: "4 lugares", "2 eventos" */
  countLabel: string;
  description: string;
  children: ReactNode;
}

/** Cabeçalho (ícone em círculo + título + contador + descrição) e carrossel horizontal de cards. */
export function SuggestionSection({ id, icon, title, countLabel, description, children }: SuggestionSectionProps) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className={styles.section} aria-labelledby={titleId}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon icon={icon} />
        </span>
        <div className={styles.headerText}>
          <div className={styles.titleRow}>
            <h3 id={titleId} className={styles.title}>
              {title}
            </h3>
            <span className={styles.count}>{countLabel}</span>
          </div>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * Trilho horizontal com scroll-snap — cada card dentro dele tem um elemento focável (Tab percorre os cards).
 * Scroll Area do shadcn (docs/ajustes-74-...md): a rolagem continua nativa (toque e inércia do celular), sem
 * barra cinza parada — a barra fina aparece só enquanto rola. O trilho vaza 16px pros lados pra o primeiro
 * cartão alinhar com o título e o último encostar na borda da tela.
 */
export function SuggestionCarousel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ScrollArea
      type="scroll"
      orientation="horizontal"
      className="-mx-4"
      viewportClassName="snap-x snap-mandatory scroll-px-4"
    >
      <ul className={styles.carousel} aria-label={label}>
        {children}
      </ul>
    </ScrollArea>
  );
}
