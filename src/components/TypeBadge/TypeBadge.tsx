import { typeColorClass } from '../../styles/typeColors';
import { titleCase } from '../../utils/format';
import styles from './TypeBadge.module.css';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[size]} ${typeColorClass(type)}`}>
      {titleCase(type)}
    </span>
  );
}

export function TypeBadgeList({ types, size }: { types: string[]; size?: 'sm' | 'md' }) {
  return (
    <ul className={styles.list} aria-label="Types">
      {types.map((t) => (
        <li key={t}>
          <TypeBadge type={t} size={size} />
        </li>
      ))}
    </ul>
  );
}
