import { requireRole } from "@/lib/supabase/profile";
import { ChildForm } from "@/components/dashboard/ChildForm";

export default async function NewChildPage() {
  await requireRole(["parent"]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <ChildForm mode="create" />
    </div>
  );
}