import { appendRow, deleteRow, findRowNumberByMatch, getRows } from "@/lib/google/sheets";
import { fetchAlertDaysFromSource } from "@/lib/business/wbgtAlerts";
import { fetchJapanesePublicHolidays, isHolidayDate } from "@/lib/business/holidays";

const SHEET = "熱中症アラート対象日マスタ";

export type HeatBase = "東京" | "大阪" | "福岡" | "静岡";

type HeatTargetDateRow = {
  拠点: string;
  対象月: string;
  対象日: string;
  設定者: string;
};

/** 指定した拠点・対象月の、管理者が設定した熱中症アラート対象日一覧(日にちの配列)を返す */
export async function getTargetDays(base: string, month: string): Promise<number[]> {
  const rows = await getRows<HeatTargetDateRow>(SHEET);
  return rows
    .filter((r) => r.拠点 === base && r.対象月 === month)
    .map((r) => Number(r.対象日))
    .filter((d) => Number.isFinite(d))
    .sort((a, b) => a - b);
}

export async function addTargetDay(
  base: string,
  month: string,
  day: number,
  setBy: string
): Promise<void> {
  const existing = await getTargetDays(base, month);
  if (existing.includes(day)) return;
  await appendRow(SHEET, { 拠点: base, 対象月: month, 対象日: day, 設定者: setBy });
}

export async function removeTargetDay(base: string, month: string, day: number): Promise<void> {
  const rowNumber = await findRowNumberByMatch(
    SHEET,
    (r) => r.拠点 === base && r.対象月 === month && Number(r.対象日) === day
  );
  if (rowNumber !== -1) {
    await deleteRow(SHEET, rowNumber);
  }
}

/**
 * 環境省サイトから、指定拠点・対象月に実際にアラートが発表された日を取得し、
 * 土日・祝日・会社指定休日(＝そもそも出勤しない日)を除いたうえで、
 * 既存の対象日マスタに(重複を避けつつ)まとめて追加する。
 */
export async function importTargetDaysFromWbgt(
  base: string,
  month: string,
  setBy: string
): Promise<{ imported: number[]; excludedNonWorkingDays: number[]; days: number[] }> {
  const [year, monthNum] = month.split("-").map(Number);

  const [fetched, companyHolidayRows, publicHolidays] = await Promise.all([
    fetchAlertDaysFromSource(base, month),
    getRows<{ 日付: string }>("会社指定休日"),
    fetchJapanesePublicHolidays(),
  ]);
  const nonWorkingDates = new Set([...companyHolidayRows.map((r) => r.日付), ...publicHolidays]);

  const workingDays: number[] = [];
  const excludedNonWorkingDays: number[] = [];
  for (const day of fetched) {
    if (isHolidayDate(year, monthNum, day, nonWorkingDates)) {
      excludedNonWorkingDays.push(day);
    } else {
      workingDays.push(day);
    }
  }

  for (const day of workingDays) {
    await addTargetDay(base, month, day, setBy);
  }
  const days = await getTargetDays(base, month);
  return { imported: workingDays, excludedNonWorkingDays, days };
}
