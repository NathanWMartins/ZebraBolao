/**
 * Cliente para a API da Copa do Mundo 2026
 * A chave é lida do servidor via env — nunca exposta no client bundle.
 */

const BASE_URL = process.env.WC2026_API_URL!
const API_KEY = process.env.WC2026_API_KEY!

async function wc2026Fetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    // Revalida a cada 60 minutos (dados da Copa mudam pouco)
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`WC2026 API error ${res.status}: ${await res.text()}`)
  }

  return res.json() as Promise<T>
}

// ────────────────────────────────────────────────
// Tipos retornados pela API (formato /matches)
// ────────────────────────────────────────────────

export interface WC2026MatchAPI {
  id: number
  match_number: number
  round: string
  group_name: string
  home_team_id: number
  home_team: string
  home_team_code: string
  home_team_flag: string | null
  away_team_id: number
  away_team: string
  away_team_code: string
  away_team_flag: string | null
  stadium_id: number
  stadium: string
  stadium_city: string
  stadium_country: string
  kickoff_utc: string
  home_score: number | null
  away_score: number | null
  status: string
}

// ────────────────────────────────────────────────
// Funções de acesso à API
// ────────────────────────────────────────────────

export function getTeams() {
  return wc2026Fetch<any[]>('/teams')
}

export function getMatchesAPI(round?: string) {
  const query = round ? `?round=${round}` : ''
  return wc2026Fetch<WC2026MatchAPI[]>(`/matches${query}`)
}