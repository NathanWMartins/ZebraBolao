import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PredictClient from './PredictClient'
import { Box, Typography, Button } from '@mui/material'
import Link from 'next/link'

export default async function PoolPredictPage(props: { params: Promise<{ id: string, poolId: string }> }) {
  const { id, poolId } = await props.params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Verificar acesso ao grupo
  const { data: memberCheck } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: group } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', id)
    .single()

  const isOwner = group?.owner_id === user.id

  if (!memberCheck && !isOwner) {
    redirect(`/dashboard/groups/${id}`)
  }

  // Buscar o bolão
  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('id', poolId)
    .single()

  if (!pool) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#111110', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography sx={{ color: '#fff', mt: 10 }}>Bolão não encontrado.</Typography>
        <Link href={`/dashboard/groups/${id}`}><Button sx={{ mt: 2, color: '#C9940A' }}>Voltar ao Grupo</Button></Link>
      </Box>
    )
  }

  // Buscar os jogos deste bolão
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .in('id', pool.match_ids)
    .order('match_date', { ascending: true })

  // Buscar palpites existentes do usuário para este bolão
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)

  return (
    <PredictClient
      groupId={id}
      poolId={poolId}
      poolName={pool.name}
      matches={matches || []}
      initialPredictions={predictions || []}
    />
  )
}
