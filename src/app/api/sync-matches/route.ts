import { NextResponse } from 'next/server'
import { getMatchesAPI, getKnockoutMatchesAPI, checkAndReserveApiCalls } from '@/lib/wc2026'
import { createAdminClient } from '@/lib/supabase-admin'
import type { WC2026MatchAPI } from '@/lib/wc2026'

const SYNC_SECRET = process.env.SYNC_SECRET
if (!SYNC_SECRET) throw new Error('SYNC_SECRET env variable is required')

async function upsertMatches(supabase: ReturnType<typeof createAdminClient>, apiMatches: WC2026MatchAPI[]) {
  const rows = apiMatches.map((match) => ({
    external_id: String(match.id),
    home_team: match.home_team,
    away_team: match.away_team,
    match_date: match.kickoff_utc,
    status: match.status,
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

    // Verifica se o sync está pausado manualmente pelo admin
    const { data: syncConfig } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'sync_paused')
      .single()

    if (syncConfig?.value === 'true') {
      return NextResponse.json({ skipped: true, reason: 'Sync pausado manualmente pelo admin.' })
    }

    // Verifica se há algum jogo dentro da janela ativa agora
    // Janela = match_date até match_date + MATCH_WINDOW_MINUTES (default 120min)
    const windowMinutes = Number(process.env.MATCH_WINDOW_MINUTES ?? 120)
    const now = new Date()
    const windowMs = windowMinutes * 60 * 1000

    const { data: activeMatches } = await supabaseAdmin
      .from('matches')
      .select('id, match_date, status')

    const LIVE_STATUSES = ['live', 'in_play', 'playing']
    const PAUSE_STATUSES = ['halftime', 'delayed']

    // Jogos dentro da janela de tempo OU marcados como live
    const matchesInWindow = (activeMatches ?? []).filter((m: any) => {
      const start = new Date(m.match_date).getTime()
      const end = start + windowMs
      const nowMs = now.getTime()
      return (nowMs >= start && nowMs <= end) || LIVE_STATUSES.includes(m.status)
    })

    // Nenhum jogo na janela → pula
    if (matchesInWindow.length === 0) {
      return NextResponse.json({
        skipped: true,
        reason: 'Nenhum jogo ativo no momento.',
        checkedAt: now.toISOString(),
      })
    }

    // Todos os jogos na janela estão em pausa (intervalo/atrasado) → pula
    const allPaused = matchesInWindow.every((m: any) => PAUSE_STATUSES.includes(m.status))
    if (allPaused) {
      return NextResponse.json({
        skipped: true,
        reason: `Todos os jogos ativos estão pausados (${matchesInWindow.map((m: any) => m.status).join(', ')}).`,
        checkedAt: now.toISOString(),
      })
    }

    // Reserva 1 chamada para group; se fase de grupos acabou, reserva +6 para knockout
    // Verificamos primeiro com 1 — se passar, buscamos group e decidimos se precisamos de mais
    await checkAndReserveApiCalls(1)
    const groupApiMatches = await getMatchesAPI('group')
    const groupCount = await upsertMatches(supabaseAdmin, groupApiMatches)

    const allGroupCompleted = groupApiMatches.every((m) => m.status === 'completed')

    let knockoutCount = 0
    if (allGroupCompleted) {
      await checkAndReserveApiCalls(6) // 6 rounds de knockout
      const knockoutApiMatches = await getKnockoutMatchesAPI()
      knockoutCount = await upsertMatches(supabaseAdmin, knockoutApiMatches)
    }

    const { data: pools, error: poolsError } = await supabaseAdmin
      .from('pools')
      .select('id, match_ids, status, type, group_id')

    let poolsUpdated = 0

    if (!poolsError && pools) {
      const { data: allMatches } = await supabaseAdmin
        .from('matches')
        .select('id, status, match_date')

      const matchMap = new Map(allMatches?.map((m: any) => [m.id, m]) || [])

      for (const pool of pools) {
        const poolMatchIds = pool.match_ids || []
        const poolMatches = poolMatchIds.map((id: string) => matchMap.get(id)).filter(Boolean)

        if (poolMatches.length === 0) continue

        const now = Date.now()
        const startTimes = poolMatches.map((m: any) => new Date(m.match_date).getTime())
        const firstMatchStart = Math.min(...startTimes)
        const lastMatchStart = Math.max(...startTimes)
        const threeHoursAfterLast = lastMatchStart + 3 * 60 * 60 * 1000

        const allCompleted = poolMatches.every((m: any) => m.status === 'completed')
        const anyLive = poolMatches.some(
          (m: any) => ['live', 'in_play', 'playing', 'halftime', 'delayed'].includes(m.status)
        )

        let newStatus = 'scheduled'
        if (now >= threeHoursAfterLast && allCompleted) {
          newStatus = 'completed'
        } else if (now >= firstMatchStart || anyLive) {
          newStatus = 'live'
        }

        if (newStatus !== pool.status) {
          await supabaseAdmin
            .from('pools')
            .update({ status: newStatus })
            .eq('id', pool.id)
          poolsUpdated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      groupMatchesSynced: groupCount,
      knockoutMatchesSynced: knockoutCount,
      groupStageCompleted: allGroupCompleted,
      poolsChecked: pools?.length || 0,
      poolsUpdated,
    })
  } catch (err: any) {
    if (err.message?.startsWith('API_LIMIT_EXCEEDED')) {
      console.warn('Sync skipped:', err.message)
      return NextResponse.json({ skipped: true, reason: err.message }, { status: 429 })
    }
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
