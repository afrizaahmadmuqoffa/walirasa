import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChild } from "@/lib/actions/children";
import { requireRole } from "@/lib/supabase/profile";
import {
  getChildAacCategories,
  getAacCardsByChild,
} from "@/lib/actions/aac";
import { getAacIconUrl } from "@/lib/supabase/aac-icon-server";
import { AACEditor, type EditorCard } from "@/components/aac/AACEditor";

type Props = {
  params: Promise<{ childId: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AacEditorPage({ params }: Props) {
  const { childId } = await params;

  if (!UUID_RE.test(childId)) {
    notFound();
  }

  // Akses editor: parent pemilik ATAU educator dengan akses aktif.
  await requireRole(["parent", "teacher", "therapist"]);

  const supabase = await createClient();
  const { data: canAccess } = await supabase.rpc("can_access_child", {
    p_child_id: childId,
  });
  if (!canAccess) {
    notFound();
  }

  const child = await getChild(childId);
  if (!child) {
    notFound();
  }

  const [categories, cards] = await Promise.all([
    getChildAacCategories(childId),
    getAacCardsByChild(childId),
  ]);

  // Resolve signed URL icon untuk semua kartu yang tampil di editor,
  // lalu pisahkan kartu milik anak vs template global.
  const items = await Promise.all(
    cards.map(async (card): Promise<EditorCard> => ({
      id: card.id,
      labelText: card.label_text,
      audioText: card.audio_text,
      iconUrl: await getAacIconUrl(card.icon_url),
      iconStoragePath: card.icon_url,
      categoryId: card.category_id,
    }))
  );

  const templates: EditorCard[] = [];
  const owned: EditorCard[] = [];
  cards.forEach((card, i) => {
    if (card.is_template) {
      templates.push(items[i]);
    } else {
      owned.push(items[i]);
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <AACEditor
        childId={childId}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        cards={owned}
        templates={templates}
        childName={child.full_name}
      />
    </div>
  );
}