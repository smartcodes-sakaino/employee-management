import { google } from "googleapis";

/**
 * 管理者本人のアクセストークンを使い、Gmail APIでメールを送信する(本人のGmailから送信される)。
 */
export async function sendGmail(params: {
  accessToken: string;
  to: string;
  toName?: string;
  subject: string;
  body: string;
}): Promise<void> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: params.accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  const toHeader = params.toName ? `"${params.toName}" <${params.to}>` : params.to;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(params.subject, "utf-8").toString("base64")}?=`;

  const message = [
    `To: ${toHeader}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    params.body,
  ].join("\r\n");

  const raw = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}
