import { getAcceptanceStatus, getCurrentMonth } from "@/lib/business/acceptance";
import { AcceptanceClient } from "@/components/AcceptanceClient";

export default async function AcceptancePage() {
  const month = await getCurrentMonth();
  const [commute, trip, heat] = await Promise.all([
    getAcceptanceStatus("commute", month),
    getAcceptanceStatus("trip", month),
    getAcceptanceStatus("heat", month),
  ]);
  return <AcceptanceClient month={month} commute={commute} trip={trip} heat={heat} />;
}
