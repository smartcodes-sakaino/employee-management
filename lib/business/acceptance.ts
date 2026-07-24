import { appendRow, findRowNumberByMatch, getRows, updateRow } from "@/lib/google/sheets";

const SHEET = "受付管理";
/** 「対象月」列に現在の受付月そのものを保持する特別な行。申請種別列にこのキーを入れて管理する */
const CURRENT_MONTH_MARKER = "_current";

export type ApplicationType = "commute" | "trip" | "heat";
export type AcceptanceStatus = "before" | "open" | "closed";

type AcceptanceRow = {
  対象月: string;
  申請種別: string;
  状態: string;
  更新日時: string;
};

/** システム全体で「現在受付中として扱う対象月」を返す(yyyy-MM形式) */
export async function getCurrentMonth(): Promise<string> {
  const rows = await getRows<AcceptanceRow>(SHEET);
  const marker = rows.find((r) => r.申請種別 === CURRENT_MONTH_MARKER);
  if (marker?.対象月) return marker.対象月;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getAcceptanceStatus(
  applicationType: ApplicationType,
  month: string
): Promise<AcceptanceStatus> {
  const rows = await getRows<AcceptanceRow>(SHEET);
  const row = rows.find((r) => r.申請種別 === applicationType && r.対象月 === month);
  const status = row?.状態;
  return status === "open" || status === "closed" ? status : "before";
}

/**
 * 現在の受付月を変更する。月が変わることで、当月分の申請有無の判定も自然に新しい月を
 * 参照するようになるため、別途「送信済みフラグのリセット」処理は不要。
 */
export async function setCurrentMonth(month: string): Promise<void> {
  const rowNumber = await findRowNumberByMatch(SHEET, (r) => r.申請種別 === CURRENT_MONTH_MARKER);
  const now = new Date().toISOString();
  if (rowNumber === -1) {
    await appendRow(SHEET, { 対象月: month, 申請種別: CURRENT_MONTH_MARKER, 状態: "", 更新日時: now });
  } else {
    await updateRow(SHEET, rowNumber, { 対象月: month, 更新日時: now });
  }
}

export async function setAcceptanceStatus(
  applicationType: ApplicationType,
  month: string,
  status: AcceptanceStatus
): Promise<void> {
  const rowNumber = await findRowNumberByMatch(
    SHEET,
    (r) => r.申請種別 === applicationType && r.対象月 === month
  );
  const now = new Date().toISOString();
  if (rowNumber === -1) {
    await appendRow(SHEET, { 対象月: month, 申請種別: applicationType, 状態: status, 更新日時: now });
  } else {
    await updateRow(SHEET, rowNumber, { 状態: status, 更新日時: now });
  }
}
