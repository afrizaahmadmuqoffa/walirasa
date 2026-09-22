import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type UserRole } from "@/lib/rbac/permissions";
import { signOut } from "@/lib/actions/auth";

export function Topbar({ fullName, role }: { fullName: string; role: UserRole }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b bg-card px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">{fullName}</span>
        <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Keluar
        </Button>
      </form>
    </header>
  );
}