import type { Rank } from '../_logic/types.def.js';

const RANK_MAP: Record<Rank, number> = {
  normal: 0,
  deprecated: -1,
  preferred: +1,
};

export const sortByRank = (a: { rank: Rank }, b: { rank: Rank }) =>
  RANK_MAP[a.rank] - RANK_MAP[b.rank];
