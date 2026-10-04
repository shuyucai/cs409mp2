import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { TypeBadge } from '../../components/TypeBadge/TypeBadge';
import { usePokedex } from '../../context/usePokedex';
import { typeColorClass } from '../../styles/typeColors';
import type { DetailLocationState } from '../../types/navigation';
import { formatId } from '../../utils/format';
import styles from './GalleryView.module.css';

type MatchMode = 'any' | 'all';

export function GalleryView() {
  const { pokemon } = usePokedex();
  const location = useLocation();
  // Selected filters live in the URL so "Back" from Detail restores them.
  const [params, setParams] = useSearchParams();

  const selected = useMemo(
    () => (params.get('types') ?? '').split(',').filter(Boolean),
    [params],
  );
  const matchMode: MatchMode = params.get('match') === 'all' ? 'all' : 'any';

  const allTypes = useMemo(() => {
    const seen = new Set<string>();
    pokemon.forEach((p) => p.types.forEach((t) => seen.add(t)));
    return [...seen].sort();
  }, [pokemon]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    pokemon.forEach((p) => p.types.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return map;
  }, [pokemon]);

  const results = useMemo(() => {
    if (selected.length === 0) return pokemon;
    return pokemon.filter((p) =>
      matchMode === 'all'
        ? selected.every((t) => p.types.includes(t))
        : selected.some((t) => p.types.includes(t)),
    );
  }, [pokemon, selected, matchMode]);

  const setFilter = (types: string[], match: MatchMode = matchMode) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (types.length) next.set('types', types.join(','));
        else next.delete('types');
        if (match === 'all') next.set('match', 'all');
        else next.delete('match');
        return next;
      },
      { replace: true },
    );
  };

  const toggleType = (type: string) => {
    setFilter(
      selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type],
    );
  };

  const linkState: DetailLocationState = {
    order: results.map((p) => p.id),
    backTo: location.pathname + location.search,
    backLabel: 'Gallery',
  };

  return (
    <section>
      <header className={styles.heading}>
        <h1 className={styles.title}>Gallery</h1>
        <p className={styles.subtitle}>Filter by one or more types. Click a Pokémon for details.</p>
      </header>

      <div className={styles.filterPanel}>
        <div className={styles.filterHeader}>
          <h2 className={styles.filterTitle}>Filter by type</h2>
          <div className={styles.filterActions}>
            <div className={styles.matchToggle} role="group" aria-label="Match mode">
              <button
                type="button"
                aria-pressed={matchMode === 'any'}
                className={matchMode === 'any' ? styles.matchActive : undefined}
                onClick={() => setFilter(selected, 'any')}
              >
                Any
              </button>
              <button
                type="button"
                aria-pressed={matchMode === 'all'}
                className={matchMode === 'all' ? styles.matchActive : undefined}
                onClick={() => setFilter(selected, 'all')}
              >
                All
              </button>
            </div>
            <button
              type="button"
              className={styles.clear}
              onClick={() => setFilter([])}
              disabled={selected.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        <ul className={styles.chips}>
          {allTypes.map((type) => {
            const isOn = selected.includes(type);
            return (
              <li key={type}>
                <button
                  type="button"
                  aria-pressed={isOn}
                  className={`${styles.chip} ${typeColorClass(type)} ${isOn ? styles.chipOn : ''}`}
                  onClick={() => toggleType(type)}
                >
                  <TypeBadge type={type} size="sm" />
                  <span className={styles.chipCount}>{counts.get(type)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className={styles.count} aria-live="polite">
        Showing {results.length} of {pokemon.length}
      </p>

      {results.length === 0 ? (
        <p className={styles.empty}>
          No Pokémon have all of those types. Try “Any” or remove a filter.
        </p>
      ) : (
        <ul className={styles.grid}>
          {results.map((p) => (
            <li key={p.id}>
              <Link
                to={`/pokemon/${p.id}`}
                state={linkState}
                className={`${styles.card} ${typeColorClass(p.types[0])}`}
              >
                <img
                  className={styles.art}
                  src={p.artwork}
                  alt={p.name}
                  width={475}
                  height={475}
                  loading="lazy"
                />
                <span className={styles.caption}>
                  <span className={styles.number}>{formatId(p.id)}</span>
                  <span className={styles.name}>{p.name}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
