"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Chip, Select } from "@/components/ui";

type EmployeeRow = {
  社員番号: string;
  社員コード: string;
  氏名: string;
  メールアドレス: string;
  ロール: string;
  退職日: string;
};

export function EmployeesClient({
  initialEmployees,
  currentEmployeeNo,
}: {
  initialEmployees: EmployeeRow[];
  currentEmployeeNo: string;
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  async function changeRole(employeeNo: string, role: string) {
    const prev = employees;
    setEmployees(employees.map((e) => (e.社員番号 === employeeNo ? { ...e, ロール: role } : e)));
    setSavingId(employeeNo);
    try {
      const res = await fetch(`/api/admin/employees/${employeeNo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmployees(prev);
        showToast(data.error ?? "更新に失敗しました");
        return;
      }
      showToast("権限を更新しました");
    } finally {
      setSavingId(null);
    }
  }

  const active = employees.filter((e) => !e.退職日);
  const retired = employees.filter((e) => e.退職日);

  function renderRow(e: EmployeeRow) {
    const isSelf = e.社員番号 === currentEmployeeNo;
    return (
      <tr key={e.社員番号} className="border-b border-[var(--line)] last:border-none">
        <td className="px-2.5 py-2.5">{e.社員番号}</td>
        <td className="px-2.5 py-2.5">{e.氏名}</td>
        <td className="px-2.5 py-2.5">{e.メールアドレス}</td>
        <td className="px-2.5 py-2.5">
          {e.退職日 ? (
            <Chip variant="neutral">退職済み</Chip>
          ) : isSelf ? (
            <div className="flex items-center gap-2">
              <Chip variant={e.ロール === "admin" ? "info" : "neutral"}>
                {e.ロール === "admin" ? "管理者" : "一般社員"}
              </Chip>
              <span className="text-[11.5px] text-[var(--ink-faint)]">(自分自身は変更不可)</span>
            </div>
          ) : (
            <Select
              value={e.ロール === "admin" ? "admin" : "employee"}
              disabled={savingId === e.社員番号}
              onChange={(ev) => changeRole(e.社員番号, ev.target.value)}
              className="!w-[140px]"
            >
              <option value="employee">一般社員</option>
              <option value="admin">管理者</option>
            </Select>
          )}
        </td>
      </tr>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="EMPLOYEES"
        title="社員・権限管理"
        subtitle="社員マスタの一覧です。各社員の権限(一般社員／管理者)をここで変更できます。"
      />

      <Card
        title="在籍中の社員"
        hint="権限を「管理者」に変更すると、集計ダッシュボードなどの管理メニューにアクセスできるようになります。"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["社員番号", "氏名", "メールアドレス", "権限"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-[var(--line)] px-2.5 pb-2.5 text-left text-[11.5px] font-bold uppercase tracking-[0.03em] text-[var(--ink-faint)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{active.map(renderRow)}</tbody>
          </table>
        </div>
      </Card>

      {retired.length > 0 && (
        <Card title="退職済みの社員" hint="参考表示のみで、権限は変更できません。">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["社員番号", "氏名", "メールアドレス", "権限"].map((h) => (
                    <th
                      key={h}
                      className="border-b border-[var(--line)] px-2.5 pb-2.5 text-left text-[11.5px] font-bold uppercase tracking-[0.03em] text-[var(--ink-faint)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{retired.map(renderRow)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-[6px] bg-[var(--ink)] px-4 py-3 text-[13px] font-semibold text-[var(--bg)] shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
