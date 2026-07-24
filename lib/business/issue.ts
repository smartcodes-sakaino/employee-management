import { randomUUID } from "crypto";
import { appendRow, getRows } from "@/lib/google/sheets";
import { copyTemplateFile, findOrCreateFolder } from "@/lib/google/drive";
import { writeCells } from "@/lib/google/issueSheetWriter";

export type IssueTarget = "commute" | "trip" | "heat";

export const TARGET_LABEL: Record<IssueTarget, string> = {
  commute: "通勤交通費",
  trip: "外出交通費",
  heat: "熱中症アラート",
};

const TEMPLATE_ENV: Record<IssueTarget, string> = {
  commute: "DRIVE_TEMPLATE_COMMUTE_ID",
  trip: "DRIVE_TEMPLATE_TRIP_ID",
  heat: "DRIVE_TEMPLATE_HEAT_ID",
};

type EmployeeRow = { 社員番号: string; 氏名: string };
type CommuteAppRow = {
  申請ID: string;
  社員番号: string;
  対象月: string;
  通勤手段: string;
  行先: string;
  用件: string;
  出発地: string;
  到着地: string;
  定期券利用: string;
  定期代: string;
  片道単価: string;
  備考: string;
  イレギュラー区分: string;
};
type CommuteDateRow = { 申請ID: string; 日: string; 種別: string };
type TripEntryRow = {
  社員番号: string;
  対象月: string;
  日付: string;
  行先: string;
  用件: string;
  交通機関: string;
  出発地: string;
  到着地: string;
  "片道/往復": string;
  利用料金: string;
  熱中症アラート振替: string;
};
type HeatAppRow = {
  申請ID: string;
  社員番号: string;
  対象月: string;
  拠点: string;
  "自宅~最寄り駅経路": string;
  "自宅~最寄り駅料金": string;
  "最寄り駅~オフィス経路": string;
  "最寄り駅~オフィス料金": string;
  備考: string;
};
type HeatDateRow = { 申請ID: string; 日: string };

function monthToJapanese(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${y}年${m}月`;
}

export function buildFolderName(target: IssueTarget, month: string): string {
  return `${TARGET_LABEL[target]}_${monthToJapanese(month)}`;
}

function formatDateJapanese(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export type IssueProgress = { line: string };

export async function runIssue(
  targets: IssueTarget[],
  month: string,
  executedBy: string
): Promise<{ lines: string[]; totalFiles: number }> {
  const sharedDriveId = process.env.DRIVE_SHARED_DRIVE_ID;
  if (!sharedDriveId) {
    throw new Error("DRIVE_SHARED_DRIVE_ID が設定されていません(.env.local参照)");
  }

  const lines: string[] = [];
  let totalFiles = 0;

  const [employees, commuteApps, commuteDates, tripEntries, heatApps, heatDates] = await Promise.all([
    getRows<EmployeeRow>("社員マスタ"),
    getRows<CommuteAppRow>("通勤交通費申請"),
    getRows<CommuteDateRow>("通勤交通費申請_出勤日"),
    getRows<TripEntryRow>("外出交通費申請明細"),
    getRows<HeatAppRow>("熱中症アラート申請"),
    getRows<HeatDateRow>("熱中症アラート申請_利用日"),
  ]);

  for (const target of targets) {
    const templateId = process.env[TEMPLATE_ENV[target]];
    if (!templateId) {
      lines.push(`⚠ ${TARGET_LABEL[target]}: テンプレートIDが未設定のためスキップしました`);
      continue;
    }

    const folderName = `${TARGET_LABEL[target]}_${monthToJapanese(month)}`;
    const folderId = await findOrCreateFolder(folderName, sharedDriveId);
    lines.push(`${folderName} フォルダを作成/確認しました`);

    if (target === "commute") {
      const submitters = commuteApps.filter((a) => a.対象月 === month && a.イレギュラー区分 !== "TRUE");
      for (const app of submitters) {
        const emp = employees.find((e) => e.社員番号 === app.社員番号);
        if (!emp) continue;
        const fileName = `通勤交通費_${emp.氏名}`;
        const fileId = await copyTemplateFile(templateId, fileName, folderId);

        const cells: { a1: string; value: string | number }[] = [
          { a1: "E5", value: "" },
          { a1: "E6", value: emp.氏名 },
        ];

        if (app.定期券利用 === "TRUE") {
          cells.push(
            { a1: "A10", value: monthToJapanese(month) },
            { a1: "D10", value: app.行先 },
            { a1: "K10", value: app.用件 },
            { a1: "R10", value: app.通勤手段 },
            { a1: "U10", value: app.出発地 },
            { a1: "Z10", value: app.到着地 },
            { a1: "AE10", value: "往" },
            { a1: "AG10", value: Number(app.定期代) || 0 },
            { a1: "A39", value: `定期券利用です${app.備考 ?? ""}` }
          );
        } else {
          const myDates = commuteDates.filter((d) => d.申請ID === app.申請ID);
          const fee = Number(app.片道単価) || 0;
          const sorted = myDates
            .map((d) => ({ day: Number(d.日), type: d.種別 === "round" ? "往" : "片" }))
            .sort((a, b) => a.day - b.day);
          sorted.forEach((d, idx) => {
            const row = 10 + idx;
            cells.push(
              { a1: `A${row}`, value: `${monthToJapanese(month)}${d.day}日` },
              { a1: `D${row}`, value: app.行先 },
              { a1: `K${row}`, value: app.用件 },
              { a1: `R${row}`, value: app.通勤手段 },
              { a1: `U${row}`, value: app.出発地 },
              { a1: `Z${row}`, value: app.到着地 },
              { a1: `AE${row}`, value: d.type },
              { a1: `AG${row}`, value: d.type === "往" ? fee * 2 : fee }
            );
          });
          cells.push({ a1: "A39", value: app.備考 ?? "" });
        }

        await writeCells(fileId, cells);
        lines.push(`${fileName}.xlsx を作成しました`);
        totalFiles++;
      }
    } else if (target === "trip") {
      const submitters = tripEntries.filter(
        (e) => e.対象月 === month && e.熱中症アラート振替 !== "TRUE"
      );
      const byEmployee = new Map<string, TripEntryRow[]>();
      for (const e of submitters) {
        const list = byEmployee.get(e.社員番号) ?? [];
        list.push(e);
        byEmployee.set(e.社員番号, list);
      }
      for (const [employeeNo, entries] of byEmployee) {
        const emp = employees.find((x) => x.社員番号 === employeeNo);
        if (!emp) continue;
        const fileName = `外出交通費_${emp.氏名}`;
        const fileId = await copyTemplateFile(templateId, fileName, folderId);

        const sorted = entries.slice().sort((a, b) => a.日付.localeCompare(b.日付));
        const cells: { a1: string; value: string | number }[] = [
          { a1: "E5", value: "" },
          { a1: "E6", value: emp.氏名 },
        ];
        sorted.forEach((e, idx) => {
          const row = 10 + idx;
          const fee = Number(e.利用料金) || 0;
          const isRound = e["片道/往復"] === "round";
          cells.push(
            { a1: `A${row}`, value: formatDateJapanese(e.日付) },
            { a1: `D${row}`, value: e.行先 },
            { a1: `K${row}`, value: e.用件 },
            { a1: `R${row}`, value: e.交通機関 },
            { a1: `U${row}`, value: e.出発地 },
            { a1: `Z${row}`, value: e.到着地 },
            { a1: `AE${row}`, value: isRound ? "往" : "片" },
            { a1: `AG${row}`, value: isRound ? fee * 2 : fee }
          );
        });
        await writeCells(fileId, cells);
        lines.push(`${fileName}.xlsx を作成しました`);
        totalFiles++;
      }
    } else {
      // 熱中症アラート: 申請本体(自宅~最寄り駅+最寄り駅~オフィス) と 外出からの振替明細を合算して記載する。
      // NOTE: 熱中症アラート用の個別精算書は現行システムに実例が無いため、通勤/外出と同じ列レイアウトを暫定採用している。
      // 実際のテンプレートが用意され次第、セル位置を調整すること。
      const heatSubmitters = heatApps.filter((a) => a.対象月 === month);
      const transferByEmployee = new Map<string, TripEntryRow[]>();
      for (const e of tripEntries.filter((e) => e.対象月 === month && e.熱中症アラート振替 === "TRUE")) {
        const list = transferByEmployee.get(e.社員番号) ?? [];
        list.push(e);
        transferByEmployee.set(e.社員番号, list);
      }
      const employeeNos = new Set([
        ...heatSubmitters.map((a) => a.社員番号),
        ...Array.from(transferByEmployee.keys()),
      ]);

      for (const employeeNo of employeeNos) {
        const emp = employees.find((x) => x.社員番号 === employeeNo);
        if (!emp) continue;
        const fileName = `熱中症アラート_${emp.氏名}`;
        const fileId = await copyTemplateFile(templateId, fileName, folderId);

        const cells: { a1: string; value: string | number }[] = [
          { a1: "E5", value: "" },
          { a1: "E6", value: emp.氏名 },
        ];
        let row = 10;

        const heatApp = heatSubmitters.find((a) => a.社員番号 === employeeNo);
        if (heatApp) {
          const perDayFee =
            (Number(heatApp["自宅~最寄り駅料金"]) || 0) + (Number(heatApp["最寄り駅~オフィス料金"]) || 0);
          const days = heatDates
            .filter((d) => d.申請ID === heatApp.申請ID)
            .map((d) => Number(d.日))
            .sort((a, b) => a - b);
          for (const day of days) {
            cells.push(
              { a1: `A${row}`, value: `${monthToJapanese(month)}${day}日` },
              { a1: `D${row}`, value: `${heatApp["自宅~最寄り駅経路"]} / ${heatApp["最寄り駅~オフィス経路"]}` },
              { a1: `AG${row}`, value: perDayFee }
            );
            row++;
          }
        }

        for (const e of transferByEmployee.get(employeeNo) ?? []) {
          const fee = Number(e.利用料金) || 0;
          const isRound = e["片道/往復"] === "round";
          cells.push(
            { a1: `A${row}`, value: formatDateJapanese(e.日付) },
            { a1: `D${row}`, value: `${e.行先}(外出バス振替)` },
            { a1: `R${row}`, value: e.交通機関 },
            { a1: `AG${row}`, value: isRound ? fee * 2 : fee }
          );
          row++;
        }

        await writeCells(fileId, cells);
        lines.push(`${fileName}.xlsx を作成しました`);
        totalFiles++;
      }
    }
  }

  await appendRow("起票実行ログ", {
    ログID: randomUUID(),
    対象月: month,
    申請種別: targets.join(","),
    作成件数: totalFiles,
    フォルダID: "",
    実行者: executedBy,
    実行日時: new Date().toISOString(),
  });

  lines.push(`完了しました。共有ドライブに ${totalFiles} 件のファイルを作成しました。`);

  return { lines, totalFiles };
}
