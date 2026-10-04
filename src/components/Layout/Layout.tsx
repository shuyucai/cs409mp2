import { Link, NavLink, Outlet } from 'react-router-dom';
import { usePokedex } from '../../context/usePokedex';
import { LoadWarning } from '../LoadWarning/LoadWarning';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import styles from './Layout.module.css';

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;
}

function Content() {
  const { state, retry } = usePokedex();

  if (state.status === 'loading') {
    return (
      <StatusMessage title="Catching Pokémon…">
        <p>
          Loaded {state.done} of {state.total}
        </p>
        <progress value={state.done} max={state.total} />
      </StatusMessage>
    );
  }

  if (state.status === 'error') {
    return (
      <StatusMessage title="Couldn't load the Pokédex" tone="error">
        <p>{state.message}</p>
        <button type="button" onClick={retry}>
          Try again
        </button>
      </StatusMessage>
    );
  }

  return (
    <>
      <LoadWarning />
      <Outlet />
    </>
  );
}

export function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.pokeball} aria-hidden="true" />
            Pokédex
            <span className={styles.gen}>Gen I</span>
          </Link>
          <nav aria-label="Main">
            <ul className={styles.nav}>
              <li>
                <NavLink to="/" end className={navClass}>
                  List
                </NavLink>
              </li>
              <li>
                <NavLink to="/gallery" className={navClass}>
                  Gallery
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Content />
      </main>

      <footer className={styles.footer}>
        Data from <a href="https://pokeapi.co/">PokeAPI</a>. Pokémon and Pokémon character names
        are trademarks of Nintendo.
      </footer>
    </div>
  );
}
