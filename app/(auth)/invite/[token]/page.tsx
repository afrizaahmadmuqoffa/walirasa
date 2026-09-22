import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getInviteDetailsServer } from "@/lib/actions/access";
import { InviteRegisterForm } from "@/components/auth/InviteRegisterForm";
import { AcceptInviteButton } from "@/components/auth/AcceptInviteButton";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ token: string }>;
};

const REASON_MESSAGES: Record<string, string> = {
  not_found: "Tautan undangan tidak ditemukan. Pastikan tautan yang kamu buka benar.",
  revoked: "Undangan ini sudah dicabut oleh orang tua. Minta undangan baru.",
  expired: "Undangan ini sudah kedaluwarsa. Minta undangan baru kepada orang tua.",
  already_used: "Undangan ini sudah diterima oleh akun lain.",
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const invite = await getInviteDetailsServer(token);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!invite.valid) {
    const message =
      REASON_MESSAGES[invite.reason ?? "not_found"] ?? "Undangan tidak valid.";
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: "#E9F1F5" }}
        >
          ⚠️
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="outline">
          <Link href="/login">Ke Halaman Masuk</Link>
        </Button>
      </div>
    );
  }

  // Sudah login → tinggal tekan tombol terima.
  if (user) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: "#B5EAD7" }}
        >
          🐢
        </div>
        <p className="text-sm text-muted-foreground">
          Kamu diundang sebagai{" "}
          <strong>{invite.accessRole === "therapist" ? "Terapis" : "Guru"}</strong> untuk{" "}
          <strong>{invite.childFullName}</strong>. Akunmu: {user.email}
        </p>
        <AcceptInviteButton token={token} />
        <p className="text-xs text-muted-foreground">
          Pastikan email yang login sama dengan undangan.
        </p>
      </div>
    );
  }

  // Belum login → form register (email readonly dari undangan).
  return (
    <InviteRegisterForm
      inviteToken={token}
      prefilledEmail={invite.inviteEmail ?? ""}
      childFullName={invite.childFullName ?? null}
    />
  );
}