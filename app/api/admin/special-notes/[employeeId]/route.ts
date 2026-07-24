import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { appendRow, findRowNumber, updateRow } from "@/lib/google/sheets";

export async function PUT(req: Request, context: { params: Promise<{ employeeId: string }> }) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { employeeId } = await context.params;
  const { content } = (await req.json()) as { content: string };

  const rowNumber = await findRowNumber("集計結果", "社員番号", employeeId);
  const now = new Date().toISOString();
  if (rowNumber === -1) {
    await appendRow("集計結果", {
      社員番号: employeeId,
      対象月: "",
      特記事項: content,
      更新日時: now,
    });
  } else {
    await updateRow("集計結果", rowNumber, { 特記事項: content, 更新日時: now });
  }
  return NextResponse.json({ ok: true });
}
