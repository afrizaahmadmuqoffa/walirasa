import { createClient } from "@/lib/supabase/server";

/**
 * Resolve icon kartu AAC untuk dirender di board/editor.
 * - icon_url bisa berupa path storage relatif bucket ('{childId}/...' atau
 *   'global/...') → dibuatkan signed URL singkat via storage RLS.
 * - icon_url bisa berupa full URL luar (misal data: URI) → langsung dipakai.
 */
export async function getAacIconUrl(iconUrl: string): Promise<string | null> {
  if (!iconUrl) {
    return null;
  }
  if (/^(https?:)?\/\//i.test(iconUrl) || iconUrl.startsWith("data:")) {
    return iconUrl;
  }

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("aac-icons")
    .createSignedUrl(iconUrl, 600);

  return data?.signedUrl ?? null;
}