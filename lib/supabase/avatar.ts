import { createClient } from "@/lib/supabase/client";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Upload avatar anak ke bucket private 'avatars' dari sisi browser.
 * Path di dalam bucket: {childId}/{name} (bucket_id terpisah, jadi prefix
 * 'avatars/' TIDAK boleh dipakai sebagai nama objek). Storage RLS memvalidasi
 * bahwa user yang meng-upload adalah parent pemilik anak tsb.
 * Mengembalikan path (relatif bucket) — server membuat signed URL saat render.
 */
export async function uploadChildAvatar(
  childId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  if (!file.type.startsWith("image/")) {
    return { path: null, error: "File harus berupa gambar (JPG, PNG, atau WebP)." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { path: null, error: "Ukuran gambar maksimal 2 MB." };
  }

  const ext = EXT_BY_MIME[file.type] ?? ".png";
  const name = `${crypto.randomUUID()}${ext}`;
  const path = `${childId}/${name}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

/** Hapus avatar lama (dari client, sebelum upload pengganti). */
export async function deleteChildAvatar(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from("avatars").remove([path]);
}