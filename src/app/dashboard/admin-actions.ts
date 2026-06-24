'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { getPointsForRound } from '@/lib/scoring'
import { getMatchStatsAPI } from '@/lib/wc2026'

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

export async function processMatchAndCalculate(matchId: string): Promise<{ goalsUpdated: number; poolsUpdated: number; statsNote: string }> {
  const supabase = await checkAdmin()
  const admin = createAdminClient()

  // Busca o jogo no banco para pegar external_id e times
  const { data: match } = await admin
    .from('matches')
    .select('id, external_id, home_team, away_team, home_team_code, away_team_code')
    .eq('id', matchId)
    .single()

  if (!match) throw new Error('Jogo não encontrado.')

  // Mapa código → nome completo (ex: "ARG" → "Argentina")
  // Necessário porque a timeline da API usa código do time, não o nome completo
  const teamCodeMap: Record<string, string> = {}
  if (match.home_team_code) teamCodeMap[match.home_team_code] = match.home_team
  if (match.away_team_code) teamCodeMap[match.away_team_code] = match.away_team
  const resolveTeam = (codeOrName: string) => teamCodeMap[codeOrName] ?? codeOrName

  // Busca stats da API (pode não estar disponível ainda)
  let goalsUpdated = 0
  let statsNote = ''

  try {
    const statsData = await getMatchStatsAPI(Number(match.external_id))

    // Player stats: gols da timeline
    const goalsByPlayer: Record<string, { team: string; goals: number }> = {}
    for (const event of statsData.timeline ?? []) {
      if (event.type === 'goal') {
        const teamName = resolveTeam(event.team)
        const key = `${event.player}__${teamName}`
        if (!goalsByPlayer[key]) goalsByPlayer[key] = { team: teamName, goals: 0 }
        goalsByPlayer[key].goals++
      }
    }

    for (const [key, data] of Object.entries(goalsByPlayer)) {
      const playerName = key.split('__')[0]
      const { data: existing } = await admin
        .from('player_stats')
        .select('id, goals')
        .eq('player_name', playerName)
        .eq('team', data.team)
        .maybeSingle()

      if (existing) {
        await admin.from('player_stats').update({ goals: existing.goals + data.goals }).eq('id', existing.id)
      } else {
        await admin.from('player_stats').insert({ player_name: playerName, team: data.team, goals: data.goals, assists: 0 })
      }
      goalsUpdated++
    }

    // Team stats: cartões
    const s = statsData.stats
    for (const [team, yellows, reds] of [
      [match.home_team, s.home_yellows, s.home_reds],
      [match.away_team, s.away_yellows, s.away_reds],
    ] as [string, number, number][]) {
      const { data: existing } = await admin.from('team_stats').select('id, yellow_cards, red_cards').eq('team', team).maybeSingle()
      if (existing) {
        await admin.from('team_stats').update({ yellow_cards: existing.yellow_cards + yellows, red_cards: existing.red_cards + reds }).eq('id', existing.id)
      } else {
        await admin.from('team_stats').insert({ team, yellow_cards: yellows, red_cards: reds })
      }
    }

    // Salva cartões no jogo
    await admin.from('matches').update({
      home_yellows: s.home_yellows,
      home_reds: s.home_reds,
      away_yellows: s.away_yellows,
      away_reds: s.away_reds,
      stats_processed: true,
    }).eq('id', matchId)

  } catch (e: any) {
    // Stats ainda não disponíveis na API (ex: 404) — prossegue só com cálculo de pontos
    statsNote = ' (stats indisponíveis)'
    console.warn(`Stats não disponíveis para match ${matchId}:`, e.message)
  }

  // Calcula pontos independente de ter stats
  const { poolsUpdated } = await calculateScoresForMatch(matchId)

  revalidatePath('/dashboard/admin')
  return { goalsUpdated, poolsUpdated, statsNote }
}

export async function recalculateAllScores(): Promise<{ matchesProcessed: number; poolsUpdated: number }> {
  const supabase = await checkAdmin()

  // Busca todos os jogos completed com placar
  const { data: completedMatches } = await supabase
    .from('matches')
    .select('id')
    .eq('status', 'completed')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)

  if (!completedMatches || completedMatches.length === 0) return { matchesProcessed: 0, poolsUpdated: 0 }

  // Primeiro limpa todos os scores existentes para recalcular do zero
  await supabase.from('scores').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  let totalPoolsUpdated = 0
  for (const match of completedMatches) {
    const res = await calculateScoresForMatch(match.id)
    totalPoolsUpdated = Math.max(totalPoolsUpdated, res.poolsUpdated)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/my-groups')
  return { matchesProcessed: completedMatches.length, poolsUpdated: totalPoolsUpdated }
}

export async function calculateScoresForMatch(matchId: string): Promise<{ poolsUpdated: number }> {
  const supabase = await checkAdmin()

  const { data: pools, error: poolsError } = await supabase
    .from('pools')
    .select('id, name, type, group_id, match_ids')

  if (poolsError || !pools) throw new Error('Erro ao buscar bolões.')

  const affectedPools = pools.filter((p: any) =>
    Array.isArray(p.match_ids) && p.match_ids.includes(matchId)
  )

  if (affectedPools.length === 0) return { poolsUpdated: 0 }

  let poolsUpdated = 0

  for (const pool of affectedPools) {
    const { data: matches } = await supabase
      .from('matches')
      .select('id, home_score, away_score, status, round')
      .in('id', pool.match_ids)

    const completedMatches = (matches ?? []).filter(
      (m: any) => m.status === 'completed' && m.home_score !== null && m.away_score !== null
    )

    if (completedMatches.length === 0) continue

    const { data: predictions } = await supabase
      .from('predictions')
      .select('user_id, match_id, prediction')
      .eq('pool_id', pool.id)

    if (!predictions || predictions.length === 0) continue

    const userPoints: Record<string, number> = {}

    for (const m of completedMatches) {
      const h = m.home_score as number
      const a = m.away_score as number
      const actualResult = h > a ? 'Time A' : a > h ? 'Time B' : 'Empate'
      const exactScore = `${h}-${a}`
      const pts = getPointsForRound(m.round)

      for (const pred of predictions) {
        if (pred.match_id !== m.id) continue
        if (!(pred.user_id in userPoints)) userPoints[pred.user_id] = 0

        if (pool.type === 'score') {
          if (pred.prediction === exactScore) userPoints[pred.user_id] += pts
        } else {
          if (pred.prediction === actualResult) userPoints[pred.user_id] += pts
        }
      }
    }

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

// Retorna quem acertou o jogo, agrupado por bolão
export type MatchHit = {
  userId: string
  userName: string
  poolId: string
  poolName: string
  groupId: string
  prediction: string
}

export async function getMatchHits(matchId: string): Promise<MatchHit[]> {
  await checkAdmin()
  const admin = createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select('id, home_score, away_score, round')
    .eq('id', matchId)
    .single()

  if (!match || match.home_score === null) return []

  const h = match.home_score as number
  const a = match.away_score as number
  const actualResult = h > a ? 'Time A' : a > h ? 'Time B' : 'Empate'
  const exactScore = `${h}-${a}`

  const { data: pools } = await admin
    .from('pools')
    .select('id, name, type, group_id, match_ids')

  const affectedPools = (pools ?? []).filter((p: any) =>
    Array.isArray(p.match_ids) && p.match_ids.includes(matchId)
  )

  const hits: MatchHit[] = []

  for (const pool of affectedPools) {
    const { data: predictions } = await admin
      .from('predictions')
      .select('user_id, prediction')
      .eq('pool_id', pool.id)
      .eq('match_id', matchId)

    for (const pred of (predictions ?? [])) {
      const isHit = pool.type === 'score'
        ? pred.prediction === exactScore
        : pred.prediction === actualResult

      if (!isHit) continue

      // Busca nome do usuário (tenta profiles, cai em auth.users)
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, email')
        .eq('id', pred.user_id)
        .maybeSingle()

      let userName = profile?.full_name ?? profile?.email ?? null
      if (!userName) {
        const { data: authUser } = await admin.auth.admin.getUserById(pred.user_id)
        userName = authUser?.user?.user_metadata?.full_name
          ?? authUser?.user?.email
          ?? pred.user_id
      }

      hits.push({
        userId: pred.user_id,
        userName,
        poolId: pool.id,
        poolName: pool.name,
        groupId: pool.group_id,
        prediction: pred.prediction,
      })
    }
  }

  return hits
}

export async function notifyMatchHits(matchId: string): Promise<{ notified: number }> {
  await checkAdmin()
  const admin = createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select('home_team, away_team, home_score, away_score')
    .eq('id', matchId)
    .single()

  if (!match) throw new Error('Jogo não encontrado')

  const hits = await getMatchHits(matchId)
  if (hits.length === 0) return { notified: 0 }

  const matchLabel = `${match.home_team} x ${match.away_team}`

  // Ranking antes
  const { data: rankingBefore } = await admin
    .from('global_ranking_participants')
    .select('user_id, total_points')
    .order('total_points', { ascending: false })
  const rankBefore: Record<string, number> = {}
  ;(rankingBefore ?? []).forEach((r: any, i: number) => { rankBefore[r.user_id] = i + 1 })

  // Envia notificação de acerto para cada hit
  for (const hit of hits) {
    await admin.from('notifications').insert({
      user_id: hit.userId,
      type: 'hit',
      title: '🎯 Palpite certo!',
      body: `Você acertou ${matchLabel} no bolão "${hit.poolName}"`,
      link: `/dashboard/groups/${hit.groupId}/pools/${hit.poolId}`,
    })
  }

  // Ranking depois — notifica subidas
  const { data: rankingAfter } = await admin
    .from('global_ranking_participants')
    .select('user_id, total_points')
    .order('total_points', { ascending: false })

  for (let i = 0; i < (rankingAfter ?? []).length; i++) {
    const r = (rankingAfter ?? [])[i]
    const newRank = i + 1
    const oldRank = rankBefore[r.user_id]
    if (oldRank && newRank < oldRank) {
      await admin.from('notifications').insert({
        user_id: r.user_id,
        type: 'ranking_up',
        title: '📈 Você subiu no ranking!',
        body: `Você foi do ${oldRank}º para o ${newRank}º lugar no ranking geral.`,
        link: '/dashboard/ranking',
      })
    }
  }

  revalidatePath('/dashboard/admin')
  return { notified: hits.length }
}

export async function runSync(): Promise<Record<string, unknown>> {
  await checkAdmin()
  const secret = process.env.SYNC_SECRET
  if (!secret) throw new Error('SYNC_SECRET não configurado')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/sync-matches`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  })
  return res.json()
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
