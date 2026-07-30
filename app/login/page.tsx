"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="w-full max-w-sm rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-sm">
        <h1 className="mb-2 text-lg font-bold text-[var(--ink)]">交通費精算</h1>
        <p className="mb-6 text-sm text-[var(--ink-muted)]">
          tcdigital.jpのGoogleアカウントでログインしてください。
        </p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/commute" })}
          className="w-full rounded-[6px] bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-ink)] transition hover:brightness-105"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  );
}
