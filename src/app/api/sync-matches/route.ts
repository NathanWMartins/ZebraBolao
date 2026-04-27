import { NextResponse } from 'next/server'
import { getMatchesAPI } from '@/lib/wc2026'
import { createAdminClient } from '@/lib/supabase-admin'

const SYNC_SECRET = process.env.SYNC_SECRET || 'zebra-sync-secret'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseAdmin = createAdminClient()
    const apiMatches = await getMatchesAPI('group')
    const matchesToUpsert = apiMatches.map((match) => ({
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

    const { data, error } = await supabaseAdmin
      .from('matches')
      .upsert(matchesToUpsert, { onConflict: 'external_id' })

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Atualizar status dos bolões (pools) baseado nos status dos jogos
    const { data: pools, error: poolsError } = await supabaseAdmin
      .from('pools')
      .select('id, match_ids, status')

    if (!poolsError && pools) {
      const { data: allMatches } = await supabaseAdmin
        .from('matches')
        .select('id, status, match_date')

      const matchMap = new Map(allMatches?.map((m: any) => [m.id, m]) || [])

      for (const pool of pools) {
        const poolMatchesIds = pool.match_ids || []
        const poolMatches = poolMatchesIds.map((id: string) => matchMap.get(id)).filter(Boolean)
        
        if (poolMatches.length === 0) continue

        const now = new Date().getTime()
        const startTimes = poolMatches.map((m: any) => new Date(m.match_date).getTime())
        const firstMatchStart = Math.min(...startTimes)
        const lastMatchStart = Math.max(...startTimes)
        const threeHoursAfterLast = lastMatchStart + (3 * 60 * 60 * 1000)

        // Status das partidas na API
        const allFinishedInAPI = poolMatches.every((m: any) => m.status === 'finished')
        const anyLiveInAPI = poolMatches.some((m: any) => m.status === 'live' || m.status === 'in_play' || m.status === 'playing')

        let newStatus = 'scheduled'
        
        // Um bolão só é "finished" se passar 3h do último jogo E todos estiverem terminados na API
        if (now >= threeHoursAfterLast && allFinishedInAPI) {
          newStatus = 'finished'
        } 
        // É "live" se o primeiro jogo já começou OU se a API diz que tem jogo ao vivo
        else if (now >= firstMatchStart || anyLiveInAPI) {
          newStatus = 'live'
        } 
        // Caso contrário, está agendado
        else {
          newStatus = 'scheduled'
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
      count: matchesToUpsert.length,
      poolsUpdated: pools?.length || 0
    })
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
