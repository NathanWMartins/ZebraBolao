/**
 * Cliente para a API da Copa do Mundo 2026
 * A chave é lida do servidor via env — nunca exposta no client bundle.
 */

import { createAdminClient } from '@/lib/supabase-admin'

const BASE_URL = process.env.WC2026_API_URL!
const API_KEY = process.env.WC2026_API_KEY!
const DAILY_LIMIT = Number(process.env.WC2026_API_DAILY_LIMIT ?? 95)

// ────────────────────────────────────────────────
// Contador diário de uso da API (tabela api_usage)
// Cada dia tem sua própria linha — sem necessidade de reset manual.
// ────────────────────────────────────────────────

async function incrementAndCheckUsage(calls: number): Promise<{ allowed: boolean; used: number }> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

  // Busca o registro de hoje
  const { data: existing } = await supabase
    .from('api_usage')
    .select('count')
    .eq('date', today)
    .maybeSingle()

  const current = existing?.count ?? 0

  if (current + calls > DAILY_LIMIT) {
    return { allowed: false, used: current }
  }

  // Upsert: incrementa o contador
  await supabase
    .from('api_usage')
    .upsert({ date: today, count: current + calls }, { onConflict: 'date' })

  return { allowed: true, used: current + calls }
}

async function wc2026Fetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
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
  phase?: string // PRE, 1H, HT, 2H, ET1, ET2, PEN, FT, FT_PEN
}

export interface WC2026TimelineEvent {
  team: string       // team code e.g. "BRA"
  type: 'goal' | 'own_goal' | 'yellow_card' | 'red_card'
  extra: string | null
  minute: number
  player: string
}

export interface WC2026MatchStats {
  match_id: number
  stats: {
    home_possession: number
    away_possession: number
    home_shots: number
    away_shots: number
    home_shots_on_target: number
    away_shots_on_target: number
    home_corners: number
    away_corners: number
    home_fouls: number
    away_fouls: number
    home_yellows: number
    away_yellows: number
    home_reds: number
    away_reds: number
  }
  timeline: WC2026TimelineEvent[]
  fetched_at: string
}

// ────────────────────────────────────────────────
// Funções de acesso à API
// ────────────────────────────────────────────────

export function getTeams() {
  return wc2026Fetch<any[]>('/teams')
}

export async function getMatchesAPI(round?: string): Promise<WC2026MatchAPI[]> {
  const query = round ? `?round=${round}` : ''
  return wc2026Fetch<WC2026MatchAPI[]>(`/matches${query}`)
}

// Busca todos os jogos do mata-mata de uma vez (em paralelo)
const KNOCKOUT_ROUNDS = ['R32', 'R16', 'QF', 'SF', '3rd', 'final']

export async function getKnockoutMatchesAPI(): Promise<WC2026MatchAPI[]> {
  const results = await Promise.all(
    KNOCKOUT_ROUNDS.map((round) => getMatchesAPI(round))
  )
  return results.flat()
}

export async function getMatchStatsAPI(matchId: number): Promise<WC2026MatchStats> {
  return wc2026Fetch<WC2026MatchStats>(`/matches/${matchId}/stats`)
}

// ────────────────────────────────────────────────
// Wrapper com proteção de limite diário
// Chamado pelo sync-matches antes de qualquer fetch
// ────────────────────────────────────────────────

/**
 * Verifica o limite diário e faz as chamadas necessárias.
 * @param callCount quantas requisições serão feitas (group=1, knockout=6)
 * @throws Error se o limite diário foi atingido
 */
export async function checkAndReserveApiCalls(callCount: number): Promise<void> {
  const { allowed, used } = await incrementAndCheckUsage(callCount)
  if (!allowed) {
    throw new Error(
      `API_LIMIT_EXCEEDED: limite diário de ${DAILY_LIMIT} requisições atingido (usado: ${used})`
    )
  }
}
