import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTargetDays } from "@/lib/business/heatTargetDates";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const base = searchParams.get("base");
  const month = searchParams.get("month");
  if (!base || !month) {
    return NextResponse.json({ error: "base, monthは必須です" }, { status: 400 });
  }
  const days = await getTargetDays(base, month);
  return NextResponse.json({ days });
}
