import { z } from "zod";
import { Constants } from "@/types/supabase";

export const supporterStatusSchema = z.enum(
  Constants.public.Enums.supporter_status as unknown as [string, ...string[]],
);
export const supportLevelSchema = z.enum(
  Constants.public.Enums.support_level as unknown as [string, ...string[]],
);
export const demandCategorySchema = z.enum(
  Constants.public.Enums.demand_category as unknown as [string, ...string[]],
);
export const demandStatusSchema = z.enum(
  Constants.public.Enums.demand_status as unknown as [string, ...string[]],
);
export const demandPrioritySchema = z.enum(
  Constants.public.Enums.demand_priority as unknown as [string, ...string[]],
);
export const agendaEventTypeSchema = z.enum(
  Constants.public.Enums.agenda_event_type as unknown as [string, ...string[]],
);
export const tenantRoleSchema = z.enum(
  Constants.public.Enums.tenant_role as unknown as [string, ...string[]],
);

export const supporterFormSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  electoral_zone: z.string().optional(),
  electoral_section: z.string().optional(),
  status: supporterStatusSchema,
  support_level: supportLevelSchema,
  notes: z.string().optional(),
  tags: z.string().optional(),
  leadership_id: z.string().optional(),
});

export const demandFormSchema = z.object({
  title: z.string().min(3, "Título obrigatório"),
  category: demandCategorySchema,
  status: demandStatusSchema.default("aberto"),
  priority: demandPrioritySchema.default("media"),
  neighborhood: z.string().optional(),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
});

export const agendaFormSchema = z.object({
  title: z.string().min(3),
  event_date: z.string().min(1),
  event_time: z.string().optional(),
  location: z.string().optional(),
  event_type: agendaEventTypeSchema.default("reuniao"),
  description: z.string().optional(),
});

export const landingCaptureSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  interest: z.string().optional(),
  notes: z.string().optional(),
});

export const signupFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  tenantName: z.string().min(2),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  headline: z.string().optional(),
});

export type SupporterFormValues = z.infer<typeof supporterFormSchema>;
export type DemandFormValues = z.infer<typeof demandFormSchema>;
export type AgendaFormValues = z.infer<typeof agendaFormSchema>;

export const SUPPORT_LEVEL_LABELS: Record<string, string> = {
  forte: "Forte",
  medio: "Médio",
  fraco: "Fraco",
  indeciso: "Indeciso",
};

export const SUPPORTER_STATUS_LABELS: Record<string, string> = {
  interessado: "Interessado",
  apoiador: "Apoiador",
  lideranca: "Liderança",
  oposicao: "Oposição",
  indeciso: "Indeciso",
};

export const DEMAND_CATEGORY_LABELS: Record<string, string> = {
  saude: "Saúde",
  educacao: "Educação",
  infraestrutura: "Infraestrutura",
  seguranca: "Segurança",
  iluminacao: "Iluminação",
};

export const DEMAND_STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

export const DEMAND_PRIORITY_LABELS: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const FUNNEL_STAGES = [
  { key: "interessado", label: "Interessado" },
  { key: "apoiador", label: "Apoiador" },
  { key: "lideranca", label: "Liderança" },
] as const;
