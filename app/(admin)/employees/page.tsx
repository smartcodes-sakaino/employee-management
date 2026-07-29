import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRows } from "@/lib/google/sheets";
import { EmployeesClient } from "@/components/EmployeesClient";

type EmployeeRow = {
  社員番号: string;
  社員コード: string;
  氏名: string;
  メールアドレス: string;
  ロール: string;
  退職日: string;
};

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  const employees = await getRows<EmployeeRow>("社員マスタ");
  return <EmployeesClient initialEmployees={employees} currentEmployeeNo={session?.user.employeeNo ?? ""} />;
}
