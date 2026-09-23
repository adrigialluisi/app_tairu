import styles from './Chip.module.css';

interface ChipProps {
  label: string;
  onRemove: () => void;
  removeLabel: string;
}

export function Chip({ label, onRemove, removeLabel }: ChipProps) {
  return (
    <span className={styles.chip}>
      <span className={styles.label}>{label}</span>
      <button type="button" className={styles.removeButton} onClick={onRemove} aria-label={removeLabel}>
        <span aria-hidden="true">×</span>
      </button>
    </span>
  );
}
