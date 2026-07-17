import styles from "./status-pill.module.css";

export type StatusTone = "complete" | "current" | "upcoming" | "warning";

export function StatusPill({ children, tone }: { children: string; tone: StatusTone }) {
  return <span className={`${styles.pill} ${styles[tone]}`}>{children}</span>;
}
