import { ChildForm } from "@/components/dashboard/ChildForm";

export default function NewChildPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <ChildForm mode="create" />
    </div>
  );
}