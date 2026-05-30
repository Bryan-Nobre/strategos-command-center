import { MoreHorizontal, Pencil, Shield } from "lucide-react";
import { formatPhoneBrDisplay } from "@/lib/normalize-phone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamMemberEnriched } from "@/services/team-provision";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TeamMemberCard({
  member,
  canManage,
  onEdit,
  onBlock,
  onActivate,
  onResetPassword,
  onRemove,
}: {
  member: TeamMemberEnriched;
  canManage: boolean;
  onEdit: () => void;
  onBlock: () => void;
  onActivate: () => void;
  onResetPassword: () => void;
  onRemove: () => void;
}) {
  const isOwner = member.role === "owner";
  const isSuspended = member.status === "suspended";
  const displayName = member.fullName ?? "Sem nome";

  return (
    <div
      className={cn(
        "team-member-card flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
        isSuspended && "opacity-75",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-11 w-11 border border-border/60">
          {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium truncate">{displayName}</p>
            {isOwner && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
            {isSuspended && (
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700">
                Bloqueado
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{member.email ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {member.customRoleName ?? member.role}
            {member.phone ? ` · ${formatPhoneBrDisplay(member.phone)}` : ""}
          </p>
        </div>
      </div>

      {canManage && !isOwner && (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <Button variant="outline" size="sm" className="h-8" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onResetPassword}>Redefinir senha</DropdownMenuItem>
              {isSuspended ? (
                <DropdownMenuItem onClick={onActivate}>Reativar acesso</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onBlock}>Bloquear login</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onRemove}>
                Remover da campanha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
