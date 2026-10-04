import type { ReactNode } from 'react';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  title: string;
  children?: ReactNode;
  tone?: 'neutral' | 'error';
}

export function StatusMessage({ title, children, tone = 'neutral' }: StatusMessageProps) {
  return (
    <section
      className={`${styles.box} ${tone === 'error' ? styles.error : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>
  );
}
