import { getCurrentMonth } from "@/lib/business/acceptance";
import { HeatSettingsClient } from "@/components/HeatSettingsClient";

export default async function HeatSettingsPage() {
  const month = await getCurrentMonth();
  return <HeatSettingsClient month={month} />;
}
