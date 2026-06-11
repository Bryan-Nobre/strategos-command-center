/** Pontuação unificada da liderança (fonte: soma dos pesos dos vínculos no backend/RLS). */

export type LeadershipPointsRow = {
  total_points?: number;
  political_strength_score: number;
  pledged_votes?: number;
  estimated_votes?: number;
};

export function leadershipTotalPoints(row: LeadershipPointsRow): number {
  return row.total_points ?? row.political_strength_score;
}
