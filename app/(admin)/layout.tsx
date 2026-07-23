import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/commute");
  }
  return (
    <AppShell role="admin" userName={session.user.name ?? ""} userEmail={session.user.email ?? ""}>
      {children}
    </AppShell>
  );
}
