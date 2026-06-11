'use client'

import React, { useTransition } from 'react'
import { Tabs, Tab, Box, Skeleton, Typography, Stack, Button, Chip } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DeletePoolButton from './DeletePoolButton'
import RankingTab from './RankingTab'

interface Pool {
  id: string
  name: string
  status: string
  created_at: string
  group_id: string
  type: string
  match_ids?: string[]
}

interface GroupPoolsListProps {
  groupId: string
  isOwner: boolean
  pools: Pool[]
  allPools: Pool[]
  predictedPoolIds: string[]
  predictionCountByPool: Record<string, number>
  activeTab: 'active' | 'history' | 'ranking'
  currentUserId: string
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
    case 'finished': return { label: 'Finalizado', color: '#63ca84', bgcolor: 'rgba(99,202,132,0.12)' }
    default: return { label: 'Agendado', color: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.05)' }
  }
}

export default function GroupPoolsList({
  groupId,
  isOwner,
  pools,
  allPools,
  predictedPoolIds,
  predictionCountByPool,
  activeTab,
  currentUserId,
}: GroupPoolsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab')
  const tabIndex = urlTab === 'history' ? 1 : urlTab === 'ranking' ? 2 : 0
  const [optimisticTab, setOptimisticTab] = React.useState(tabIndex)
  const [isPending, startTransition] = useTransition()

  const predictedSet = new Set(predictedPoolIds)
  const finishedPools = allPools.filter(p => p.status === 'finished')

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setOptimisticTab(newValue)
    const tab = newValue === 1 ? 'history' : newValue === 2 ? 'ranking' : 'active'
    startTransition(() => {
      router.push(`?tab=${tab}`, { scroll: false })
    })
  }

  return (
    <>
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
          <Tab label="Ranking" />
        </Tabs>
      </Box>

      {optimisticTab === 2 ? (
        <RankingTab
          groupId={groupId}
          finishedPools={finishedPools}
          allPools={allPools}
          currentUserId={currentUserId}
        />
      ) : isPending ? (
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
            const totalMatches = pool.match_ids?.length ?? 0
            const predictedCount = predictionCountByPool[pool.id] ?? 0
            const isIncomplete = hasPredicted && totalMatches > 0 && predictedCount < totalMatches && pool.status !== 'finished'
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography sx={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {pool.name}
                    </Typography>
                    {pool.type === 'special' && (
                      <Chip
                        label="Especial"
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#C9940A',
                          bgcolor: 'rgba(201,148,10,0.1)',
                          border: '1px solid rgba(201,148,10,0.3)',
                          '& .MuiChip-label': { px: 1 },
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>

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
                          border: `1px solid ${status.color}55`,
                          '& .MuiChip-label': { px: 1.5 }
                        }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          color: isIncomplete ? '#C9940A' : hasPredicted ? 'rgba(255,255,255,0.7)' : '#C9940A',
                          borderColor: isIncomplete ? 'rgba(201,148,10,0.5)' : hasPredicted ? 'rgba(255,255,255,0.2)' : 'rgba(201,148,10,0.5)',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '12px',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '8px',
                          whiteSpace: 'nowrap',
                          minWidth: 'auto',
                          '&:hover': {
                            borderColor: hasPredicted && !isIncomplete ? '#fff' : '#C9940A',
                            bgcolor: 'rgba(255,255,255,0.05)'
                          }
                        }}
                      >
                        {isIncomplete ? 'Continuar' : hasPredicted ? 'Ver Palpite' : 'Palpitar'}
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
