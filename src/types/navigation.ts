/**
 * Router state passed from the List/Gallery views to the Detail view so that
 * Prev/Next follow the order the user was looking at.
 */
export interface DetailLocationState {
  /** Pokémon ids in the order they were displayed */
  order: number[];
  /** Path (with query string) to return to */
  backTo: string;
  /** Human label for the origin view, e.g. "List" */
  backLabel: string;
}

export function isDetailLocationState(value: unknown): value is DetailLocationState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<DetailLocationState>;
  return (
    Array.isArray(v.order) &&
    v.order.every((n) => typeof n === 'number') &&
    typeof v.backTo === 'string' &&
    typeof v.backLabel === 'string'
  );
}
