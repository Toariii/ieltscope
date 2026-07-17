"use client";

import {
  BarChart3,
  Bell,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Compass,
  CreditCard,
  FilePenLine,
  Headphones,
  House,
  Menu,
  MessageCircle,
  Mic2,
  NotebookTabs,
  Search,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";

import { SignOutButton } from "@/features/auth/sign-out-button";

import styles from "./app-shell.module.css";

const navigation = [
  { label: "首页", href: "/dashboard#dashboard-top", icon: House },
  { label: "今日计划", href: "/dashboard#today-plan", icon: CalendarDays },
  { label: "学习计划", href: "/plan", icon: Target },
  { label: "练习题库", href: "/dashboard#practice", icon: Compass },
  { label: "词汇", href: "/dashboard#skill-goals", icon: BookOpenText },
  { label: "听力", href: "/dashboard#skill-goals", icon: Headphones },
  { label: "阅读", href: "/dashboard#skill-goals", icon: NotebookTabs },
  { label: "写作精批", href: "/writing", icon: FilePenLine },
  { label: "口语精批", href: "/speaking", icon: Mic2 },
  { label: "学习报告", href: "/report", icon: BarChart3 },
  { label: "会员中心", href: "/membership", icon: CreditCard },
];

export function AppShell({
  studentName,
  children,
}: {
  studentName: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    return query ? navigation.filter((item) => item.label.includes(query)).slice(0, 5) : [];
  }, [searchQuery]);

  function goToFirstResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = searchResults[0];
    if (result) {
      window.location.href = result.href;
      setSearchQuery("");
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label={menuOpen ? "关闭学习导航" : "打开学习导航"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <Link className={styles.mobileBrand} href="/dashboard#dashboard-top" aria-label="IELTScope 工作台首页">
          IELTScope
        </Link>

        <form className={styles.search} role="search" onSubmit={goToFirstResult}>
          <Search aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            placeholder="搜索功能或学习内容"
            aria-label="搜索功能或学习内容"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchResults.length > 0 ? (
            <div className={styles.searchResults}>
              {searchResults.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setSearchQuery("")}>
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
        </form>

        <div className={styles.topActions}>
          <div className={styles.actionWrap}>
            <button
              type="button"
              aria-label="查看通知"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setMessagesOpen(false);
                setProfileOpen(false);
              }}
            >
              <Bell aria-hidden="true" />
              <span className={styles.alertDot} />
            </button>
            {notificationsOpen ? (
              <div className={styles.popover} role="status">
                <strong>学习提醒</strong>
                <p>今天还有 2 项计划待完成。</p>
              </div>
            ) : null}
          </div>

          <div className={styles.actionWrap}>
            <button
              type="button"
              aria-label="查看消息"
              aria-expanded={messagesOpen}
              onClick={() => {
                setMessagesOpen((open) => !open);
                setNotificationsOpen(false);
                setProfileOpen(false);
              }}
            >
              <MessageCircle aria-hidden="true" />
            </button>
            {messagesOpen ? (
              <div className={styles.popover} role="status">
                <strong>暂无新消息</strong>
                <p>老师反馈和系统通知会显示在这里。</p>
              </div>
            ) : null}
          </div>

          <div className={styles.actionWrap}>
            <button
              className={styles.profileButton}
              type="button"
              aria-label="打开账号菜单"
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen((open) => !open);
                setNotificationsOpen(false);
                setMessagesOpen(false);
              }}
            >
              <CircleUserRound aria-hidden="true" />
              <ChevronDown aria-hidden="true" />
            </button>
            {profileOpen ? (
              <div className={`${styles.popover} ${styles.profileMenu}`}>
                <strong>{studentName}</strong>
                <a href="/membership">会员与精批额度</a>
                <SignOutButton />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <Link className={styles.brand} href="/dashboard#dashboard-top" aria-label="IELTScope 工作台首页">
          <strong>IELT<span>Scope</span></strong>
          <small>AI 雅思提分系统</small>
        </Link>

        <nav aria-label="学习导航">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                className={index === 0 ? styles.current : ""}
                href={item.href}
                aria-current={index === 0 ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className={styles.sidebarProfile}>
          <CircleUserRound aria-hidden="true" />
          <div>
            <strong>{studentName}</strong>
            <span>学生账号</span>
          </div>
        </div>
      </aside>

      {menuOpen ? (
        <button
          className={styles.scrim}
          type="button"
          aria-label="关闭导航遮罩"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className={styles.main}>{children}</main>
    </div>
  );
}
