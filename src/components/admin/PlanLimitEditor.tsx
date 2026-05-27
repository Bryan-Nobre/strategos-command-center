import { useEffect, useState } from "react";
import { Info, Save, Users } from "lucide-react";
import type { AdminPlanLimitRow, UpdatePlanLimitPayload } from "@/services/admin-plans";
import { PLAN_FIELD_META } from "@/lib/plan-field-meta";
import { TENANT_PLAN_LABELS, type TenantPlan } from "@/types/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NumericLimitKey = "maxSupporters" | "maxTeamMembers" | "maxRegions";

type FormState = UpdatePlanLimitPayload & {
  unlimitedSupporters: boolean;
  unlimitedTeam: boolean;
  unlimitedRegions: boolean;
};

function toFormState(row: AdminPlanLimitRow): FormState {
  return {
    maxSupporters: row.maxSupporters,
    maxTeamMembers: row.maxTeamMembers,
    maxRegions: row.maxRegions,
    exportsEnabled: row.exportsEnabled,
    pollsEnabled: row.pollsEnabled,
    unlimitedSupporters: row.maxSupporters === null,
    unlimitedTeam: row.maxTeamMembers === null,
    unlimitedRegions: row.maxRegions === null,
  };
}

function toPayload(form: FormState): UpdatePlanLimitPayload {
  return {
    maxSupporters: form.unlimitedSupporters ? null : form.maxSupporters,
    maxTeamMembers: form.unlimitedTeam ? null : form.maxTeamMembers,
    maxRegions: form.unlimitedRegions ? null : form.maxRegions,
    exportsEnabled: form.exportsEnabled,
    pollsEnabled: form.pollsEnabled,
  };
}

function FieldHelp({
  meta,
}: {
  meta: (typeof PLAN_FIELD_META)[keyof typeof PLAN_FIELD_META];
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
      <p className="text-sm text-muted-foreground">{meta.description}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-[11px] font-normal">
          {meta.enforcement}
        </Badge>
        {meta.modules.map((m) => (
          <Badge key={m} variant="secondary" className="text-[11px] font-normal">
            {m}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function NumericLimitField({
  fieldKey,
  form,
  onChange,
}: {
  fieldKey: NumericLimitKey;
  form: FormState;
  onChange: (next: FormState) => void;
}) {
  const meta = PLAN_FIELD_META[fieldKey];
  const unlimitedKey =
    fieldKey === "maxSupporters"
      ? "unlimitedSupporters"
      : fieldKey === "maxTeamMembers"
        ? "unlimitedTeam"
        : "unlimitedRegions";

  const unlimited = form[unlimitedKey];
  const value = form[fieldKey];

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${fieldKey}-value`} className="text-base">
            {meta.label}
          </Label>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="mt-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Mais informações sobre ${meta.label}`}
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs">
              {meta.enforcement}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <FieldHelp meta={meta} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          id={`${fieldKey}-value`}
          type="number"
          min={1}
          disabled={unlimited}
          value={unlimited ? "" : (value ?? "")}
          onChange={(e) => {
            const parsed = e.target.value === "" ? null : Number(e.target.value);
            onChange({ ...form, [fieldKey]: parsed });
          }}
          className="sm:max-w-[180px]"
          placeholder={unlimited ? "Ilimitado" : "Ex.: 500"}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${fieldKey}-unlimited`}
            checked={unlimited}
            onCheckedChange={(checked) => {
              const isUnlimited = checked === true;
              onChange({
                ...form,
                [unlimitedKey]: isUnlimited,
                [fieldKey]: isUnlimited ? null : value ?? 1,
              });
            }}
          />
          <Label htmlFor={`${fieldKey}-unlimited`} className="cursor-pointer font-normal">
            Ilimitado (sem teto numérico)
          </Label>
        </div>
      </div>
    </div>
  );
}

function BooleanLimitField({
  fieldKey,
  form,
  onChange,
}: {
  fieldKey: "exportsEnabled" | "pollsEnabled";
  form: FormState;
  onChange: (next: FormState) => void;
}) {
  const meta = PLAN_FIELD_META[fieldKey];
  const checked = form[fieldKey];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor={fieldKey} className="text-base">
            {meta.label}
          </Label>
          <p className="text-xs text-muted-foreground">
            {checked ? "Permitido neste plano" : "Bloqueado neste plano"}
          </p>
        </div>
        <Switch
          id={fieldKey}
          checked={checked}
          onCheckedChange={(v) => onChange({ ...form, [fieldKey]: v })}
        />
      </div>
      <FieldHelp meta={meta} />
    </div>
  );
}

function isFormValid(form: FormState): boolean {
  const check = (unlimited: boolean, value: number | null) =>
    unlimited || (value !== null && value >= 1);

  return (
    check(form.unlimitedSupporters, form.maxSupporters) &&
    check(form.unlimitedTeam, form.maxTeamMembers) &&
    check(form.unlimitedRegions, form.maxRegions)
  );
}

function isDirty(a: FormState, b: FormState): boolean {
  return JSON.stringify(toPayload(a)) !== JSON.stringify(toPayload(b));
}

export function PlanLimitEditor({
  row,
  saving,
  onSave,
}: {
  row: AdminPlanLimitRow;
  saving: boolean;
  onSave: (payload: UpdatePlanLimitPayload) => void | Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(row));
  const initial = toFormState(row);

  useEffect(() => {
    setForm(toFormState(row));
  }, [row]);

  const planLabel = TENANT_PLAN_LABELS[row.plan as TenantPlan];
  const dirty = isDirty(form, initial);
  const valid = isFormValid(form);

  return (
    <Card className="shadow-elegant">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">{planLabel}</CardTitle>
            <CardDescription className="mt-1.5 font-mono text-xs">
              Identificador interno: {row.plan}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1.5 self-start">
            <Users className="h-3.5 w-3.5" />
            {row.tenantCount} campanha{row.tenantCount === 1 ? "" : "s"} neste plano
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <NumericLimitField fieldKey="maxSupporters" form={form} onChange={setForm} />
        <Separator />
        <NumericLimitField fieldKey="maxTeamMembers" form={form} onChange={setForm} />
        <Separator />
        <NumericLimitField fieldKey="maxRegions" form={form} onChange={setForm} />
        <Separator />
        <BooleanLimitField fieldKey="exportsEnabled" form={form} onChange={setForm} />
        <Separator />
        <BooleanLimitField fieldKey="pollsEnabled" form={form} onChange={setForm} />

        <div className="flex flex-col gap-3 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Reduzir limites não remove dados existentes — apenas impede novos cadastros acima do teto.
            Campanhas que já excedem o novo limite mantêm os registros (grandfather).
          </p>
          <Button
            type="button"
            disabled={!dirty || !valid || saving}
            onClick={() => onSave(toPayload(form))}
            className="shrink-0"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando…" : "Salvar plano"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
