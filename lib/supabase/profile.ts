import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

export type CurrentProfile = {
  userId: string;
  fullName: string;
  role: UserRole;
};

export async function getCurrentProfile(): Promise<CurrentProfile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return {
    userId: user.id,
    fullName: profile.full_name,
    role: profile.role,
  };
}

export type GuardOptions = {
  redirectTo?: string;
};

export async function requireRole(
  allowedRoles: UserRole[],
  options: GuardOptions = {}
): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!allowedRoles.includes(profile.role)) {
    redirect(options.redirectTo ?? "/login");
  }
  return profile;
}