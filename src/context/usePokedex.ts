import { useContext } from 'react';
import { PokedexContext, type PokedexContextValue } from './PokedexContext';

export function usePokedex(): PokedexContextValue {
  const ctx = useContext(PokedexContext);
  if (!ctx) throw new Error('usePokedex must be used inside <PokedexProvider>');
  return ctx;
}
