export function toDateKey(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isWeekend(year: number, month1: number, day: number): boolean {
  const dow = new Date(year, month1 - 1, day).getDay();
  return dow === 0 || dow === 6;
}

/**
 * 土日 or 会社指定休日かどうかを判定する。
 * NOTE: 日本の祝日API連携は未実装(会社指定休日シートのみで判定)。
 * 将来的に祝日データソースと連携する場合はここに追加する。
 */
export function isHolidayDate(
  year: number,
  month1: number,
  day: number,
  companyHolidays: ReadonlySet<string>
): boolean {
  return isWeekend(year, month1, day) || companyHolidays.has(toDateKey(year, month1, day));
}
