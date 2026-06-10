import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import JoinGroupPageWrapper from './JoinGroupClient'

export default async function JoinGroupPage(props: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await props.searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const next = `/dashboard/groups/join${code ? `?code=${code}` : ''}`
    redirect(`/auth/login?next=${encodeURIComponent(next)}`)
  }

  return <JoinGroupPageWrapper />
}
