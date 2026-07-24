"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Chip, GhostButton, Modal, PrimaryButton, TextInput, Textarea } from "@/components/ui";
import type { EmployeeStatus } from "@/lib/business/aggregation";

export type MailQueueItem = {
  no: string;
  name: string;
  status: EmployeeStatus;
  sent: boolean;
  subject: string;
  body: string;
};

const STATUS_META: Record<string, { label: string; variant: "danger" | "warn" }> = {
  holiday: { label: "休日出勤 要確認", variant: "danger" },
  duplicate: { label: "日付重複", variant: "warn" },
  heatMismatch: { label: "熱中症 不整合", variant: "danger" },
};

export function MailClient({ initialQueue }: { month: string; initialQueue: MailQueueItem[] }) {
  const [queue, setQueue] = useState(initialQueue);
  const [target, setTarget] = useState<MailQueueItem | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  function openModal(item: MailQueueItem) {
    setTarget(item);
    setSubject(item.subject);
    setBody(item.body);
  }

  async function handleSend() {
    if (!target) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/mail-queue/${encodeURIComponent(target.no)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) {
        showToast("送信に失敗しました");
        return;
      }
      setQueue(queue.map((q) => (q.no === target.no ? { ...q, sent: true } : q)));
      setTarget(null);
      showToast("メールを送信しました");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="NOTIFY"
        title="エラーメール送信"
        subtitle="要確認の申請者に、1人ずつ内容を確認して送信します。"
      />

      <Card
        title="要確認の申請者"
        hint="1人ずつ内容を確認してからメールを送信します。文面は定型文をベースに送信前に編集できます。"
      >
        {queue.length === 0 ? (
          <p className="text-[13px] text-[var(--ink-muted)]">現在、要確認の申請者はいません。</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {queue.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <div
                  key={item.no}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] p-4"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2.5">
                      <strong className="text-[14px] text-[var(--ink)]">{item.name}</strong>
                      {meta && <Chip variant={meta.variant}>{meta.label}</Chip>}
                    </div>
                  </div>
                  {item.sent ? (
                    <GhostButton type="button" disabled>
                      送信済み
                    </GhostButton>
                  ) : (
                    <PrimaryButton type="button" onClick={() => openModal(item)}>
                      メール送信
                    </PrimaryButton>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={Boolean(target)} onClose={() => setTarget(null)} title="メール送信内容の確認" hint="送信前に文面を編集できます。">
        <div className="mb-3 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">宛先</label>
          <TextInput readOnly value={target ? `${target.name} 様` : ""} />
        </div>
        <div className="mb-3 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">件名</label>
          <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="mb-4 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">本文</label>
          <Textarea className="min-h-[150px]" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2.5">
          <GhostButton type="button" onClick={() => setTarget(null)}>
            キャンセル
          </GhostButton>
          <PrimaryButton type="button" onClick={handleSend} disabled={sending}>
            {sending ? "送信中…" : "送信する"}
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
