import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CreatePoolClient from './create-pool-client'

export default async function CreatePoolPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Verificar se é o dono do grupo
  const { data: group } = await supabase
    .from('groups')
    .select('id, name, owner_id')
    .eq('id', id)
    .single()

  if (!group || group.owner_id !== user.id) {
    redirect(`/dashboard/groups/${id}`)
  }

  // Buscar todos os jogos da Copa para seleção
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  return (
    <CreatePoolClient
      groupId={id}
      groupName={group.name}
      initialMatches={matches || []}
    />
  )
}
