import { createClient } from "@/lib/supabase/server";

/**
 * Buat signed URL untuk avatar (bucket private) dengan masa berlaku singkat.
 * Hanya parent pemilik / educator berakses aktif yang bisa generate
 * (storage RLS memvalidasi lewat can_access_child).
 */
export async function getChildAvatarSignedUrl(
  avatarPath: string
): Promise<string | null> {
  if (!avatarPath) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 60);

  return data?.signedUrl ?? null;
}