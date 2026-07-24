import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
