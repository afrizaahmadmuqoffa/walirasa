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

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);
    if (error) {
      setError(error.message);
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
          style={{ backgroundColor: "#A2C5D9" }}
        >
          🐢
        </div>
        <CardTitle className="text-xl" style={{ color: "#2C4A5E" }}>
          Masuk ke WaliRasa
        </CardTitle>
        <CardDescription>
          Silakan masuk dengan akun orang tua, guru, atau terapis.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Masuk"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium underline-offset-4 hover:underline">
              Daftar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}