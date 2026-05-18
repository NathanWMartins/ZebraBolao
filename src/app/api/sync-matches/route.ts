import { NextResponse } from 'next/server'
import { getMatchesAPI, getKnockoutMatchesAPI } from '@/lib/wc2026'
import { createAdminClient } from '@/lib/supabase-admin'
import type { WC2026MatchAPI } from '@/lib/wc2026'
import type { SupabaseClient } from '@supabase/supabase-js'

const SYNC_SECRET = process.env.SYNC_SECRET || 'zebra-sync-secret'

// Converte jogos da API para o formato do banco e faz upsert
async function upsertMatches(supabase: SupabaseClient, apiMatches: WC2026MatchAPI[]) {
  const rows = apiMatches.map((match) => ({
    external_id: String(match.id),
    home_team: match.home_team,
    away_team: match.away_team,
    match_date: match.kickoff_utc,
    status: match.status,
    home_score: match.home_score,
    away_score: match.away_score,
    result:
      match.home_score !== null && match.away_score !== null
        ? `${match.home_score}-${match.away_score}`
        : null,
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

    // ── 1. Sincroniza fase de grupos ──────────────────────────────────
    const groupApiMatches = await getMatchesAPI('group')
    const groupCount = await upsertMatches(supabaseAdmin, groupApiMatches)

    // ── 2. Detecta se a fase de grupos terminou ───────────────────────
    const allGroupFinished = groupApiMatches.every((m) => m.status === 'finished')

    let knockoutCount = 0
    if (allGroupFinished) {
      // ── 3. Sincroniza mata-mata (só quando grupos acabaram) ─────────
      const knockoutApiMatches = await getKnockoutMatchesAPI()
      knockoutCount = await upsertMatches(supabaseAdmin, knockoutApiMatches)
    }

    // ── 4. Atualiza status dos bolões ─────────────────────────────────
    const { data: pools, error: poolsError } = await supabaseAdmin
      .from('pools')
      .select('id, match_ids, status')

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

        const allFinished = poolMatches.every((m: any) => m.status === 'finished')
        const anyLive = poolMatches.some(
          (m: any) => m.status === 'live' || m.status === 'in_play' || m.status === 'playing'
        )

        let newStatus = 'scheduled'
        // Finalizado: 3h após o último jogo E todos terminados na API
        if (now >= threeHoursAfterLast && allFinished) {
          newStatus = 'finished'
        }
        // Ao vivo: primeiro jogo já começou OU API sinaliza ao vivo
        else if (now >= firstMatchStart || anyLive) {
          newStatus = 'live'
        }

        if (newStatus !== pool.status) {
          await supabaseAdmin
            .from('pools')
            .update({ status: newStatus })
            .eq('id', pool.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      groupMatchesSynced: groupCount,
      knockoutMatchesSynced: knockoutCount,
      groupStageFinished: allGroupFinished,
      poolsChecked: pools?.length || 0,
    })
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
