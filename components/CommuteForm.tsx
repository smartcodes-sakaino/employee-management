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

type AcceptanceStatus = "before" | "open" | "closed";
type CommuteDate = { day: number; type: "round" | "one" };

function monthLabel(month: string): string {
  const parts = month.split("-");
  const m = Number(parts[1]);
  return Number.isFinite(m) ? `${m}月` : month;
}

export function CommuteForm({
  month,
  status,
  submitted: initialSubmitted,
}: {
  month: string;
  status: AcceptanceStatus;
  submitted: boolean;
}) {
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [usePass, setUsePass] = useState<"yes" | "no">("no");
  const [fareChanged, setFareChanged] = useState(false);
  const [dates, setDates] = useState<CommuteDate[]>([]);
  const [manualDay, setManualDay] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fetchingCalendar, setFetchingCalendar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [transportation, setTransportation] = useState("電車");
  const [destination, setDestination] = useState("南青山オフィス");
  const [purpose, setPurpose] = useState("出社");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [commuterPassFee, setCommuterPassFee] = useState("");
  const [oneWayFee, setOneWayFee] = useState("");
  const [newFee, setNewFee] = useState("");
  const [fareChangeDate, setFareChangeDate] = useState("");
  const [note, setNote] = useState("");

  const isOpen = status === "open";

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
      const newDates: CommuteDate[] = (data.days as number[]).map((day) => ({ day, type: "round" }));
      setDates(newDates);
      setInfoMessage("カレンダーの勤務場所から候補日を取得しました");
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
    try {
      const res = await fetch("/api/commute-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transportation,
          destination,
          purpose,
          departure,
          arrival,
          useCommuterPass: usePass === "yes",
          commuterPassFee: commuterPassFee ? Number(commuterPassFee) : undefined,
          oneWayFee: oneWayFee ? Number(oneWayFee) : undefined,
          fareChanged,
          newFee: newFee ? Number(newFee) : undefined,
          fareChangeDate: fareChangeDate || undefined,
          note,
          dates: usePass === "no" ? dates : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "送信に失敗しました");
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMessage("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <PageHeader eyebrow="COMMUTE" title={`${monthLabel(month)} 通勤交通費申請`} />
        <Card>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ok-bg)] px-2.5 py-1 text-[12px] font-bold text-[var(--ok-ink)]">
              <span className="h-[7px] w-[7px] rounded-full bg-current" />
              申請済み
            </span>
            <h2 className="text-[15px] font-bold text-[var(--ink)]">
              {monthLabel(month)} 通勤交通費申請
            </h2>
          </div>
          <p className="text-[12.5px] text-[var(--ink-muted)]">
            今月分は送信済みのため、再度の申請はできません。内容の修正が必要な場合は管理部にご連絡ください。
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="COMMUTE"
        title={`${monthLabel(month)} 通勤交通費申請`}
        subtitle="定期券の有無に応じて入力項目が切り替わります。対象月は管理者設定に従います。"
      />

      {status !== "open" && (
        <Banner variant={status === "before" ? "warn" : "danger"}>
          {status === "before"
            ? "現在は受付前です。管理者が受付を開始するまで送信できません(下書き保存は可能です)。"
            : "受付は締め切りました。修正が必要な場合は管理部にご連絡ください。"}
        </Banner>
      )}
      {errorMessage && <Banner variant="danger">{errorMessage}</Banner>}
      {infoMessage && <Banner variant="info">{infoMessage}</Banner>}

      <Card title="基本情報" hint="対象月は管理者が設定した現在の受付月が自動的に適用されます。">
        <FieldRow>
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
          <Field label="用件">
            <TextInput value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </Field>
          <Field label="出発地">
            <TextInput
              placeholder="例：戸田"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
            />
          </Field>
          <Field label="到着地">
            <TextInput
              placeholder="例：渋谷"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
            />
          </Field>
        </FieldRow>
      </Card>

      <Card title="定期券の利用" hint="定期券を利用していますか？回答によって以降の入力項目が変わります。">
        <div className="flex flex-wrap gap-4 pt-1">
          <RadioLabel>
            <input
              type="radio"
              checked={usePass === "yes"}
              onChange={() => setUsePass("yes")}
            />
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

            <p className="mb-1 text-[12.5px] font-semibold text-[var(--ink-muted)]">
              出勤日(カレンダー連携)
            </p>
            <p className="mb-2 text-[12.5px] text-[var(--ink-muted)]">
              Googleカレンダーの「勤務場所」がオフィスになっている日を候補として取得できます。取得後も追加・削除・往復/片道の切替が可能です。
            </p>
            <GhostButton type="button" onClick={handleFetchCalendar} disabled={fetchingCalendar}>
              {fetchingCalendar ? "取得中…" : "カレンダーから出勤日を取得"}
            </GhostButton>

            <div className="mt-3 flex min-h-[48px] flex-wrap gap-2 rounded-[6px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-3">
              {dates.length === 0 ? (
                <span className="text-[12.5px] text-[var(--ink-muted)]">
                  まだ日付がありません。上のボタンから取得するか、手動で追加してください。
                </span>
              ) : (
                dates.map((d) => (
                  <div
                    key={d.day}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] py-1 pl-3 pr-1.5 text-[12.5px]"
                  >
                    <span>
                      {monthLabel(month)}
                      {d.day}日
                    </span>
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
              <span className="text-[12.5px] text-[var(--ink-muted)]">
                追加時は「往復」として登録されます。チップ内のボタンで片道に切替できます。
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card title="運賃改定">
        <div className="flex gap-4 pt-1">
          <RadioLabel>
            <input type="radio" checked={fareChanged} onChange={() => setFareChanged(true)} /> はい
          </RadioLabel>
          <RadioLabel>
            <input type="radio" checked={!fareChanged} onChange={() => setFareChanged(false)} /> いいえ
          </RadioLabel>
        </div>
        {fareChanged && (
          <div className="mt-4">
            <FieldRow>
              <Field label="変更後の利用料金">
                <TextInput type="number" value={newFee} onChange={(e) => setNewFee(e.target.value)} />
              </Field>
              <Field label="運賃が変化した日付">
                <TextInput
                  type="date"
                  value={fareChangeDate}
                  onChange={(e) => setFareChangeDate(e.target.value)}
                />
              </Field>
            </FieldRow>
          </div>
        )}
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
