import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { TypeBadgeList } from '../../components/TypeBadge/TypeBadge';
import { usePokedex } from '../../context/usePokedex';
import type { DetailLocationState } from '../../types/navigation';
import type { Pokemon } from '../../types/pokemon';
import { formatHeight, formatId, formatWeight } from '../../utils/format';
import styles from './ListView.module.css';

type SortKey = 'id' | 'name' | 'total' | 'height' | 'weight';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'Pokédex number' },
  { key: 'name', label: 'Name' },
  { key: 'total', label: 'Base stat total' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
];

function isSortKey(value: string | null): value is SortKey {
  return SORT_OPTIONS.some((o) => o.key === value);
}

function compare(a: Pokemon, b: Pokemon, key: SortKey): number {
  if (key === 'name') return a.name.localeCompare(b.name);
  return a[key] - b[key];
}

function matchesQuery(p: Pokemon, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().replace(/^#/, '');
  return (
    p.name.toLowerCase().includes(q) ||
    p.slug.includes(q) ||
    (/^\d+$/.test(q) && String(p.id).padStart(3, '0').includes(q))
  );
}

/** Secondary info shown on each row, matching the active sort where useful. */
function metricFor(p: Pokemon, key: SortKey): { label: string; value: string } {
  switch (key) {
    case 'height':
      return { label: 'Height', value: formatHeight(p.height) };
    case 'weight':
      return { label: 'Weight', value: formatWeight(p.weight) };
    default:
      return { label: 'Total', value: String(p.total) };
  }
}

export function ListView() {
  const { pokemon } = usePokedex();
  const location = useLocation();
  // Search/sort live in the URL so "Back" from Detail restores them.
  const [params, setParams] = useSearchParams();

  const query = params.get('q') ?? '';
  const sortParam = params.get('sort');
  const sortKey: SortKey = isSortKey(sortParam) ? sortParam : 'id';
  const sortDir: SortDir = params.get('dir') === 'desc' ? 'desc' : 'asc';

  const update = (changes: Record<string, string>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        return next;
      },
      { replace: true },
    );
  };

  const results = useMemo(() => {
    const sign = sortDir === 'asc' ? 1 : -1;
    return pokemon
      .filter((p) => matchesQuery(p, query.trim()))
      .sort((a, b) => sign * compare(a, b, sortKey) || a.id - b.id);
  }, [pokemon, query, sortKey, sortDir]);

  const linkState: DetailLocationState = {
    order: results.map((p) => p.id),
    backTo: location.pathname + location.search,
    backLabel: 'List',
  };

  return (
    <section>
      <header className={styles.heading}>
        <h1 className={styles.title}>Pokémon List</h1>
        <p className={styles.subtitle}>Search and sort all 151 original Pokémon.</p>
      </header>

      <div className={styles.controls}>
        <label className={styles.search}>
          <span className="visually-hidden">Search Pokémon by name</span>
          <input
            type="search"
            placeholder="Search by name or number…"
            value={query}
            onChange={(e) => update({ q: e.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className={styles.sortGroup}>
          <label className={styles.sortLabel}>
            <span>Sort by</span>
            <select value={sortKey} onChange={(e) => update({ sort: e.target.value })}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.dirToggle} role="group" aria-label="Sort order">
            <button
              type="button"
              aria-pressed={sortDir === 'asc'}
              className={sortDir === 'asc' ? styles.dirActive : undefined}
              onClick={() => update({ dir: '' })}
            >
              ↑ Asc
            </button>
            <button
              type="button"
              aria-pressed={sortDir === 'desc'}
              className={sortDir === 'desc' ? styles.dirActive : undefined}
              onClick={() => update({ dir: 'desc' })}
            >
              ↓ Desc
            </button>
          </div>
        </div>
      </div>

      <p className={styles.count} aria-live="polite">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      {results.length === 0 ? (
        <p className={styles.empty}>No Pokémon match “{query}”.</p>
      ) : (
        <ul className={styles.list}>
          {results.map((p) => {
            const metric = metricFor(p, sortKey);
            return (
              <li key={p.id}>
                <Link to={`/pokemon/${p.id}`} state={linkState} className={styles.row}>
                  <img
                    className={styles.sprite}
                    src={p.sprite}
                    alt=""
                    width={72}
                    height={72}
                    loading="lazy"
                  />
                  <span className={styles.number}>{formatId(p.id)}</span>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.types}>
                    <TypeBadgeList types={p.types} size="sm" />
                  </span>
                  <span className={styles.metric}>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    {metric.value}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
