import { auth } from "@/server/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any)?.role as string || "";

  return (
    <DashboardShell
      role={role}
      userName={session.user?.name || ""}
      userEmail={session.user?.email || ""}
      userImage={session.user?.image || null}
    >
      {children}
    </DashboardShell>
  );
}
