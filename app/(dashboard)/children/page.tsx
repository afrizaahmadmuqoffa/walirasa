import Link from "next/link";
import { Plus } from "lucide-react";
import { getChildrenByParent } from "@/lib/actions/children";
import { requireRole } from "@/lib/supabase/profile";
import { getChildAvatarSignedUrl } from "@/lib/supabase/avatar-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChildCard } from "@/components/dashboard/ChildCard";

export default async function ChildrenPage() {
  const profile = await requireRole(["parent"]);
  const children = await getChildrenByParent();

  const cards = await Promise.all(
    children.map(async (child) => ({
      ...child,
      avatarUrl: child.avatar_url
        ? await getChildAvatarSignedUrl(child.avatar_url)
        : null,
    }))
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#2C4A5E" }}>
            Profil Anak
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.fullName}, kelola data anak yang kamu miliki di sini.
          </p>
        </div>
        <Button asChild>
          <Link href="/children/new">
            <Plus className="size-4" aria-hidden />
            Tambah Anak
          </Link>
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-3xl" aria-hidden>
              🐢
            </span>
            <div>
              <p className="font-heading text-sm font-medium" style={{ color: "#2C4A5E" }}>
                Belum ada anak
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Tambahkan profil anak untuk mulai menggunakan modul pembelajaran.
              </p>
            </div>
            <Button asChild>
              <Link href="/children/new">
                <Plus className="size-4" aria-hidden />
                Tambah Anak
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((child) => (
            <ChildCard
              key={child.id}
              childId={child.id}
              fullName={child.full_name}
              nickname={child.nickname}
              avatarUrl={child.avatarUrl}
              birthDate={child.birth_date}
              asdSupportLevel={child.asd_support_level}
            />
          ))}
        </div>
      )}
    </div>
  );
}