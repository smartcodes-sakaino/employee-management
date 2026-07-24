import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { importTargetDaysFromWbgt } from "@/lib/business/heatTargetDates";

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { base, month } = (await req.json()) as { base: string; month: string };
  if (!base || !month) {
    return NextResponse.json({ error: "base, monthは必須です" }, { status: 400 });
  }
  try {
    const result = await importTargetDaysFromWbgt(base, month, session.user.employeeNo);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "環境省サイトからの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
