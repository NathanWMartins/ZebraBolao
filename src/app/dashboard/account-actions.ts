'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const supabase = await createServerSupabaseClient()
  const supabaseAdmin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const userId = user.id

  // 1. Remover palpites
  await supabaseAdmin.from('predictions').delete().eq('user_id', userId)
  await supabaseAdmin.from('special_predictions').delete().eq('user_id', userId)

  // 2. Remover pontuação
  await supabaseAdmin.from('scores').delete().eq('user_id', userId)

  // 3. Remover membros de grupos (sair de todos os grupos)
  await supabaseAdmin.from('group_members').delete().eq('user_id', userId)

  // 4. Grupos que o usuário criou: transferir ownership não é obrigatório,
  //    mas devemos deletar para não deixar grupos órfãos.
  //    Busca grupos do usuário, deleta predictions/members/pools associados e depois o grupo.
  const { data: ownedGroups } = await supabaseAdmin
    .from('groups')
    .select('id')
    .eq('owner_id', userId)

  if (ownedGroups && ownedGroups.length > 0) {
    const groupIds = ownedGroups.map((g: any) => g.id)

    const { data: groupPools } = await supabaseAdmin
      .from('pools')
      .select('id')
      .in('group_id', groupIds)

    const poolIds = groupPools?.map((p: any) => p.id) || []

    if (poolIds.length > 0) {
      await supabaseAdmin.from('predictions').delete().in('pool_id', poolIds)
      await supabaseAdmin.from('special_predictions').delete().in('pool_id', poolIds)
      await supabaseAdmin.from('pools').delete().in('id', poolIds)
    }

    await supabaseAdmin.from('scores').delete().in('group_id', groupIds)
    await supabaseAdmin.from('group_members').delete().in('group_id', groupIds)
    await supabaseAdmin.from('groups').delete().in('id', groupIds)
  }

  // 5. Remover perfil
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  // 6. Fazer logout e deletar o usuário no Auth
  await supabase.auth.signOut()
  await supabaseAdmin.auth.admin.deleteUser(userId)

  redirect('/')
}
