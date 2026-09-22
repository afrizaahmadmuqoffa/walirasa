"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type AccessRow = Database["public"]["Tables"]["child_access"]["Row"];
type AccessRole = Database["public"]["Enums"]["access_role"];

export type InviteInput = {
  childId: string;
  email: string;
  accessRole: AccessRole;
  expiresInDays: number;
};

export type InviteResult = {
  inviteUrl: string | null;
  error: string | null;
};

const VALID_EXPIRY_DAYS = [7, 30, 60];

function validateInviteInput(input: InviteInput): string | null {
  if (!input.childId) {
    return "Anak belum dipilih.";
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return "Alamat email tidak valid.";
  }
  if (input.accessRole !== "teacher" && input.accessRole !== "therapist") {
    return "Peran akses tidak valid.";
  }
  if (!Number.isInteger(input.expiresInDays) || !VALID_EXPIRY_DAYS.includes(input.expiresInDays)) {
    return "Masa berlaku harus 7, 30, atau 60 hari.";
  }
  return null;
}

async function buildInviteUrl(token: string): Promise<string> {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "https";
  const host = forwardedHost ?? headerStore.get("host") ?? "localhost:3000";

  return `${forwardedProto}://${host}/invite/${token}`;
}

export async function getAccessByChild(childId: string): Promise<AccessRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("child_access")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function inviteEducator(input: InviteInput): Promise<InviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { inviteUrl: null, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const validationError = validateInviteInput(input);
  if (validationError) {
    return { inviteUrl: null, error: validationError };
  }

  const { data, error } = await supabase
    .from("child_access")
    .insert({
      child_id: input.childId,
      educator_id: null,
      invited_by: user.id,
      access_role: input.accessRole,
      invite_email: input.email.trim(),
      expires_at: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("invite_token")
    .single();

  if (error || !data) {
    return { inviteUrl: null, error: error?.message ?? "Gagal membuat undangan." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "invite_educator",
    target_table: "child_access",
    child_id: input.childId,
    metadata: {
      invite_email: input.email.trim(),
      access_role: input.accessRole,
      expires_in_days: input.expiresInDays,
    },
  });

  const inviteUrl = await buildInviteUrl(data.invite_token);
  revalidatePath(`/children/${input.childId}/access`);
  return { inviteUrl, error: null };
}

export async function revokeAccess(accessId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  // Ambil child_id untuk audit + revalidate.
  const { data: existing } = await supabase
    .from("child_access")
    .select("id, child_id")
    .eq("id", accessId)
    .maybeSingle();

  // RLS menjamin hanya parent pemilik yang bisa update baris ini.
  const { error } = await supabase
    .from("child_access")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", accessId);

  if (error) {
    return { error: error.message };
  }

  if (existing?.child_id) {
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "revoke_access",
      target_table: "child_access",
      target_id: accessId,
      child_id: existing.child_id,
    });
    revalidatePath(`/children/${existing.child_id}/access`);
  }
  return { error: null };
}

export type AccessibleChild = {
  child_id: string;
  full_name: string;
  nickname: string | null;
  avatar_url: string | null;
  access_role: AccessRole;
  expires_at: string;
};

export async function getMyAccessibleChildren(): Promise<AccessibleChild[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // RLS: educator_views_own_grant (SELECT) + educator_views_assigned_child (children).
  const { data: grants } = await supabase
    .from("child_access")
    .select("child_id, access_role, expires_at, children(full_name, nickname, avatar_url)")
    .eq("educator_id", user.id)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString());

  if (!grants) {
    return [];
  }

  return grants.flatMap((grant) => {
    const child = Array.isArray(grant.children)
      ? (grant.children[0] as { full_name: string; nickname: string | null; avatar_url: string | null } | undefined)
      : (grant.children as unknown as {
          full_name: string;
          nickname: string | null;
          avatar_url: string | null;
        });
    if (!child) {
      return [];
    }
    return [
      {
        child_id: grant.child_id,
        full_name: child.full_name,
        nickname: child.nickname,
        avatar_url: child.avatar_url,
        access_role: grant.access_role as AccessRole,
        expires_at: grant.expires_at,
      },
    ];
  });
}

export async function getInviteDetailsServer(
  token: string
): Promise<{
  valid: boolean;
  reason?: string;
  accessRole?: AccessRole;
  expiresAt?: string;
  childId?: string;
  childFullName?: string | null;
  inviteEmail?: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invite_details", { p_token: token });

  if (error) {
    return { valid: false, reason: "not_found" };
  }

  const result = data as unknown as {
    valid: boolean;
    reason?: string;
    access_role?: AccessRole;
    expires_at?: string;
    child_id?: string;
    child_full_name?: string | null;
    invite_email?: string | null;
  };

  if (!result.valid) {
    return { valid: false, reason: result.reason };
  }

  return {
    valid: true,
    accessRole: result.access_role,
    expiresAt: result.expires_at,
    childId: result.child_id,
    childFullName: result.child_full_name,
    inviteEmail: result.invite_email,
  };
}