import type { ReportsQueryParams } from "@/services/reports";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalUuid(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return UUID_RE.test(value.trim()) ? value.trim() : undefined;
}

type ReportsRpcArgs = {
  p_tenant_id: string;
  p_from: string;
  p_to: string;
  p_neighborhood?: string;
  p_city?: string;
  p_source?: string;
  p_status?: string;
  p_support_level?: string;
  p_leadership_id?: string;
  p_assigned_to?: string;
};

/** Monta payload da RPC omitindo campos vazios (evita 400 no PostgREST). */
export function buildReportsRpcPayload(params: ReportsQueryParams): ReportsRpcArgs {
  const payload: ReportsRpcArgs = {
    p_tenant_id: params.tenantId,
    p_from: params.from,
    p_to: params.to,
  };

  const neighborhood = optionalText(params.neighborhood);
  const city = optionalText(params.city);
  const source = optionalText(params.source);
  const status = optionalText(params.status);
  const supportLevel = optionalText(params.supportLevel);
  const leadershipId = optionalUuid(params.leadershipId);
  const assignedTo = optionalUuid(params.assignedTo);

  if (neighborhood) payload.p_neighborhood = neighborhood;
  if (city) payload.p_city = city;
  if (source) payload.p_source = source;
  if (status) payload.p_status = status;
  if (supportLevel) payload.p_support_level = supportLevel;
  if (leadershipId) payload.p_leadership_id = leadershipId;
  if (assignedTo) payload.p_assigned_to = assignedTo;

  return payload;
}
