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
  const supabaseAdmin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  // Verificar ownership com o client autenticado
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

  // Usar admin client para deletar (bypass RLS)
  const { error: predictionError } = await supabaseAdmin
    .from('predictions')
    .delete()
    .eq('pool_id', poolId)

  if (predictionError) {
    console.error('Delete predictions error:', predictionError)
    throw new Error('Erro ao excluir os palpites do bolão.')
  }

  const { error: poolError } = await supabaseAdmin
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

export async function saveSpecialPredictions(poolId: string, predictions: { betType: string, value: string }[]) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select('group_id')
    .eq('id', poolId)
    .single()

  if (poolError || !pool) return { error: 'Bolão não encontrado.' }

  const { data: memberCheck } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', pool.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!memberCheck) return { error: 'Você não tem permissão para palpitar neste bolão.' }

  const data = predictions.map(p => ({
    pool_id: poolId,
    user_id: user.id,
    bet_type: p.betType,
    value: p.value,
  }))

  const { error } = await supabase
    .from('special_predictions')
    .upsert(data, { onConflict: 'pool_id, user_id, bet_type' })

  if (error) {
    console.error('Save special predictions error:', error)
    return { error: 'Erro ao salvar as apostas especiais.' }
  }

  revalidatePath(`/dashboard/groups/${pool.group_id}/pools/${poolId}`)
  return { success: true }
}

export async function getSpecialPredictions(poolId: string) {
  const supabase = await createServerSupabaseClient()
  const supabaseAdmin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const { data: bets, error } = await supabaseAdmin
    .from('special_predictions')
    .select('*')
    .eq('pool_id', poolId)

  if (error) {
    console.error('getSpecialPredictions error:', error)
    throw new Error('Erro ao carregar apostas especiais.')
  }

  if (!bets || bets.length === 0) return []

  // Busca profiles separadamente
  const userIds = [...new Set(bets.map((b: any) => b.user_id))]
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profileMap: Record<string, any> = {}
  profiles?.forEach((p: any) => { profileMap[p.id] = p })

  return bets.map((b: any) => ({
    ...b,
    profiles: profileMap[b.user_id] ?? { username: 'Usuário', avatar_url: null }
  }))
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

export async function getPoolRanking(poolId: string) {
  const supabaseAdmin = createAdminClient()

  // Busca o pool para saber group_id e match_ids
  const { data: pool } = await supabaseAdmin
    .from('pools')
    .select('id, type, group_id, match_ids')
    .eq('id', poolId)
    .single()

  if (!pool) return []

  // Busca os jogos do bolão com resultados
  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('id, home_score, away_score')
    .in('id', pool.match_ids || [])

  // Busca todos os palpites do bolão
  const { data: predictions, error } = await supabaseAdmin
    .from('predictions')
    .select('user_id, match_id, prediction')
    .eq('pool_id', poolId)

  if (error || !predictions || predictions.length === 0) return []

  const matchById = new Map((matches || []).map((m: any) => [m.id, m]))
  const userPoints: Record<string, number> = {}

  for (const pred of predictions) {
    const match = matchById.get(pred.match_id)
    if (!match || match.home_score === null || match.away_score === null) continue

    const h = match.home_score as number
    const a = match.away_score as number
    const actual = h > a ? 'Time A' : a > h ? 'Time B' : 'Empate'

    if (!userPoints[pred.user_id]) userPoints[pred.user_id] = 0

    if (pool.type === 'score') {
      if (pred.prediction === `${h}-${a}`) {
        userPoints[pred.user_id] += 3
      } else {
        const parts = pred.prediction?.split('-')
        if (parts?.length === 2) {
          const ph = parseInt(parts[0]), pa = parseInt(parts[1])
          const pr = ph > pa ? 'Time A' : pa > ph ? 'Time B' : 'Empate'
          if (pr === actual) userPoints[pred.user_id] += 1
        }
      }
    } else {
      if (pred.prediction === actual) userPoints[pred.user_id] += 1
    }
  }

  const sorted = Object.entries(userPoints).sort(([, a], [, b]) => b - a)
  if (sorted.length === 0) return []

  const userIds = sorted.map(([uid]) => uid)
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profileMap: Record<string, any> = {}
  profiles?.forEach((p: any) => { profileMap[p.id] = p })

  return sorted.map(([userId, points], idx) => ({
    position: idx + 1,
    user_id: userId,
    points,
    username: profileMap[userId]?.username ?? 'Usuário',
    avatar_url: profileMap[userId]?.avatar_url ?? null,
  }))
}

export async function getGroupRanking(groupId: string) {
  const supabaseAdmin = createAdminClient()

  // Busca total_points por usuário da tabela scores (agregado por grupo)
  const { data: scores, error } = await supabaseAdmin
    .from('scores')
    .select('user_id, total_points')
    .eq('group_id', groupId)
    .order('total_points', { ascending: false })

  if (error) {
    console.error('getGroupRanking error:', error)
    throw new Error('Erro ao carregar ranking geral.')
  }

  if (!scores || scores.length === 0) return []

  const sorted = (scores as any[]).map((s: any) => [s.user_id, s.total_points] as [string, number])

  const userIds = sorted.map(([uid]) => uid)
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profileMap: Record<string, any> = {}
  profiles?.forEach((p: any) => { profileMap[p.id] = p })

  return sorted.map(([userId, points], idx) => ({
    position: idx + 1,
    user_id: userId,
    points,
    username: profileMap[userId]?.username ?? 'Usuário',
    avatar_url: profileMap[userId]?.avatar_url ?? null,
  }))
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

  const { data: pools } = await supabaseAdmin
    .from('pools')
    .select('id')
    .eq('group_id', groupId)

  const poolIds = pools?.map((p: any) => p.id) || []

  if (poolIds.length > 0) {
    const { error: predError } = await supabaseAdmin
      .from('predictions')
      .delete()
      .in('pool_id', poolIds)

    if (predError) {
      console.error('Delete predictions error:', predError)
      return { error: 'Erro ao excluir palpites do grupo.' }
    }

    const { error: poolsError } = await supabaseAdmin
      .from('pools')
      .delete()
      .eq('group_id', groupId)

    if (poolsError) {
      console.error('Delete pools error:', poolsError)
      return { error: 'Erro ao excluir bolões do grupo.' }
    }
  }

  const { error: membersError } = await supabaseAdmin
    .from('group_members')
    .delete()
    .eq('group_id', groupId)

  if (membersError) {
    console.error('Delete group members error:', membersError)
    return { error: 'Erro ao excluir membros do grupo.' }
  }

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
