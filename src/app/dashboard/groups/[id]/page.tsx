import React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Box, Typography, Avatar, Button, Stack, Divider, Chip } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import ShareModalClient from './ShareModalClient'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditGroupModal from './EditGroupModal'
import DeletePoolButton from './DeletePoolButton'
import GroupTabs from './GroupTabs'

export default async function GroupPage(props: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await props.params
  const { tab } = await props.searchParams
  const activeTab = tab === 'history' ? 'history' : 'active'

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Verificar acesso: ou é membro ou é dono
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
    // Não é dono e nem membro, manda tentar entrar
    redirect(`/dashboard/groups/join?code=${group.invite_code}`)
  }

  // Buscar os membros do grupo (juntando com a tabela profiles)
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
    avatar_url: m.profiles?.avatar_url
  })) || []

  // Buscar as pools (bolões) deste grupo
  const { data: pools } = await supabase
    .from('pools')
    .select('*')
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  // Filtrar pools baseado na aba ativa
  const filteredPools = pools?.filter(pool => {
    if (activeTab === 'history') return pool.status === 'finished'
    // Se não tiver status (bolões antigos), assume scheduled/ativo
    return pool.status !== 'finished'
  }) || []

  // Buscar se o usuário já palpitou nos bolões deste grupo
  const { data: userPredictions } = await supabase
    .from('predictions')
    .select('pool_id')
    .eq('user_id', user.id)

  const predictedPoolIds = new Set(userPredictions?.map(p => p.pool_id) || [])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live': return { label: 'Ao Vivo', color: '#ff4444', bgcolor: 'rgba(255, 68, 68, 0.1)' }
      case 'finished': return { label: 'Finalizado', color: '#00C851', bgcolor: 'rgba(0, 200, 81, 0.1)' }
      default: return { label: 'Agendado', color: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.05)' }
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 3, md: 0 }, pb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)' }}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 14, '&:hover': { color: '#fff' } }}>Voltar à Home</Typography>
        </Link>

        {isOwner && (
          <>
            <Stack direction="row" spacing={2}>
              <ShareModalClient inviteCode={group.invite_code} groupName={group.name} />
              <EditGroupModal groupId={id} />
            </Stack>
          </>
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
            {isOwner && (
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
                    '&:hover': { bgcolor: '#E6AC10' }
                  }}
                >
                  Novo Bolão
                </Button>
              </Link>
            )}
          </Box>

          <GroupTabs />

          {(filteredPools.length === 0) ? (
            <Box sx={{
              bgcolor: 'rgba(12, 12, 12)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px',
              p: 5,
              textAlign: 'center'
            }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                {activeTab === 'history'
                  ? "Nenhum bolão finalizado ainda."
                  : "Nenhum bolão aberto no momento."
                }
              </Typography>
              {isOwner && activeTab === 'active' && (
                <Link href={`/dashboard/groups/${id}/create-pool`} passHref>
                  <Button variant="outlined" sx={{ color: '#C9940A', borderColor: 'rgba(201,148,10,0.5)' }}>
                    Criar Bolão
                  </Button>
                </Link>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredPools.map(pool => {
                const hasPredicted = predictedPoolIds.has(pool.id)
                const status = getStatusLabel(pool.status)

                return (
                  <Link key={pool.id} href={`/dashboard/groups/${id}/pools/${pool.id}`} style={{ textDecoration: 'none' }}>
                    <Box sx={{
                      bgcolor: 'rgba(0,0,0,0.4)',
                      border: '0.5px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(201,148,10,0.3)',
                      }
                    }}>
                      <Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
                          <Typography sx={{ color: '#fff', fontSize: 18, fontWeight: 500 }}>{pool.name}</Typography>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{
                              height: '20px',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: status.color,
                              bgcolor: status.bgcolor,
                              border: `1px solid ${status.color}33`,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        </Stack>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                          Criado em {new Date(pool.created_at).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            color: hasPredicted ? 'rgba(255,255,255,0.7)' : '#C9940A',
                            borderColor: hasPredicted ? 'rgba(255,255,255,0.2)' : 'rgba(201,148,10,0.5)',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '12px',
                            px: 2,
                            borderRadius: '8px',
                            '&:hover': {
                              borderColor: hasPredicted ? '#fff' : '#C9940A',
                              bgcolor: 'rgba(255,255,255,0.05)'
                            }
                          }}
                        >
                          {hasPredicted ? 'Visualizar Palpite' : 'Palpitar'}
                        </Button>

                        {isOwner && (
                          <DeletePoolButton
                            poolId={pool.id}
                            groupId={id}
                            poolName={pool.name}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Link>
                )
              })}
            </Box>
          )}
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
            border: '0.5px solid rgba(255,255,255,0.03)'
          }}>
            {membersList.map((member, index) => (
              <React.Fragment key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={member.avatar_url || ''}
                    alt={member.username}
                    sx={{ width: 40, height: 40, bgcolor: 'rgba(201,148,10)', color: '#C9940A' }}
                  >
                    {member.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Stack direction="row" spacing={1}>
                      <Typography sx={{ color: '#fff', fontSize: 15 }}>
                        {member.username}
                      </Typography>
                      {member.id === group.owner_id && <AdminPanelSettingsIcon sx={{ fontSize: 18, color: '#C9940A' }} />}
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
