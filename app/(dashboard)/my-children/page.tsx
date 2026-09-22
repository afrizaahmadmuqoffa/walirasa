import { requireRole } from "@/lib/supabase/profile";
import { getMyAccessibleChildren } from "@/lib/actions/access";
import { getChildAvatarSignedUrl } from "@/lib/supabase/avatar-server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChildCard } from "@/components/dashboard/ChildCard";

const ROLE_LABELS: Record<string, string> = {
  teacher: "Guru",
  therapist: "Terapis",
};

export default async function MyChildrenPage() {
  const profile = await requireRole(["teacher", "therapist"]);
  const children = await getMyAccessibleChildren();

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#2C4A5E" }}>
          Anak yang Saya Bantu
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.fullName}, aksesmu hanya mencakup anak yang diundang oleh orang tua.
        </p>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-3xl" aria-hidden>
              🐢
            </span>
            <div>
              <p className="font-heading text-sm font-medium" style={{ color: "#2C4A5E" }}>
                Belum ada anak dengan akses aktif
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Minta orang tua mengundangmu melalui tautan undangan, lalu terima undangan
                tersebut.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((child) => (
            <div key={child.child_id} className="relative">
              <ChildCard
                childId={child.child_id}
                fullName={child.full_name}
                nickname={child.nickname}
                avatarUrl={child.avatarUrl}
                birthDate={null}
                asdSupportLevel={null}
              />
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[child.access_role] ?? child.access_role}
                </Badge>
                <span>
                  hingga{" "}
                  {new Date(child.expires_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}