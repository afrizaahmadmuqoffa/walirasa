"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { ROLE_LABELS, type NavItem, type UserRole } from "@/lib/rbac/permissions";

function ItemIcon({ href }: { href: string }) {
  if (href.startsWith("/children")) {
    return <Users className="size-4" aria-hidden />;
  }
  if (href.startsWith("/reports")) {
    return <Sparkles className="size-4" aria-hidden />;
  }
  return <LayoutDashboard className="size-4" aria-hidden />;
}

function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: "#A2C5D9" }}
      >
        🐢
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-heading text-base font-semibold" style={{ color: "#2C4A5E" }}>
          WaliRasa
        </span>
        <span className="text-xs text-muted-foreground">Edukasi Inklusif</span>
      </div>
    </div>
  );
}

function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ease-out",
              isActive
                ? "bg-secondary/60 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ItemIcon href={item.href} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  items,
  role,
  fullName,
}: {
  items: NavItem[];
  role: UserRole;
  fullName: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r bg-card p-4 md:flex">
        <Brand />
        <NavList items={items} pathname={pathname} />
        <div className="mt-auto rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <span className="mb-1 block font-medium text-foreground">{fullName}</span>
          {ROLE_LABELS[role]}
        </div>
      </aside>

      <div className="flex items-center justify-between border-b bg-card px-4 py-2.5 md:hidden">
        <Brand />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Buka menu">
              <Sparkles className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetHeader className="p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <NavList items={items} pathname={pathname} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}