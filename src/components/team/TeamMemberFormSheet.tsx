import { useEffect, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamMemberEnriched } from "@/services/team-provision";

function generatePassword(length = 12): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%";
  let out = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    out += chars[arr[i]! % chars.length];
  }
  return out;
}

export type TeamMemberFormMode = "create" | "edit";

export function TeamMemberFormSheet({
  open,
  onOpenChange,
  mode,
  member,
  roles,
  loading,
  onSubmitCreate,
  onSubmitEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: TeamMemberFormMode;
  member: TeamMemberEnriched | null;
  roles: { id: string; name: string }[];
  loading?: boolean;
  onSubmitCreate: (values: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    customRoleId: string;
  }) => void;
  onSubmitEdit: (values: {
    fullName: string;
    phone: string;
    customRoleId: string;
  }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [customRoleId, setCustomRoleId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && member) {
      setFullName(member.fullName ?? "");
      setEmail(member.email ?? "");
      setPhone(member.phone ?? "");
      setCustomRoleId(member.customRoleId ?? roles[0]?.id ?? "");
      setPassword("");
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword(generatePassword());
      setCustomRoleId(roles[0]?.id ?? "");
    }
  }, [open, mode, member, roles]);

  const isCreate = mode === "create";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isCreate ? "Novo acesso na equipe" : "Editar membro"}</SheetTitle>
          <SheetDescription>
            {isCreate
              ? "Crie login e senha para a pessoa entrar na plataforma da campanha. Conta no limite do seu plano."
              : "Atualize dados e cargo. E-mail de login não pode ser alterado aqui."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tm-name">Nome completo</Label>
            <Input
              id="tm-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome do assessor"
            />
          </div>

          {isCreate && (
            <div className="grid gap-2">
              <Label htmlFor="tm-email">E-mail de login</Label>
              <Input
                id="tm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          )}

          {!isCreate && (
            <div className="grid gap-2">
              <Label>E-mail de login</Label>
              <Input value={email} disabled className="text-muted-foreground" />
            </div>
          )}

          {isCreate && (
            <div className="grid gap-2">
              <Label htmlFor="tm-password">Senha inicial</Label>
              <div className="flex gap-2">
                <Input
                  id="tm-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Gerar senha"
                  onClick={() => setPassword(generatePassword())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                Mínimo 8 caracteres — envie com segurança ao membro.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="tm-phone">Telefone</Label>
            <Input
              id="tm-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="grid gap-2">
            <Label>Cargo</Label>
            <Select value={customRoleId} onValueChange={setCustomRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button
            className="w-full sm:w-auto"
            disabled={
              loading ||
              fullName.trim().length < 2 ||
              !customRoleId ||
              (isCreate && (!email.trim() || password.length < 8))
            }
            onClick={() => {
              if (isCreate) {
                onSubmitCreate({
                  fullName: fullName.trim(),
                  email: email.trim().toLowerCase(),
                  password,
                  phone: phone.trim(),
                  customRoleId,
                });
              } else {
                onSubmitEdit({
                  fullName: fullName.trim(),
                  phone: phone.trim(),
                  customRoleId,
                });
              }
            }}
          >
            {loading ? "Salvando..." : isCreate ? "Criar acesso" : "Salvar alterações"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
