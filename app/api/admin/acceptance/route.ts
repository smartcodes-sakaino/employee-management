import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import {
  type AcceptanceStatus,
  getAcceptanceStatus,
  getCurrentMonth,
  setAcceptanceStatus,
  setCurrentMonth,
} from "@/lib/business/acceptance";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const month = await getCurrentMonth();
  const [commute, trip, heat] = await Promise.all([
    getAcceptanceStatus("commute", month),
    getAcceptanceStatus("trip", month),
    getAcceptanceStatus("heat", month),
  ]);
  return NextResponse.json({ month, commute, trip, heat });
}

type Body = {
  month?: string;
  commute?: AcceptanceStatus;
  trip?: AcceptanceStatus;
  heat?: AcceptanceStatus;
};

export async function PUT(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as Body;

  if (body.month) {
    await setCurrentMonth(body.month);
  }
  const month = body.month ?? (await getCurrentMonth());

  if (body.commute) await setAcceptanceStatus("commute", month, body.commute);
  if (body.trip) await setAcceptanceStatus("trip", month, body.trip);
  if (body.heat) await setAcceptanceStatus("heat", month, body.heat);

  return NextResponse.json({ ok: true, month });
}
