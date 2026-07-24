import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminSession";
import { addRule, listRules } from "@/lib/business/rules";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const rules = await listRules();
  return NextResponse.json({ rules });
}

type Body = {
  name: string;
  type: string;
  targetBases: string[];
  periodFrom: string;
  periodTo: string;
  note: string;
};

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as Body;
  if (!body.name) {
    return NextResponse.json({ error: "ルール名を入力してください" }, { status: 400 });
  }
  const rule = await addRule(body);
  return NextResponse.json({ rule });
}
