import type { Enums } from "@/types/supabase";
import { TENANT_STATUS_LABELS } from "@/types/tenant";

/** CRM liberado para uso operacional (active + trial). Segurança real: RLS/backend. */
export function isTenantOperational(tenant: { status: Enums<"tenant_status"> } | null | undefined): boolean {
  return tenant?.status === "active" || tenant?.status === "trial";
}

export function getTenantAccessMessage(status: Enums<"tenant_status">): {
  title: string;
  description: string;
} {
  if (status === "suspended") {
    return {
      title: "Conta aguardando ativação",
      description:
        "Sua campanha foi criada, mas o acesso ao CRM ainda não está liberado. Efetue o pagamento conforme combinado e entre em contato com o administrador da plataforma para ativar sua conta.",
    };
  }
  if (status === "pending") {
    return {
      title: "Conta em análise",
      description:
        "Estamos revisando seu cadastro. Entre em contato com o administrador da plataforma para mais informações.",
    };
  }
  if (status === "cancelled") {
    return {
      title: "Conta encerrada",
      description:
        "O acesso a esta campanha foi cancelado. Entre em contato com o administrador da plataforma se acredita que isso é um erro.",
    };
  }
  return {
    title: "Acesso indisponível",
    description: `Status: ${TENANT_STATUS_LABELS[status] ?? status}. Entre em contato com o administrador da plataforma.`,
  };
}

export const PLATFORM_CONTACT_EMAIL =
  import.meta.env.VITE_PLATFORM_CONTACT_EMAIL?.trim() || "contato@strategos.app";
