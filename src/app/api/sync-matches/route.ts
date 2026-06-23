/**
 * GET /api/sync-matches
 * Cron automático: sincroniza status, placar e phase dos jogos apenas.
 * Stats (gols, cartões) e pontos são processados exclusivamente pelo botão no admin.
 */
import { NextResponse } from 'next/server'
import { getMatchesAPI, getKnockoutMatchesAPI, checkAndReserveApiCalls } from '@/lib/wc2026'
import { createAdminClient } from '@/lib/supabase-admin'
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
    home_team_code: match.home_team_code,
    away_team_code: match.away_team_code,
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

    const windowMinutes = Number(process.env.MATCH_WINDOW_MINUTES ?? 120)
    const now = new Date()
    const windowMs = windowMinutes * 60 * 1000

    const { data: allDbMatches } = await supabaseAdmin
      .from('matches')
      .select('id, match_date, status')

    // Só roda se houver jogos na janela ativa ou ao vivo
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

    // Busca jogos da API e faz upsert
    await checkAndReserveApiCalls(1)
    const groupApiMatches = await getMatchesAPI('group')
    const groupCount = await upsertMatches(supabaseAdmin, groupApiMatches)

    const allGroupCompleted = groupApiMatches.every((m) => m.status === 'completed')

    let knockoutCount = 0
    if (allGroupCompleted) {
      await checkAndReserveApiCalls(6)
      const knockoutApiMatches = await getKnockoutMatchesAPI()
      knockoutCount = await upsertMatches(supabaseAdmin, knockoutApiMatches)
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
