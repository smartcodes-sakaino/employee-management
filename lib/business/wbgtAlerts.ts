import * as cheerio from "cheerio";

const BASE_URL = "https://www.wbgt.env.go.jp";

/**
 * 環境省 熱中症予防情報サイトの発表履歴ページのURLを、対象年に応じて組み立てる。
 * 当年は /alert_record.php、過去年は /alert_record_{year}.php という命名規則になっている。
 * 参照: https://www.wbgt.env.go.jp/alert_record.php
 */
function buildSourceUrl(year: number): string {
  const currentYear = new Date().getFullYear();
  return year === currentYear
    ? `${BASE_URL}/alert_record.php`
    : `${BASE_URL}/alert_record_${year}.php`;
}

/**
 * 環境省の発表履歴ページ(1年分が1つの大きな表になっている)から、
 * 指定した拠点(表の行ラベルと一致する地域名。例: 東京/大阪/福岡/静岡)・対象月について、
 * 熱中症特別警戒アラート または 熱中症警戒アラートが発表された日を取得する。
 */
export async function fetchAlertDaysFromSource(base: string, month: string): Promise<number[]> {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const targetMonth = Number(monthStr);
  if (!year || !targetMonth) {
    throw new Error("monthはyyyy-MM形式で指定してください");
  }

  const url = buildSourceUrl(year);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; kotsuhi-portal/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`環境省サイトの取得に失敗しました(${url}, status: ${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  // 日付ヘッダー(例: "04/23")を表示順に取得する
  const dateHeaders: { month: number; day: number }[] = [];
  $("th.fixed_top1").each((_, el) => {
    const text = $(el).text().trim();
    const m = text.match(/(\d{1,2})\/(\d{1,2})/);
    if (m) {
      dateHeaders.push({ month: Number(m[1]), day: Number(m[2]) });
    }
  });
  if (dateHeaders.length === 0) {
    throw new Error("環境省サイトのページ構造が変わっている可能性があります(日付ヘッダーが見つかりません)");
  }

  // 対象拠点の行(<th class="fixed_left">地域名</th>を含む<tr>)を探す
  const rowHeader = $("th.fixed_left")
    .filter((_, el) => $(el).text().trim() === base)
    .first();
  if (rowHeader.length === 0) {
    throw new Error(`環境省サイトに拠点「${base}」に一致する地域が見つかりませんでした`);
  }
  const row = rowHeader.closest("tr");

  const cellTexts: string[] = [];
  row.find("td").each((_, td) => {
    cellTexts.push($(td).text().trim());
  });

  // 先頭2セルは「発表回数」(特別回数・警戒回数)なので、日付ごとのセルはその後から始まる
  const dateCells = cellTexts.slice(2);

  const alertDays = new Set<number>();
  dateHeaders.forEach((d, idx) => {
    if (d.month !== targetMonth) return;
    const special = dateCells[idx * 2];
    const alert = dateCells[idx * 2 + 1];
    if (special === "●" || alert === "●") {
      alertDays.add(d.day);
    }
  });

  return Array.from(alertDays).sort((a, b) => a - b);
}
