"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Select } from "@/components/ui";
import type { AcceptanceStatus, ApplicationType } from "@/lib/business/acceptance";

const STATES: { value: AcceptanceStatus; label: string }[] = [
  { value: "before", label: "受付前" },
  { value: "open", label: "受付中" },
  { value: "closed", label: "締切" },
];

const TYPE_LABEL: Record<ApplicationType, string> = {
  commute: "通勤交通費申請",
  trip: "外出交通費申請",
  heat: "熱中症アラート申請",
};

function monthOptions(): { value: string; label: string }[] {
  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { value: `${year}-${String(m).padStart(2, "0")}`, label: `${m}月` };
  });
}

export function AcceptanceClient({
  month: initialMonth,
  commute: initialCommute,
  trip: initialTrip,
  heat: initialHeat,
}: {
  month: string;
  commute: AcceptanceStatus;
  trip: AcceptanceStatus;
  heat: AcceptanceStatus;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [statuses, setStatuses] = useState<Record<ApplicationType, AcceptanceStatus>>({
    commute: initialCommute,
    trip: initialTrip,
    heat: initialHeat,
  });
  const [toast, setToast] = useState<string | null>(null);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  async function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    await fetch("/api/admin/acceptance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: newMonth }),
    });
    showToast(`対象月を${newMonth}に変更しました`);
  }

  async function handleStatusChange(type: ApplicationType, status: AcceptanceStatus) {
    setStatuses((prev) => ({ ...prev, [type]: status }));
    await fetch("/api/admin/acceptance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [type]: status }),
    });
    showToast(`${TYPE_LABEL[type]}の受付状態を変更しました`);
  }

  return (
    <>
      <PageHeader eyebrow="ACCEPTANCE" title="受付管理" subtitle="対象月と各申請の受付状態を管理します。" />

      <Card
        title="対象月"
        hint="申請者の画面タイトルや集計ダッシュボードに表示される「現在の受付月」です。"
      >
        <div className="max-w-[220px]">
          <Select value={month} onChange={(e) => handleMonthChange(e.target.value)}>
            {monthOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card
        title="受付状態"
        hint="受付前は下書き保存のみ可能で送信は無効化されます。締切後は申請そのものを受け付けません。"
      >
        <div className="flex flex-col">
          {(Object.keys(TYPE_LABEL) as ApplicationType[]).map((type, idx) => (
            <div
              key={type}
              className={`flex flex-wrap items-center justify-between gap-4 py-3.5 ${
                idx > 0 ? "border-t border-[var(--line)]" : ""
              }`}
            >
              <strong className="text-[13.5px] text-[var(--ink)]">{TYPE_LABEL[type]}</strong>
              <div className="flex gap-1">
                {STATES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleStatusChange(type, s.value)}
                    className={`rounded-full border px-3.5 py-1.5 text-[12px] font-bold ${
                      statuses[type] === s.value
                        ? s.value === "before"
                          ? "border-[var(--warn-bg)] bg-[var(--warn-bg)] text-[var(--warn-ink)]"
                          : s.value === "open"
                            ? "border-[var(--ok-bg)] bg-[var(--ok-bg)] text-[var(--ok-ink)]"
                            : "border-[var(--danger-bg)] bg-[var(--danger-bg)] text-[var(--danger-ink)]"
                        : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-muted)]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-[6px] bg-[var(--ink)] px-4 py-3 text-[13px] font-semibold text-[var(--bg)] shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
