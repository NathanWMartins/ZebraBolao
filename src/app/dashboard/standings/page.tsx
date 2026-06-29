import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import StandingsClient from './StandingsClient'

export default async function StandingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const admin = createAdminClient()
  const { data: standings } = await admin
    .from('group_standings')
    .select('*')
    .order('group_name', { ascending: true })
    .order('position', { ascending: true })

  const { data: knockoutMatches } = await admin
    .from('matches')
    .select('id, home_team, away_team, home_team_code, away_team_code, match_date, round, status, home_score, away_score, home_pen_score, away_pen_score')
    .neq('round', 'group')
    .order('match_date', { ascending: true })

  return <StandingsClient standings={standings ?? []} knockoutMatches={knockoutMatches ?? []} />
}
