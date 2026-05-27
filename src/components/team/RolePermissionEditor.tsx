import { useEffect, useState } from "react";
import { Eye, EyeOff, Info, Save, Trash2, Users, Wrench } from "lucide-react";
import { PERMISSION_FIELD_META } from "@/lib/permission-field-meta";
import {
  PERMISSION_MODULE_GROUPS,
  clearModule,
  countEnabledActions,
  moduleAccessLabel,
  setModuleAction,
  setModuleFull,
  setModuleReadOnly,
} from "@/lib/permission-helpers";
import {
  emptyPermissions,
  type PermissionModule,
  type TenantPermissionsMap,
  type TenantRoleRow,
} from "@/types/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FormState = {
  name: string;
  description: string;
  permissions: TenantPermissionsMap;
};

function toFormState(row?: TenantRoleRow | null): FormState {
  if (!row) {
    return { name: "", description: "", permissions: emptyPermissions() };
  }
  return {
    name: row.name,
    description: row.description ?? "",
    permissions: { ...emptyPermissions(), ...row.permissions },
  };
}

function actionGroupLabel(action: string): string {
  if (action === "read") return "Acesso à tela";
  if (action === "create" || action === "update") return "Alterar dados";
  if (action === "delete") return "Excluir dados";
  return "Funções extras";
}

function groupActions(actions: Record<string, { label: string; description: string }>) {
  const buckets: Record<string, [string, { label: string; description: string }][]> = {
    "Acesso à tela": [],
    "Alterar dados": [],
    "Excluir dados": [],
    "Funções extras": [],
  };

  for (const [key, meta] of Object.entries(actions)) {
    buckets[actionGroupLabel(key)].push([key, meta]);
  }

  return Object.entries(buckets).filter(([, items]) => items.length > 0);
}

function ModuleSection({
  module,
  permissions,
  readOnly,
  onChange,
}: {
  module: PermissionModule;
  permissions: TenantPermissionsMap;
  readOnly: boolean;
  onChange: (next: TenantPermissionsMap) => void;
}) {
  const meta = PERMISSION_FIELD_META[module];
  const modPerms = permissions[module] ?? {};
  const summary = moduleAccessLabel(permissions, module);
  const { enabled, total } = countEnabledActions(permissions, module);

  return (
    <div className="space-y-4 rounded-xl border border-border/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium">{meta.label}</h4>
            <Badge variant={enabled === 0 ? "outline" : "secondary"}>{summary}</Badge>
            <Badge variant="outline" className="text-[10px] font-normal">
              {enabled}/{total} opções
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          <p className="text-xs text-muted-foreground">Rota: {meta.route}</p>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange(setModuleReadOnly(permissions, module))}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Somente leitura
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange(setModuleFull(permissions, module))}
            >
              <Wrench className="mr-1.5 h-3.5 w-3.5" />
              Operação completa
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(clearModule(permissions, module))}
            >
              <EyeOff className="mr-1.5 h-3.5 w-3.5" />
              Sem acesso
            </Button>
          </div>
        )}
      </div>

      <Badge variant="outline" className="text-[11px] font-normal">
        {meta.enforcement}
      </Badge>

      {groupActions(meta.actions).map(([groupTitle, items]) => (
        <div key={groupTitle} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {groupTitle}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(([action, actionMeta]) => (
              <div
                key={action}
                className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3"
              >
                <div className="space-y-0.5">
                  <Label htmlFor={`${module}-${action}`} className="text-sm">
                    {actionMeta.label}
                  </Label>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {actionMeta.description}
                  </p>
                </div>
                <Switch
                  id={`${module}-${action}`}
                  checked={modPerms[action] === true}
                  disabled={readOnly}
                  onCheckedChange={(v) => onChange(setModuleAction(permissions, module, action, v))}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RolePermissionEditor({
  role,
  isNew,
  saving,
  onSave,
  onDelete,
}: {
  role?: TenantRoleRow | null;
  isNew?: boolean;
  saving: boolean;
  onSave: (payload: FormState) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(role));
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setForm(toFormState(role));
  }, [role?.id, isNew]);

  const readOnly = role?.isFullAccess === true;
  const dirty = JSON.stringify(form) !== JSON.stringify(toFormState(role));

  return (
    <>
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{isNew ? "Novo cargo" : role?.name ?? "Cargo"}</CardTitle>
              <CardDescription className="mt-1.5">
                {readOnly
                  ? "Cargo do sistema com acesso total — não editável."
                  : "Configure exatamente o que membros com este cargo podem ver e fazer em cada parte do sistema."}
              </CardDescription>
            </div>
            {!isNew && role && (
              <Badge variant="secondary" className="gap-1.5 self-start">
                <Users className="h-3.5 w-3.5" />
                {role.memberCount} membro{role.memberCount === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nome do cargo</Label>
              <Input
                id="role-name"
                value={form.name}
                disabled={readOnly || role?.isSystem}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Captador de ruas"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="role-desc">Descrição interna (opcional)</Label>
              <Textarea
                id="role-desc"
                value={form.description}
                disabled={readOnly}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex.: Atua em campo cadastrando apoiadores, sem acesso a configurações"
                rows={2}
              />
            </div>
          </div>

          {!readOnly && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Como configurar</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>
                  <strong>Acesso à tela</strong> — controla se a aba aparece no menu.
                </p>
                <p>
                  <strong>Alterar / Excluir dados</strong> — controla botões e gravação no banco.
                </p>
                <p>
                  Atalhos: <strong>Somente leitura</strong>, <strong>Operação completa</strong> ou{" "}
                  <strong>Sem acesso</strong> em cada módulo.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <Accordion
            type="multiple"
            defaultValue={PERMISSION_MODULE_GROUPS.map((g) => g.id)}
            className="space-y-2"
          >
            {PERMISSION_MODULE_GROUPS.map((group) => (
              <AccordionItem key={group.id} value={group.id} className="rounded-lg border px-2">
                <AccordionTrigger className="px-2 hover:no-underline">
                  <div className="text-left">
                    <p className="font-medium">{group.label}</p>
                    <p className="text-xs font-normal text-muted-foreground">{group.description}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-1 pb-4">
                  {group.modules.map((module) => (
                    <ModuleSection
                      key={module}
                      module={module}
                      permissions={form.permissions}
                      readOnly={readOnly}
                      onChange={(permissions) => setForm({ ...form, permissions })}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Membros com este cargo passam a ter o novo comportamento assim que você salvar.
            </p>
            <div className="flex shrink-0 gap-2">
              {!isNew && role && !role.isSystem && onDelete && (
                <Button type="button" variant="outline" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              )}
              <Button
                type="button"
                disabled={readOnly || !form.name.trim() || (!isNew && !dirty) || saving}
                onClick={() => onSave(form)}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando…" : isNew ? "Criar cargo" : "Salvar cargo"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir cargo?"
        description="Só é possível excluir cargos sem membros ou convites pendentes."
        onConfirm={() => {
          onDelete?.();
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
