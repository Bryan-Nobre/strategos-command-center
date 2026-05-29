import { createClient } from "@/lib/supabase/client";
import type {
  LeadershipNetworkSegmentId,
  LeadershipOperationalDetailResponse,
} from "@/lib/leadership-network";

export async function fetchLeadershipOperationalDetail(
  leadershipId: string,
  params: {
    segment?: LeadershipNetworkSegmentId;
    search?: string | null;
    limit?: number;
    offset?: number;
  },
): Promise<LeadershipOperationalDetailResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_leadership_operational_detail", {
    p_leadership_id: leadershipId,
    p_segment: params.segment ?? "all",
    p_search: params.search?.trim() || null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  });
  if (error) throw error;
  return data as LeadershipOperationalDetailResponse;
}
