"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "cn";
import { SensoryButton } from "@/components/sensory/SensoryButton";

/**
 * ZenLayout — wadah full-screen untuk area anak (mode tenang):
 * menghilangkan navbar, sidebar, dan notifikasi. Anak fokus penuh pada
 * satu aktivitas. Ada tombol "Keluar" kecil untuk kembali ke dashboard.
 * Palet: #E9F1F5 background, aksen #A2C5D9.
 */
export function ZenLayout({
  children,
  className,
  exitHref = "/dashboard",
}: {
  children: React.ReactNode;
  className?: string;
  exitHref?: string;
}) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex min-h-svh w-full flex-col bg-[#E9F1F5]",
        className
      )}
    >
      <header className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-base font-semibold" style={{ color: "#5C7686" }}>
          WaliRasa
        </span>
        <SensoryButton
          color="muted"
          size="sm"
          aria-label="Keluar dari mode anak"
          onClick={() => router.push(exitHref)}
        >
          <Home className="size-5" aria-hidden />
          Keluar
        </SensoryButton>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-6">
        {children}
      </main>
    </div>
  );
}