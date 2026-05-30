import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  formatPhoneBrDisplay,
  isValidBrPhoneOptional,
  normalizeSupporterPhone,
  PHONE_INVALID_MSG,
} from "@/lib/normalize-phone";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/services/team";
import { removeProfileAvatar, uploadProfileAvatar } from "@/services/profile-avatar";
import type { Profile } from "@/lib/supabase/session";

function initialsFrom(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileSettingsCard({
  profile,
  canEdit,
}: {
  profile: Profile | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(
    profile?.phone ? formatPhoneBrDisplay(profile.phone) : "",
  );
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ? formatPhoneBrDisplay(profile.phone) : "");
    setBio(profile?.bio ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile?.full_name, profile?.phone, profile?.bio, profile?.avatar_url]);

  const saveProfile = useMutation({
    mutationFn: () => {
      if (!isValidBrPhoneOptional(phone)) {
        throw new Error(PHONE_INVALID_MSG);
      }
      return updateProfile({
        full_name: fullName.trim(),
        phone: normalizeSupporterPhone(phone) ?? undefined,
        bio: bio.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado");
      await router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => uploadProfileAvatar(file),
    onSuccess: async (url) => {
      setAvatarUrl(url);
      toast.success("Foto atualizada");
      await router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAvatar = useMutation({
    mutationFn: () => removeProfileAvatar(),
    onSuccess: async () => {
      setAvatarUrl("");
      toast.success("Foto removida");
      await router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const displayName = fullName.trim() || profile?.full_name || "Usuário";

  return (
    <Card className="settings-panel shadow-elegant">
      <CardHeader>
        <CardTitle>Seu perfil</CardTitle>
        <CardDescription>
          Nome e foto aparecem na equipe e na operação da campanha. O e-mail de login não é alterado
          aqui.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="settings-profile-hero">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-border shadow-md">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {initialsFrom(displayName)}
              </AvatarFallback>
            </Avatar>
            {canEdit && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full shadow"
                disabled={uploadAvatar.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-lg font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">
              JPEG, PNG, WebP ou GIF · até 2 MB
            </p>
            {canEdit && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadAvatar.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  Alterar foto
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={deleteAvatar.isPending}
                    onClick={() => deleteAvatar.mutate()}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remover
                  </Button>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar.mutate(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="profile-name">Nome completo</Label>
            <Input
              id="profile-name"
              value={fullName}
              disabled={!canEdit}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-phone">Telefone</Label>
            <PhoneInput
              id="profile-phone"
              value={phone}
              disabled={!canEdit}
              onValueChange={setPhone}
            />
          </div>
          <div className="grid gap-2">
            <Label>E-mail</Label>
            <Input value="Definido no login" disabled className="text-muted-foreground" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              disabled={!canEdit}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Cargo na campanha, foco de atuação..."
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button
              disabled={fullName.trim().length < 2 || saveProfile.isPending}
              onClick={() => saveProfile.mutate()}
            >
              {saveProfile.isPending ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
