import { getAcceptanceStatus, getCurrentMonth } from "@/lib/business/acceptance";
import { HeatForm } from "@/components/HeatForm";

export default async function HeatPage() {
  const month = await getCurrentMonth();
  const status = await getAcceptanceStatus("heat", month);
  return <HeatForm month={month} status={status} />;
}
