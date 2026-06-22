import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getSyncPaused, getGroupStandings } from '../admin-actions'

export default async function AdminPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const adminEmails = [process.env.ADMIN_EMAIL].filter(Boolean) as string[]
    if (!user?.email || !adminEmails.includes(user.email)) {
        redirect('/dashboard')
    }

    const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })

    const { data: playerStats } = await supabase
        .from('player_stats')
        .select('*')
        .order('goals', { ascending: false })

    const { data: teamStats } = await supabase
        .from('team_stats')
        .select('*')
        .order('yellow_cards', { ascending: false })

    const syncPaused = await getSyncPaused()
    const groupStandings = await getGroupStandings()

    // Match IDs que já tiveram pontos calculados (aparecem em scored_match_ids de algum score)
    const { data: scoresData } = await supabase
        .from('scores')
        .select('scored_match_ids')

    const scoredMatchIds = new Set<string>(
        (scoresData ?? []).flatMap((s: any) => s.scored_match_ids ?? [])
    )

    return <AdminClient matches={matches ?? []} playerStats={playerStats ?? []} teamStats={teamStats ?? []} syncPaused={syncPaused} groupStandings={groupStandings} scoredMatchIds={[...scoredMatchIds]} />
}