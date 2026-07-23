/**
 * システムDBスプレッドシートに、必要なタブ(シート)と見出し行を一式作成するセットアップスクリプト。
 *
 * 事前準備:
 *   1. Google Cloudでサービスアカウントを作成し、Sheets APIを有効化する
 *   2. 空のGoogleスプレッドシートを1つ作成し、そのIDを控える
 *   3. 作成したスプレッドシートを、サービスアカウントのメールアドレスに「編集者」として共有する
 *   4. .env.local に以下を設定する
 *        GOOGLE_SERVICE_ACCOUNT_EMAIL
 *        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *        SYSTEM_DB_SPREADSHEET_ID
 *
 * 実行方法: npm run setup:sheets
 *
 * 既に存在するタブ・見出し行はスキップ/上書きするだけで、データ行には触れない(何度実行しても安全)。
 */
import { loadEnvConfig } from "@next/env";
import { google } from "googleapis";
import { SHEET_SCHEMA } from "../lib/google/schema";

loadEnvConfig(process.cwd());

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} が設定されていません(.env.local を確認してください)`);
  }
  return value;
}

function columnLetter(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

async function main() {
  const email = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key = requireEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");
  const spreadsheetId = requireEnv("SYSTEM_DB_SPREADSHEET_ID");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  console.log("スプレッドシートの現在の構成を取得しています…");
  const current = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = current.data.sheets ?? [];
  const existingTitles = new Set(existingSheets.map((s) => s.properties?.title).filter(Boolean));

  const missing = SHEET_SCHEMA.filter((def) => !existingTitles.has(def.name));

  if (missing.length > 0) {
    console.log(`不足しているタブを作成します: ${missing.map((d) => d.name).join(", ")}`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missing.map((def) => ({
          addSheet: { properties: { title: def.name } },
        })),
      },
    });
  } else {
    console.log("すべてのタブは既に存在しています。");
  }

  console.log("各タブの見出し行(1行目)を設定しています…");
  for (const def of SHEET_SCHEMA) {
    const lastCol = columnLetter(def.columns.length - 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${def.name}!A1:${lastCol}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [def.columns] },
    });
    console.log(`  - ${def.name} (${def.columns.length}列)`);
  }

  // セットアップ直後の空のデフォルトタブ(Sheet1 / シート1)が残っていて、かつ空であれば削除する
  const defaultSheet = existingSheets.find(
    (s) => s.properties?.title === "Sheet1" || s.properties?.title === "シート1"
  );
  if (defaultSheet?.properties?.sheetId !== undefined && defaultSheet.properties.title) {
    const check = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${defaultSheet.properties.title}!A1:Z10`,
    });
    if (!check.data.values || check.data.values.length === 0) {
      console.log(`空のデフォルトタブ「${defaultSheet.properties.title}」を削除します。`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ deleteSheet: { sheetId: defaultSheet.properties.sheetId } }],
        },
      });
    }
  }

  console.log("完了しました。");
}

main().catch((err) => {
  console.error("セットアップに失敗しました:", err);
  process.exit(1);
});
