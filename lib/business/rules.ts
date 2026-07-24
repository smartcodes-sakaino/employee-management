import { randomUUID } from "crypto";
import { appendRow, findRowNumberByMatch, getRows, updateRow } from "@/lib/google/sheets";

const SHEET = "ルールマスタ";

export type Rule = {
  id: string;
  name: string;
  type: string;
  targetBases: string[];
  periodFrom: string;
  periodTo: string;
  note: string;
  active: boolean;
};

type RuleRow = {
  ルールID: string;
  ルール名: string;
  種別: string;
  対象拠点: string;
  開始月: string;
  終了月: string;
  内容: string;
  "有効/無効": string;
};

function toRule(row: RuleRow): Rule {
  return {
    id: row.ルールID,
    name: row.ルール名,
    type: row.種別,
    targetBases: row.対象拠点 ? row.対象拠点.split(",").map((s) => s.trim()).filter(Boolean) : [],
    periodFrom: row.開始月,
    periodTo: row.終了月,
    note: row.内容,
    active: row["有効/無効"] === "TRUE",
  };
}

export async function listRules(): Promise<Rule[]> {
  const rows = await getRows<RuleRow>(SHEET);
  return rows.map(toRule);
}

export async function addRule(input: {
  name: string;
  type: string;
  targetBases: string[];
  periodFrom: string;
  periodTo: string;
  note: string;
}): Promise<Rule> {
  const id = randomUUID();
  await appendRow(SHEET, {
    ルールID: id,
    ルール名: input.name,
    種別: input.type,
    対象拠点: input.targetBases.join(","),
    開始月: input.periodFrom,
    終了月: input.periodTo,
    内容: input.note,
    "有効/無効": true,
  });
  return {
    id,
    name: input.name,
    type: input.type,
    targetBases: input.targetBases,
    periodFrom: input.periodFrom,
    periodTo: input.periodTo,
    note: input.note,
    active: true,
  };
}

export async function setRuleActive(id: string, active: boolean): Promise<void> {
  const rowNumber = await findRowNumberByMatch(SHEET, (r) => r.ルールID === id);
  if (rowNumber === -1) {
    throw new Error("ルールが見つかりません");
  }
  await updateRow(SHEET, rowNumber, { "有効/無効": active });
}
