"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Banner, Card, Field, FieldRow, GhostButton, PrimaryButton, Select, TextInput, Textarea } from "@/components/ui";

type AcceptanceStatus = "before" | "open" | "closed";
const BASES = ["東京", "大阪", "福岡", "静岡"] as const;

function monthLabel(month: string): string {
  const m = Number(month.split("-")[1]);
  return Number.isFinite(m) ? `${m}月` : month;
}

export function HeatForm({ month, status }: { month: string; status: AcceptanceStatus }) {
  const [base, setBase] = useState<(typeof BASES)[number]>("東京");
  const [homeToStationRoute, setHomeToStationRoute] = useState("");
  const [homeToStationFee, setHomeToStationFee] = useState("");
  const [stationToOfficeRoute, setStationToOfficeRoute] = useState("");
  const [stationToOfficeFee, setStationToOfficeFee] = useState("");
  const [note, setNote] = useState("");

  const [candidateDays, setCandidateDays] = useState<number[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  const isOpen = status === "open";

  useEffect(() => {
    let cancelled = false;
    // 拠点/対象月が変わるたびに選択状態をリセットし、その組み合わせの候補日を取得し直す。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 依存変更時の意図的なリセット
    setLoadingCandidates(true);
    setSelectedDays([]);
    fetch(`/api/heatstroke/target-dates?base=${encodeURIComponent(base)}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCandidateDays(data.days ?? []);
      })
      .catch(() => {
        if (!cancelled) setCandidateDays([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCandidates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [base, month]);

  function toggleDay(day: number) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(false);
    try {
      const res = await fetch("/api/heatstroke-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base,
          homeToStationRoute,
          homeToStationFee: homeToStationFee ? Number(homeToStationFee) : undefined,
          stationToOfficeRoute,
          stationToOfficeFee: stationToOfficeFee ? Number(stationToOfficeFee) : undefined,
          note,
          days: selectedDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "送信に失敗しました");
        return;
      }
      setSuccessMessage(true);
      setSelectedDays([]);
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
        eyebrow="HEAT ALERT"
        title={`${monthLabel(month)} 熱中症アラート申請`}
        subtitle="管理者が指定した対象日から利用日を選択します。"
      />

      {status !== "open" && (
        <Banner variant={status === "before" ? "warn" : "danger"}>
          {status === "before"
            ? "現在は受付前です。管理者が受付を開始するまで送信できません。"
            : "受付は締め切りました。修正が必要な場合は管理部にご連絡ください。"}
        </Banner>
      )}
      {errorMessage && <Banner variant="danger">{errorMessage}</Banner>}
      {successMessage && <Banner variant="ok">熱中症アラート時の交通費申請を送信しました</Banner>}

      <Card title="拠点・経路">
        <FieldRow>
          <Field label="拠点">
            <Select value={base} onChange={(e) => setBase(e.target.value as (typeof BASES)[number])}>
              {BASES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
          <div />
          <Field label="自宅から最寄り駅までの経路">
            <TextInput
              placeholder="例：家〜戸田駅"
              value={homeToStationRoute}
              onChange={(e) => setHomeToStationRoute(e.target.value)}
            />
          </Field>
          <Field label="自宅から最寄り駅までの料金">
            <TextInput
              type="number"
              placeholder="例：300"
              value={homeToStationFee}
              onChange={(e) => setHomeToStationFee(e.target.value)}
            />
          </Field>
          <Field label="オフィス最寄り駅からオフィスまでの経路">
            <TextInput
              placeholder="例：渋谷駅〜青山学院中等部前"
              value={stationToOfficeRoute}
              onChange={(e) => setStationToOfficeRoute(e.target.value)}
            />
          </Field>
          <Field label="オフィス最寄り駅からオフィスまでの料金">
            <TextInput
              type="number"
              placeholder="例：210"
              value={stationToOfficeFee}
              onChange={(e) => setStationToOfficeFee(e.target.value)}
            />
          </Field>
        </FieldRow>
      </Card>

      <Card
        title="熱中症アラート利用日"
        hint="管理者が拠点ごとに設定した対象日から、該当する日を選択してください。通勤交通費の出勤日と突き合わせて確認されます。"
      >
        <div className="flex min-h-[48px] flex-wrap gap-2 rounded-[6px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-3">
          {loadingCandidates ? (
            <span className="text-[12.5px] text-[var(--ink-muted)]">読み込み中…</span>
          ) : candidateDays.length === 0 ? (
            <span className="text-[12.5px] text-[var(--ink-muted)]">
              現在、{base}は管理者から対象日が設定されていません。
            </span>
          ) : (
            candidateDays.map((day) => {
              const selected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-ink)]"
                      : "border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--ink-muted)]"
                  }`}
                >
                  {monthLabel(month)}
                  {day}日
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card title="備考欄">
        <Textarea placeholder="例：熱中症警戒アラート" value={note} onChange={(e) => setNote(e.target.value)} />
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
