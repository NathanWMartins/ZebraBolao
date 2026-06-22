/**
 * GET /api/sync-matches
 * Cron automático: sincroniza jogos, detecta encerrados e processa stats/pontos.
 *
 * Fluxo por ciclo:
 * 1. Verifica se há jogos na janela ativa (não roda se não tiver)
 * 2. Busca /matches da API → atualiza status, phase, placar no banco
 * 3. Para jogos que chegaram com phase=FT e ainda não eram completed:
 *    - Busca /matches/:id/stats → atualiza player_stats e team_stats
 *    - Marca jogo como completed
 *    - Calcula pontos dos bolões
 * 4. Atualiza status dos pools
 */
import { NextResponse } from 'next/server'
import { getMatchesAPI, getKnockoutMatchesAPI, getMatchStatsAPI, checkAndReserveApiCalls } from '@/lib/wc2026'
import { createAdminClient } from '@/lib/supabase-admin'
import { calculateScoresForMatch } from '@/app/dashboard/admin-actions'
import type { WC2026MatchAPI } from '@/lib/wc2026'

const SYNC_SECRET = process.env.SYNC_SECRET
if (!SYNC_SECRET) throw new Error('SYNC_SECRET env variable is required')

const LIVE_STATUSES = ['live', 'in_play', 'playing']
const PAUSE_STATUSES = ['halftime', 'delayed']

async function upsertMatches(supabase: ReturnType<typeof createAdminClient>, apiMatches: WC2026MatchAPI[]) {
  const rows = apiMatches.map((match) => ({
    external_id: String(match.id),
    home_team: match.home_team,
    away_team: match.away_team,
    match_date: match.kickoff_utc,
    status: match.status,
    phase: match.phase ?? null,
    home_score: match.home_score,
    away_score: match.away_score,
    stadium: match.stadium,
    round: match.round,
    group_name: match.group_name,
  }))

  const { error } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'external_id' })

  if (error) throw new Error(`Upsert error: ${error.message}`)
  return rows.length
}

async function processFinishedMatch(
  supabase: ReturnType<typeof createAdminClient>,
  dbMatch: { id: string; external_id: string; home_team: string; away_team: string }
) {
  // Busca stats do jogo encerrado
  const statsData = await getMatchStatsAPI(Number(dbMatch.external_id))

  // Player stats: gols da timeline
  const goalsByPlayer: Record<string, { team: string; goals: number }> = {}
  for (const event of statsData.timeline ?? []) {
    if (event.type === 'goal') {
      const key = `${event.player}__${event.team}`
      if (!goalsByPlayer[key]) goalsByPlayer[key] = { team: event.team, goals: 0 }
      goalsByPlayer[key].goals++
    }
  }

  for (const [key, data] of Object.entries(goalsByPlayer)) {
    const playerName = key.split('__')[0]
    const { data: existing } = await supabase
      .from('player_stats')
      .select('id, goals')
      .eq('player_name', playerName)
      .eq('team', data.team)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('player_stats')
        .update({ goals: existing.goals + data.goals })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('player_stats')
        .insert({ player_name: playerName, team: data.team, goals: data.goals, assists: 0 })
    }
  }

  // Team stats: cartões
  const s = statsData.stats
  for (const [team, yellows, reds] of [
    [dbMatch.home_team, s.home_yellows, s.home_reds],
    [dbMatch.away_team, s.away_yellows, s.away_reds],
  ] as [string, number, number][]) {
    const { data: existing } = await supabase
      .from('team_stats')
      .select('id, yellow_cards, red_cards')
      .eq('team', team)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('team_stats')
        .update({ yellow_cards: existing.yellow_cards + yellows, red_cards: existing.red_cards + reds })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('team_stats')
        .insert({ team, yellow_cards: yellows, red_cards: reds })
    }
  }

  // Marca completed e calcula pontos
  await supabase.from('matches').update({ status: 'completed' }).eq('id', dbMatch.id)

  try {
    await calculateScoresForMatch(dbMatch.id)
  } catch (e) {
    console.error(`Erro ao calcular pontos match ${dbMatch.id}:`, e)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secretParam = searchParams.get('secret')
  const authHeader = request.headers.get('authorization')

  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManualSecret = secretParam === SYNC_SECRET || authHeader === `Bearer ${SYNC_SECRET}`

  if (!isVercelCron && !isManualSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseAdmin = createAdminClient()

    // Verifica se sync está pausado
    const { data: syncConfig } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'sync_paused')
      .single()

    if (syncConfig?.value === 'true') {
      return NextResponse.json({ skipped: true, reason: 'Sync pausado manualmente pelo admin.' })
    }

    // Verifica janela ativa
    const windowMinutes = Number(process.env.MATCH_WINDOW_MINUTES ?? 120)
    const now = new Date()
    const windowMs = windowMinutes * 60 * 1000

    const { data: allDbMatches } = await supabaseAdmin
      .from('matches')
      .select('id, external_id, home_team, away_team, match_date, status')

    const matchesInWindow = (allDbMatches ?? []).filter((m: any) => {
      const start = new Date(m.match_date).getTime()
      const end = start + windowMs
      const nowMs = now.getTime()
      return (nowMs >= start && nowMs <= end) || LIVE_STATUSES.includes(m.status)
    })

    if (matchesInWindow.length === 0) {
      return NextResponse.json({
        skipped: true,
        reason: 'Nenhum jogo ativo no momento.',
        checkedAt: now.toISOString(),
      })
    }

    const allPaused = matchesInWindow.every((m: any) => PAUSE_STATUSES.includes(m.status))
    if (allPaused) {
      return NextResponse.json({
        skipped: true,
        reason: `Todos os jogos pausados (${matchesInWindow.map((m: any) => m.status).join(', ')}).`,
        checkedAt: now.toISOString(),
      })
    }

    // Busca jogos atualizados da API
    await checkAndReserveApiCalls(1)
    const groupApiMatches = await getMatchesAPI('group')
    const groupCount = await upsertMatches(supabaseAdmin, groupApiMatches)

    const allGroupCompleted = groupApiMatches.every((m) => m.status === 'completed')

    let knockoutCount = 0
    let knockoutApiMatches: WC2026MatchAPI[] = []
    if (allGroupCompleted) {
      await checkAndReserveApiCalls(6)
      knockoutApiMatches = await getKnockoutMatchesAPI()
      knockoutCount = await upsertMatches(supabaseAdmin, knockoutApiMatches)
    }

    // Detecta jogos que a API marcou como completed mas o banco ainda não tem
    const allApiMatches = [...groupApiMatches, ...knockoutApiMatches]
    const justFinished = allApiMatches.filter(
      (m) => m.status === 'completed' && m.home_score !== null && m.away_score !== null
    )

    let matchesProcessed = 0
    let matchesErrors = 0

    if (justFinished.length > 0) {
      const externalIds = justFinished.map((m) => String(m.id))
      const { data: dbToProcess } = await supabaseAdmin
        .from('matches')
        .select('id, external_id, home_team, away_team, status')
        .in('external_id', externalIds)
        .neq('status', 'completed')

      for (const dbMatch of dbToProcess ?? []) {
        try {
          await checkAndReserveApiCalls(1)
          await processFinishedMatch(supabaseAdmin, dbMatch)
          matchesProcessed++
        } catch (e: any) {
          console.error(`Erro ao processar match ${dbMatch.id}:`, e.message)
          matchesErrors++
        }
      }
    }

    // Atualiza status dos pools
    const { data: pools } = await supabaseAdmin
      .from('pools')
      .select('id, match_ids, status')

    let poolsUpdated = 0
    if (pools) {
      const { data: refreshedMatches } = await supabaseAdmin
        .from('matches')
        .select('id, status, match_date')
      const matchMap = new Map(refreshedMatches?.map((m: any) => [m.id, m]) || [])

      for (const pool of pools) {
        const poolMatches = (pool.match_ids || []).map((id: string) => matchMap.get(id)).filter(Boolean)
        if (poolMatches.length === 0) continue

        const nowMs = Date.now()
        const starts = poolMatches.map((m: any) => new Date(m.match_date).getTime())
        const firstStart = Math.min(...starts)
        const lastStart = Math.max(...starts)
        const threeHoursAfterLast = lastStart + 3 * 60 * 60 * 1000

        const allCompleted = poolMatches.every((m: any) => m.status === 'completed')
        const anyLive = poolMatches.some((m: any) =>
          [...LIVE_STATUSES, ...PAUSE_STATUSES].includes(m.status)
        )

        let newStatus = 'scheduled'
        if (nowMs >= threeHoursAfterLast && allCompleted) newStatus = 'completed'
        else if (nowMs >= firstStart || anyLive) newStatus = 'live'

        if (newStatus !== pool.status) {
          await supabaseAdmin.from('pools').update({ status: newStatus }).eq('id', pool.id)
          poolsUpdated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: now.toISOString(),
      groupMatchesSynced: groupCount,
      knockoutMatchesSynced: knockoutCount,
      groupStageCompleted: allGroupCompleted,
      matchesFinished: matchesProcessed,
      matchesErrors,
      poolsUpdated,
    })
  } catch (err: any) {
    if (err.message?.startsWith('API_LIMIT_EXCEEDED')) {
      return NextResponse.json({ skipped: true, reason: err.message }, { status: 429 })
    }
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
