import { ViewTransition } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardNav from "@/components/admin/AdminDashboardNav";
import { getSessionCookieName, verifySessionId } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authCookie = (await cookies()).get(getSessionCookieName())?.value;
  const session = authCookie ? await verifySessionId(authCookie) : null;

  if (!session) {
    redirect("/auth/login");
  }

  return (
    // Rises in from below when arriving from a successful login. The layout
    // persists across /dashboard/* tabs, so switching tabs never replays it.
    <ViewTransition
      enter={{ "login-success": "auto-scroll-in", default: "none" }}
      default="none"
    >
      <div className="flex min-h-screen flex-col">
        <AdminDashboardNav />
        <main className="flex-1">{children}</main>
      </div>
    </ViewTransition>
  );
}
