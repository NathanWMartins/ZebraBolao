'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, Box, Typography, CircularProgress, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import LeaderboardIcon from '@mui/icons-material/Leaderboard'
import StandingsClient from './StandingsClient'
import type { StandingEntry } from './StandingsClient'

interface Props {
  open: boolean
  onClose: () => void
}

export default function StandingsModal({ open, onClose }: Props) {
  const [standings, setStandings] = useState<StandingEntry[]>([])
  const [knockoutMatches, setKnockoutMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (open && !loaded) {
      setLoading(true)
      fetch('/api/standings')
        .then(r => r.json())
        .then(data => {
          setStandings(data.standings ?? [])
          setKnockoutMatches(data.knockoutMatches ?? [])
          setLoaded(true)
        })
        .finally(() => setLoading(false))
    }
  }, [open, loaded])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#111110',
            backgroundImage: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            maxHeight: '85vh',
          }
        }
      }}
    >
      <DialogTitle sx={{ p: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LeaderboardIcon sx={{ color: '#C9940A', fontSize: 20 }} />
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Classificação — Fase de Grupos</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pb: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#C9940A' }} />
          </Box>
        ) : (
          <StandingsClient standings={standings} knockoutMatches={knockoutMatches} compact />
        )}
      </DialogContent>
    </Dialog>
  )
}
