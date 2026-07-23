import { getRows } from "@/lib/google/sheets";

const SHEET = "通勤交通費申請";

type CommuteApplicationRow = {
  申請ID: string;
  社員番号: string;
  対象月: string;
  イレギュラー区分: string;
};

/** 当月、当該社員の通常申請(イレギュラー申請を除く)が既に送信済みかどうか */
export async function hasSubmittedThisMonth(employeeNo: string, month: string): Promise<boolean> {
  const rows = await getRows<CommuteApplicationRow>(SHEET);
  return rows.some(
    (r) => r.社員番号 === employeeNo && r.対象月 === month && r.イレギュラー区分 !== "TRUE"
  );
}
