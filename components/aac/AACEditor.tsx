"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "cn";
import {
  createAacCategory,
  createAacCard,
  updateAacCard,
  deleteAacCard,
  reorderAacCards,
} from "@/lib/actions/aac";
import {
  uploadAacIcon,
  deleteAacIcon,
} from "@/lib/supabase/aac-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type EditorCard = {
  id: string;
  labelText: string;
  audioText: string;
  iconUrl: string | null;
  iconStoragePath: string | null;
  categoryId: string | null;
};

type EditorCategory = {
  id: string;
  name: string;
};

/**
 * AAC Editor — kelola kategori & kartu milik anak (dan hanya memakai kartu
 * milik anak; template global tampil read-only). Reorder kartu memakai
 * @dnd-kit/sortable (library drag-drop paling stabil & populer, support
 * pointer/touch untuk tablet, aksesibel via KeyboardSensor bila ditambah).
 * Alasannya: native HTML5 DnD tidak konsisten di touch; dnd-kit dipakai
 * luas & terawat aktif, cocok untuk grid kartu AAC.
 */
export function AACEditor({
  childId,
  categories: initialCategories,
  cards: initialCards,
  templates,
  childName,
}: {
  childId: string;
  categories: EditorCategory[];
  cards: EditorCard[];
  templates: EditorCard[];
  childName: string;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<EditorCategory[]>(initialCategories);
  const [cards, setCards] = useState<EditorCard[]>(initialCards);

  // Tab aktif: id kategori atau null (Tanpa Kategori).
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    categories[0]?.id ?? null
  );

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<EditorCard | null>(null);
  const [deletingCard, setDeletingCard] = useState<EditorCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeCards = useMemo(
    () =>
      cards.filter(
        (c) => (c.categoryId ?? null) === (activeCategoryId ?? null)
      ),
    [cards, activeCategoryId]
  );

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setCategoryError(null);
    const result = await createAacCategory(childId, { name: newCategoryName });
    if (result.error) {
      setCategoryError(result.error);
      return;
    }
    if (result.categoryId) {
      setCategories((prev) => [
        ...prev,
        { id: result.categoryId!, name: newCategoryName.trim() },
      ]);
    }
    setNewCategoryName("");
    setIsCreatingCategory(false);
    router.refresh();
  }

  async function handleCardSaved(saved: EditorCard) {
    // Disisipkan/update di state lokal lalu refresh server utk data asli.
    setCards((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved];
    });
    setIsCreatingCard(false);
    setEditingCard(null);
    router.refresh();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeCards.findIndex((c) => c.id === active.id);
    const newIndex = activeCards.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(activeCards, oldIndex, newIndex);
    setCards((prev) => {
      const others = prev.filter(
        (c) => (c.categoryId ?? null) !== (activeCategoryId ?? null)
      );
      return [...others, ...next];
    });

    // Simpan urutan baru ke server (order per tab yang sedang aktif).
    void reorderAacCards(
      childId,
      next.map((c) => c.id)
    ).then(({ error }) => {
      if (error) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle style={{ color: "#2C4A5E" }}>
            Papan Komunikasi — {childName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Rapikan kartu dengan menyeretnya. Kartu template global
            berjumlah {templates.length} dan otomatis ikut tampil di board.
          </p>
        </CardHeader>
      </Card>

      {/* Tab kategori */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeCategoryId === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategoryId(null)}
        >
          Tanpa Kategori
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategoryId === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategoryId(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
        {!isCreatingCategory ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreatingCategory(true)}
          >
            <Plus className="size-4" aria-hidden />
            Kategori
          </Button>
        ) : (
          <form
            onSubmit={handleCreateCategory}
            className="flex items-center gap-2"
          >
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori"
              className="h-9 w-44"
              autoFocus
              required
            />
            <Button size="sm" type="submit">
              Simpan
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setIsCreatingCategory(false)}
            >
              Batal
            </Button>
          </form>
        )}
      </div>
      {categoryError ? (
        <p role="alert" className="text-sm text-destructive">
          {categoryError}
        </p>
      ) : null}

      {/* Daftar kartu di tab aktif */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "#2C4A5E" }}>
              {categories.find((c) => c.id === activeCategoryId)?.name ??
                "Tanpa Kategori"}
            </h3>
            <Button
              size="sm"
              onClick={() => {
                setEditingCard(null);
                setIsCreatingCard(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Tambah Kartu
            </Button>
          </div>

          {activeCards.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada kartu di kategori ini.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeCards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-2">
                  {activeCards.map((card) => (
                    <SortableCardItem
                      key={card.id}
                      card={card}
                      onEdit={() => {
                        setEditingCard(card);
                        setIsCreatingCard(true);
                      }}
                      onDelete={() => setDeletingCard(card)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Form tambah/edit kartu */}
      {isCreatingCard ? (
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#2C4A5E" }}>
              {editingCard ? "Edit Kartu" : "Tambah Kartu Baru"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AacCardForm
              childId={childId}
              categoryId={activeCategoryId}
              categories={categories}
              existing={editingCard}
              onCancel={() => {
                setIsCreatingCard(false);
                setEditingCard(null);
              }}
              onSaved={handleCardSaved}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Template global read-only */}
      {templates.length > 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
              Template global (otomatis tampil di semua board)
            </h4>
            <ul className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-sm"
                >
                  {t.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.iconUrl} alt="" className="size-5" />
                  ) : null}
                  {t.labelText}
                </span>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Dialog hapus kartu */}
      <AlertDialog
        open={deletingCard !== null}
        onOpenChange={() => {}}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kartu ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kartu &ldquo;{deletingCard?.labelText}&rdquo; akan dihapus dari
              papan komunikasi beserta ikonnya. Riwayat pemakaian tetap
              tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCard(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deletingCard) return;
                setIsDeleting(true);
                const result = await deleteAacCard(childId, deletingCard.id);
                if (!result.error && deletingCard.iconStoragePath) {
                  await deleteAacIcon(deletingCard.iconStoragePath);
                }
                setCards((prev) => prev.filter((c) => c.id !== deletingCard.id));
                setDeletingCard(null);
                setIsDeleting(false);
                if (result.error) {
                  console.error(result.error);
                }
                router.refresh();
              }}
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                "Ya, hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableCardItem({
  card,
  onEdit,
  onDelete,
}: {
  card: EditorCard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-2",
        isDragging && "z-10 shadow-lg opacity-80 ring-2 ring-ring"
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted"
        aria-label="Seret untuk mengurutkan"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" aria-hidden />
      </button>

      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
        {card.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.iconUrl} alt="" className="size-10 object-contain" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" style={{ color: "#2C4A5E" }}>
          {card.labelText}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {card.audioText}
        </p>
      </div>

      <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
        <Pencil className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
        aria-label="Hapus"
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </li>
  );
}

/**
 * Form kartu: label + teks suara + upload/simpan icon. Icon di-upload ke
 * bucket private 'aac-icons' dari browser; hanya path hasil upload yang
 * disimpan ke DB (bukan file mentah).
 */
function AacCardForm({
  childId,
  categoryId,
  categories,
  existing,
  onCancel,
  onSaved,
}: {
  childId: string;
  categoryId: string | null;
  categories: EditorCategory[];
  existing: EditorCard | null;
  onCancel: () => void;
  onSaved: (card: EditorCard) => void;
}) {
  const [labelText, setLabelText] = useState(existing?.labelText ?? "");
  const [audioText, setAudioText] = useState(existing?.audioText ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "none">(
    existing?.categoryId ?? categoryId ?? "none"
  );
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setIconPreview(URL.createObjectURL(file));
    } else {
      setIconPreview(null);
    }
    setIconFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const categoryIdValue =
      selectedCategoryId === "none" ? null : selectedCategoryId;

    try {
      if (!existing && !iconFile) {
        setError("Ikon kartu wajib diunggah.");
        return;
      }

      let finalIconPath: string | null = existing?.iconStoragePath ?? null;

      // Upload icon baru (kalau ada) sebelum simpan/tambah ke DB.
      if (iconFile) {
        const upload = await uploadAacIcon(childId, iconFile);
        if (upload.error) {
          setError(upload.error);
          return;
        }
        if (upload.path) {
          finalIconPath = upload.path;
        }
        // Icon lama diganti → hapus dari storage (path milik anak).
        if (existing?.iconStoragePath && upload.path) {
          await deleteAacIcon(existing.iconStoragePath);
        }
      }

      const input = {
        category_id: categoryIdValue,
        label_text: labelText.trim(),
        icon_url: finalIconPath ?? "",
        audio_text: audioText.trim(),
      };

      const result = existing
        ? await updateAacCard(childId, existing.id, input)
        : await createAacCard(childId, input);

      if (result.error) {
        setError(result.error);
        return;
      }

      const savedId = existing ? existing.id : (result as { cardId?: string }).cardId;
      if (!savedId) {
        setError("Gagal mengambil ID kartu.");
        return;
      }

      onSaved({
        id: savedId,
        labelText: labelText.trim(),
        audioText: audioText.trim(),
        iconUrl: iconPreview ?? existing?.iconUrl ?? null,
        iconStoragePath: finalIconPath,
        categoryId: categoryIdValue,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="aac-category">Kategori</Label>
        <select
          id="aac-category"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
        >
          <option value="none">Tanpa Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="aac-label">Label kartu *</Label>
        <Input
          id="aac-label"
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
          placeholder="cth: Makan"
          required
          maxLength={100}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="aac-audio">Teks yang dibacakan suara *</Label>
        <Textarea
          id="aac-audio"
          rows={2}
          value={audioText}
          onChange={(e) => setAudioText(e.target.value)}
          placeholder="cth: Aku mau makan."
          required
          maxLength={300}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ikon kartu {!existing ? "*" : ""}</Label>
        <div className="flex items-center gap-3">
          {(iconPreview ?? existing?.iconUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconPreview ?? existing?.iconUrl ?? undefined}
              alt="Pratinjau ikon"
              className="size-14 rounded-lg border border-border bg-muted object-contain p-1"
            />
          ) : null}
          <div className="flex flex-col gap-1">
            <Label htmlFor="aac-icon" className="sr-only">
              Pilih file ikon
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("aac-icon")?.click()}
            >
              {existing && !iconFile ? "Ganti ikon" : "Pilih ikon"}
            </Button>
            <input
              id="aac-icon"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={handleIconChange}
            />
            <span className="text-xs text-muted-foreground">
              Maks 2 MB — PNG, JPG, WebP, atau SVG
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Batal
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Menyimpan...
            </>
          ) : existing ? (
            "Simpan Perubahan"
          ) : (
            "Simpan Kartu"
          )}
        </Button>
      </div>
    </form>
  );
}