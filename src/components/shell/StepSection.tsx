import type { ReactNode } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import styles from './StepSection.module.css';

interface StepSectionProps {
  stepNumber: number;
  title: string;
  /** true = mostra o resumo (modo revisão); false = mostra o children (modo edição) */
  saved: boolean;
  summary: ReactNode;
  onEdit: () => void;
  children: ReactNode;
}

/**
 * Seção de formulário em formato de "passo numerado", com dois modos:
 * edição (children, com o botão de salvar de responsabilidade de quem usa
 * o componente) e resumo (summary + botão "Editar" pra voltar à edição).
 * Ver docs/ajustes-23-destinos-em-steps-com-resumo.md.
 *
 * Collapsible do shadcn (docs/ajustes-74-...md): o formulário é o conteúdo
 * que abre e fecha — aberto enquanto o passo não está salvo — e "Editar" é o
 * gatilho que reabre (o Radix liga aria-expanded/aria-controls). Quem manda no
 * estado continua sendo quem usa (`saved`/`onEdit`), como antes.
 */
export function StepSection({ stepNumber, title, saved, summary, onEdit, children }: StepSectionProps) {
  return (
    <Collapsible
      asChild
      open={!saved}
      onOpenChange={(open) => {
        if (open) onEdit();
      }}
    >
      <section className={styles.step} aria-label={`Passo ${stepNumber}: ${title}`}>
        <div className={styles.stepHeader}>
          <span className={styles.stepNumber} aria-hidden="true">
            {stepNumber}
          </span>
          <h3 className={styles.stepTitle}>{title}</h3>
          {saved && (
            <CollapsibleTrigger asChild>
              <button type="button" className={styles.editButton}>
                Editar
              </button>
            </CollapsibleTrigger>
          )}
        </div>
        {saved && <div className={styles.stepSummary}>{summary}</div>}
        <CollapsibleContent className={styles.stepBody}>{children}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}
