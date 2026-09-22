"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Helper lokal (bukan export) untuk menghindari pemanggilan antar server action.
async function runAcceptInvite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string
): Promise<{ success: boolean; childId: string | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, childId: null, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) {
    return { success: false, childId: null, error: error.message };
  }

  const result = data as unknown as {
    success?: boolean;
    error?: string;
    child_id?: string | null;
  };

  if (!result?.success) {
    return { success: false, childId: null, error: result?.error ?? "Undangan tidak valid." };
  }

  return { success: true, childId: result.child_id ?? null, error: null };
}

export async function signUpAndAcceptInvite({
  email,
  password,
  fullName,
  token,
}: {
  email: string;
  password: string;
  fullName: string;
  token: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: invite, error: inviteError } = await supabase.rpc("get_invite_details", {
    p_token: token,
  });
  if (inviteError) {
    return { error: "Undangan tidak valid atau kadaluwarsa." };
  }

  const inviteData = invite as unknown as {
    valid: boolean;
    access_role?: Database["public"]["Enums"]["access_role"];
    invite_email?: string | null;
  };

  if (!inviteData?.valid) {
    return { error: "Undangan tidak valid atau kadaluwarsa." };
  }

  if (inviteData.invite_email?.toLowerCase() !== email.trim().toLowerCase()) {
    return { error: "Email harus sama dengan email undangan." };
  }

  // role diputuskan server-side dari undangan (bukan dari input client).
  const { error: signUpError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim(), role: inviteData.access_role ?? "teacher" } },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const { success, error } = await runAcceptInvite(supabase, token);
  if (!success) {
    return { error: error ?? "Gagal menerima undangan." };
  }

  return { error: null };
}

export async function acceptInvite(
  token: string
): Promise<{ success: boolean; childId: string | null; error: string | null }> {
  const supabase = await createClient();
  return runAcceptInvite(supabase, token);
}