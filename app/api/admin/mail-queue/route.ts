import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { getDashboardData } from "@/lib/business/aggregation";
import { getCurrentMonth } from "@/lib/business/acceptance";
import { buildTemplate } from "@/lib/business/mailTemplates";
import { getRows } from "@/lib/google/sheets";

type NotificationRow = { 社員番号: string; 対象月: string; エラー種別: string };

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || (await getCurrentMonth());

  const [rows, sentLogs] = await Promise.all([getDashboardData(month), getRows<NotificationRow>("通知履歴")]);

  const attention = rows.filter(
    (r) => r.status === "holiday" || r.status === "duplicate" || r.status === "heatMismatch"
  );

  const queue = attention.map((r) => {
    const sent = sentLogs.some((l) => l.社員番号 === r.no && l.対象月 === month && l.エラー種別 === r.status);
    const template = buildTemplate(r.status, r.name);
    return {
      no: r.no,
      name: r.name,
      status: r.status,
      sent,
      subject: template?.subject ?? "",
      body: template?.body ?? "",
    };
  });

  return NextResponse.json({ month, queue });
}
