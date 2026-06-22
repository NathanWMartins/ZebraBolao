'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { getPointsForRound } from '@/lib/scoring'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  // Pegamos apenas emails válidos (ignora undefined se não estiver no env)
  const adminEmails = [process.env.ADMIN_EMAIL].filter(Boolean) as string[]

  if (!user.email || !adminEmails.includes(user.email)) {
    throw new Error('Acesso negado: você não tem permissão de administrador.')
  }
  return createAdminClient()
}

export async function incrementStat(id: string, field: 'goals' | 'assists') {
  if (!id || typeof id !== 'string') throw new Error('ID inválido')
  if (field !== 'goals' && field !== 'assists') throw new Error('Campo inválido')

  const supabase = await checkAdmin()
  const { data: current, error } = await supabase.from('player_stats').select(field).eq('id', id).single()
  if (current) {
    await supabase.from('player_stats').update({ [field]: (current as any)[field] + 1 }).eq('id', id)
    revalidatePath('/dashboard')
  }
}

export async function decrementStat(id: string, field: 'goals' | 'assists') {
  if (!id || typeof id !== 'string') throw new Error('ID inválido')
  if (field !== 'goals' && field !== 'assists') throw new Error('Campo inválido')

  const supabase = await checkAdmin()
  const { data: current } = await supabase.from('player_stats').select(field).eq('id', id).single()
  if (current && (current as any)[field] > 0) {
    await supabase.from('player_stats').update({ [field]: (current as any)[field] - 1 }).eq('id', id)
    revalidatePath('/dashboard')
  }
}

export async function addPlayerStat(playerName: string, team: string, goals: number, assists: number) {
  if (!playerName || typeof playerName !== 'string' || playerName.length > 100) throw new Error('Nome do jogador inválido')
  if (!team || typeof team !== 'string' || team.length > 100) throw new Error('Seleção inválida')
  if (typeof goals !== 'number' || goals < 0 || goals > 1000) throw new Error('Valor de gols inválido')
  if (typeof assists !== 'number' || assists < 0 || assists > 1000) throw new Error('Valor de assistências inválido')

  const supabase = await checkAdmin()

  // Verifica se o jogador já existe para não duplicar
  const { data: existing } = await supabase.from('player_stats')
    .select('*')
    .eq('player_name', playerName)
    .eq('team', team)
    .single()

  if (existing) {
    await supabase.from('player_stats')
      .update({ goals: existing.goals + goals, assists: existing.assists + assists })
      .eq('id', existing.id)
  } else {
    await supabase.from('player_stats').insert({
      player_name: playerName,
      team,
      goals,
      assists
    })
  }
  revalidatePath('/dashboard')
}

export async function addTeamCard(team: string, cardType: 'yellow' | 'red') {
  if (!team || typeof team !== 'string' || team.length > 100) throw new Error('Seleção inválida')
  if (cardType !== 'yellow' && cardType !== 'red') throw new Error('Tipo de cartão inválido')

  const supabase = await checkAdmin()
  const field = cardType === 'yellow' ? 'yellow_cards' : 'red_cards'

  const { data: existing } = await supabase.from('team_stats')
    .select('*')
    .eq('team', team)
    .single()

  if (existing) {
    await supabase.from('team_stats')
      .update({ [field]: (existing as any)[field] + 1 })
      .eq('team', team)
  } else {
    await supabase.from('team_stats').insert({
      team,
      yellow_cards: cardType === 'yellow' ? 1 : 0,
      red_cards: cardType === 'red' ? 1 : 0,
    })
  }
  revalidatePath('/dashboard')
}

export async function decrementTeamCard(team: string, cardType: 'yellow' | 'red') {
  if (!team || typeof team !== 'string' || team.length > 100) throw new Error('Seleção inválida')
  if (cardType !== 'yellow' && cardType !== 'red') throw new Error('Tipo de cartão inválido')

  const supabase = await checkAdmin()
  const field = cardType === 'yellow' ? 'yellow_cards' : 'red_cards'

  const { data: existing } = await supabase.from('team_stats')
    .select('*')
    .eq('team', team)
    .single()

  if (existing && (existing as any)[field] > 0) {
    await supabase.from('team_stats')
      .update({ [field]: (existing as any)[field] - 1 })
      .eq('team', team)
    revalidatePath('/dashboard')
  }
}

export async function updateMatch(id: string, status: string, homeScore: number | null, awayScore: number | null) {
  const supabase = await checkAdmin()

  const { error } = await supabase
    .from('matches')
    .update({ status, home_score: homeScore, away_score: awayScore })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function calculateScoresForMatch(matchId: string): Promise<{ poolsUpdated: number }> {
  const supabase = await checkAdmin()

  // Busca todos os bolões que contêm este jogo
  const { data: pools, error: poolsError } = await supabase
    .from('pools')
    .select('id, type, group_id, match_ids')

  if (poolsError || !pools) throw new Error('Erro ao buscar bolões.')

  const affectedPools = pools.filter((p: any) =>
    Array.isArray(p.match_ids) && p.match_ids.includes(matchId)
  )

  if (affectedPools.length === 0) return { poolsUpdated: 0 }

  // Para cada bolão afetado, recalcula o total completo do zero
  let poolsUpdated = 0

  for (const pool of affectedPools) {
    // Busca todos os jogos do bolão que já têm placar (inclui round para pontuação)
    const { data: matches } = await supabase
      .from('matches')
      .select('id, home_score, away_score, status, round')
      .in('id', pool.match_ids)

    const completedMatches = (matches ?? []).filter(
      (m: any) => m.status === 'completed' && m.home_score !== null && m.away_score !== null
    )

    if (completedMatches.length === 0) continue

    // Busca todos os palpites do bolão
    const { data: predictions } = await supabase
      .from('predictions')
      .select('user_id, match_id, prediction')
      .eq('pool_id', pool.id)

    if (!predictions || predictions.length === 0) continue

    // Recalcula pontos do zero por usuário
    const userPoints: Record<string, number> = {}

    for (const match of completedMatches) {
      const h = match.home_score as number
      const a = match.away_score as number
      const actualResult = h > a ? 'Time A' : a > h ? 'Time B' : 'Empate'
      const exactScore = `${h}-${a}`
      const pts = getPointsForRound(match.round)

      for (const pred of predictions) {
        if (pred.match_id !== match.id) continue
        if (!(pred.user_id in userPoints)) userPoints[pred.user_id] = 0

        if (pool.type === 'score') {
          if (pred.prediction === exactScore) userPoints[pred.user_id] += pts
        } else {
          if (pred.prediction === actualResult) userPoints[pred.user_id] += pts
        }
      }
    }

    // Substitui os scores do bolão (delete + insert para garantir consistência)
    const scoredMatchIds = completedMatches.map((m: any) => m.id)

    for (const [userId, points] of Object.entries(userPoints)) {
      await supabase
        .from('scores')
        .upsert({
          user_id: userId,
          pool_id: pool.id,
          group_id: pool.group_id,
          total_points: points,
          scored_match_ids: scoredMatchIds,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, pool_id' })
    }

    poolsUpdated++
  }

  revalidatePath('/dashboard/admin')
  return { poolsUpdated }
}

export async function getSyncPaused(): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('app_config')
    .select('value')
    .eq('key', 'sync_paused')
    .single()
  return data?.value === 'true'
}

export async function setSyncPaused(paused: boolean): Promise<void> {
  const supabase = await checkAdmin()
  await supabase
    .from('app_config')
    .upsert({ key: 'sync_paused', value: paused ? 'true' : 'false' }, { onConflict: 'key' })
  revalidatePath('/dashboard/admin')
}

export type GroupStandingEntry = {
  id: string
  group_name: string
  team: string
  position: number
  played: number
  points: number
  goals_for: number
  goals_against: number
  wins: number
  draws: number
  losses: number
}

export async function getGroupStandings(): Promise<GroupStandingEntry[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_standings')
    .select('*')
    .order('group_name', { ascending: true })
    .order('position', { ascending: true })
  return (data ?? []) as GroupStandingEntry[]
}

export async function upsertTeamStanding(entry: Omit<GroupStandingEntry, 'id'>): Promise<void> {
  const supabase = await checkAdmin()
  await supabase
    .from('group_standings')
    .upsert(entry, { onConflict: 'group_name,team' })
  revalidatePath('/dashboard/standings')
  revalidatePath('/dashboard/admin')
}

export async function reorderGroupStandings(
  groupName: string,
  orderedTeams: string[]
): Promise<void> {
  const supabase = await checkAdmin()
  for (let i = 0; i < orderedTeams.length; i++) {
    await supabase
      .from('group_standings')
      .update({ position: i + 1 })
      .eq('group_name', groupName)
      .eq('team', orderedTeams[i])
  }
  revalidatePath('/dashboard/standings')
  revalidatePath('/dashboard/admin')
}
