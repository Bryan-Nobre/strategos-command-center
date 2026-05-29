import { useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function ResetPasswordDialog({
  open,
  onOpenChange,
  memberName,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  loading?: boolean;
  onConfirm: (password: string) => void;
}) {
  const [password, setPassword] = useState(() => generatePassword());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            Nova senha para <strong>{memberName}</strong>. Informe ao membro por canal seguro.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label>Nova senha</Label>
          <div className="flex gap-2">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono text-sm"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={password.length < 8 || loading}
            onClick={() => onConfirm(password)}
          >
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
