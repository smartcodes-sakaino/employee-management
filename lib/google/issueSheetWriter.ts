import { google, sheets_v4 } from "googleapis";

let sheetsClient: sheets_v4.Sheets | null = null;

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

/**
 * 起票で複製した個別ファイル(システムDBスプレッドシートとは別のファイル)に対して、
 * 任意セルへの書き込みを1回のAPI呼び出しにまとめて行う。
 */
export async function writeCells(
  spreadsheetId: string,
  cellValues: { a1: string; value: string | number }[]
): Promise<void> {
  if (cellValues.length === 0) return;
  const sheets = getSheets();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: cellValues.map((c) => ({ range: c.a1, values: [[c.value]] })),
    },
  });
}
