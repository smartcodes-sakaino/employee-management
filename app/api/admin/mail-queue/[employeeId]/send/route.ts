import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { appendRow, getRows } from "@/lib/google/sheets";
import { getCurrentMonth } from "@/lib/business/acceptance";
import { getDashboardData } from "@/lib/business/aggregation";

type EmployeeRow = { 社員番号: string; メールアドレス: string };

export async function POST(req: Request, context: { params: Promise<{ employeeId: string }> }) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { employeeId } = await context.params;
  const { subject, body } = (await req.json()) as { subject: string; body: string };

  const month = await getCurrentMonth();
  const rows = await getDashboardData(month);
  const target = rows.find((r) => r.no === employeeId);
  if (!target) {
    return NextResponse.json({ error: "対象者が見つかりません" }, { status: 404 });
  }

  const employees = await getRows<EmployeeRow>("社員マスタ");
  const employee = employees.find((e) => e.社員番号 === employeeId);

  // NOTE: 実際のメール送信基盤(Gmail API等)は未接続(要件定義時点で未確定のため)。
  // 本番導入時はここでメール送信APIを呼び出す。現状は送信履歴の記録のみ行う。
  console.log(`[stub send] to=${employee?.メールアドレス ?? "unknown"} subject=${subject}`);

  await appendRow("通知履歴", {
    ログID: randomUUID(),
    社員番号: employeeId,
    対象月: month,
    エラー種別: target.status,
    件名: subject,
    本文: body,
    送信者: session.user.employeeNo,
    送信日時: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
