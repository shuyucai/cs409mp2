import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { GEN1_COUNT } from '../../api/pokeapi';
import { StatChart } from '../../components/StatChart/StatChart';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { TypeBadgeList } from '../../components/TypeBadge/TypeBadge';
import { usePokedex } from '../../context/usePokedex';
import { typeColorClass } from '../../styles/typeColors';
import { isDetailLocationState, type DetailLocationState } from '../../types/navigation';
import { formatHeight, formatId, formatWeight, titleCase } from '../../utils/format';
import styles from './DetailView.module.css';

export function DetailView() {
  const { id } = useParams();
  const { byId, defaultOrder, failedIds, retrying, retry } = usePokedex();
  const location = useLocation();
  const navigate = useNavigate();

  const currentId = Number(id);
  const pokemon = byId.get(currentId);

  // Use the order the user came from; fall back to Pokédex order on direct visits.
  const fromState = isDetailLocationState(location.state) ? location.state : null;
  const nav: DetailLocationState = useMemo(
    () =>
      fromState && fromState.order.includes(currentId)
        ? fromState
        : { order: defaultOrder, backTo: '/', backLabel: 'List' },
    [fromState, currentId, defaultOrder],
  );

  const index = nav.order.indexOf(currentId);
  const len = nav.order.length;
  const prevId = index >= 0 && len > 1 ? nav.order[(index - 1 + len) % len] : null;
  const nextId = index >= 0 && len > 1 ? nav.order[(index + 1) % len] : null;
  const prev = prevId != null ? byId.get(prevId) : undefined;
  const next = nextId != null ? byId.get(nextId) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentId]);

  // Arrow-key navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === 'ArrowLeft' && prevId != null) {
        navigate(`/pokemon/${prevId}`, { state: nav });
      } else if (e.key === 'ArrowRight' && nextId != null) {
        navigate(`/pokemon/${nextId}`, { state: nav });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, nav, prevId, nextId]);

  if (!pokemon && failedIds.includes(currentId)) {
    return (
      <StatusMessage title="Couldn’t load this Pokémon" tone="error">
        <p>{formatId(currentId)} failed to load from PokeAPI. The rest of the Pokédex is available.</p>
        <button type="button" onClick={retry} disabled={retrying}>
          {retrying ? 'Retrying…' : 'Try again'}
        </button>{' '}
        <Link to="/">Back to list</Link>
      </StatusMessage>
    );
  }

  if (!pokemon) {
    return (
      <StatusMessage title="Pokémon not found" tone="error">
        <p>
          “{id}” isn’t one of the original 151 Pokémon. Try a number from 1 to{' '}
          {GEN1_COUNT}.
        </p>
        <Link to="/">Back to list</Link>
      </StatusMessage>
    );
  }

  const primary = pokemon.types[0];

  return (
    <article className={`${styles.page} ${typeColorClass(primary)}`}>
      <nav className={styles.topBar} aria-label="Pokémon navigation">
        <Link to={nav.backTo} className={styles.back}>
          ← Back to {nav.backLabel}
        </Link>
        <span className={styles.position}>
          {index + 1} of {len}
          {fromState ? ` in ${nav.backLabel.toLowerCase()}` : ''}
        </span>
      </nav>

      <div className={styles.hero}>
        <img
          className={styles.art}
          src={pokemon.artwork}
          alt={pokemon.name}
          width={475}
          height={475}
        />
        <div className={styles.heroText}>
          <p className={styles.number}>{formatId(pokemon.id)}</p>
          <h1 className={styles.name}>{pokemon.name}</h1>
          {pokemon.genus && <p className={styles.genus}>{pokemon.genus}</p>}
          <TypeBadgeList types={pokemon.types} />
          {pokemon.description && <p className={styles.description}>{pokemon.description}</p>}
        </div>
      </div>

      <div className={styles.panels}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Profile</h2>
          <dl className={styles.facts}>
            <div>
              <dt>Height</dt>
              <dd>{formatHeight(pokemon.height)}</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{formatWeight(pokemon.weight)}</dd>
            </div>
          </dl>

          <h3 className={styles.subTitle}>Abilities</h3>
          <ul className={styles.abilities}>
            {pokemon.abilities.map((a) => (
              <li key={a.name} className={styles.ability}>
                {titleCase(a.name)}
                {a.hidden && <span className={styles.hidden}>Hidden</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Base stats</h2>
          <StatChart stats={pokemon.stats} total={pokemon.total} />
        </section>
      </div>

      <nav className={styles.pager} aria-label="Previous and next Pokémon">
        {prev ? (
          <Link to={`/pokemon/${prev.id}`} state={nav} className={styles.pagerLink} rel="prev">
            <span className={styles.pagerDir}>← Previous</span>
            <span className={styles.pagerName}>
              {formatId(prev.id)} {prev.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/pokemon/${next.id}`}
            state={nav}
            className={`${styles.pagerLink} ${styles.pagerNext}`}
            rel="next"
          >
            <span className={styles.pagerDir}>Next →</span>
            <span className={styles.pagerName}>
              {formatId(next.id)} {next.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
