import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appendRow } from "@/lib/google/sheets";
import { getAcceptanceStatus, getCurrentMonth } from "@/lib/business/acceptance";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const month = await getCurrentMonth();
  const status = await getAcceptanceStatus("trip", month);
  return NextResponse.json({ month, status });
}

type TripEntry = {
  date: string; // yyyy-MM-dd
  destination?: string;
  purpose?: string;
  transportation: string;
  departure?: string;
  arrival?: string;
  tripType: "one" | "round";
  fee: number;
  isHeatstrokeTransfer: boolean;
};

function monthOf(dateStr: string): string {
  return dateStr.slice(0, 7); // "yyyy-MM"
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const currentMonth = await getCurrentMonth();
  const status = await getAcceptanceStatus("trip", currentMonth);
  if (status !== "open") {
    return NextResponse.json({ error: "現在は受付期間外です" }, { status: 409 });
  }

  const body = (await req.json()) as { entries: TripEntry[] };
  const entries = body.entries ?? [];
  if (entries.length === 0) {
    return NextResponse.json({ error: "明細を1件以上入力してください" }, { status: 400 });
  }

  for (const entry of entries) {
    await appendRow("外出交通費申請明細", {
      明細ID: randomUUID(),
      社員番号: session.user.employeeNo,
      対象月: monthOf(entry.date),
      日付: entry.date,
      行先: entry.destination,
      用件: entry.purpose,
      交通機関: entry.transportation,
      出発地: entry.departure,
      到着地: entry.arrival,
      "片道/往復": entry.tripType,
      利用料金: entry.fee,
      熱中症アラート振替: entry.transportation === "バス" ? entry.isHeatstrokeTransfer : false,
    });
  }

  return NextResponse.json({ count: entries.length });
}
