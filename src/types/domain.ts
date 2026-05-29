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
  interest: z.string().optional(),
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

export const agendaEventStatusSchema = z.enum([
  "agendado",
  "confirmado",
  "realizado",
  "cancelado",
] as const);

export const agendaAttendeeStatusSchema = z.enum([
  "convidado",
  "confirmado",
  "compareceu",
  "nao_compareceu",
] as const);

export const agendaAttendeeRoleSchema = z.enum(["acompanhante", "convidado", "lideranca"] as const);

export const agendaFormSchema = z.object({
  title: z.string().min(3),
  event_date: z.string().min(1),
  event_time: z.string().optional(),
  location: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  event_type: agendaEventTypeSchema.default("reuniao"),
  status: agendaEventStatusSchema.default("agendado"),
  leadership_id: z.string().optional(),
  expected_attendance: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
});

export const AGENDA_EVENT_TYPE_LABELS: Record<string, string> = {
  reuniao: "Reunião",
  evento: "Evento",
  caminhada: "Caminhada",
  visita: "Visita",
};

export const AGENDA_EVENT_STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export const AGENDA_ATTENDEE_STATUS_LABELS: Record<string, string> = {
  convidado: "Convidado",
  confirmado: "Confirmado",
  compareceu: "Compareceu",
  nao_compareceu: "Não compareceu",
};

export const AGENDA_ATTENDEE_ROLE_LABELS: Record<string, string> = {
  acompanhante: "Acompanhante",
  convidado: "Convidado",
  lideranca: "Liderança",
};

export const landingCaptureSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  interest: z.string().optional(),
  notes: z.string().optional(),
});

export const signupFormSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo de 8 caracteres"),
    fullName: z.string().min(2, "Informe seu nome"),
    tenantName: z.string().min(2, "Informe o nome da campanha"),
    slug: z
      .string()
      .min(3, "Mínimo de 3 caracteres")
      .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
    headline: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
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

export const SUPPORTER_SOURCE_LABELS: Record<string, string> = {
  landing: "Landing",
  manual: "Manual",
  import: "Importação",
};

export const DEMAND_CATEGORY_LABELS: Record<string, string> = {
  saude: "Saúde",
  educacao: "Educação",
  infraestrutura: "Infraestrutura",
  seguranca: "Segurança",
  iluminacao: "Iluminação",
  melhorias: "Melhorias",
  outros: "Outros",
};

export const DEMAND_SOURCE_LABELS: Record<string, string> = {
  landing: "Cidadão (landing)",
  manual: "Equipe",
};

export const landingDemandSchema = z.object({
  requester_name: z.string().min(2, "Informe seu nome"),
  requester_phone: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  category: z.enum(
    ["saude", "educacao", "infraestrutura", "seguranca", "iluminacao", "melhorias", "outros"] as const,
  ),
  title: z.string().min(5, "Descreva o assunto em poucas palavras"),
  description: z.string().min(10, "Conte o que precisa ser melhorado"),
});

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
