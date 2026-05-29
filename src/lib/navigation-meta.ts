import {
  LayoutDashboard,
  Users,
  Crown,
  MessageSquareWarning,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  UsersRound,
  Building2,
  type LucideIcon,
} from "lucide-react";

export type RouteMeta = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

const APP_ROUTES: Record<string, RouteMeta> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Painel operacional da campanha",
    icon: LayoutDashboard,
  },
  eleitores: {
    title: "Eleitores",
    subtitle: "Base de apoiadores e relacionamento",
    icon: Users,
  },
  liderancas: {
    title: "Lideranças",
    subtitle: "Rede de influência territorial",
    icon: Crown,
  },
  demandas: {
    title: "Demandas",
    subtitle: "Gestão operacional de solicitações",
    icon: MessageSquareWarning,
  },
  agenda: {
    title: "Agenda",
    subtitle: "Compromissos e presença de campo",
    icon: Calendar,
  },
  pesquisas: {
    title: "Pesquisas",
    subtitle: "Período, CRM e cenário eleitoral",
    icon: BarChart3,
  },
  relatorios: {
    title: "Relatórios",
    subtitle: "Central analítica e exportação executiva",
    icon: FileText,
  },
  configuracoes: {
    title: "Configurações",
    subtitle: "Perfil, metas e operação da campanha",
    icon: Settings,
  },
  equipe: {
    title: "Equipe",
    subtitle: "Membros, cargos e acessos da campanha",
    icon: UsersRound,
  },
};

const ADMIN_ROUTES: Record<string, RouteMeta> = {
  tenants: {
    title: "Clientes",
    subtitle: "Governança multi-tenant da plataforma",
    icon: Building2,
  },
  users: {
    title: "Usuários",
    subtitle: "Acesso e perfis da plataforma",
    icon: Users,
  },
  metricas: {
    title: "Métricas",
    subtitle: "Indicadores globais do SaaS",
    icon: BarChart3,
  },
};

const DEFAULT_META: RouteMeta = {
  title: "Strategos CRM",
  subtitle: "Central estratégica da campanha",
  icon: LayoutDashboard,
};

export function resolveRouteMeta(pathname: string): RouteMeta {
  const seg = pathname.split("/").filter(Boolean);
  if (!seg.length) return DEFAULT_META;

  if (seg[0] === "admin") {
    const key = seg[1] ?? "tenants";
    return ADMIN_ROUTES[key] ?? DEFAULT_META;
  }

  const key = seg[0];
  return APP_ROUTES[key] ?? DEFAULT_META;
}
