'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

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

  // Busca o jogo com o placar
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, home_score, away_score, status')
    .eq('id', matchId)
    .single()

  if (matchError || !match) throw new Error('Jogo não encontrado.')
  if (match.status !== 'finished' || match.home_score === null || match.away_score === null) {
    throw new Error('O jogo ainda não foi finalizado.')
  }

  const h = match.home_score as number
  const a = match.away_score as number
  const actualResult = h > a ? 'Time A' : a > h ? 'Time B' : 'Empate'
  const exactScore = `${h}-${a}`

  // Busca todos os bolões que contêm este jogo
  const { data: pools, error: poolsError } = await supabase
    .from('pools')
    .select('id, type, group_id, match_ids')

  if (poolsError || !pools) throw new Error('Erro ao buscar bolões.')

  const affectedPools = pools.filter((p: any) =>
    Array.isArray(p.match_ids) && p.match_ids.includes(matchId)
  )

  if (affectedPools.length === 0) return { poolsUpdated: 0 }

  // Busca todos os palpites deste jogo em todos os bolões afetados
  const poolIds = affectedPools.map((p: any) => p.id)
  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('user_id, pool_id, prediction')
    .eq('match_id', matchId)
    .in('pool_id', poolIds)

  if (predError || !predictions) throw new Error('Erro ao buscar palpites.')

  // Calcula pontos por (user_id, pool_id)
  const pointsMap: Record<string, Record<string, number>> = {}
  // pointsMap[pool_id][user_id] = points

  const poolTypeMap: Record<string, string> = {}
  const poolGroupMap: Record<string, string> = {}
  for (const p of affectedPools) {
    poolTypeMap[p.id] = p.type
    poolGroupMap[p.id] = p.group_id
    pointsMap[p.id] = {}
  }

  for (const pred of predictions) {
    const { user_id, pool_id, prediction } = pred
    const poolType = poolTypeMap[pool_id]
    if (!pointsMap[pool_id]) continue
    if (!(user_id in pointsMap[pool_id])) pointsMap[pool_id][user_id] = 0

    if (poolType === 'score') {
      if (prediction === exactScore) {
        pointsMap[pool_id][user_id] += 1
      }
    } else {
      if (prediction === actualResult) pointsMap[pool_id][user_id] += 1
    }
  }

  // Upsert dos pontos: soma incremental por (user_id, pool_id)
  // Usa uma chave única de controle para evitar dupla contagem: scored_match_ids
  let poolsUpdated = 0
  for (const pool of affectedPools) {
    const poolPoints = pointsMap[pool.id]
    if (Object.keys(poolPoints).length === 0) continue

    for (const [userId, points] of Object.entries(poolPoints)) {
      // Busca registro existente
      const { data: existing } = await supabase
        .from('scores')
        .select('id, total_points, scored_match_ids')
        .eq('user_id', userId)
        .eq('pool_id', pool.id)
        .maybeSingle()

      const scoredIds: string[] = existing?.scored_match_ids ?? []

      // Evita dupla contagem: só processa se este jogo ainda não foi contado
      if (scoredIds.includes(matchId)) continue

      const newTotal = (existing?.total_points ?? 0) + points
      const newScoredIds = [...scoredIds, matchId]

      await supabase
        .from('scores')
        .upsert({
          user_id: userId,
          pool_id: pool.id,
          group_id: pool.group_id,
          total_points: newTotal,
          scored_match_ids: newScoredIds,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id, pool_id' })
    }
    poolsUpdated++
  }

  revalidatePath('/dashboard/admin')
  return { poolsUpdated }
}
