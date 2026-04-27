'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'

export async function joinGroup(prevState: any, formData: FormData) {
  const inviteCode = formData.get('code') as string
  const password = formData.get('password') as string

  if (!inviteCode || inviteCode.trim() === '') {
    return { error: 'O código do grupo é obrigatório.' }
  }

  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  // Busca o grupo pelo código de convite usando o admin client para ignorar RLS
  const adminSupabase = createAdminClient()
  const { data: group, error: groupError } = await adminSupabase
    .from('groups')
    .select('id, name, is_private, password')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .single()

  if (groupError || !group) {
    return { error: 'Grupo não encontrado com esse código.' }
  }

  // Verifica se o grupo é privado e a senha está correta
  if (group.is_private) {
    if (!password || password.trim() === '') {
      return { error: 'Este grupo é privado. A senha é obrigatória.' }
    }
    if (group.password !== password) {
      return { error: 'Senha incorreta para este grupo.' }
    }
  }

  // Verifica se já não é membro
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    return { error: 'Você já está nesse grupo.' }
  }

  // Entra no grupo
  const { error: joinError } = await supabase
    .from('group_members')
    .insert([{
      group_id: group.id,
      user_id: user.id
    }])

  if (joinError) {
    console.error('Erro ao entrar no grupo:', joinError)
    return { error: 'Erro ao tentar entrar no grupo. Tente novamente mais tarde.' }
  }

  // Se tudo deu certo, redirecionamos para a página do grupo
  redirect(`/dashboard/groups/${group.id}`)
}
