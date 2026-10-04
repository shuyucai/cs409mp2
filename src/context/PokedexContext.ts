import { createContext } from 'react';
import type { Pokemon } from '../types/pokemon';

export type PokedexState =
  | { status: 'loading'; done: number; total: number }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      pokemon: Pokemon[];
      /** Ids that failed to load fully (missing entirely or missing species data) */
      failedIds: number[];
      /** True while missing entries are being re-fetched in the background */
      retrying: boolean;
    };

export interface PokedexContextValue {
  state: PokedexState;
  /** All loaded Pokémon in Pokédex order (empty until ready) */
  pokemon: Pokemon[];
  byId: Map<number, Pokemon>;
  /** Default Pokédex order, used when Detail is opened directly by URL */
  defaultOrder: number[];
  failedIds: number[];
  retrying: boolean;
  /** Re-fetches only what is missing (or everything, if nothing loaded) */
  retry: () => void;
}

export const PokedexContext = createContext<PokedexContextValue | null>(null);
