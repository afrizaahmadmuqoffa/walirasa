"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signUpAndAcceptInvite } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function InviteRegisterForm({
  inviteToken,
  prefilledEmail,
  childFullName,
}: {
  inviteToken: string;
  prefilledEmail: string;
  childFullName: string | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await signUpAndAcceptInvite({
      email: prefilledEmail,
      password,
      fullName,
      token: inviteToken,
    });

    setIsLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }

    router.push("/my-children");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div
          aria-hidden
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: "#A2C5D9" }}
        >
          🐢
        </div>
        <CardTitle className="text-xl" style={{ color: "#2C4A5E" }}>
          Terima Undangan
        </CardTitle>
        <CardDescription>
          Buat akun untuk membantu{" "}
          <strong>{childFullName ?? "anak"}</strong> Anda. Email tidak bisa diubah karena
          mengikuti undangan.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email (dari undangan)</Label>
            <Input id="invite-email" type="email" value={prefilledEmail} readOnly disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-full-name">Nama lengkap</Label>
            <Input
              id="invite-full-name"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <PasswordInput
            id="invite-password"
            label="Kata sandi"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={setPassword}
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Membuat akun...
              </>
            ) : (
              "Buat Akun & Terima Undangan"
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}