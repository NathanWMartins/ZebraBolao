import React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Box, Typography, Avatar, Divider, Button, Stack } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import ShareModalClient from './ShareModalClient'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import EditGroupModal from './EditGroupModal'
import GroupPoolsList from './GroupPoolsList'

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
    if (activeTab === 'history') return pool.status === 'finished'
    return pool.status !== 'finished'
  })

  const { data: userPredictions } = await supabase
    .from('predictions')
    .select('pool_id')
    .eq('user_id', user.id)

  const { data: userSpecialPredictions } = await supabase
    .from('special_predictions')
    .select('pool_id')
    .eq('user_id', user.id)

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
            activeTab={activeTab as 'active' | 'history' | 'ranking'}
            currentUserId={user.id}
          />
        </Box>

        <Box>
          <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 600, mb: 3 }}>
            Membros ({membersList.length})
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'rgba(12, 12, 12)',
            p: 2,
            borderRadius: '12px',
            border: '0.5px solid rgba(255,255,255,0.03)',
          }}>
            {membersList.map((member: any, index: number) => (
              <React.Fragment key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={member.avatar_url || ''}
                    alt={member.username}
                    sx={{ width: 40, height: 40, bgcolor: 'rgba(201,148,10)', color: '#C9940A' }}
                    slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                  >
                    {member.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Stack direction="row" spacing={1}>
                      <Typography sx={{ color: '#fff', fontSize: 15 }}>
                        {member.username}
                      </Typography>
                      {member.id === group.owner_id && (
                        <AdminPanelSettingsIcon sx={{ fontSize: 18, color: '#C9940A' }} />
                      )}
                    </Stack>
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Box>
                </Box>
                {index < membersList.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
