import type { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

export const ROLE_LABELS: Record<UserRole, string> = {
  parent: "Orang Tua",
  teacher: "Guru",
  therapist: "Terapis",
};

export type NavItem = {
  label: string;
  href: string;
};

export function getNavItemsByRole(role: UserRole): NavItem[] {
  const items: NavItem[] = [{ label: "Dashboard", href: "/dashboard" }];

  if (role === "parent") {
    items.push({ label: "Profil Anak", href: "/children" });
    return items;
  }

  // Fase 3: teacher/therapist menambahkan "Anak yang Saya Bantu".
  return items;
}