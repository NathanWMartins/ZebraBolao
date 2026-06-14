import React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Box, Typography, Button, Stack } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import ShareModalClient from './ShareModalClient'
import EditGroupModal from './EditGroupModal'
import GroupPoolsList from './GroupPoolsList'
import MembersListClient from './MembersListClient'

export default async function GroupPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await props.params
  const { tab } = await props.searchParams
  const activeTab = tab === 'ranking' ? 'ranking' : tab === 'history' ? 'history' : 'active'

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: memberCheck } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#111110', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography sx={{ color: '#fff', mt: 10 }}>Grupo não encontrado.</Typography>
        <Link href="/dashboard"><Button sx={{ mt: 2, color: '#C9940A' }}>Voltar</Button></Link>
      </Box>
    )
  }

  const isOwner = group.owner_id === user.id

  if (!memberCheck && !isOwner) {
    redirect(`/dashboard/groups/join?code=${group.invite_code}`)
  }

  const { data: membersData } = await supabase
    .from('group_members')
    .select(`
      joined_at,
      profiles (
        id,
        username,
        avatar_url
      )
    `)
    .eq('group_id', id)
    .order('joined_at', { ascending: true })

  const membersList = membersData?.map((m: any) => ({
    joined_at: m.joined_at,
    id: m.profiles?.id,
    username: m.profiles?.username || 'Usuário Desconhecido',
    avatar_url: m.profiles?.avatar_url,
  })) || []

  const { data: pools } = await supabase
    .from('pools')
    .select('*')
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  const allPools = pools || []

  const filteredPools = allPools.filter((pool: any) => {
    if (activeTab === 'history') return pool.status === 'completed'
    return pool.status !== 'completed'
  })

  const { data: userPredictions } = await supabase
    .from('predictions')
    .select('pool_id, match_id')
    .eq('user_id', user.id)

  const { data: userSpecialPredictions } = await supabase
    .from('special_predictions')
    .select('pool_id')
    .eq('user_id', user.id)

  // Conta palpites por pool
  const predictionCountByPool: Record<string, number> = {}
  userPredictions?.forEach((p: any) => {
    predictionCountByPool[p.pool_id] = (predictionCountByPool[p.pool_id] || 0) + 1
  })

  const predictedPoolIds = new Set([
    ...(userPredictions?.map((p: any) => p.pool_id) || []),
    ...(userSpecialPredictions?.map((p: any) => p.pool_id) || []),
  ])

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 3, md: 0 }, pb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)' }}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 14 }}>Voltar à Home</Typography>
        </Link>

        {isOwner && (
          <Stack direction="row" spacing={2}>
            <ShareModalClient inviteCode={group.invite_code} groupName={group.name} />
            <EditGroupModal groupId={id} />
          </Stack>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
        <Box>
          <Typography variant="h1" sx={{ color: '#fff', fontSize: '32px', fontWeight: 800, mb: 1 }}>
            {group.name}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>
              Bolões
            </Typography>
            {isOwner && activeTab !== 'ranking' && (
              <Link href={`/dashboard/groups/${id}/create-pool`} passHref>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{
                    bgcolor: '#C9940A',
                    color: '#000',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#E6AC10' },
                  }}
                >
                  Novo Bolão
                </Button>
              </Link>
            )}
          </Box>

          <GroupPoolsList
            groupId={id}
            isOwner={isOwner}
            pools={filteredPools}
            allPools={allPools}
            predictedPoolIds={[...predictedPoolIds]}
            predictionCountByPool={predictionCountByPool}
            activeTab={activeTab as 'active' | 'history' | 'ranking'}
            currentUserId={user.id}
          />
        </Box>

        <MembersListClient
          members={membersList}
          groupId={id}
          ownerId={group.owner_id}
          isOwner={isOwner}
          currentUserId={user.id}
        />
      </Box>
    </Box>
  )
}
