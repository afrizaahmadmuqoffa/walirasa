"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createChild,
  setChildAvatar,
  updateChild,
  type ChildInput,
} from "@/lib/actions/children";
import { uploadChildAvatar, deleteChildAvatar } from "@/lib/supabase/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChildAvatarUpload } from "@/components/dashboard/ChildAvatarUpload";

const LEVEL_OPTIONS = [
  { value: "level_1", label: "Dukungan Ringan" },
  { value: "level_2", label: "Dukungan Sedang" },
  { value: "level_3", label: "Dukungan Intensif" },
];

export function ChildForm({
  mode,
  childId,
  initial,
}: {
  mode: "create" | "edit";
  childId?: string;
  initial?: {
    fullName: string;
    nickname: string | null;
    birthDate: string | null;
    asdSupportLevel: string | null;
    notes: string | null;
    avatarPath: string | null;
    avatarUrl: string | null;
  };
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [asdSupportLevel, setAsdSupportLevel] = useState<string | null>(
    initial?.asdSupportLevel ?? null
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const input: ChildInput = {
      full_name: fullName,
      nickname: nickname || null,
      birth_date: birthDate || null,
      asd_support_level: asdSupportLevel as ChildInput["asd_support_level"],
      notes: notes || null,
    };

    try {
      let targetChildId = childId;

      if (mode === "create") {
        const result = await createChild(input);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }
        targetChildId = result.childId ?? undefined;
      } else {
        if (!childId) return;
        const result = await updateChild(childId, input);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }
      }

      if (targetChildId && avatarFile) {
        if (initial?.avatarPath) {
          await deleteChildAvatar(initial.avatarPath);
        }
        const upload = await uploadChildAvatar(targetChildId, avatarFile);
        if (upload.error) {
          setError(`Anak tersimpan, tapi foto gagal: ${upload.error}`);
          setIsSubmitting(false);
          router.refresh();
          return;
        }
        if (upload.path) {
          const saved = await setChildAvatar(targetChildId, upload.path);
          if (saved.error) {
            setError(saved.error);
            setIsSubmitting(false);
            router.refresh();
            return;
          }
        }
      }

      router.push(`/children/${targetChildId}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle style={{ color: "#2C4A5E" }}>
          {mode === "create" ? "Tambah Anak Baru" : "Edit Profil Anak"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CardContent className="flex flex-col gap-4">
          <ChildAvatarUpload
            currentAvatarUrl={initial?.avatarUrl}
            onFileChange={setAvatarFile}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full-name">Nama lengkap *</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname">Nama panggilan</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="birth-date">Tanggal lahir</Label>
            <Input
              id="birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tingkat dukungan ASD</Label>
            <Select
              value={asdSupportLevel ?? undefined}
              onValueChange={(v) => setAsdSupportLevel(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tingkat dukungan" />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>

        <div className="flex justify-end gap-2 px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Menyimpan...
              </>
            ) : mode === "create" ? (
              "Simpan Anak"
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}