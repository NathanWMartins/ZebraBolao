import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

    return <AdminClient matches={matches ?? []} playerStats={playerStats ?? []} />
}