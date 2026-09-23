import type { ReactNode } from 'react';
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
 */
export function StepSection({ stepNumber, title, saved, summary, onEdit, children }: StepSectionProps) {
  return (
    <section className={styles.step} aria-label={`Passo ${stepNumber}: ${title}`}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber} aria-hidden="true">
          {stepNumber}
        </span>
        <h3 className={styles.stepTitle}>{title}</h3>
        {saved && (
          <button type="button" className={styles.editButton} onClick={onEdit}>
            Editar
          </button>
        )}
      </div>
      {saved ? <div className={styles.stepSummary}>{summary}</div> : <div className={styles.stepBody}>{children}</div>}
    </section>
  );
}
