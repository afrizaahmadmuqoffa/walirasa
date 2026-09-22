import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getAccessByChild } from "@/lib/actions/access";
import { requireRole } from "@/lib/supabase/profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InviteEducatorForm } from "@/components/dashboard/InviteEducatorForm";
import { RevokeAccessButton } from "@/components/dashboard/RevokeAccessButton";

type Props = {
  params: Promise<{ childId: string }>;
};

const ROLE_LABELS: Record<string, string> = {
  teacher: "Guru",
  therapist: "Terapis",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ChildAccessPage({ params }: Props) {
  const { childId } = await params;
  await requireRole(["parent"]);
  const child = await getChild(childId);

  if (!child) {
    notFound();
  }

  const grants = await getAccessByChild(childId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#2C4A5E" }}>
          Kelola Akses — {child.full_name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Undang guru/terapis dengan tautan berbatas waktu. Akses bisa dicabut kapan saja.
        </p>
      </div>

      <InviteEducatorForm childId={child.id} />

      <Card>
        <CardHeader>
          <CardTitle>Akses Aktif</CardTitle>
          <CardDescription>
            {grants.length === 0
              ? "Belum ada guru/terapis yang diundang."
              : `${grants.length} undangan tercatat.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {grants.map((grant) => {
              const accepted = grant.educator_id !== null;
              return (
                <li key={grant.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-foreground">
                        {grant.invite_email ?? "Email tidak tercatat"}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABELS[grant.access_role] ?? grant.access_role}
                      </Badge>
                      {accepted ? null : (
                        <Badge className="text-xs">Menunggu</Badge>
                      )}
                      {grant.is_active ? null : (
                        <Badge variant="destructive" className="text-xs">
                          Dicabut
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Berlaku hingga {formatDate(grant.expires_at)}
                      {accepted ? " · Sudah diterima" : ""}
                    </p>
                  </div>
                  {grant.is_active ? (
                    <RevokeAccessButton accessId={grant.id} />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Tautan undangan membutuhkan kecocokan alamat email saat guru/terapis mendaftar.
      </p>
    </div>
  );
}