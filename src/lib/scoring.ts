// Tabela de pontos por fase
// Grupos: 1pt | 16avos: 2pts | Oitavas: 3pts | Quartas: 5pts | Semi: 8pts | Final: 12pts
export const ROUND_POINTS: Record<string, number> = {
  'group stage': 1,
  'group a': 1, 'group b': 1, 'group c': 1, 'group d': 1,
  'group e': 1, 'group f': 1, 'group g': 1, 'group h': 1,
  'group i': 1, 'group j': 1, 'group k': 1, 'group l': 1,
  // API codes (saved directly to DB)
  'r32': 2,
  'r16': 3,
  'qf': 5,
  'sf': 8,
  '3rd': 5,
  // Long-form variants
  'round of 32': 2,
  'round of 16': 3,
  'quarter-finals': 5,
  'quarter-final': 5,
  'semi-finals': 8,
  'semi-final': 8,
  '3rd place final': 5,
  'final': 12,
}

export function getPointsForRound(round: string): number {
  const key = round?.toLowerCase().trim()
  if (!key) return 1
  if (key in ROUND_POINTS) return ROUND_POINTS[key]
  if (key.includes('group')) return 1
  if (key.includes('final') && key.includes('3rd')) return 5
  if (key.includes('final')) return 12
  if (key.includes('semi')) return 8
  if (key.includes('quarter')) return 5
  if (key.includes('round of 16')) return 3
  if (key.includes('round of 32')) return 2
  return 1
}
