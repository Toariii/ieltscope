import { CircleDashed } from "lucide-react";
import Link from "next/link";

import styles from "./empty-state.module.css";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className={styles.empty}>
      <CircleDashed aria-hidden="true" />
      <strong>{title}</strong>
      <p>{description}</p>
      <Link href={actionHref}>{actionLabel}</Link>
    </div>
  );
}
