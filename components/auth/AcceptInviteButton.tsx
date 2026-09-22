"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { acceptInvite } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setIsLoading(true);
    setError(null);
    const res = await acceptInvite(token);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error ?? "Gagal menerima undangan.");
      return;
    }

    router.push("/my-children");
    router.refresh();
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button type="button" className="w-full" disabled={isLoading} onClick={handleAccept}>
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Memproses...
          </>
        ) : (
          "Terima Undangan"
        )}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}