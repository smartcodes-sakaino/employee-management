import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { appendRow, getRows } from "@/lib/google/sheets";
import { getCurrentMonth } from "@/lib/business/acceptance";
import { getDashboardData } from "@/lib/business/aggregation";
import { sendGmail } from "@/lib/google/gmail";

type EmployeeRow = { 社員番号: string; 氏名: string; メールアドレス: string };

export async function POST(req: NextRequest, context: { params: Promise<{ employeeId: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!token.accessToken) {
    return NextResponse.json(
      { error: "メール送信の権限がありません。再ログインしてください。" },
      { status: 403 }
    );
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
  if (!employee) {
    return NextResponse.json({ error: "社員マスタに該当者が見つかりません" }, { status: 404 });
  }

  try {
    await sendGmail({
      accessToken: token.accessToken,
      to: employee.メールアドレス,
      toName: employee.氏名,
      subject,
      body,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "メール送信に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await appendRow("通知履歴", {
    ログID: randomUUID(),
    社員番号: employeeId,
    対象月: month,
    エラー種別: target.status,
    件名: subject,
    本文: body,
    送信者: token.employeeNo,
    送信日時: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
