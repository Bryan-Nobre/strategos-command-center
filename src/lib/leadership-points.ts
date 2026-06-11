/** Pontuação: 1 ponto por apoiador na rede (fonte canônica no backend/RLS). */

export type LeadershipPointsRow = {
  linked_supporters?: number;
  total_points?: number;
  political_strength_score: number;
  pledged_supporters_count?: number;
  pledged_votes?: number;
  estimated_votes?: number;
};

export function leadershipTotalPoints(row: LeadershipPointsRow): number {
  return row.linked_supporters ?? row.total_points ?? row.political_strength_score;
}

export function leadershipLandpagePoints(row: LeadershipPointsRow): number {
  return row.pledged_supporters_count ?? row.pledged_votes ?? 0;
}
