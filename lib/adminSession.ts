import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/** admin以外(未ログイン含む)の場合はnullを返す。API Route側で403にする際に使う。 */
export async function requireAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}
