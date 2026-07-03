import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getAvailableMatches } from '../actions'
import QuickPoolCreateClient from './QuickPoolCreateClient'

export default async function QuickPoolCreatePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const matches = await getAvailableMatches()

  return <QuickPoolCreateClient matches={matches} />
}
