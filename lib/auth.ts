import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getRows } from "./google/sheets";

type EmployeeRow = {
  社員番号: string;
  社員コード: string;
  氏名: string;
  メールアドレス: string;
  ロール: string;
  退職日: string;
};

async function findActiveEmployeeByEmail(email: string): Promise<EmployeeRow | undefined> {
  const employees = await getRows<EmployeeRow>("社員マスタ");
  return employees.find((e) => e.メールアドレス === email && !e.退職日);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          // hd はUIのヒントに過ぎず必須の検証にはならないため、signInコールバックで必ず二重チェックする
          hd: process.env.GOOGLE_WORKSPACE_DOMAIN,
          access_type: "offline",
          prompt: "consent",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      const domain = process.env.GOOGLE_WORKSPACE_DOMAIN;
      if (!email || !domain || !email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) {
        return false;
      }
      const employee = await findActiveEmployeeByEmail(email);
      return Boolean(employee);
    },
    async jwt({ token, profile, account }) {
      const email = profile?.email ?? token.email;
      if (email) {
        const employee = await findActiveEmployeeByEmail(email);
        if (employee) {
          token.employeeNo = employee.社員番号;
          token.role = employee.ロール === "admin" ? "admin" : "employee";
          token.name = employee.氏名;
        }
      }
      // 初回ログイン時のみaccountが渡される。アクセストークンはクライアントに公開せず、
      // サーバー側(API Route)からgetToken()で読み出してCalendar API呼び出しに使う。
      // NOTE: 有効期限切れ時のリフレッシュ処理は未実装(再ログインで再取得される)
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.employeeNo = (token.employeeNo as string) ?? "";
        session.user.role = (token.role as "employee" | "admin") ?? "employee";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
