import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { addTargetDay, getTargetDays, removeTargetDay } from "@/lib/business/heatTargetDates";

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { base, month, day } = (await req.json()) as { base: string; month: string; day: number };
  if (!base || !month || !day) {
    return NextResponse.json({ error: "base, month, dayは必須です" }, { status: 400 });
  }
  await addTargetDay(base, month, day, session.user.employeeNo);
  const days = await getTargetDays(base, month);
  return NextResponse.json({ days });
}

export async function DELETE(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { base, month, day } = (await req.json()) as { base: string; month: string; day: number };
  if (!base || !month || !day) {
    return NextResponse.json({ error: "base, month, dayは必須です" }, { status: 400 });
  }
  await removeTargetDay(base, month, day);
  const days = await getTargetDays(base, month);
  return NextResponse.json({ days });
}
