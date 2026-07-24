import { google, drive_v3 } from "googleapis";

let driveClient: drive_v3.Drive | null = null;

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
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function getDrive(): drive_v3.Drive {
  if (!driveClient) {
    driveClient = google.drive({ version: "v3", auth: getAuth() });
  }
  return driveClient;
}

function escapeForQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

/** 指定した親フォルダ配下に同名フォルダがあればそのIDを返し、無ければ新規作成する */
export async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `name = '${escapeForQuery(name)}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
  });
  const existing = res.data.files?.[0];
  if (existing?.id) return existing.id;

  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
    supportsAllDrives: true,
  });
  if (!created.data.id) throw new Error(`フォルダ「${name}」の作成に失敗しました`);
  return created.data.id;
}

/** テンプレートファイルを指定フォルダ配下に新しい名前で複製し、複製後のファイルIDを返す */
export async function copyTemplateFile(templateId: string, newName: string, parentId: string): Promise<string> {
  const drive = getDrive();
  const copied = await drive.files.copy({
    fileId: templateId,
    requestBody: { name: newName, parents: [parentId] },
    supportsAllDrives: true,
    fields: "id",
  });
  if (!copied.data.id) throw new Error(`テンプレートの複製(${newName})に失敗しました`);
  return copied.data.id;
}
