'use server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type PoolType = 'winner' | 'exact'

export type QuickMatch = {
  id: string
  home_team: string
  away_team: string
  home_team_code: string
  away_team_code: string
  match_date: string
  status: string
  home_score: number | null
  away_score: number | null
  home_pen_score: number | null
  away_pen_score: number | null
  round: string
  group_name: string | null
}

export type QuickParticipant = { id: string; quick_pool_id: string; name: string; created_at: string }
export type QuickPrediction = {
  id: string
  quick_pool_id: string
  participant_id: string
  match_id: string
  predicted_winner: 'home' | 'draw' | 'away'
  home_score_pred: number | null
  away_score_pred: number | null
}

export type WinnerPredictions = Record<string, Record<string, 'home' | 'draw' | 'away'>>
export type ExactPredictions = Record<string, Record<string, { home: number; away: number }>>

export async function createQuickPool(data: {
  name: string
  type: PoolType
  matchIds: string[]
  participants: string[]
  winnerPredictions: WinnerPredictions
  exactPredictions: ExactPredictions
}): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: pool, error: poolErr } = await supabase
    .from('quick_pools')
    .insert({ name: data.name, type: data.type, owner_id: user.id, match_ids: data.matchIds })
    .select('id')
    .single()
  if (poolErr || !pool) throw new Error(poolErr?.message || 'Erro ao criar bolão')

  const { data: participants, error: partErr } = await supabase
    .from('quick_participants')
    .insert(data.participants.map(name => ({ quick_pool_id: pool.id, name })))
    .select('id, name')
  if (partErr || !participants) throw new Error(partErr?.message || 'Erro ao criar participantes')

  const predRows = participants.flatMap(p => {
    if (data.type === 'exact') {
      return Object.entries(data.exactPredictions[p.name] || {}).map(([matchId, scores]) => {
        const winner = scores.home > scores.away ? 'home' : scores.home < scores.away ? 'away' : 'draw'
        return {
          quick_pool_id: pool.id,
          participant_id: p.id,
          match_id: matchId,
          predicted_winner: winner as 'home' | 'draw' | 'away',
          home_score_pred: scores.home,
          away_score_pred: scores.away,
        }
      })
    } else {
      return Object.entries(data.winnerPredictions[p.name] || {}).map(([matchId, winner]) => ({
        quick_pool_id: pool.id,
        participant_id: p.id,
        match_id: matchId,
        predicted_winner: winner,
        home_score_pred: null as unknown as number,
        away_score_pred: null as unknown as number,
      }))
    }
  })

  if (predRows.length > 0) {
    const { error: predErr } = await supabase.from('quick_predictions').insert(predRows)
    if (predErr) throw new Error(predErr.message)
  }

  revalidatePath('/dashboard/quick-pool')
  return pool.id
}

export async function getQuickPools() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('quick_pools')
    .select('id, name, type, status, match_ids, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getQuickPoolDetail(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pool } = await supabase
    .from('quick_pools')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()
  if (!pool) return null

  const [{ data: participants }, { data: predictions }, { data: matches }] = await Promise.all([
    supabase.from('quick_participants').select('*').eq('quick_pool_id', id).order('created_at'),
    supabase.from('quick_predictions').select('*').eq('quick_pool_id', id),
    supabase.from('matches')
      .select('id, home_team, away_team, home_team_code, away_team_code, home_score, away_score, home_pen_score, away_pen_score, match_date, status, round, group_name')
      .in('id', pool.match_ids || [])
      .order('match_date'),
  ])

  return {
    pool,
    participants: (participants || []) as QuickParticipant[],
    predictions: (predictions || []) as QuickPrediction[],
    matches: (matches || []) as QuickMatch[],
  }
}

export async function deleteQuickPool(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  await supabase.from('quick_pools').delete().eq('id', id).eq('owner_id', user.id)
  revalidatePath('/dashboard/quick-pool')
}

const TBD_PATTERNS = ['tbd', 'a definir', 'to be', 'winner of', 'loser of', 'w ', 'l ']
function isTeamDefined(team: string | null): boolean {
  if (!team || team.trim() === '') return false
  const lower = team.toLowerCase()
  return !TBD_PATTERNS.some(p => lower.includes(p))
}

export async function getAvailableMatches(): Promise<QuickMatch[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_team_code, away_team_code, match_date, status, home_score, away_score, home_pen_score, away_pen_score, round, group_name')
    .neq('status', 'completed')
    .order('match_date', { ascending: true })

  // Filtra jogos sem times definidos (fase mata-mata sem confrontos definidos)
  return ((data || []) as QuickMatch[]).filter(
    m => isTeamDefined(m.home_team) && isTeamDefined(m.away_team)
  )
}
