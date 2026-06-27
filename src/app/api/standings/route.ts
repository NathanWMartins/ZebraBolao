import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const admin = createAdminClient()
  const { data: standings } = await admin
    .from('group_standings')
    .select('*')
    .order('group_name', { ascending: true })
    .order('position', { ascending: true })

  const { data: knockoutMatches } = await admin
    .from('matches')
    .select('id, home_team, away_team, home_team_code, away_team_code, match_date, round, status, home_score, away_score')
    .neq('round', 'group')
    .order('match_date', { ascending: true })

  return NextResponse.json({ standings: standings ?? [], knockoutMatches: knockoutMatches ?? [] })
}
