import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { getDashboardData } from "@/lib/business/aggregation";
import { getCurrentMonth } from "@/lib/business/acceptance";

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || (await getCurrentMonth());
  const rows = await getDashboardData(month);
  return NextResponse.json({ month, rows });
}
