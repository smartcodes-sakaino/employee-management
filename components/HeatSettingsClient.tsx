"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Banner, Card, GhostButton, PrimaryButton, TextInput } from "@/components/ui";

const BASES = ["東京", "大阪", "福岡", "静岡"] as const;

function monthLabel(month: string): string {
  const m = Number(month.split("-")[1]);
  return Number.isFinite(m) ? `${m}月` : month;
}

export function HeatSettingsClient({ month }: { month: string }) {
  const [base, setBase] = useState<(typeof BASES)[number]>("東京");
  const [days, setDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualDay, setManualDay] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: "ok" | "danger"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 拠点/対象月変更時の意図的なリセット
    setLoading(true);
    fetch(`/api/admin/heat-settings?base=${encodeURIComponent(base)}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setDays(data.days ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [base, month]);

  async function addDay() {
    const day = parseInt(manualDay, 10);
    if (!day || day < 1 || day > 31) return;
    const res = await fetch("/api/admin/heat-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base, month, day }),
    });
    const data = await res.json();
    if (res.ok) setDays(data.days ?? []);
    setManualDay("");
  }

  async function removeDay(day: number) {
    const res = await fetch("/api/admin/heat-settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base, month, day }),
    });
    const data = await res.json();
    if (res.ok) setDays(data.days ?? []);
  }

  async function importFromWbgt() {
    setImporting(true);
    setImportMessage(null);
    try {
      const res = await fetch("/api/admin/heat-settings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base, month }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportMessage({ type: "danger", text: data.error ?? "取得に失敗しました" });
        return;
      }
      setDays(data.days ?? []);
      const count = (data.imported ?? []).length;
      const excludedCount = (data.excludedNonWorkingDays ?? []).length;
      const excludedNote = excludedCount > 0 ? `(土日祝・会社休日を${excludedCount}件除外)` : "";
      setImportMessage({
        type: "ok",
        text:
          count > 0
            ? `環境省サイトから${count}件の発表日を取得し、対象日に追加しました。${excludedNote}`
            : `環境省サイトを確認しましたが、対象月に追加できるアラート発表はありませんでした。${excludedNote}`,
      });
    } catch {
      setImportMessage({ type: "danger", text: "取得に失敗しました。時間をおいて再度お試しください。" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="HEAT SETTINGS"
        title="熱中症アラート設定"
        subtitle="拠点ごとに熱中症アラートの対象日を設定します。"
      />

      <Card
        title="拠点別の対象日"
        hint="拠点ごとに熱中症アラートの対象日を指定します。ここで指定した日が、申請者の熱中症アラート申請画面で候補日として表示されます。"
      >
        {importMessage && (
          <Banner variant={importMessage.type === "ok" ? "ok" : "danger"}>{importMessage.text}</Banner>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {BASES.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBase(b)}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-bold ${
                  base === b
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-muted)]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <PrimaryButton type="button" onClick={importFromWbgt} disabled={importing}>
            {importing ? "取得中…" : "環境省サイトから取得"}
          </PrimaryButton>
        </div>

        <p className="mb-3 text-[12px] text-[var(--ink-faint)]">
          環境省 熱中症予防情報サイト(
          <a
            href="https://www.wbgt.env.go.jp/alert_record.php"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            発表履歴
          </a>
          )から、選択中の拠点・対象月に実際にアラートが発表された日を自動取得し、対象日に追加します。
        </p>

        <div className="flex min-h-[48px] flex-wrap gap-2 rounded-[6px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-3">
          {loading ? (
            <span className="text-[12.5px] text-[var(--ink-muted)]">読み込み中…</span>
          ) : days.length === 0 ? (
            <span className="text-[12.5px] text-[var(--ink-muted)]">まだ対象日が設定されていません。</span>
          ) : (
            days.map((day) => (
              <div
                key={day}
                className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] py-1 pl-3 pr-1.5 text-[12.5px] tabular-nums"
              >
                <span>
                  {monthLabel(month)}
                  {day}日
                </span>
                <button
                  type="button"
                  onClick={() => removeDay(day)}
                  aria-label="削除"
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[var(--ink-faint)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-ink)]"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <TextInput
            type="number"
            min={1}
            max={31}
            placeholder="日"
            value={manualDay}
            onChange={(e) => setManualDay(e.target.value)}
            className="w-[90px]"
          />
          <GhostButton type="button" onClick={addDay}>
            + 対象日を追加
          </GhostButton>
        </div>
      </Card>
    </>
  );
}
