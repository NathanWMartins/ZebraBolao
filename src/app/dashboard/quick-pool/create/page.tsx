import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getAvailableMatches } from '../actions'
import QuickPoolCreateClient from './QuickPoolCreateClient'

export default async function QuickPoolCreatePage() {
  // Deadline: final da Copa 19/07/2026 às 16h (Brasília)
  if (new Date() >= new Date('2026-07-19T16:00:00-03:00')) {
    redirect('/dashboard/quick-pool')
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const matches = await getAvailableMatches()

  return <QuickPoolCreateClient matches={matches} />
}
