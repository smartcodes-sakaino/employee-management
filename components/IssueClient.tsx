"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, PrimaryButton, Select } from "@/components/ui";

type Target = "commute" | "trip" | "heat";

const TARGET_LABEL: Record<Target, string> = {
  commute: "通勤交通費",
  trip: "外出交通費",
  heat: "熱中症アラート",
};

function monthOptions(): { value: string; label: string }[] {
  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { value: `${year}-${String(m).padStart(2, "0")}`, label: `${m}月` };
  });
}

function folderName(target: Target, month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${TARGET_LABEL[target]}_${y}年${m}月`;
}

export function IssueClient({ month: initialMonth }: { month: string }) {
  const [month, setMonth] = useState(initialMonth);
  const [targets, setTargets] = useState<Target[]>(["commute", "trip"]);
  const [running, setRunning] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function toggleTarget(t: Target) {
    setTargets((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function handleRun() {
    if (targets.length === 0) return;
    setRunning(true);
    setErrorMessage(null);
    setDisplayedLines([]);
    try {
      const res = await fetch("/api/admin/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets, month }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "起票の実行に失敗しました");
        return;
      }
      const lines: string[] = data.lines ?? [];
      lines.forEach((line, i) => {
        setTimeout(() => {
          setDisplayedLines((prev) => [...prev, line]);
        }, i * 120);
      });
    } catch {
      setErrorMessage("起票の実行に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ISSUE"
        title="起票実行"
        subtitle="共有ドライブに月次フォルダを作成し、個別精算書を一括作成します。"
      />

      <Card title="起票する対象">
        <div className="flex flex-wrap gap-4">
          {(Object.keys(TARGET_LABEL) as Target[]).map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink)]">
              <input type="checkbox" checked={targets.includes(t)} onChange={() => toggleTarget(t)} />
              {TARGET_LABEL[t]}
            </label>
          ))}
        </div>
        <div className="mt-4.5 max-w-[220px]">
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--ink-muted)]">対象月</label>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card title="作成されるフォルダ" hint="選択した対象・月から、共有ドライブ配下のフォルダ名が自動で決まります。">
        {targets.length === 0 ? (
          <span className="text-[12.5px] text-[var(--ink-muted)]">対象を1つ以上選択してください。</span>
        ) : (
          <div className="flex flex-col gap-1.5">
            {targets.map((t) => (
              <code
                key={t}
                className="w-fit rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[12.5px]"
              >
                共有ドライブ / {folderName(t, month)}
              </code>
            ))}
          </div>
        )}
      </Card>

      <Card>
        {errorMessage && (
          <p className="mb-3 rounded-[6px] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--danger-ink)]">
            {errorMessage}
          </p>
        )}
        <PrimaryButton type="button" onClick={handleRun} disabled={running || targets.length === 0}>
          {running ? "実行中…" : "個別精算書を一括作成する"}
        </PrimaryButton>

        {displayedLines.length > 0 && (
          <div className="mt-3.5 max-h-[260px] overflow-y-auto rounded-[6px] bg-[var(--ink)] p-4 text-[12.5px] leading-loose text-[#d9e4e2] tabular-nums">
            {displayedLines.map((line, i) => (
              <div key={i}>&gt; {line}</div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
