import { google, sheets_v4 } from "googleapis";

type CellValue = string | number | boolean | null | undefined;

let sheetsClient: sheets_v4.Sheets | null = null;

/**
 * process.env.SYSTEM_DB_SPREADSHEET_ID をモジュール読み込み時ではなく呼び出し時に読む。
 * (standaloneスクリプトでloadEnvConfig()を自前で呼ぶ場合、import文はスクリプト本体の
 *  処理より先に評価されるため、トップレベルのconstにしてしまうと値が空のまま固定されてしまう)
 */
function getSpreadsheetId(): string {
  return process.env.SYSTEM_DB_SPREADSHEET_ID ?? "";
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY が設定されていません(.env.local参照)"
    );
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets(): sheets_v4.Sheets {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

function assertSpreadsheetId(): string {
  const id = getSpreadsheetId();
  if (!id) {
    throw new Error("SYSTEM_DB_SPREADSHEET_ID が設定されていません(.env.local参照)");
  }
  return id;
}

function formatCell(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

/** 0-indexedの列番号(0=A)を列レター(A, B, ..., Z, AA, ...)に変換する */
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

async function getHeader(sheetName: string): Promise<string[]> {
  const spreadsheetId = assertSpreadsheetId();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });
  return (res.data.values?.[0] ?? []) as string[];
}

/**
 * シート(タブ)の全行を、ヘッダー行(1行目)の列名をキーにしたオブジェクトの配列として取得する。
 * 未提出などで値が入っていないセルは空文字になる。
 */
export async function getRows<T extends Record<string, string>>(sheetName: string): Promise<T[]> {
  const spreadsheetId = assertSpreadsheetId();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:ZZ`,
  });
  const values = res.data.values ?? [];
  if (values.length === 0) return [];
  const [header, ...rows] = values as string[][];
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = row[i] ?? "";
    });
    return obj as T;
  });
}

/** 複数の新規行を1回のAPI呼び出しでまとめて末尾に追加する(大量データの一括投入向け)。 */
export async function appendRows(
  sheetName: string,
  rows: Record<string, CellValue>[]
): Promise<void> {
  if (rows.length === 0) return;
  const spreadsheetId = assertSpreadsheetId();
  const sheets = getSheets();
  const header = await getHeader(sheetName);
  const values = rows.map((row) => header.map((key) => formatCell(row[key])));
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

/** 新規行を末尾に追加する。rowのキーはヘッダー行の列名と一致させる。 */
export async function appendRow(
  sheetName: string,
  row: Record<string, CellValue>
): Promise<void> {
  const spreadsheetId = assertSpreadsheetId();
  const sheets = getSheets();
  const header = await getHeader(sheetName);
  const values = header.map((key) => formatCell(row[key]));
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

/**
 * 指定した行(1-indexed。ヘッダー行=1行目を含む)を部分更新する。
 * patchに含まれない列は既存の値を維持する。
 */
export async function updateRow(
  sheetName: string,
  rowNumber: number,
  patch: Record<string, CellValue>
): Promise<void> {
  const spreadsheetId = assertSpreadsheetId();
  const sheets = getSheets();
  const header = await getHeader(sheetName);
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${rowNumber}:${rowNumber}`,
  });
  const currentRow = existing.data.values?.[0] ?? [];
  const merged = header.map((key, i) =>
    key in patch ? formatCell(patch[key]) : currentRow[i] ?? ""
  );
  const lastCol = columnLetter(header.length - 1);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${rowNumber}:${lastCol}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [merged] },
  });
}

/**
 * 条件に一致する最初の行番号(1-indexed、ヘッダー行を含む)を返す。見つからない場合は-1。
 */
export async function findRowNumberByMatch(
  sheetName: string,
  predicate: (row: Record<string, string>) => boolean
): Promise<number> {
  const rows = await getRows<Record<string, string>>(sheetName);
  const idx = rows.findIndex(predicate);
  return idx === -1 ? -1 : idx + 2;
}

/**
 * matchKey列がmatchValueと一致する最初の行番号(1-indexed、ヘッダー行を含む)を返す。
 * 見つからない場合は-1。
 */
export async function findRowNumber(
  sheetName: string,
  matchKey: string,
  matchValue: string
): Promise<number> {
  return findRowNumberByMatch(sheetName, (r) => r[matchKey] === matchValue);
}

async function getSheetId(sheetName: string): Promise<number> {
  const spreadsheetId = assertSpreadsheetId();
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error(`シート「${sheetName}」が見つかりません`);
  }
  return sheetId;
}

/** 指定した行(1-indexed。ヘッダー行を含む)を完全に削除する(以降の行は繰り上がる) */
export async function deleteRow(sheetName: string, rowNumber: number): Promise<void> {
  const spreadsheetId = assertSpreadsheetId();
  const sheets = getSheets();
  const sheetId = await getSheetId(sheetName);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });
}
