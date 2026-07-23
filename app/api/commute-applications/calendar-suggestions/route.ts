import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getWorkingLocationDays } from "@/lib/google/calendar";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!token.accessToken) {
    return NextResponse.json(
      { error: "カレンダーへのアクセス権限がありません。再ログインしてください。" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "yyyy-MM"
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "monthはyyyy-MM形式で指定してください" }, { status: 400 });
  }
  const [year, m] = month.split("-").map(Number);

  try {
    const days = await getWorkingLocationDays(token.accessToken, year, m - 1);
    return NextResponse.json({ days });
  } catch {
    return NextResponse.json(
      { error: "カレンダー情報の取得に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 }
    );
  }
}
