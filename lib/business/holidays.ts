export function toDateKey(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isWeekend(year: number, month1: number, day: number): boolean {
  const dow = new Date(year, month1 - 1, day).getDay();
  return dow === 0 || dow === 6;
}

const HOLIDAYS_JP_API = "https://holidays-jp.github.io/api/v1/date.json";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1時間

let cachedPublicHolidays: Set<string> | null = null;
let cachedAt = 0;

/**
 * 日本の祝日データを取得する(holidays-jp: https://holidays-jp.github.io/ が提供する公開データ)。
 * 全期間分を1回のリクエストで取得し、プロセス内で1時間キャッシュする。
 */
export async function fetchJapanesePublicHolidays(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedPublicHolidays && now - cachedAt < CACHE_TTL_MS) {
    return cachedPublicHolidays;
  }
  const res = await fetch(HOLIDAYS_JP_API);
  if (!res.ok) {
    throw new Error(`祝日データの取得に失敗しました(status: ${res.status})`);
  }
  const data = (await res.json()) as Record<string, string>;
  cachedPublicHolidays = new Set(Object.keys(data));
  cachedAt = now;
  return cachedPublicHolidays;
}

/**
 * 土日、または渡された休日一覧(会社指定休日・日本の祝日をまとめたもの)に含まれる日かどうかを判定する。
 */
export function isHolidayDate(
  year: number,
  month1: number,
  day: number,
  nonWorkingDates: ReadonlySet<string>
): boolean {
  return isWeekend(year, month1, day) || nonWorkingDates.has(toDateKey(year, month1, day));
}
