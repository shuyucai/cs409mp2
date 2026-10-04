import type { StatName } from '../types/pokemon';

export function formatId(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

/** "chlorophyll" -> "Chlorophyll", "swift-swim" -> "Swift Swim" */
export function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** PokeAPI height is in decimetres */
export function formatHeight(dm: number): string {
  return `${(dm / 10).toFixed(1)} m`;
}

/** PokeAPI weight is in hectograms */
export function formatWeight(hg: number): string {
  return `${(hg / 10).toFixed(1)} kg`;
}

export const STAT_LABELS: Record<StatName, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};
