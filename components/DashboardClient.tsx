"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Chip, GhostButton, IconCopyButton, Modal, PrimaryButton, Textarea } from "@/components/ui";
import type { EmployeeAggregation, EmployeeStatus } from "@/lib/business/aggregation";

function monthLabel(month: string): string {
  const m = Number(month.split("-")[1]);
  return Number.isFinite(m) ? `${m}月` : month;
}

const STATUS_META: Record<EmployeeStatus, { label: string; variant: "ok" | "info" | "warn" | "danger" | "neutral" }> = {
  ok: { label: "正常", variant: "ok" },
  pass: { label: "定期券", variant: "info" },
  holiday: { label: "休日出勤 要確認", variant: "danger" },
  duplicate: { label: "日付重複", variant: "warn" },
  heatMismatch: { label: "熱中症 不整合", variant: "danger" },
  pending: { label: "未提出", variant: "neutral" },
};

function fmt(v: number | null): string {
  return v === null ? "—" : `¥${v.toLocaleString()}`;
}

type Filter = "all" | "attention" | "pending";

const COLUMNS: { key: keyof EmployeeAggregation; label: string; copy: boolean }[] = [
  { key: "no", label: "社員番号", copy: true },
  { key: "name", label: "氏名", copy: true },
  { key: "commute", label: "通勤交通費", copy: true },
  { key: "trip", label: "外出交通費", copy: true },
  { key: "heat", label: "熱中症アラート", copy: true },
  { key: "status", label: "状態", copy: false },
  { key: "specialNote", label: "特記事項", copy: true },
];

export function DashboardClient({
  month,
  initialRows,
}: {
  month: string;
  initialRows: EmployeeAggregation[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<string | null>(null);

  const [noteTarget, setNoteTarget] = useState<EmployeeAggregation | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);

  const total = rows.length;
  const submitted = rows.filter((r) => r.status !== "pending").length;

  const visibleRows = useMemo(() => {
    if (filter === "attention") {
      return rows.filter((r) => r.status === "holiday" || r.status === "duplicate" || r.status === "heatMismatch");
    }
    if (filter === "pending") {
      return rows.filter((r) => r.status === "pending");
    }
    return rows;
  }, [rows, filter]);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  function rawValue(r: EmployeeAggregation, key: keyof EmployeeAggregation): string {
    const v = r[key];
    return v === null || v === undefined ? "" : String(v);
  }

  async function copyColumn(key: keyof EmployeeAggregation, label: string) {
    const text = rows.map((r) => rawValue(r, key)).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast(`「${label}」列を社員${rows.length}名分コピーしました(未提出は空欄)`);
    } catch {
      showToast("コピーに失敗しました");
    }
  }

  function buildExportTSV(): string {
    const header = ["社員番号", "氏名", "通勤交通費", "外出交通費", "熱中症アラート", "特記事項"];
    const body = rows.map((r) => [r.no, r.name, rawValue(r, "commute"), rawValue(r, "trip"), rawValue(r, "heat"), r.specialNote]);
    return [header, ...body].map((r) => r.join("\t")).join("\n");
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(buildExportTSV());
      showToast(`社員リスト(${rows.length}名分)をコピーしました`);
    } catch {
      showToast("コピーに失敗しました");
    }
  }

  function openNoteModal(row: EmployeeAggregation) {
    setNoteTarget(row);
    setNoteDraft(row.specialNote);
  }

  async function saveNote() {
    if (!noteTarget) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/special-notes/${encodeURIComponent(noteTarget.no)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteDraft }),
      });
      if (!res.ok) {
        showToast("特記事項の保存に失敗しました");
        return;
      }
      setRows(rows.map((r) => (r.no === noteTarget.no ? { ...r, specialNote: noteDraft } : r)));
      showToast("特記事項を保存しました");
      setNoteTarget(null);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="DASHBOARD"
        title={`${monthLabel(month)} 集計状況`}
        subtitle="色分けで要確認の申請者が一目で分かります。"
      />

      <Card>
        <p className="mb-3 text-[12.5px] text-[var(--ink-muted)]">
          社員{total}名中 {submitted}名 提出済み({total - submitted}名 未提出)
        </p>
        <p className="mb-4 text-[12.5px] text-[var(--ink-muted)]">
          白=正常、青=定期券、赤=休日出勤 or 熱中症不整合、黄=片道/往復の日付重複。並び順は社員リスト(社員コード順)と一致しています。
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <PrimaryButton type="button" onClick={() => setExportOpen(true)}>
            社員リスト形式でエクスポート
          </PrimaryButton>
          <span className="text-[12.5px] text-[var(--ink-muted)]">
            絞り込みに関わらず、未提出の方も含めた社員全員分(社員コード順)を出力します。
          </span>
        </div>

        <div className="mb-3.5 flex flex-wrap gap-2">
          {(["all", "attention", "pending"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
                filter === f
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]"
                  : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-muted)]"
              }`}
            >
              {f === "all" ? "すべて" : f === "attention" ? "要確認のみ" : "未提出のみ"}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="border-b border-[var(--line)] px-2.5 pb-2.5 text-left text-[11.5px] font-bold uppercase tracking-[0.03em] text-[var(--ink-faint)]"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.copy && (
                        <IconCopyButton
                          title={`この列を社員全員分コピー`}
                          onClick={() => copyColumn(col.key, col.label)}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => {
                const meta = STATUS_META[r.status];
                return (
                  <tr key={r.no} className="border-b border-[var(--line)] last:border-none">
                    <td className="px-2.5 py-2.5">{r.no}</td>
                    <td className="px-2.5 py-2.5">{r.name}</td>
                    <td className="px-2.5 py-2.5 text-right tabular-nums">{fmt(r.commute)}</td>
                    <td className="px-2.5 py-2.5 text-right tabular-nums">{fmt(r.trip)}</td>
                    <td className="px-2.5 py-2.5 text-right tabular-nums">{fmt(r.heat)}</td>
                    <td className="px-2.5 py-2.5">
                      <Chip variant={meta.variant}>{meta.label}</Chip>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Chip variant={r.specialNote ? "info" : "neutral"}>
                          {r.specialNote ? "特記あり" : "なし"}
                        </Chip>
                        <GhostButton type="button" className="!px-2.5 !py-1 text-[12px]" onClick={() => openNoteModal(r)}>
                          編集
                        </GhostButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={Boolean(noteTarget)}
        onClose={() => setNoteTarget(null)}
        title="特記事項の編集"
        hint={noteTarget ? `${noteTarget.name}(${noteTarget.no})` : undefined}
      >
        <Textarea
          className="mb-4 min-h-[110px]"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="例：規定の上限を超過しても特例で承認済み"
        />
        <div className="flex justify-end gap-2.5">
          <GhostButton type="button" onClick={() => setNoteTarget(null)}>
            キャンセル
          </GhostButton>
          <PrimaryButton type="button" onClick={saveNote} disabled={savingNote}>
            {savingNote ? "保存中…" : "保存する"}
          </PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="社員リスト形式でエクスポート"
        hint="タブ区切り(TSV)形式です。承認者が管理するシートにそのまま貼り付けられます。未提出の方は空欄になります。"
        maxWidthClass="max-w-[660px]"
      >
        <Textarea readOnly value={buildExportTSV()} className="mb-4 min-h-[280px] font-mono text-[12px] tabular-nums" />
        <div className="flex flex-wrap justify-end gap-2.5">
          <GhostButton type="button" onClick={() => setExportOpen(false)}>
            閉じる
          </GhostButton>
          <a href={`/api/admin/dashboard/export?month=${month}&format=csv`}>
            <GhostButton type="button">CSVをダウンロード</GhostButton>
          </a>
          <PrimaryButton type="button" onClick={copyExport}>
            クリップボードにコピー
          </PrimaryButton>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-[6px] bg-[var(--ink)] px-4 py-3 text-[13px] font-semibold text-[var(--bg)] shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
