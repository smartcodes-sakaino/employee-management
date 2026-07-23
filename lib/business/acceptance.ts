import { getRows } from "@/lib/google/sheets";

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
