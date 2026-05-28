import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MatchesClient from './matches-client'

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Busca todos os jogos do banco de dados ordenados por data
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  return <MatchesClient initialMatches={matches || []} />
}
