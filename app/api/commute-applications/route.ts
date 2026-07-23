import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appendRow } from "@/lib/google/sheets";
import { getAcceptanceStatus, getCurrentMonth } from "@/lib/business/acceptance";
import { hasSubmittedThisMonth } from "@/lib/business/commute";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const month = await getCurrentMonth();
  const [status, submitted] = await Promise.all([
    getAcceptanceStatus("commute", month),
    hasSubmittedThisMonth(session.user.employeeNo, month),
  ]);
  return NextResponse.json({ month, status, submitted });
}

type SubmitBody = {
  isIrregular?: boolean;
  month?: string;
  transportation: string;
  destination: string;
  purpose?: string;
  departure?: string;
  arrival?: string;
  useCommuterPass: boolean;
  commuterPassFee?: number;
  oneWayFee?: number;
  fareChanged?: boolean;
  newFee?: number;
  fareChangeDate?: string;
  note?: string;
  dates?: { day: number; type: "round" | "one" }[];
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as SubmitBody;
  const isIrregular = Boolean(body.isIrregular);
  const month = isIrregular ? body.month : await getCurrentMonth();

  if (!month) {
    return NextResponse.json({ error: "対象月が指定されていません" }, { status: 400 });
  }

  if (!isIrregular) {
    const status = await getAcceptanceStatus("commute", month);
    if (status !== "open") {
      return NextResponse.json({ error: "現在は受付期間外です" }, { status: 409 });
    }
    if (await hasSubmittedThisMonth(session.user.employeeNo, month)) {
      return NextResponse.json({ error: "今月分は既に申請済みです" }, { status: 409 });
    }
  }

  const applicationId = randomUUID();
  await appendRow("通勤交通費申請", {
    申請ID: applicationId,
    社員番号: session.user.employeeNo,
    対象月: month,
    通勤手段: body.transportation,
    行先: body.destination,
    用件: body.purpose,
    出発地: body.departure,
    到着地: body.arrival,
    定期券利用: body.useCommuterPass,
    定期代: body.commuterPassFee,
    片道単価: body.oneWayFee,
    運賃改定有無: body.fareChanged ?? false,
    変更後料金: body.newFee,
    運賃変更日: body.fareChangeDate,
    備考: body.note,
    イレギュラー区分: isIrregular,
    送信日時: new Date().toISOString(),
  });

  if (Array.isArray(body.dates)) {
    for (const d of body.dates) {
      await appendRow("通勤交通費申請_出勤日", {
        申請ID: applicationId,
        日: d.day,
        種別: d.type,
      });
    }
  }

  return NextResponse.json({ id: applicationId, month });
}
