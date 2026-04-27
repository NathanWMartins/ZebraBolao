'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPool(groupId: string, name: string, matchIds: string[]) {
  if (!name || name.trim() === '') {
    return { error: 'O nome do bolão é obrigatório.' }
  }

  if (!matchIds || matchIds.length === 0) {
    return { error: 'Selecione pelo menos um jogo para o bolão.' }
  }

  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  // Verificar se o usuário é o dono do grupo
  const { data: group, error: groupCheckError } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .single()

  if (groupCheckError || !group) {
    return { error: 'Grupo não encontrado.' }
  }

  if (group.owner_id !== user.id) {
    return { error: 'Apenas o administrador pode criar um bolão.' }
  }

  // Criar o bolão
  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .insert([{
      group_id: groupId,
      name: name.trim(),
      match_ids: matchIds // A coluna que o usuário acabou de criar
    }])
    .select()
    .single()

  if (poolError) {
    console.error('Create pool error:', poolError)
    return { error: 'Erro ao criar o bolão. Tente novamente mais tarde.' }
  }

  revalidatePath(`/dashboard/groups/${groupId}`)
  
  return { success: true, poolId: pool.id }
}
