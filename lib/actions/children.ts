"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ChildRow = Database["public"]["Tables"]["children"]["Row"];
type ChildInsert = Database["public"]["Tables"]["children"]["Insert"];
type ChildUpdate = Database["public"]["Tables"]["children"]["Update"];

export type AsdSupportLevel = "level_1" | "level_2" | "level_3" | null;

export type ChildInput = {
  full_name: string;
  nickname?: string | null;
  birth_date?: string | null;
  asd_support_level?: AsdSupportLevel;
  notes?: string | null;
};

function validateChildInput(input: ChildInput): string | null {
  if (!input.full_name || input.full_name.trim().length === 0) {
    return "Nama lengkap wajib diisi.";
  }
  if (input.full_name.trim().length > 200) {
    return "Nama lengkap terlalu panjang.";
  }
  if (
    input.asd_support_level !== null &&
    input.asd_support_level !== undefined &&
    !["level_1", "level_2", "level_3"].includes(input.asd_support_level)
  ) {
    return "Tingkat dukungan ASD tidak valid.";
  }
  return null;
}

function toInsert(input: ChildInput, userId: string): ChildInsert {
  return {
    parent_id: userId,
    full_name: input.full_name.trim(),
    nickname: input.nickname?.trim() || null,
    birth_date: input.birth_date || null,
    asd_support_level: input.asd_support_level ?? null,
    notes: input.notes?.trim() || null,
  };
}

function toUpdate(input: ChildInput): ChildUpdate {
  return {
    full_name: input.full_name.trim(),
    nickname: input.nickname?.trim() || null,
    birth_date: input.birth_date || null,
    asd_support_level: input.asd_support_level ?? null,
    notes: input.notes?.trim() || null,
  };
}

export async function getChildrenByParent(): Promise<ChildRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("children")
    .select("*")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function getChild(childId: string): Promise<ChildRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("children")
    .select("*")
    .eq("id", childId)
    .maybeSingle();

  return data;
}

export async function createChild(
  input: ChildInput
): Promise<{ childId: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { childId: null, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const validationError = validateChildInput(input);
  if (validationError) {
    return { childId: null, error: validationError };
  }

  const { data, error } = await supabase
    .from("children")
    .insert(toInsert(input, user.id))
    .select("id")
    .single();

  if (error) {
    return { childId: null, error: error.message };
  }

  revalidatePath("/children");
  return { childId: data.id, error: null };
}

export async function updateChild(
  childId: string,
  input: ChildInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const validationError = validateChildInput(input);
  if (validationError) {
    return { error: validationError };
  }

  // RLS menjamin hanya parent pemilik yang bisa update baris ini.
  const { error } = await supabase
    .from("children")
    .update(toUpdate(input))
    .eq("id", childId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/children/${childId}`);
  revalidatePath("/children");
  return { error: null };
}

export async function setChildAvatar(
  childId: string,
  avatarPath: string
): Promise<{ error: string | null }> {
  if (!childId || !avatarPath) {
    return { error: "Parameter avatar tidak lengkap." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const { error } = await supabase
    .from("children")
    .update({ avatar_url: avatarPath })
    .eq("id", childId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/children/${childId}`);
  revalidatePath("/children");
  return { error: null };
}

export async function deleteChild(
  childId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  // Ambil path avatar lama dulu supaya file di storage ikut dihapus.
  const { data: existing } = await supabase
    .from("children")
    .select("avatar_url")
    .eq("id", childId)
    .maybeSingle();

  if (existing?.avatar_url) {
    const { error: storageError } = await supabase.storage
      .from("avatars")
      .remove([existing.avatar_url]);
    if (storageError) {
      return { error: `Gagal menghapus avatar: ${storageError.message}` };
    }
  }

  // RLS: hanya parent pemilik yang bisa delete baris ini (cascade ke data terkait).
  const { error } = await supabase.from("children").delete().eq("id", childId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/children");
  return { error: null };
}