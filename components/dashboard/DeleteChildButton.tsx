"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { deleteChild } from "@/lib/actions/children";
import { Button } from "@/components/ui/button";

export function DeleteChildButton({ childId }: { childId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteChild(childId);
    setIsDeleting(false);

    if (result.error) {
      // AlertDialog sudah tertutup; navigasi tetap aman.
      return;
    }

    router.push("/children");
    router.refresh();
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-full"
    >
      {isDeleting ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Menghapus...
        </>
      ) : (
        "Ya, hapus"
      )}
    </Button>
  );
}