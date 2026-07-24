import { getCurrentMonth } from "@/lib/business/acceptance";
import { IssueClient } from "@/components/IssueClient";

export default async function IssuePage() {
  const month = await getCurrentMonth();
  return <IssueClient month={month} />;
}
