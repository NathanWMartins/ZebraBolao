'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'ZBR-'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createGroup(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const isPrivateStr = formData.get('is_private')
  const isPrivate = isPrivateStr === 'true' || isPrivateStr === 'on'
  const password = isPrivate ? (formData.get('password') as string) : null

  if (!name || name.trim() === '') {
    return { error: 'O nome do grupo é obrigatório.' }
  }
  
  if (isPrivate && (!password || password.trim() === '')) {
    return { error: 'A senha é obrigatória para grupos privados.' }
  }

  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado.' }
  }

  const invite_code = generateInviteCode()

  const { data, error } = await supabase
    .from('groups')
    .insert([{
      name: name.trim(),
      owner_id: user.id,
      invite_code,
      is_private: isPrivate,
      password: password
    }])
    .select()
    .single()

  if (error) {
    console.error('Create group error:', error)
    return { error: 'Erro ao criar o grupo. Verifique as configurações do banco.' }
  }

  // Adiciona automaticamente o criador do grupo como membro
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([{
      group_id: data.id,
      user_id: user.id
    }])

  if (memberError) {
    console.error('Add group member error:', memberError)
    // Mesmo se falhar ao adicionar como membro, o grupo foi criado, mas idealmente devemos tratar
    return { error: 'Grupo criado, mas houve um erro ao te adicionar como membro.' }
  }

  // Retorna sucesso com os dados do grupo gerado, em vez de redirecionar
  return {
    success: true,
    group: {
      id: data.id,
      invite_code: data.invite_code,
      name: data.name
    }
  }
}

