import { getCurrentProfile } from "@/lib/supabase/profile";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  // Guru/terapis tidak punya "Anak Saya" — arahkan ke tampilan anak yang mereka bantu.
  if (profile.role !== "parent") {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#2C4A5E" }}>
            Selamat datang, {profile.fullName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buka <a href="/my-children" className="font-medium underline underline-offset-4">Anak yang Saya Bantu</a>{" "}
            untuk melihat daftar anak dengan akses aktifmu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#2C4A5E" }}>
          Selamat datang, {profile.fullName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan anak dan perkembangannya akan muncul di sini.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modul yang akan tersedia</CardTitle>
          <CardDescription>
            AAC Board, Emotion Mirror, Social Story, Life Skills, dan IEP Dashboard dibangun bertahap
            di fase-fase berikutnya.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}