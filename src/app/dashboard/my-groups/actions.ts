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
  last_match_points: number | null
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

  // Soma pontos por jogo único por usuário (tabela user_match_points)
  const { data: matchPoints } = await admin
    .from('user_match_points')
    .select('user_id, match_id, points')
    .in('user_id', participantIds)

  // Busca o último jogo completed globalmente
  const { data: lastMatch } = await admin
    .from('matches')
    .select('id')
    .eq('status', 'completed')
    .order('match_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Busca profiles
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', participantIds)

  const profileMap: Record<string, any> = {}
  profiles?.forEach((p: any) => { profileMap[p.id] = p })

  // Soma total e captura pontos do último jogo por usuário
  const userTotals: Record<string, number> = {}
  const userLastPoints: Record<string, number> = {}
  for (const row of (matchPoints ?? [])) {
    userTotals[row.user_id] = (userTotals[row.user_id] ?? 0) + row.points
    if (lastMatch && row.match_id === lastMatch.id) {
      userLastPoints[row.user_id] = row.points
    }
  }

  // Monta ranking ordenado por pontos desc
  const sorted = participantIds
    .map((uid: string) => ({
      user_id: uid,
      username: profileMap[uid]?.username ?? 'Usuário',
      avatar_url: profileMap[uid]?.avatar_url ?? null,
      total_points: userTotals[uid] ?? 0,
      last_match_points: userLastPoints[uid] ?? null,
      isCurrentUser: uid === user?.id,
    }))
    .sort((a: any, b: any) => b.total_points - a.total_points)

  const ranking: GlobalRankingEntry[] = sorted.map((entry: any, i: number) => ({
    ...entry,
    position: i + 1,
  }))

  return { ranking, isParticipant, currentUserId: user?.id ?? null }
}
