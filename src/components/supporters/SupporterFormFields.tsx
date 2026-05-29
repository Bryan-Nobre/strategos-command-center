import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  supporterFormSchema,
  SUPPORT_LEVEL_LABELS,
  SUPPORTER_STATUS_LABELS,
  type SupporterFormValues,
} from "@/types/domain";
import type { Enums } from "@/types/supabase";

type LeadershipOption = { id: string; name: string };

type SupporterFormFieldsProps = {
  defaultValues?: Partial<SupporterFormValues>;
  leaderships: LeadershipOption[];
  onSubmit: (values: SupporterFormValues) => void;
  submitLabel?: string;
  loading?: boolean;
};

export function SupporterFormFields({
  defaultValues,
  leaderships,
  onSubmit,
  submitLabel = "Salvar",
  loading,
}: SupporterFormFieldsProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupporterFormValues>({
    resolver: zodResolver(supporterFormSchema),
    defaultValues: {
      status: "interessado",
      support_level: "indeciso",
      ...defaultValues,
    },
  });

  const leadershipId = watch("leadership_id");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label>Nome</Label>
        <Input {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Telefone</Label>
          <Input {...register("phone")} />
        </div>
        <div className="grid gap-2">
          <Label>Cidade</Label>
          <Input {...register("city")} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Label>Bairro</Label>
          <Input {...register("neighborhood")} />
        </div>
        <div className="grid gap-2">
          <Label>Zona</Label>
          <Input {...register("electoral_zone")} />
        </div>
        <div className="grid gap-2">
          <Label>Seção</Label>
          <Input {...register("electoral_section")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Status político</Label>
          <Select
            value={watch("status")}
            onValueChange={(v) => setValue("status", v as SupporterFormValues["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUPPORTER_STATUS_LABELS).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Grau de apoio</Label>
          <Select
            value={watch("support_level")}
            onValueChange={(v) => setValue("support_level", v as SupporterFormValues["support_level"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUPPORT_LEVEL_LABELS).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Liderança primária (CRM)</Label>
        <Select
          value={leadershipId || "none"}
          onValueChange={(v) => setValue("leadership_id", v === "none" ? undefined : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nenhuma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {leaderships.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Interesse declarado</Label>
        <Input
          {...register("interest")}
          placeholder="Ex.: saúde, emprego — comum em cadastros da landing"
        />
      </div>
      <div className="grid gap-2">
        <Label>Tags (separadas por vírgula)</Label>
        <Input {...register("tags")} placeholder="vizinho, igreja, sindicato" />
      </div>
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea {...register("notes")} rows={3} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}

export function supporterFormToPayload(values: SupporterFormValues) {
  const tags = values.tags
    ? values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  return {
    name: values.name,
    phone: values.phone || null,
    neighborhood: values.neighborhood || null,
    city: values.city || null,
    electoral_zone: values.electoral_zone || null,
    electoral_section: values.electoral_section || null,
    status: values.status as Enums<"supporter_status">,
    support_level: values.support_level as Enums<"support_level">,
    notes: values.notes || null,
    interest: values.interest || null,
    tags,
    leadership_id: values.leadership_id || null,
  };
}

export function supporterToFormValues(
  s: {
    name: string;
    phone: string | null;
    neighborhood: string | null;
    city: string | null;
    electoral_zone: string | null;
    electoral_section: string | null;
    status: string;
    support_level: string;
    notes: string | null;
    interest?: string | null;
    tags: string[] | null;
    leadership_id: string | null;
  },
): SupporterFormValues {
  return {
    name: s.name,
    phone: s.phone ?? undefined,
    neighborhood: s.neighborhood ?? undefined,
    city: s.city ?? undefined,
    electoral_zone: s.electoral_zone ?? undefined,
    electoral_section: s.electoral_section ?? undefined,
    status: s.status as SupporterFormValues["status"],
    support_level: s.support_level as SupporterFormValues["support_level"],
    notes: s.notes ?? undefined,
    interest: s.interest ?? undefined,
    tags: (s.tags ?? []).join(", "),
    leadership_id: s.leadership_id ?? undefined,
  };
}
