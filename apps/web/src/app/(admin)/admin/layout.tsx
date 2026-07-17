import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/features/auth/sign-out-button";

import styles from "./staff.module.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          雅思提分系统
        </Link>
        <nav aria-label="教研后台导航">
          <Link href="/admin/annotations">批改队列</Link>
          <Link href="/admin">后台总览</Link>
        </nav>
        <SignOutButton />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
