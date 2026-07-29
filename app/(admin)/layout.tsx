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
  const dbSheetUrl = process.env.SYSTEM_DB_SPREADSHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${process.env.SYSTEM_DB_SPREADSHEET_ID}/edit`
    : undefined;

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      dbSheetUrl={dbSheetUrl}
    >
      {children}
    </AppShell>
  );
}
