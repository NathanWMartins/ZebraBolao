'use client'

import React, { useTransition } from 'react'
import { Tabs, Tab, Box, Skeleton } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'

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

export default function GroupTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') === 'history' ? 1 : 0
  const [isPending, startTransition] = useTransition()

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const tab = newValue === 1 ? 'history' : 'active'
    startTransition(() => {
      router.push(`?tab=${tab}`, { scroll: false })
    })
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.05)', mb: 3 }}>
        <Tabs
          value={currentTab}
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
              transition: 'opacity 0.15s',
            },
            '& .Mui-selected': { color: '#C9940A !important' },
            '& .MuiTabs-indicator': { bgcolor: '#C9940A' }
          }}
        >
          <Tab label="Bolões Ativos" />
          <Tab label="Histórico" />
        </Tabs>
      </Box>

      {isPending && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <PoolCardSkeleton />
          <PoolCardSkeleton />
          <PoolCardSkeleton />
        </Box>
      )}
    </>
  )
}
