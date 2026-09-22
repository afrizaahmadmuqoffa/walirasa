"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setIsLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session) {
      // Email confirmation masih menyala di project ini: user harus verifikasi dulu.
      setNotice("Akun dibuat. Periksa email kamu untuk tautan verifikasi, lalu masuk.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div
          aria-hidden
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: "#B5EAD7" }}
        >
          🐢
        </div>
        <CardTitle className="text-xl" style={{ color: "#2C4A5E" }}>
          Daftar WaliRasa
        </CardTitle>
        <CardDescription>
          Akun ini akan menjadi <strong>Orang Tua</strong> untuk anak yang kamu kelola.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full-name">Nama lengkap</Label>
            <Input
              id="full-name"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <PasswordInput
            id="password"
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
          {notice ? (
            <p role="status" className="rounded-lg bg-accent/40 p-3 text-sm text-accent-foreground">
              {notice}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Daftar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium underline-offset-4 hover:underline">
              Masuk
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}