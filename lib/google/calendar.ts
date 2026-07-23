import { google } from "googleapis";

/**
 * 指定した年月における、Googleカレンダーの「勤務場所(Working location)」が
 * オフィスに設定されている平日を候補日として返す。
 *
 * NOTE: アクセストークンの有効期限切れ時のリフレッシュは未実装。
 * 期限切れの場合はGoogle APIがエラーを返すので、呼び出し側で再ログインを促す。
 */
export async function getWorkingLocationDays(
  accessToken: string,
  year: number,
  monthIndex0: number
): Promise<number[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth });

  const timeMin = new Date(year, monthIndex0, 1).toISOString();
  const timeMax = new Date(year, monthIndex0 + 1, 1).toISOString();

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    eventTypes: ["workingLocation"],
    singleEvents: true,
    maxResults: 100,
  });

  const days = new Set<number>();
  for (const event of res.data.items ?? []) {
    const loc = event.workingLocationProperties;
    const dateStr = event.start?.date ?? event.start?.dateTime;
    if (loc?.type !== "officeLocation" || !dateStr) continue;
    const d = new Date(dateStr);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      days.add(d.getDate());
    }
  }
  return Array.from(days).sort((a, b) => a - b);
}
