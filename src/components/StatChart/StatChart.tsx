import type { Stat } from '../../types/pokemon';
import { STAT_LABELS } from '../../utils/format';
import styles from './StatChart.module.css';

/** Highest possible base stat; bars are scaled against it. */
const MAX_STAT = 255;

function tierClass(value: number): string {
  if (value < 50) return styles.low;
  if (value < 80) return styles.mid;
  if (value < 110) return styles.good;
  return styles.high;
}

interface StatChartProps {
  stats: Stat[];
  total: number;
}

export function StatChart({ stats, total }: StatChartProps) {
  return (
    <dl className={styles.chart}>
      {stats.map((stat) => (
        <div key={stat.name} className={styles.row}>
          <dt className={styles.label}>{STAT_LABELS[stat.name] ?? stat.name}</dt>
          <dd className={styles.value}>{stat.value}</dd>
          <dd className={styles.barCell}>
            {/* SVG attributes (not inline styles) size each bar */}
            <svg
              className={styles.track}
              viewBox={`0 0 ${MAX_STAT} 10`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${STAT_LABELS[stat.name]} ${stat.value} of ${MAX_STAT}`}
            >
              <rect
                className={tierClass(stat.value)}
                x="0"
                y="0"
                width={stat.value}
                height="10"
              />
            </svg>
          </dd>
        </div>
      ))}
      <div className={`${styles.row} ${styles.totalRow}`}>
        <dt className={styles.label}>Total</dt>
        <dd className={styles.value}>{total}</dd>
        <dd className={styles.barCell} />
      </div>
    </dl>
  );
}
