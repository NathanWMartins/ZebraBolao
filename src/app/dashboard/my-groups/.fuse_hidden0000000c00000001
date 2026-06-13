'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function joinGlobalRanking(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('global_ranking_participants')
    .upsert({ user_id: user.id, joined_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/my-groups')
  return { ok: true }
}

export type GlobalRankingEntry = {
  position: number
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  isCurrentUser: boolean
}

export async function getGlobalRanking(): Promise<{
  ranking: GlobalRankingEntry[]
  isParticipant: boolean
  currentUserId: string | null
}> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  // Verifica se o usuário atual já optou por participar
  let isParticipant = false
  if (user) {
    const { data: participation } = await admin
      .from('global_ranking_participants')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    isParticipant = !!participation
  }

  // Busca todos os participantes do ranking global
  const { data: participants } = await admin
    .from('global_ranking_participants')
    .select('user_id')

  if (!participants || participants.length === 0) {
    return { ranking: [], isParticipant, currentUserId: user?.id ?? null }
  }

  const participantIds = participants.map((p: any) => p.user_id)

  // Para cada participante, busca seus scores agrupados por grupo
  // Lógica: de cada grupo, pega o bolão onde o usuário tem mais pontos → soma entre grupos
  const { data: scores } = await admin
    .from('scores')
    .select('user_id, pool_id, group_id, total_points')
    .in('user_id', participantIds)

  if (!scores || scores.length === 0) {
    // Participantes sem pontos ainda: mostra todos com 0
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', participantIds)

    const profileMap: Record<string, any> = {}
    profiles?.forEach((p: any) => { profileMap[p.id] = p })

    const ranking = participantIds.map((uid: string, i: number) => ({
      position: i + 1,
      user_id: uid,
      username: profileMap[uid]?.username ?? 'Usuário',
      avatar_url: profileMap[uid]?.avatar_url ?? null,
      total_points: 0,
      isCurrentUser: uid === user?.id,
    }))

    return { ranking, isParticipant, currentUserId: user?.id ?? null }
  }

  // Pega o maior total_points de um único bolão por usuário (independente de grupo)
  const userTotals: Record<string, number> = {}

  for (const score of scores) {
    if (!participantIds.includes(score.user_id)) continue
    const current = userTotals[score.user_id] ?? 0
    if (score.total_points > current) {
      userTotals[score.user_id] = score.total_points
    }
  }

  // Busca profiles
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', participantIds)

  const profileMap: Record<string, any> = {}
  profiles?.forEach((p: any) => { profileMap[p.id] = p })

  // Monta ranking ordenado por pontos desc
  const sorted = participantIds
    .map((uid: string) => ({
      user_id: uid,
      username: profileMap[uid]?.username ?? 'Usuário',
      avatar_url: profileMap[uid]?.avatar_url ?? null,
      total_points: userTotals[uid] ?? 0,
      isCurrentUser: uid === user?.id,
    }))
    .sort((a: any, b: any) => b.total_points - a.total_points)

  const ranking: GlobalRankingEntry[] = sorted.map((entry: any, i: number) => ({
    ...entry,
    position: i + 1,
  }))

  return { ranking, isParticipant, currentUserId: user?.id ?? null }
}
