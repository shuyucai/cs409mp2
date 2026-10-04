import colors from './typeColors.module.css';

/** Class name that sets `--type-color` for the given type. */
export function typeColorClass(type: string): string {
  return colors[type] ?? colors.unknown;
}
