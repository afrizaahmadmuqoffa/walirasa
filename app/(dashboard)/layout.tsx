import type { ReactNode } from "react";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getNavItemsByRole } from "@/lib/rbac/permissions";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  const navItems = getNavItemsByRole(profile.role);

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <Sidebar items={navItems} role={profile.role} fullName={profile.fullName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar fullName={profile.fullName} role={profile.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}