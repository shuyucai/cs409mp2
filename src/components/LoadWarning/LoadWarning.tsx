import { useState } from 'react';
import { usePokedex } from '../../context/usePokedex';
import { formatId } from '../../utils/format';
import styles from './LoadWarning.module.css';

const MAX_LISTED = 6;

/** Non-blocking notice shown when some Pokémon failed to load. */
export function LoadWarning() {
  const { failedIds, retrying, retry } = usePokedex();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  const key = failedIds.join(',');
  if (failedIds.length === 0 || dismissedFor === key) return null;

  const listed = failedIds.slice(0, MAX_LISTED).map(formatId).join(', ');
  const more = failedIds.length > MAX_LISTED ? ` and ${failedIds.length - MAX_LISTED} more` : '';

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        <strong>
          {failedIds.length} Pokémon didn’t fully load
        </strong>{' '}
        ({listed}
        {more}). Everything else works normally.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.retry} onClick={retry} disabled={retrying}>
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => setDismissedFor(key)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
