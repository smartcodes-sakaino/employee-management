import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { findRowNumber, updateRow } from "@/lib/google/sheets";

export async function PATCH(req: Request, context: { params: Promise<{ employeeId: string }> }) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { employeeId } = await context.params;
  const { role } = (await req.json()) as { role: string };
  if (role !== "employee" && role !== "admin") {
    return NextResponse.json({ error: "不正なロールです" }, { status: 400 });
  }
  if (employeeId === session.user.employeeNo) {
    return NextResponse.json(
      { error: "自分自身のロールは変更できません。別の管理者に依頼してください。" },
      { status: 400 }
    );
  }

  const rowNumber = await findRowNumber("社員マスタ", "社員番号", employeeId);
  if (rowNumber === -1) {
    return NextResponse.json({ error: "対象者が見つかりません" }, { status: 404 });
  }
  await updateRow("社員マスタ", rowNumber, { ロール: role });
  return NextResponse.json({ ok: true });
}
