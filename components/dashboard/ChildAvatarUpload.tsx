"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function ChildAvatarUpload({
  currentAvatarUrl,
  onFileChange,
}: {
  currentAvatarUrl?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
    onFileChange(file);
  }

  const src = preview ?? currentAvatarUrl;

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-14">
        <AvatarImage src={src ?? undefined} alt="Foto anak" />
        <AvatarFallback className="bg-secondary/60 text-primary">🐢</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden />
          Pilih foto
        </Button>
        <span className="text-xs text-muted-foreground">
          Maks 2 MB — JPG, PNG, atau WebP
        </span>
      </div>
    </div>
  );
}