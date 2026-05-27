import { useMemo } from "react";
import { usePlanUsage } from "@/hooks/use-plan-usage";
import type { SupporterImportRow } from "@/services/supporters";

function isUnlimited(max: number | null): boolean {
  return max === null;
}

export function usePlanGate(tenantId: string) {
  const { data: usage, isLoading, isError } = usePlanUsage(tenantId);

  return useMemo(() => {
    const limits = usage?.limits;
    const remaining = usage?.remaining;
    const used = usage?.usage;

    const canAddSupporters = (count = 1) => {
      if (!limits || !remaining || !used) return !isLoading;
      if (isUnlimited(limits.maxSupporters)) return true;
      return (remaining.supporters ?? 0) >= count;
    };

    const canInviteTeam = (count = 1) => {
      if (!limits || !remaining) return !isLoading;
      if (isUnlimited(limits.maxTeamMembers)) return true;
      return (remaining.teamSlots ?? 0) >= count;
    };

    const canExport = limits?.exportsEnabled ?? true;
    const canEditPolls = limits?.pollsEnabled ?? true;

    const sliceImportRows = <T extends SupporterImportRow>(rows: T[]) => {
      if (!remaining || isUnlimited(limits?.maxSupporters ?? null)) {
        return { rows, skipped: 0 };
      }
      const allowed = remaining.supporters ?? 0;
      if (allowed <= 0) return { rows: [] as T[], skipped: rows.length };
      if (rows.length <= allowed) return { rows, skipped: 0 };
      return { rows: rows.slice(0, allowed), skipped: rows.length - allowed };
    };

    const supporterUsageLabel = () => {
      if (!limits || !used) return null;
      if (isUnlimited(limits.maxSupporters)) {
        return `${used.supporters.toLocaleString("pt-BR")} apoiadores`;
      }
      return `${used.supporters.toLocaleString("pt-BR")} / ${limits.maxSupporters!.toLocaleString("pt-BR")} apoiadores`;
    };

    const teamUsageLabel = () => {
      if (!limits || !used) return null;
      if (isUnlimited(limits.maxTeamMembers)) {
        return `${used.teamSlots} vagas em uso`;
      }
      return `${used.teamSlots} / ${limits.maxTeamMembers} vagas (membros + convites)`;
    };

    return {
      usage,
      isLoading,
      isError,
      canAddSupporters,
      canInviteTeam,
      canExport,
      canEditPolls,
      sliceImportRows,
      supporterUsageLabel,
      teamUsageLabel,
    };
  }, [usage, isLoading, isError]);
}
