import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import StandingsClient from './StandingsClient'

export default async function StandingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const admin = createAdminClient()
  const { data } = await admin
    .from('group_standings')
    .select('*')
    .order('group_name', { ascending: true })
    .order('position', { ascending: true })

  return <StandingsClient standings={data ?? []} />
}
