"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type AacCardRow = Database["public"]["Tables"]["aac_cards"]["Row"];
type AacCategoryRow = Database["public"]["Tables"]["aac_categories"]["Row"];

// Reasonably safe uuid check, mirip pola guard di lib/actions lain.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AacCardView = AacCardRow & {
  category_name: string | null;
  is_template: boolean;
};

export type AacCategoryInput = {
  name: string;
};

export type AacCardInput = {
  category_id: string | null;
  label_text: string;
  icon_url: string;
  audio_text: string;
};

function validateCategoryName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Nama kategori wajib diisi.";
  }
  if (name.trim().length > 100) {
    return "Nama kategori terlalu panjang. Maksimal 100 karakter.";
  }
  return null;
}

function validateCardInput(input: AacCardInput): string | null {
  if (!input.label_text || input.label_text.trim().length === 0) {
    return "Label kartu wajib diisi.";
  }
  if (input.label_text.trim().length > 100) {
    return "Label kartu terlalu panjang. Maksimal 100 karakter.";
  }
  if (!input.audio_text || input.audio_text.trim().length === 0) {
    return "Teks suara wajib diisi.";
  }
  if (input.audio_text.trim().length > 300) {
    return "Teks suara terlalu panjang. Maksimal 300 karakter.";
  }
  if (!input.icon_url || input.icon_url.trim().length === 0) {
    return "Icon kartu wajib diunggah.";
  }
  return null;
}

/**
 * Ambil kategori milik anak (child-scoped). Dipakai editor AAC.
 * Kategori template global tidak dikelola via app (read-only).
 */
export async function getChildAacCategories(
  childId: string
): Promise<AacCategoryRow[]> {
  if (!UUID_RE.test(childId)) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("aac_categories")
    .select("*")
    .eq("child_id", childId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return data ?? [];
}

/**
 * Ambil kategori global (template) + kategori milik anak untuk keperluan
 * board read-only (kategori template ikut tampil sebelum kategori anak).
 */
export async function getAacBoardCategories(
  childId: string
): Promise<AacCategoryRow[]> {
  if (!UUID_RE.test(childId)) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("aac_categories")
    .select("*")
    .or(`child_id.eq.${childId},child_id.is.null`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return data ?? [];
}

/** Ambil kartu AAC anak + kartu template global, aktif semua, berurutan. */
export async function getAacCardsByChild(
  childId: string
): Promise<AacCardView[]> {
  if (!UUID_RE.test(childId)) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 2 query terpisah + join manual: supabase-js typed join dengan nullable
  // FK kadang bermasalah, manual join lebih stabil & transparan.
  const { data: cards } = await supabase
    .from("aac_cards")
    .select("*")
    .or(`child_id.eq.${childId},child_id.is.null`)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: categories } = await supabase
    .from("aac_categories")
    .select("id, name")
    .or(`child_id.eq.${childId},child_id.is.null`);

  if (!cards) return [];

  const nameById: Record<string, string> = {};
  for (const c of categories ?? []) {
    nameById[c.id] = c.name;
  }

  return cards.map((card) => ({
    ...card,
    category_name: card.category_id ? (nameById[card.category_id] ?? null) : null,
    is_template: card.child_id === null,
  }));
}

/** Buat kategori baru milik anak (RLS: hanya parent/educator berakses). */
export async function createAacCategory(
  childId: string,
  input: AacCategoryInput
): Promise<{ categoryId: string | null; error: string | null }> {
  if (!UUID_RE.test(childId)) {
    return { categoryId: null, error: "ID anak tidak valid." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { categoryId: null, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const validationError = validateCategoryName(input.name);
  if (validationError) {
    return { categoryId: null, error: validationError };
  }

  const { count } = await supabase
    .from("aac_categories")
    .select("*", { count: "exact", head: true })
    .eq("child_id", childId);

  const { data, error } = await supabase
    .from("aac_categories")
    .insert({
      child_id: childId,
      name: input.name.trim(),
      sort_order: (count ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error) {
    return { categoryId: null, error: error.message };
  }

  revalidatePath(`/children/${childId}/aac-editor`);
  return { categoryId: data.id, error: null };
}

/** Buat kartu AAC milik anak. */
export async function createAacCard(
  childId: string,
  input: AacCardInput
): Promise<{ cardId: string | null; error: string | null }> {
  if (!UUID_RE.test(childId)) {
    return { cardId: null, error: "ID anak tidak valid." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { cardId: null, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const validationError = validateCardInput(input);
  if (validationError) {
    return { cardId: null, error: validationError };
  }

  const { count } = await supabase
    .from("aac_cards")
    .select("*", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("category_id", input.category_id);

  const { data, error } = await supabase
    .from("aac_cards")
    .insert({
      child_id: childId,
      category_id: input.category_id,
      label_text: input.label_text.trim(),
      icon_url: input.icon_url.trim(),
      audio_text: input.audio_text.trim(),
      sort_order: (count ?? 0) + 1,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { cardId: null, error: error.message };
  }

  revalidatePath(`/children/${childId}/aac-editor`);
  revalidatePath(`/play/${childId}/aac`);
  return { cardId: data.id, error: null };
}

/** Update kartu AAC milik anak (RLS blocking UPDATE = tidak mengubah baris). */
export async function updateAacCard(
  childId: string,
  cardId: string,
  input: AacCardInput
): Promise<{ error: string | null }> {
  if (!UUID_RE.test(childId) || !UUID_RE.test(cardId)) {
    return { error: "ID tidak valid." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const validationError = validateCardInput(input);
  if (validationError) {
    return { error: validationError };
  }

  // Scoping ke child_id: mengganti kartu milik anak sendiri. RLS menolak
  // akses ke kartu milik orang lain (error null + 0 rows), jadi verifikasi
  // hasil update via select.
  const { data, error } = await supabase
    .from("aac_cards")
    .update({
      category_id: input.category_id,
      label_text: input.label_text.trim(),
      icon_url: input.icon_url.trim(),
      audio_text: input.audio_text.trim(),
      created_by: user.id,
    })
    .eq("id", cardId)
    .eq("child_id", childId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: "Kartu tidak ditemukan atau kamu tidak punya akses." };
  }

  revalidatePath(`/children/${childId}/aac-editor`);
  revalidatePath(`/play/${childId}/aac`);
  return { error: null };
}

/** Hapus kartu AAC milik anak beserta file icon-nya di storage. */
export async function deleteAacCard(
  childId: string,
  cardId: string
): Promise<{ error: string | null }> {
  if (!UUID_RE.test(childId) || !UUID_RE.test(cardId)) {
    return { error: "ID tidak valid." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const { data: existing } = await supabase
    .from("aac_cards")
    .select("icon_url")
    .eq("id", cardId)
    .eq("child_id", childId)
    .maybeSingle();
  if (!existing) {
    return { error: "Kartu tidak ditemukan atau kamu tidak punya akses." };
  }

  const { data: deleted } = await supabase
    .from("aac_cards")
    .delete()
    .eq("id", cardId)
    .eq("child_id", childId)
    .select("icon_url")
    .single();

  if (!deleted) {
    return { error: "Tidak bisa menghapus kartu ini." };
  }

  // Hapus file icon di storage hanya kalau icon milik folder anak (path
  // diawali childId); icon global/template (child_id null) tak pernah
  // dihapus lewat alur ini.
  if (deleted.icon_url.startsWith(`${childId}/`)) {
    const { error: storageError } = await supabase.storage
      .from("aac-icons")
      .remove([deleted.icon_url]);
    if (storageError) {
      return { error: `Kartu terhapus, tapi icon gagal dihapus: ${storageError.message}` };
    }
  }

  revalidatePath(`/children/${childId}/aac-editor`);
  revalidatePath(`/play/${childId}/aac`);
  return { error: null };
}

/**
 * Urutkan ulang kartu sesuai urutan array yang diberikan (hasil drag-drop
 * di dalam satu tab kategori). Hanya kartu milik anak yang di-update;
 * kartu template global (child_id null) tidak bisa di-reorder via app.
 */
export async function reorderAacCards(
  childId: string,
  orderedCardIds: string[]
): Promise<{ error: string | null }> {
  if (!UUID_RE.test(childId)) {
    return { error: "ID anak tidak valid." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  let lastError: string | null = null;
  for (let i = 0; i < orderedCardIds.length; i++) {
    const cardId = orderedCardIds[i];
    if (!UUID_RE.test(cardId)) continue;

    const { data, error } = await supabase
      .from("aac_cards")
      .update({ sort_order: i + 1 })
      .eq("id", cardId)
      .eq("child_id", childId)
      .select("id")
      .maybeSingle();

    if (error) {
      lastError = error.message;
      break;
    }
    if (!data) {
      lastError = "Salah satu kartu tidak ditemukan.";
      break;
    }
  }

  revalidatePath(`/children/${childId}/aac-editor`);
  revalidatePath(`/play/${childId}/aac`);
  return { error: lastError };
}

/**
 * Catat pemakaian kartu (append-only). Dipanggil AACGrid saat anak mengetuk
 * kartu. Sebelumnya TTS dibacakan di browser; hanya metadata (child+card)
 * yang dikirim ke server. RLS: insert bila can_access_child(child_id).
 */
export async function logAacCardUsage(
  childId: string,
  cardId: string
): Promise<{ error: string | null }> {
  if (!UUID_RE.test(childId) || !UUID_RE.test(cardId)) {
    return { error: "ID tidak valid." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const { error } = await supabase.from("aac_usage_logs").insert({
    child_id: childId,
    card_id: cardId,
  });

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}