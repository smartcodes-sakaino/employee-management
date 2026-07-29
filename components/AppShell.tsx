"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  divider?: boolean;
  external?: boolean;
};

const EMPLOYEE_NAV: NavItem[] = [
  { href: "/commute", label: "通勤交通費申請" },
  { href: "/trip", label: "外出交通費申請" },
  { href: "/heat", label: "熱中症アラート申請" },
  { href: "/irregular", label: "イレギュラー申請", divider: true },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "集計ダッシュボード" },
  { href: "/mail", label: "エラーメール送信" },
  { href: "/heat-settings", label: "熱中症アラート設定" },
  { href: "/acceptance", label: "受付管理" },
  { href: "/rules", label: "ルール管理" },
  { href: "/issue", label: "起票実行" },
  { href: "/employees", label: "社員・権限管理" },
];

export function AppShell({
  role,
  userName,
  userEmail,
  dbSheetUrl,
  children,
}: {
  role: "employee" | "admin";
  userName: string;
  userEmail: string;
  dbSheetUrl?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // 管理者も1人の社員として自分の交通費を申請するため、adminの場合は
  // 「申請メニュー」と「管理メニュー」の両方を表示する(社員は申請メニューのみ)。
  const adminNav = dbSheetUrl
    ? [...ADMIN_NAV, { href: dbSheetUrl, label: "DBスプレッドシートを開く", external: true, divider: true }]
    : ADMIN_NAV;
  const groups = role === "admin"
    ? [
        { label: "申請メニュー", items: EMPLOYEE_NAV },
        { label: "管理メニュー", items: adminNav },
      ]
    : [{ label: "申請メニュー", items: EMPLOYEE_NAV }];
  const initial = userName ? userName.slice(0, 1) : "?";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[250px] flex-none flex-col gap-[18px] overflow-y-auto border-r border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-col gap-0.5 px-1">
          <span className="text-[15px] font-bold text-[var(--ink)]">交通費精算</span>
          <span className="pl-0 text-[11px] uppercase tracking-[0.06em] text-[var(--ink-faint)]">
            Expense Portal
          </span>
        </div>

        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-1 px-2 text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {group.label}
            </div>
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <div key={item.href}>
                  {item.divider && <div className="my-2 mx-1 h-px bg-[var(--line)]" />}
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[6px] px-2.5 py-2 text-[13.5px] text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                    >
                      {item.label} ↗
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={`block rounded-[6px] px-2.5 py-2 text-[13.5px] ${
                        pathname?.startsWith(item.href)
                          ? "bg-[var(--accent-soft)] font-bold text-[var(--accent-soft-ink)]"
                          : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        ))}

        <div className="mt-auto border-t border-[var(--line)] pt-3">
          <div className="flex items-center gap-2 rounded-[6px] p-2">
            <div className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-ink)]">
              {initial}
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <strong className="truncate text-[12.5px] text-[var(--ink)]">{userName}</strong>
              <span className="truncate text-[10.5px] text-[var(--ink-faint)]">{userEmail}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 w-full rounded-[6px] px-2.5 py-1.5 text-left text-[12px] text-[var(--ink-muted)] hover:bg-[var(--surface-2)]"
          >
            ログアウト
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="max-w-[1000px] px-9 py-6">{children}</div>
      </main>
    </div>
  );
}
