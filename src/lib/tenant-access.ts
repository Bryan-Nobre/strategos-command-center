import type { Tenant } from "@/lib/supabase/session";
import type { Enums } from "@/types/supabase";

export function isTenantOperational(tenant: Tenant | null | undefined): boolean {
  return tenant?.status === "active";
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
  return {
    title: "Acesso indisponível",
    description: "Entre em contato com o administrador da plataforma.",
  };
}

export const PLATFORM_CONTACT_EMAIL =
  import.meta.env.VITE_PLATFORM_CONTACT_EMAIL?.trim() || "contato@strategos.app";
