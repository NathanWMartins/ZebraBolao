'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  // Pegamos apenas emails válidos (ignora undefined se não estiver no env)
  const adminEmails = [process.env.ADMIN_EMAIL].filter(Boolean) as string[]

  if (!user.email || !adminEmails.includes(user.email)) {
    throw new Error('Acesso negado: você não tem permissão de administrador.')
  }
  return createAdminClient()
}

export async function incrementStat(id: string, field: 'goals' | 'assists') {
  if (!id || typeof id !== 'string') throw new Error('ID inválido')
  if (field !== 'goals' && field !== 'assists') throw new Error('Campo inválido')

  const supabase = await checkAdmin()
  const { data: current, error } = await supabase.from('player_stats').select(field).eq('id', id).single()
  if (current) {
    await supabase.from('player_stats').update({ [field]: (current as any)[field] + 1 }).eq('id', id)
    revalidatePath('/dashboard')
  }
}

export async function decrementStat(id: string, field: 'goals' | 'assists') {
  if (!id || typeof id !== 'string') throw new Error('ID inválido')
  if (field !== 'goals' && field !== 'assists') throw new Error('Campo inválido')

  const supabase = await checkAdmin()
  const { data: current } = await supabase.from('player_stats').select(field).eq('id', id).single()
  if (current && (current as any)[field] > 0) {
    await supabase.from('player_stats').update({ [field]: (current as any)[field] - 1 }).eq('id', id)
    revalidatePath('/dashboard')
  }
}

export async function addPlayerStat(playerName: string, team: string, goals: number, assists: number) {
  if (!playerName || typeof playerName !== 'string' || playerName.length > 100) throw new Error('Nome do jogador inválido')
  if (!team || typeof team !== 'string' || team.length > 100) throw new Error('Seleção inválida')
  if (typeof goals !== 'number' || goals < 0 || goals > 1000) throw new Error('Valor de gols inválido')
  if (typeof assists !== 'number' || assists < 0 || assists > 1000) throw new Error('Valor de assistências inválido')

  const supabase = await checkAdmin()

  // Verifica se o jogador já existe para não duplicar
  const { data: existing } = await supabase.from('player_stats')
    .select('*')
    .eq('player_name', playerName)
    .eq('team', team)
    .single()

  if (existing) {
    await supabase.from('player_stats')
      .update({ goals: existing.goals + goals, assists: existing.assists + assists })
      .eq('id', existing.id)
  } else {
    await supabase.from('player_stats').insert({
      player_name: playerName,
      team,
      goals,
      assists
    })
  }
  revalidatePath('/dashboard')
}

export async function updateMatch(id: string, status: string, homeScore: number | null, awayScore: number | null) {
  const supabase = await createAdminClient()
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  const adminEmails = [process.env.ADMIN_EMAIL].filter(Boolean) as string[]
  if (!user?.email || !adminEmails.includes(user.email)) throw new Error('Acesso negado.')

  const result = status === 'finished' ? `${homeScore}-${awayScore}` : null
  const { error } = await supabase
    .from('matches')
    .update({ status, home_score: homeScore, away_score: awayScore, result })
    .eq('id', id)
  if (error) throw new Error(error.message)
  return { success: true }
}
