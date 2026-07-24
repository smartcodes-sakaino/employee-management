"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Chip, GhostButton, Modal, PrimaryButton, Select, TextInput, Textarea } from "@/components/ui";
import type { Rule } from "@/lib/business/rules";

const BASES = ["東京", "大阪", "福岡", "静岡"];
const RULE_TYPES = ["拠点別", "期間限定", "単価", "その他"];

function monthOptions(): string[] {
  return Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
}

export function RulesClient({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState(RULE_TYPES[0]);
  const [targetBases, setTargetBases] = useState<string[]>(["東京"]);
  const [periodFrom, setPeriodFrom] = useState("6月");
  const [periodTo, setPeriodTo] = useState("9月");
  const [note, setNote] = useState("");

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  function toggleBase(base: string) {
    setTargetBases((prev) => (prev.includes(base) ? prev.filter((b) => b !== base) : [...prev, base]));
  }

  async function toggleActive(rule: Rule) {
    const nextActive = !rule.active;
    setRules(rules.map((r) => (r.id === rule.id ? { ...r, active: nextActive } : r)));
    await fetch(`/api/admin/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive }),
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, targetBases, periodFrom, periodTo, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "追加に失敗しました");
        return;
      }
      setRules([...rules, data.rule]);
      setModalOpen(false);
      setName("");
      setNote("");
      showToast("ルールを追加しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="RULES"
        title="ルール管理"
        subtitle="拠点・期間ごとの特別ルールをコード修正なしで管理します。"
      />

      <Card
        title="特別ルールの管理"
        hint="拠点・期間ごとの特殊な集計ルールをここで管理します。コード修正なしに追加・無効化できます。"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["ルール名", "種別", "対象", "期間", "状態", ""].map((h) => (
                  <th
                    key={h}
                    className="border-b border-[var(--line)] px-2.5 pb-2.5 text-left text-[11.5px] font-bold uppercase tracking-[0.03em] text-[var(--ink-faint)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-[var(--line)] last:border-none">
                  <td className="px-2.5 py-2.5">{r.name}</td>
                  <td className="px-2.5 py-2.5">{r.type}</td>
                  <td className="px-2.5 py-2.5">{r.targetBases.join("・") || "未指定"}</td>
                  <td className="px-2.5 py-2.5">
                    {r.periodFrom}〜{r.periodTo}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <Chip variant={r.active ? "ok" : "neutral"}>{r.active ? "有効" : "無効"}</Chip>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <GhostButton type="button" className="!px-2.5 !py-1 text-[12px]" onClick={() => toggleActive(r)}>
                      {r.active ? "無効化" : "有効化"}
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <PrimaryButton type="button" onClick={() => setModalOpen(true)}>
            + 新しいルールを追加
          </PrimaryButton>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新しいルールを追加"
        hint="拠点や期間ごとの特別な集計ルールを登録します。"
      >
        <div className="mb-3 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">ルール名</label>
          <TextInput
            placeholder="例：熱中症アラート対象(8月用)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-3 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">種別</label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {RULE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div className="mb-3 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">対象拠点</label>
          <div className="flex flex-wrap gap-3.5 pt-1">
            {BASES.map((b) => (
              <label key={b} className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink)]">
                <input type="checkbox" checked={targetBases.includes(b)} onChange={() => toggleBase(b)} />
                {b}
              </label>
            ))}
          </div>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">開始月</label>
            <Select value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)}>
              {monthOptions().map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">終了月</label>
            <Select value={periodTo} onChange={(e) => setPeriodTo(e.target.value)}>
              {monthOptions().map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mb-2 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">内容・備考</label>
          <Textarea
            placeholder="例：対象月のみ拠点別の熱中症アラート交通費申請フォームを有効化する"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2.5">
          <GhostButton type="button" onClick={() => setModalOpen(false)}>
            キャンセル
          </GhostButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={saving || !name}>
            {saving ? "保存中…" : "保存する"}
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
