import { getAcceptanceStatus, getCurrentMonth } from "@/lib/business/acceptance";
import { TripForm } from "@/components/TripForm";

export default async function TripPage() {
  const month = await getCurrentMonth();
  const status = await getAcceptanceStatus("trip", month);
  return <TripForm month={month} status={status} />;
}
