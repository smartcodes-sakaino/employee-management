"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Banner, Card, GhostButton, PrimaryButton, RadioLabel, Select, TextInput, Textarea } from "@/components/ui";

type AcceptanceStatus = "before" | "open" | "closed";

type TripRow = {
  id: number;
  date: string;
  destination: string;
  purpose: string;
  transportation: string;
  departure: string;
  arrival: string;
  tripType: "one" | "round";
  fee: string;
  isHeatstrokeTransfer: "yes" | "no";
};

let rowSeq = 1;
function emptyRow(): TripRow {
  return {
    id: rowSeq++,
    date: "",
    destination: "",
    purpose: "",
    transportation: "電車",
    departure: "",
    arrival: "",
    tripType: "one",
    fee: "",
    isHeatstrokeTransfer: "no",
  };
}

export function TripForm({ month, status }: { month: string; status: AcceptanceStatus }) {
  const [rows, setRows] = useState<TripRow[]>([emptyRow()]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  const isOpen = status === "open";

  function updateRow(id: number, patch: Partial<TripRow>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows([...rows, emptyRow()]);
  }

  function removeRow(id: number) {
    setRows(rows.filter((r) => r.id !== id));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(false);
    try {
      const res = await fetch("/api/trip-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: rows.map((r) => ({
            date: r.date,
            destination: r.destination,
            purpose: r.purpose,
            transportation: r.transportation,
            departure: r.departure,
            arrival: r.arrival,
            tripType: r.tripType,
            fee: r.fee ? Number(r.fee) : 0,
            isHeatstrokeTransfer: r.isHeatstrokeTransfer === "yes",
          })),
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "送信に失敗しました");
        return;
      }
      setSuccessMessage(true);
      setRows([emptyRow()]);
      setNote("");
    } catch {
      setErrorMessage("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="BUSINESS TRIP"
        title="外出交通費申請"
        subtitle="複数件まとめて登録できます。バス選択時は熱中症アラートの確認が出ます。"
      />

      {status !== "open" && (
        <Banner variant={status === "before" ? "warn" : "danger"}>
          {status === "before"
            ? "現在は受付前です。管理者が受付を開始するまで送信できません。"
            : "受付は締め切りました。修正が必要な場合は管理部にご連絡ください。"}
        </Banner>
      )}
      {errorMessage && <Banner variant="danger">{errorMessage}</Banner>}
      {successMessage && <Banner variant="ok">送信しました({month}分として登録されました)</Banner>}

      <Card
        title="外出の明細"
        hint="1回の申請で複数件まとめて登録できます。交通機関で「バス」を選ぶと、熱中症アラート利用有無の確認が表示されます(会社規定によりバスは熱中症アラート時のみ利用可のため)。"
      >
        <div className="flex flex-col gap-3">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] p-4"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[12px] font-bold text-[var(--ink-faint)]">明細 {idx + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="rounded-[6px] border border-[var(--danger-bg)] px-2.5 py-1 text-[12.5px] font-bold text-[var(--danger-dot)] hover:bg-[var(--danger-bg)]"
                  >
                    この行を削除
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">日付</label>
                  <TextInput
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(row.id, { date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">行先</label>
                  <TextInput
                    placeholder="例：秋葉原"
                    value={row.destination}
                    onChange={(e) => updateRow(row.id, { destination: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">用件</label>
                  <TextInput
                    placeholder="例：来客対応"
                    value={row.purpose}
                    onChange={(e) => updateRow(row.id, { purpose: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">交通機関</label>
                  <Select
                    value={row.transportation}
                    onChange={(e) => updateRow(row.id, { transportation: e.target.value })}
                  >
                    <option value="電車">電車</option>
                    <option value="バス">バス</option>
                    <option value="タクシー">タクシー</option>
                    <option value="その他">その他</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">出発地</label>
                  <TextInput
                    placeholder="例：渋谷"
                    value={row.departure}
                    onChange={(e) => updateRow(row.id, { departure: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">到着地</label>
                  <TextInput
                    placeholder="例：秋葉原"
                    value={row.arrival}
                    onChange={(e) => updateRow(row.id, { arrival: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">片道/往復</label>
                  <Select
                    value={row.tripType}
                    onChange={(e) => updateRow(row.id, { tripType: e.target.value as "one" | "round" })}
                  >
                    <option value="one">片</option>
                    <option value="round">往</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">利用料金</label>
                  <TextInput
                    type="number"
                    placeholder="例：420"
                    value={row.fee}
                    onChange={(e) => updateRow(row.id, { fee: e.target.value })}
                  />
                </div>
              </div>

              {row.transportation === "バス" && (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 rounded-[6px] bg-[var(--info-bg)] px-3 py-2.5 text-[12.5px] text-[var(--info-ink)]">
                  <span>
                    会社規定によりバスは熱中症アラート時のみ利用可能です。今回の利用は熱中症アラートに該当しますか？該当する場合、この明細は外出交通費ではなく熱中症アラートとして集計されます。
                  </span>
                  <div className="flex gap-4">
                    <RadioLabel>
                      <input
                        type="radio"
                        checked={row.isHeatstrokeTransfer === "yes"}
                        onChange={() => updateRow(row.id, { isHeatstrokeTransfer: "yes" })}
                      />
                      該当する
                    </RadioLabel>
                    <RadioLabel>
                      <input
                        type="radio"
                        checked={row.isHeatstrokeTransfer === "no"}
                        onChange={() => updateRow(row.id, { isHeatstrokeTransfer: "no" })}
                      />
                      該当しない
                    </RadioLabel>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <GhostButton type="button" onClick={addRow}>
            + 行を追加
          </GhostButton>
        </div>
      </Card>

      <Card title="備考欄">
        <Textarea
          placeholder="申請内容について補足があれば入力してください"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <GhostButton type="button">下書き保存</GhostButton>
        <PrimaryButton type="button" onClick={handleSubmit} disabled={!isOpen || submitting}>
          {submitting ? "送信中…" : "この内容で申請する"}
        </PrimaryButton>
      </div>
    </>
  );
}
