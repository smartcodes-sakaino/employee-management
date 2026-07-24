import { getCurrentMonth } from "@/lib/business/acceptance";
import { getDashboardData } from "@/lib/business/aggregation";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const month = await getCurrentMonth();
  const rows = await getDashboardData(month);
  return <DashboardClient month={month} initialRows={rows} />;
}
