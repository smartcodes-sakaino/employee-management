import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { getDashboardData } from "@/lib/business/aggregation";
import { getCurrentMonth } from "@/lib/business/acceptance";

// 現行の社員マスタには「所属」列が無い(申請ごとに入力される値のため)。
// 出力形式は社員リストに合わせるため列自体は用意しつつ、当面は空欄で出力する。
const HEADER = ["社員番号", "氏名", "所属", "通勤交通費", "外出交通費", "熱中症アラート", "特記事項"];

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || (await getCurrentMonth());
  const format = searchParams.get("format") === "csv" ? "csv" : "tsv";

  const rows = await getDashboardData(month);
  const dataRows = rows.map((r) => [
    r.no,
    r.name,
    "",
    r.commute === null ? "" : String(r.commute),
    r.trip === null ? "" : String(r.trip),
    r.heat === null ? "" : String(r.heat),
    r.specialNote,
  ]);

  if (format === "csv") {
    const text = "﻿" + [HEADER, ...dataRows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
    const asciiName = `${month}_shain_list.csv`;
    const utf8Name = encodeURIComponent(`${month}_社員リスト.csv`);
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
      },
    });
  }

  const text = [HEADER, ...dataRows].map((r) => r.join("\t")).join("\n");
  return new NextResponse(text, {
    headers: { "Content-Type": "text/tab-separated-values; charset=utf-8" },
  });
}
