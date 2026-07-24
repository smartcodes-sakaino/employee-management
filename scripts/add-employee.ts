/**
 * 「社員マスタ」タブに1名を登録するユーティリティ。
 *
 * 使い方:
 *   npx tsx scripts/add-employee.ts <社員番号> <社員コード> <氏名> <メールアドレス> [role=employee|admin]
 *
 * 例:
 *   npx tsx scripts/add-employee.ts td240042 2442 境野巧己 t.sakaino@tcdigital.jp admin
 */
import { loadEnvConfig } from "@next/env";
import { appendRow, getRows } from "../lib/google/sheets";

loadEnvConfig(process.cwd());

type EmployeeRow = { 社員番号: string };

async function main() {
  const [, , employeeNo, employeeCode, name, email, role] = process.argv;
  if (!employeeNo || !employeeCode || !name || !email) {
    console.error(
      "使い方: npx tsx scripts/add-employee.ts <社員番号> <社員コード> <氏名> <メールアドレス> [role=employee|admin]"
    );
    process.exit(1);
  }

  const existing = await getRows<EmployeeRow>("社員マスタ");
  if (existing.some((e) => e.社員番号 === employeeNo)) {
    console.log(`社員番号 ${employeeNo} は既に登録されています(スキップしました)。`);
    return;
  }

  const finalRole = role === "admin" ? "admin" : "employee";
  await appendRow("社員マスタ", {
    社員番号: employeeNo,
    社員コード: employeeCode,
    氏名: name,
    メールアドレス: email,
    ロール: finalRole,
    退職日: "",
  });
  console.log(`${name}(${email})を ${finalRole} として登録しました。`);
}

main().catch((err) => {
  console.error("登録に失敗しました:", err);
  process.exit(1);
});
