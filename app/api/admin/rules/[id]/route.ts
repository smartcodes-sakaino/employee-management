import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { setRuleActive } from "@/lib/business/rules";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const { active } = (await req.json()) as { active: boolean };
  await setRuleActive(id, active);
  return NextResponse.json({ ok: true });
}
