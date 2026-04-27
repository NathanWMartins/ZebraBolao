'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function updateGroupSettings(groupId: string, name?: string, password?: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  const { data: group, error: groupCheckError } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .single()

  if (groupCheckError || !group) {
    return { error: 'Grupo não encontrado.' }
  }

  if (group.owner_id !== user.id) {
    return { error: 'Apenas o administrador pode alterar as configurações.' }
  }

  const updates: any = {}
  
  if (name && name.trim() !== '') {
    updates.name = name.trim()
  }
  
  if (password && password.trim() !== '') {
    updates.password = password.trim()
    updates.is_private = true
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Nenhuma alteração informada.' }
  }

  const { error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)

  if (error) {
    console.error('Update group settings error:', error)
    return { error: 'Erro ao atualizar as configurações. Tente novamente mais tarde.' }
  }

  revalidatePath(`/dashboard/groups/${groupId}`)
  revalidatePath('/dashboard/my-groups')

  return { success: true }
}

export async function deletePool(poolId: string, groupId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data: group, error: groupCheckError } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .single()

  if (groupCheckError || !group) {
    throw new Error('Grupo não encontrado.')
  }

  if (group.owner_id !== user.id) {
    throw new Error('Apenas o administrador do grupo pode excluir um bolão.')
  }

  const { error: predictionError } = await supabase
    .from('predictions')
    .delete()
    .eq('pool_id', poolId)

  if (predictionError) {
    console.error('Delete predictions error:', predictionError)
    throw new Error('Erro ao excluir os palpites do bolão.')
  }

  const { error: poolError } = await supabase
    .from('pools')
    .delete()
    .eq('id', poolId)

  if (poolError) {
    console.error('Delete pool error:', poolError)
    throw new Error('Erro ao excluir o bolão.')
  }

  revalidatePath(`/dashboard/groups/${groupId}`)
  
  return { success: true }
}

export async function savePredictions(poolId: string, predictions: { matchId: string, prediction: string }[]) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select('group_id')
    .eq('id', poolId)
    .single()

  if (poolError || !pool) {
    return { error: 'Bolão não encontrado.' }
  }

  const { data: memberCheck, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', pool.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberError || !memberCheck) {
    return { error: 'Você não tem permissão para palpitar neste bolão.' }
  }

  const predictionData = predictions.map(p => ({
    user_id: user.id,
    pool_id: poolId,
    match_id: p.matchId,
    prediction: p.prediction
  }))

  const { error: upsertError } = await supabase
    .from('predictions')
    .upsert(predictionData, { 
      onConflict: 'user_id, pool_id, match_id' 
    })

  if (upsertError) {
    console.error('Upsert predictions error:', upsertError)
    await supabase.from('predictions').delete().eq('user_id', user.id).eq('pool_id', poolId)
    const { error: insertError } = await supabase.from('predictions').insert(predictionData)
    if (insertError) {
      console.error('Insert predictions error after delete:', insertError)
      return { error: 'Erro ao salvar os palpites.' }
    }
  }

  revalidatePath(`/dashboard/groups/${pool.group_id}`)
  revalidatePath(`/dashboard/groups/${pool.group_id}/pools/${poolId}`)

  return { success: true }
}

export async function getPoolPredictions(poolId: string) {
  const supabase = await createServerSupabaseClient()
  const supabaseAdmin = createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data, error } = await supabaseAdmin
    .from('predictions')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq('pool_id', poolId)

  if (error) {
    console.error('Fetch group predictions error:', error)
    throw new Error('Erro ao carregar os palpites do grupo.')
  }

  return data
}

export async function deleteGroup(groupId: string) {
  const supabase = await createServerSupabaseClient()
  const supabaseAdmin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  const { data: group, error: groupCheckError } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .single()

  if (groupCheckError || !group) {
    return { error: 'Grupo não encontrado.' }
  }

  if (group.owner_id !== user.id) {
    return { error: 'Apenas o administrador pode excluir o grupo.' }
  }

  // 1. Buscar todos os pools do grupo
  const { data: pools } = await supabaseAdmin
    .from('pools')
    .select('id')
    .eq('group_id', groupId)

  const poolIds = pools?.map((p: any) => p.id) || []

  // 2. Excluir palpites dos pools
  if (poolIds.length > 0) {
    const { error: predError } = await supabaseAdmin
      .from('predictions')
      .delete()
      .in('pool_id', poolIds)

    if (predError) {
      console.error('Delete predictions error:', predError)
      return { error: 'Erro ao excluir palpites do grupo.' }
    }

    // 3. Excluir os pools
    const { error: poolsError } = await supabaseAdmin
      .from('pools')
      .delete()
      .eq('group_id', groupId)

    if (poolsError) {
      console.error('Delete pools error:', poolsError)
      return { error: 'Erro ao excluir bolões do grupo.' }
    }
  }

  // 4. Excluir membros
  const { error: membersError } = await supabaseAdmin
    .from('group_members')
    .delete()
    .eq('group_id', groupId)

  if (membersError) {
    console.error('Delete group members error:', membersError)
    return { error: 'Erro ao excluir membros do grupo.' }
  }

  // 5. Excluir o grupo
  const { error: groupError } = await supabaseAdmin
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (groupError) {
    console.error('Delete group error:', groupError)
    return { error: 'Erro ao excluir o grupo.' }
  }

  revalidatePath('/dashboard/my-groups')
  revalidatePath('/dashboard')

  return { success: true }
}
