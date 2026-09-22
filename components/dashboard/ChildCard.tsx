import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const LEVEL_LABELS: Record<string, string> = {
  level_1: "Dukungan Ringan",
  level_2: "Dukungan Sedang",
  level_3: "Dukungan Intensif",
};

export function ChildCard({
  childId,
  fullName,
  nickname,
  avatarUrl,
  birthDate,
  asdSupportLevel,
}: {
  childId: string;
  fullName: string;
  nickname: string | null;
  avatarUrl?: string | null;
  birthDate: string | null;
  asdSupportLevel: string | null;
}) {
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <Link href={`/children/${childId}`} className="block">
      <Card className="h-full transition-colors duration-200 ease-out hover:border-ring/60 hover:bg-muted/30">
        <CardContent className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="bg-secondary/60 text-primary">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-heading text-sm font-medium" style={{ color: "#2C4A5E" }}>
              {fullName}
            </span>
            {nickname ? (
              <span className="truncate text-xs text-muted-foreground">
                &ldquo;{nickname}&rdquo;
              </span>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
              {asdSupportLevel ? (
                <Badge variant="secondary" className="text-xs">
                  {LEVEL_LABELS[asdSupportLevel] ?? asdSupportLevel}
                </Badge>
              ) : null}
              {birthDate ? (
                <span className="text-xs text-muted-foreground">{birthDate}</span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}