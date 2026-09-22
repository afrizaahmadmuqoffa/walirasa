import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAacBoardCategories, getAacCardsByChild } from "@/lib/actions/aac";
import { getAacIconUrl } from "@/lib/supabase/aac-icon-server";
import { ZenLayout } from "@/components/sensory/ZenLayout";
import { AACGrid, type AacBoardGroup } from "@/components/aac/AACGrid";

type Props = {
  params: Promise<{ childId: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidChildId(id: string): boolean {
  return UUID_RE.test(id);
}

export default async function AacBoardPage({ params }: Props) {
  const { childId } = await params;

  if (!isValidChildId(childId)) {
    notFound();
  }

  // Verifikasi akses aktif: parent pemilik ATAU educator berakses aktif.
  const supabase = await createClient();
  const { data: canAccess } = await supabase.rpc("can_access_child", {
    p_child_id: childId,
  });
  if (!canAccess) {
    notFound();
  }

  const [categories, cards] = await Promise.all([
    getAacBoardCategories(childId),
    getAacCardsByChild(childId),
  ]);

  // Resolve signed URL icon per kartu (template global + milik anak).
  const iconCache = new Map<string, string | null>();
  async function resolveIcon(url: string): Promise<string | null> {
    if (iconCache.has(url)) return iconCache.get(url) ?? null;
    const resolved = await getAacIconUrl(url);
    iconCache.set(url, resolved);
    return resolved;
  }

  const groups: AacBoardGroup[] = categories.map((cat) => ({
    name: cat.name,
    categoryId: cat.id,
    cards: [],
  }));
  // Kartu tanpa kategori → grup biasa "Umum" di akhir.
  const uncategorized: AacBoardGroup = {
    name: "Umum",
    categoryId: null,
    cards: [],
  };

  for (const card of cards) {
    const resolved = await resolveIcon(card.icon_url);
    const boardCard = {
      id: card.id,
      labelText: card.label_text,
      audioText: card.audio_text,
      iconUrl: resolved,
    };
    const group = groups.find((g) => g.categoryId === card.category_id);
    if (group) {
      group.cards.push(boardCard);
    } else {
      uncategorized.cards.push(boardCard);
    }
  }

  if (uncategorized.cards.length > 0) {
    groups.push(uncategorized);
  }

  return (
    <ZenLayout>
      <AACGrid childId={childId} groups={groups} />
    </ZenLayout>
  );
}