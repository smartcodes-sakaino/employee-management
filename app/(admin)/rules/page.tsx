import { listRules } from "@/lib/business/rules";
import { RulesClient } from "@/components/RulesClient";

export default async function RulesPage() {
  const rules = await listRules();
  return <RulesClient initialRules={rules} />;
}
