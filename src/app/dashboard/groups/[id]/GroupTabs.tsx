'use client'

import React from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'

export default function GroupTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') === 'history' ? 1 : 0

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const tab = newValue === 1 ? 'history' : 'active'
    // Mantém outros query params se houver, mas aqui só temos o tab
    router.push(`?tab=${tab}`, { scroll: false })
  }

  return (
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
            mr: 2
          },
          '& .Mui-selected': { color: '#C9940A !important' },
          '& .MuiTabs-indicator': { bgcolor: '#C9940A' }
        }}
      >
        <Tab label="Bolões Ativos" />
        <Tab label="Histórico" />
      </Tabs>
    </Box>
  )
}
