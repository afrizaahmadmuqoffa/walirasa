import { createClient } from "@/lib/supabase/client";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

/**
 * Upload icon kartu AAC ke bucket private 'aac-icons' dari sisi browser.
 * Path: {childId}/{uuid}{ext} — bucket sudah punya RLS: hanya user dengan
 * can_access_child(child_id) (parent pemilik / educator aktif) yang boleh
 * upload ke folder anak tsb. Mengembalikan path relatif bucket.
 */
export async function uploadAacIcon(
  childId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  if (!file.type.startsWith("image/")) {
    return { path: null, error: "File harus berupa gambar (PNG, JPG, atau SVG)." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { path: null, error: "Ukuran gambar maksimal 2 MB." };
  }

  const ext = EXT_BY_MIME[file.type] ?? ".png";
  const name = `${crypto.randomUUID()}${ext}`;
  const path = `${childId}/${name}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from("aac-icons").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

/** Hapus icon kartu lama dari storage (dipanggil dari sisi client). */
export async function deleteAacIcon(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from("aac-icons").remove([path]);
}