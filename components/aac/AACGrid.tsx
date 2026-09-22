"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "cn";
import { SensoryButton } from "@/components/sensory/SensoryButton";
import { speakAudio } from "@/lib/speech/tts";
import { logAacCardUsage } from "@/lib/actions/aac";

export type AacBoardCard = {
  id: string;
  labelText: string;
  audioText: string;
  iconUrl: string | null;
};

export type AacBoardGroup = {
  name: string;
  categoryId: string | null;
  cards: AacBoardCard[];
};

/**
 * AACGrid — papan komunikasi anak (read-only). Tombol besar ≥48px,
 * palet sensory, tap → TTS dibacakan lalu dictatat ke aac_usage_logs
 * (hanya metadata child+card, bukan data gambar/suara).
 */
export function AACGrid({
  childId,
  groups,
}: {
  childId: string;
  groups: AacBoardGroup[];
}) {
  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null);

  async function handleTap(card: AacBoardCard) {
    // Suara dulu (feedback utama anak), lalu log (metadata respon).
    speakAudio(card.audioText, 0.82);
    setSpeakingCardId(card.id);
    await logAacCardUsage(childId, card.id);
    setSpeakingCardId(null);
  }

  const visibleGroups = groups.filter((g) => g.cards.length > 0);

  if (visibleGroups.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <div
          className="flex size-20 items-center justify-center rounded-3xl"
          style={{ background: "#A2C5D9" }}
        >
          <ImageIcon className="size-10" style={{ color: "#2C4A5E" }} aria-hidden />
        </div>
        <p className="text-lg font-semibold" style={{ color: "#2C4A5E" }}>
          Papan kartu masih kosong
        </p>
        <p className="max-w-sm text-base" style={{ color: "#5C7686" }}>
          Minta orang tua atau guru menambahkan kartu lewat editor AAC di
          halaman profil anak.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {visibleGroups.map((group) => (
        <section key={group.categoryId ?? `global-${group.name}`}>
          <h2
            className="mb-4 text-2xl font-bold"
            style={{ color: "#2C4A5E" }}
          >
            {group.name}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {group.cards.map((card) => (
              <SensoryButton
                key={card.id}
                color={speakingCardId === card.id ? "accent" : "secondary"}
                size="xl"
                className={cn("flex-col gap-2 rounded-2xl p-3 text-center")}
                onClick={() => handleTap(card)}
                aria-label={card.audioText}
              >
                {card.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.iconUrl}
                    alt=""
                    className="pointer-events-none size-14 object-contain"
                    draggable={false}
                  />
                ) : (
                  <ImageIcon
                    className="size-10"
                    style={{ color: "#2C4A5E" }}
                    aria-hidden
                  />
                )}
                <span className="text-lg font-semibold leading-tight">
                  {card.labelText}
                </span>
              </SensoryButton>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}