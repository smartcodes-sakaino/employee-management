import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAcceptanceStatus, getCurrentMonth } from "@/lib/business/acceptance";
import { hasSubmittedThisMonth } from "@/lib/business/commute";
import { CommuteForm } from "@/components/CommuteForm";

export default async function CommutePage() {
  const session = await getServerSession(authOptions);
  const month = await getCurrentMonth();
  const [status, submitted] = await Promise.all([
    getAcceptanceStatus("commute", month),
    hasSubmittedThisMonth(session!.user.employeeNo, month),
  ]);

  return <CommuteForm month={month} status={status} submitted={submitted} />;
}
