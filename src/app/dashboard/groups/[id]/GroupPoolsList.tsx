'use client'

import React, { useTransition } from 'react'
import { Tabs, Tab, Box, Skeleton, Typography, Stack, Button, Chip } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DeletePoolButton from './DeletePoolButton'

interface Pool {
  id: string
  name: string
  status: string
  created_at: string
  group_id: string
}

interface GroupPoolsListProps {
  groupId: string
  isOwner: boolean
  pools: Pool[]
  predictedPoolIds: string[]
  activeTab: 'active' | 'history'
}

function PoolCardSkeleton() {
  return (
    <Box sx={{
      bgcolor: 'rgba(0,0,0,0.4)',
      border: '0.5px solid rgba(255,255,255,0.05)',
      borderRadius: '12px',
      p: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Skeleton variant="text" width="55%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '6px' }} />
        <Skeleton variant="rounded" width={70} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '6px' }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton variant="text" width="25%" height={18} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} />
        <Skeleton variant="rounded" width={80} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '8px' }} />
      </Box>
    </Box>
  )
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'live': return { label: 'Ao Vivo', color: '#ff4444', bgcolor: 'rgba(255, 68, 68, 0.1)' }
    case 'finished': return { label: 'Finalizado', color: '#00C851', bgcolor: 'rgba(0, 200, 81, 0.1)' }
    default: return { label: 'Agendado', color: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.05)' }
  }
}

export default function GroupPoolsList({
  groupId,
  isOwner,
  pools,
  predictedPoolIds,
  activeTab,
}: GroupPoolsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab') === 'history' ? 1 : 0
  const [optimisticTab, setOptimisticTab] = React.useState(urlTab)
  const [isPending, startTransition] = useTransition()

  const predictedSet = new Set(predictedPoolIds)

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setOptimisticTab(newValue) // muda o estilo da aba imediatamente
    const tab = newValue === 1 ? 'history' : 'active'
    startTransition(() => {
      router.push(`?tab=${tab}`, { scroll: false })
    })
  }

  return (
    <>
      {/* Abas */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.05)', mb: 3 }}>
        <Tabs
          value={optimisticTab}
          onChange={handleChange}
          sx={{
            minHeight: '40px',
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '15px',
              minHeight: '40px',
              px: 1,
              mr: 2,
            },
            '& .Mui-selected': { color: '#C9940A !important' },
            '& .MuiTabs-indicator': { bgcolor: '#C9940A' }
          }}
        >
          <Tab label="Bolões Ativos" />
          <Tab label="Histórico" />
        </Tabs>
      </Box>

      {/* Conteúdo: skeleton enquanto carrega, lista quando pronto */}
      {isPending ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <PoolCardSkeleton />
          <PoolCardSkeleton />
          <PoolCardSkeleton />
        </Box>
      ) : pools.length === 0 ? (
        <Box sx={{
          bgcolor: 'rgba(12, 12, 12)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '12px',
          p: 5,
          textAlign: 'center'
        }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            {activeTab === 'history'
              ? 'Nenhum bolão finalizado ainda.'
              : 'Nenhum bolão aberto no momento.'
            }
          </Typography>
          {isOwner && activeTab === 'active' && (
            <Link href={`/dashboard/groups/${groupId}/create-pool`} passHref>
              <Button variant="outlined" sx={{ color: '#C9940A', borderColor: 'rgba(201,148,10,0.5)' }}>
                Criar Bolão
              </Button>
            </Link>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {pools.map(pool => {
            const hasPredicted = predictedSet.has(pool.id)
            const status = getStatusLabel(pool.status)

            return (
              <Link key={pool.id} href={`/dashboard/groups/${groupId}/pools/${pool.id}`} style={{ textDecoration: 'none' }}>
                <Box sx={{
                  bgcolor: 'rgba(0,0,0,0.4)',
                  border: '0.5px solid rgba(255,255,255,0.05)',
                  borderLeft: `3px solid ${status.color}`,
                  borderRadius: '12px',
                  p: 2,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    borderColor: `${status.color}66`,
                    borderLeftColor: status.color,
                  }
                }}>
                  {/* Linha 1: Nome */}
                  <Typography sx={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 1.5,
                  }}>
                    {pool.name}
                  </Typography>

                  {/* Linha 2: Data + Status + Botões */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                        {new Date(pool.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: status.color,
                          bgcolor: status.bgcolor,
                          border: `1px solid ${status.color}33`,
                          '& .MuiChip-label': { px: 1.5 }
                        }}
                      />
                    </Stack>

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
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '8px',
                          whiteSpace: 'nowrap',
                          minWidth: 'auto',
                          '&:hover': {
                            borderColor: hasPredicted ? '#fff' : '#C9940A',
                            bgcolor: 'rgba(255,255,255,0.05)'
                          }
                        }}
                      >
                        {hasPredicted ? 'Ver Palpite' : 'Palpitar'}
                      </Button>

                      {isOwner && (
                        <DeletePoolButton
                          poolId={pool.id}
                          groupId={groupId}
                          poolName={pool.name}
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Link>
            )
          })}
        </Box>
      )}
    </>
  )
}
