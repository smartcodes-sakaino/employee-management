import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { runIssue, type IssueTarget } from "@/lib/business/issue";

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { targets, month } = (await req.json()) as { targets: IssueTarget[]; month: string };
  if (!targets || targets.length === 0) {
    return NextResponse.json({ error: "対象を選択してください" }, { status: 400 });
  }
  if (!month) {
    return NextResponse.json({ error: "対象月を選択してください" }, { status: 400 });
  }

  try {
    const result = await runIssue(targets, month, session.user.employeeNo);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "起票の実行に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
