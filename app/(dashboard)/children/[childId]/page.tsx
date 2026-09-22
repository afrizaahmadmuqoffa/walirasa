import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getChild } from "@/lib/actions/children";
import { getChildAvatarSignedUrl } from "@/lib/supabase/avatar-server";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChildForm } from "@/components/dashboard/ChildForm";
import { DeleteChildButton } from "@/components/dashboard/DeleteChildButton";

type Props = {
  params: Promise<{ childId: string }>;
};

export default async function ChildDetailPage({ params }: Props) {
  const { childId } = await params;
  const child = await getChild(childId);

  if (!child) {
    notFound();
  }

  const avatarUrl = child.avatar_url
    ? await getChildAvatarSignedUrl(child.avatar_url)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#2C4A5E" }}>
            {child.full_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {child.nickname ? `"${child.nickname}" · ` : ""}Edit data dan foto anak.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" type="button">
              <Trash2 className="size-4" aria-hidden />
              Hapus
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus anak ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Seluruh data milik {child.full_name} (log AAC, emosi, cerita, progress) akan
                ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction asChild>
                <DeleteChildButton childId={child.id} />
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ChildForm
        mode="edit"
        childId={child.id}
        initial={{
          fullName: child.full_name,
          nickname: child.nickname,
          birthDate: child.birth_date,
          asdSupportLevel: child.asd_support_level,
          notes: child.notes,
          avatarPath: child.avatar_url,
          avatarUrl,
        }}
      />
    </div>
  );
}