"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Banner,
  Card,
  Field,
  FieldRow,
  GhostButton,
  PrimaryButton,
  RadioLabel,
  Select,
  Textarea,
  TextInput,
} from "@/components/ui";

type CommuteDate = { day: number; type: "round" | "one" };

function monthOptions(): { value: string; label: string }[] {
  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { value: `${year}-${String(m).padStart(2, "0")}`, label: `${m}月` };
  });
}

export function IrregularForm() {
  const options = monthOptions();
  const defaultMonth = options[Math.max(0, new Date().getMonth() - 1)].value;

  const [month, setMonth] = useState(defaultMonth);
  const [transportation, setTransportation] = useState("電車");
  const [destination, setDestination] = useState("南青山オフィス");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [usePass, setUsePass] = useState<"yes" | "no">("no");
  const [commuterPassFee, setCommuterPassFee] = useState("");
  const [oneWayFee, setOneWayFee] = useState("");
  const [dates, setDates] = useState<CommuteDate[]>([]);
  const [manualDay, setManualDay] = useState("");
  const [note, setNote] = useState("");

  const [fetchingCalendar, setFetchingCalendar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  async function handleFetchCalendar() {
    setFetchingCalendar(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/commute-applications/calendar-suggestions?month=${month}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "カレンダー情報の取得に失敗しました");
        return;
      }
      setDates((data.days as number[]).map((day) => ({ day, type: "round" as const })));
    } catch {
      setErrorMessage("カレンダー情報の取得に失敗しました");
    } finally {
      setFetchingCalendar(false);
    }
  }

  function addManualDay() {
    const day = parseInt(manualDay, 10);
    if (!day || day < 1 || day > 31) return;
    if (!dates.some((d) => d.day === day)) {
      const next: CommuteDate = { day, type: "round" };
      setDates([...dates, next].sort((a, b) => a.day - b.day));
    }
    setManualDay("");
  }

  function toggleDateType(day: number) {
    setDates(dates.map((d) => (d.day === day ? { ...d, type: d.type === "round" ? "one" : "round" } : d)));
  }

  function removeDate(day: number) {
    setDates(dates.filter((d) => d.day !== day));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(false);
    try {
      const res = await fetch("/api/commute-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isIrregular: true,
          month,
          transportation,
          destination,
          departure,
          arrival,
          useCommuterPass: usePass === "yes",
          commuterPassFee: commuterPassFee ? Number(commuterPassFee) : undefined,
          oneWayFee: oneWayFee ? Number(oneWayFee) : undefined,
          note,
          dates: usePass === "no" ? dates : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "送信に失敗しました");
        return;
      }
      setSuccessMessage(true);
      setDates([]);
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
        eyebrow="IRREGULAR"
        title="イレギュラー申請"
        subtitle="受付期間外や前月分など、例外的な申請はこちらから行います。"
      />

      {errorMessage && <Banner variant="danger">{errorMessage}</Banner>}
      {successMessage && <Banner variant="ok">イレギュラー申請を送信しました(管理部が個別に確認します)</Banner>}

      <Card
        title="他の月の申請"
        hint="集計が既に締め切られた前月分など、通常の受付期間外の通勤交通費を申請する場合に使用してください。通常の申請と異なり受付状態に関わらず送信できますが、管理部が内容を個別に確認します。"
      >
        <FieldRow>
          <Field label="対象月">
            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="通勤手段">
            <Select value={transportation} onChange={(e) => setTransportation(e.target.value)}>
              <option>電車</option>
              <option>バス</option>
              <option>車</option>
              <option>自転車</option>
            </Select>
          </Field>
          <Field label="行先">
            <Select value={destination} onChange={(e) => setDestination(e.target.value)}>
              <option>南青山オフィス</option>
              <option>大阪オフィス</option>
              <option>福岡オフィス</option>
              <option>静岡オフィス</option>
            </Select>
          </Field>
          <Field label="出発地">
            <TextInput placeholder="例：戸田" value={departure} onChange={(e) => setDeparture(e.target.value)} />
          </Field>
          <Field label="到着地">
            <TextInput placeholder="例：渋谷" value={arrival} onChange={(e) => setArrival(e.target.value)} />
          </Field>
        </FieldRow>
      </Card>

      <Card title="定期券の利用">
        <div className="flex gap-4 pt-1">
          <RadioLabel>
            <input type="radio" checked={usePass === "yes"} onChange={() => setUsePass("yes")} />
            はい(定期券を利用している)
          </RadioLabel>
          <RadioLabel>
            <input type="radio" checked={usePass === "no"} onChange={() => setUsePass("no")} />
            いいえ(都度の実費)
          </RadioLabel>
        </div>

        {usePass === "yes" ? (
          <div className="mt-4">
            <FieldRow>
              <Field label="定期代(利用料金)" span2>
                <TextInput
                  type="number"
                  placeholder="例：20000"
                  value={commuterPassFee}
                  onChange={(e) => setCommuterPassFee(e.target.value)}
                />
              </Field>
            </FieldRow>
          </div>
        ) : (
          <div className="mt-4.5">
            <FieldRow>
              <Field label="片道の利用料金" span2>
                <TextInput
                  type="number"
                  placeholder="例：210"
                  value={oneWayFee}
                  onChange={(e) => setOneWayFee(e.target.value)}
                />
              </Field>
            </FieldRow>

            <GhostButton type="button" onClick={handleFetchCalendar} disabled={fetchingCalendar}>
              {fetchingCalendar ? "取得中…" : "対象月のカレンダーから出勤日を取得"}
            </GhostButton>

            <div className="mt-3 flex min-h-[48px] flex-wrap gap-2 rounded-[6px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-3">
              {dates.length === 0 ? (
                <span className="text-[12.5px] text-[var(--ink-muted)]">まだ日付がありません。</span>
              ) : (
                dates.map((d) => (
                  <div
                    key={d.day}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] py-1 pl-3 pr-1.5 text-[12.5px]"
                  >
                    <span>{d.day}日</span>
                    <button
                      type="button"
                      onClick={() => toggleDateType(d.day)}
                      className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent-soft-ink)]"
                    >
                      {d.type === "round" ? "往復" : "片道"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDate(d.day)}
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
              <GhostButton type="button" onClick={addManualDay}>
                + 日付を追加
              </GhostButton>
            </div>
          </div>
        )}
      </Card>

      <Card title="備考欄">
        <Textarea
          placeholder="申請が遅れた理由などを記入してください"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <PrimaryButton type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "送信中…" : "イレギュラー申請を送信する"}
        </PrimaryButton>
      </div>
    </>
  );
}
