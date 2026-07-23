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
  const status = await getAcceptanceStatus("heat", month);
  return NextResponse.json({ month, status });
}

type SubmitBody = {
  base: string;
  homeToStationRoute?: string;
  homeToStationFee?: number;
  stationToOfficeRoute?: string;
  stationToOfficeFee?: number;
  note?: string;
  days: number[];
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as SubmitBody;
  const month = await getCurrentMonth();
  const status = await getAcceptanceStatus("heat", month);
  if (status !== "open") {
    return NextResponse.json({ error: "現在は受付期間外です" }, { status: 409 });
  }
  if (!body.base) {
    return NextResponse.json({ error: "拠点を選択してください" }, { status: 400 });
  }

  const applicationId = randomUUID();
  await appendRow("熱中症アラート申請", {
    申請ID: applicationId,
    社員番号: session.user.employeeNo,
    対象月: month,
    拠点: body.base,
    "自宅~最寄り駅経路": body.homeToStationRoute,
    "自宅~最寄り駅料金": body.homeToStationFee,
    "最寄り駅~オフィス経路": body.stationToOfficeRoute,
    "最寄り駅~オフィス料金": body.stationToOfficeFee,
    備考: body.note,
    送信日時: new Date().toISOString(),
  });

  for (const day of body.days ?? []) {
    await appendRow("熱中症アラート申請_利用日", {
      申請ID: applicationId,
      日: day,
    });
  }

  return NextResponse.json({ id: applicationId, month });
}
