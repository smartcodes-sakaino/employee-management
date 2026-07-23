import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      employeeNo: string;
      role: "employee" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    employeeNo?: string;
    role?: "employee" | "admin";
    accessToken?: string;
    refreshToken?: string;
  }
}
