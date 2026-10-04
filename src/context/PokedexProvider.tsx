import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { GEN1_COUNT, loadPokedex, readCache } from '../api/pokeapi';
import { PokedexContext, type PokedexState } from './PokedexContext';

function describeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response) return `PokeAPI responded with ${err.response.status}.`;
    if (err.code === 'ECONNABORTED') return 'The request to PokeAPI timed out.';
    return 'Could not reach PokeAPI. Check your connection.';
  }
  return 'Something went wrong while loading Pokémon.';
}

export function PokedexProvider({ children }: { children: ReactNode }) {
  // Read the cache once, synchronously, so cached visits never flash a loader.
  const [initial] = useState(readCache);
  const [state, setState] = useState<PokedexState>(() =>
    initial
      ? {
          status: 'ready',
          pokemon: initial.pokemon,
          failedIds: initial.failedIds,
          // A partial cache is topped up in the background on mount
          retrying: initial.failedIds.length > 0,
        }
      : { status: 'loading', done: 0, total: GEN1_COUNT },
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Fully cached: nothing to fetch until the user asks to retry
    if (attempt === 0 && initial && initial.failedIds.length === 0) return;

    let active = true;
    loadPokedex((done, total) => {
      // Only show progress on the full-page loader; partial retries stay in the background
      if (active) setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading', done, total }));
    })
      .then((result) => {
        if (!active) return;
        if (result.pokemon.length === 0) {
          setState({ status: 'error', message: describeError(result.firstError) });
        } else {
          setState({
            status: 'ready',
            pokemon: result.pokemon,
            failedIds: result.failedIds,
            retrying: false,
          });
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState((prev) =>
          prev.status === 'ready'
            ? { ...prev, retrying: false }
            : { status: 'error', message: describeError(err) },
        );
      });
    return () => {
      active = false;
    };
  }, [attempt, initial]);

  const retry = useCallback(() => {
    setState((prev) =>
      prev.status === 'ready'
        ? { ...prev, retrying: true }
        : { status: 'loading', done: 0, total: GEN1_COUNT },
    );
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(() => {
    const ready = state.status === 'ready' ? state : null;
    const pokemon = ready?.pokemon ?? [];
    return {
      state,
      pokemon,
      byId: new Map(pokemon.map((p) => [p.id, p])),
      defaultOrder: pokemon.map((p) => p.id),
      failedIds: ready?.failedIds ?? [],
      retrying: ready?.retrying ?? false,
      retry,
    };
  }, [state, retry]);

  return <PokedexContext.Provider value={value}>{children}</PokedexContext.Provider>;
}
