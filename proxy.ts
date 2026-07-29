import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Next.js 16でmiddleware規約はproxyに名称変更された。next-authのwithAuthヘルパーは
// 旧middleware規約向けのため、ここではgetToken()を直接使う実装にしている。
const ADMIN_PATHS = ["/dashboard", "/mail", "/heat-settings", "/acceptance", "/rules", "/issue", "/employees"];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && token.role !== "admin") {
    return NextResponse.redirect(new URL("/commute", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|login|_next|favicon.ico).*)"],
};
