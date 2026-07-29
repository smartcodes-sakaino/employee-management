import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { getRows } from "@/lib/google/sheets";

type EmployeeRow = {
  社員番号: string;
  社員コード: string;
  氏名: string;
  メールアドレス: string;
  ロール: string;
  退職日: string;
};

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const employees = await getRows<EmployeeRow>("社員マスタ");
  return NextResponse.json({ employees });
}
