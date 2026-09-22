"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { inviteEducator, type InviteResult } from "@/lib/actions/access";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AccessRole = "teacher" | "therapist";

export function InviteEducatorForm({ childId }: { childId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [accessRole, setAccessRole] = useState<AccessRole>("teacher");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    const res = await inviteEducator({
      childId,
      email,
      accessRole,
      expiresInDays: Number(expiresInDays),
    });

    setIsLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }

    setResult(res);
    setEmail("");
    router.refresh();
  }

  async function handleCopy() {
    if (!result?.inviteUrl) {
      return;
    }
    await navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Undang Guru / Terapis</CardTitle>
        <CardDescription>
          Kamu akan mendapat tautan undangan berbatas waktu. Guru berperan teacher, terapis
          berperan therapist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email penerima</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              required
              placeholder="nama@sekolah.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-role">Peran akses</Label>
              <Select
                value={accessRole}
                onValueChange={(v) => setAccessRole(v as AccessRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Guru</SelectItem>
                  <SelectItem value="therapist">Terapis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-expiry">Masa berlaku</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="invite-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 hari</SelectItem>
                  <SelectItem value="30">30 hari</SelectItem>
                  <SelectItem value="60">60 hari</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Membuat undangan...
              </>
            ) : (
              "Buat Undangan"
            )}
          </Button>
        </form>

        {result?.inviteUrl ? (
          <div className="mt-4 rounded-lg bg-accent/40 p-3">
            <p className="text-sm font-medium text-accent-foreground">Undangan dibuat!</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-background px-2 py-1 text-xs text-primary">
                {result.inviteUrl}
              </code>
              <Button variant="outline" size="sm" type="button" onClick={handleCopy}>
                {copied ? "Tersalin" : <Copy className="size-3.5" aria-hidden />}
                <span className="sr-only">Salin tautan</span>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}