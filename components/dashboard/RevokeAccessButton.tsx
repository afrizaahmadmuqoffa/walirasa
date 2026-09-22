"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { revokeAccess } from "@/lib/actions/access";
import { Button } from "@/components/ui/button";

export function RevokeAccessButton({ accessId }: { accessId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    setIsLoading(true);
    setError(null);
    const res = await revokeAccess(accessId);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        type="button"
        disabled={isLoading}
        onClick={handleRevoke}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Memproses...
          </>
        ) : (
          "Cabut Akses"
        )}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}