'use client'

import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Avatar, Stack, CircularProgress,
  ToggleButton, ToggleButtonGroup, Divider
} from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { getGroupRanking, getPoolRanking } from './actions'

interface Pool {
  id: string
  name: string
  status: string
}

interface RankingEntry {
  position: number
  user_id: string
  points: number
  username: string
  avatar_url: string | null
}

interface RankingTabProps {
  groupId: string
  finishedPools: Pool[]
  allPools: Pool[]
  currentUserId: string
}

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function RankingTab({ groupId, finishedPools, allPools, currentUserId }: RankingTabProps) {
  const [mode, setMode] = useState<'general' | string>('general')
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRanking()
  }, [mode])

  async function loadRanking() {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'general') {
        const data = await getGroupRanking(groupId)
        setRanking(data as RankingEntry[])
      } else {
        const data = await getPoolRanking(mode)
        setRanking(data as RankingEntry[])
      }
    } catch (err) {
      setError('Erro ao carregar ranking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Seletor de ranking */}
      <Box sx={{ mb: 3, overflowX: 'auto' }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, val) => { if (val) setMode(val) }}
          size="small"
          sx={{
            gap: 1,
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px !important',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              px: 2,
              py: 0.75,
              '&.Mui-selected': {
                color: '#C9940A',
                bgcolor: 'rgba(201,148,10,0.1)',
                border: '1px solid rgba(201,148,10,0.4)',
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.04)',
              }
            }
          }}
        >
          <ToggleButton value="general">Geral</ToggleButton>
          {allPools.map(p => (
            <ToggleButton key={p.id} value={p.id}>
              {p.name}
              {p.status === 'finished' && (
                <Typography component="span" sx={{ ml: 0.5, fontSize: 10, color: '#00C851', opacity: 0.8 }}>✓</Typography>
              )}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#C9940A' }} />
        </Box>
      ) : error ? (
        <Typography sx={{ color: '#ff4444', textAlign: 'center', py: 4 }}>{error}</Typography>
      ) : ranking.length === 0 ? (
        <Box sx={{
          bgcolor: 'rgba(12,12,12)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '12px',
          p: 5,
          textAlign: 'center'
        }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            {allPools.length === 0
              ? 'Nenhum bolão criado ainda.'
              : 'Nenhum ponto computado ainda. Os pontos aparecem após o admin calcular cada jogo.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          bgcolor: 'rgba(12,12,12)',
          border: '0.5px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {ranking.map((entry, idx) => {
            const isCurrentUser = entry.user_id === currentUserId
            const medal = medalColors[idx] ?? null

            return (
              <React.Fragment key={entry.user_id}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2.5,
                  py: 1.75,
                  bgcolor: isCurrentUser ? 'rgba(201,148,10,0.06)' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  {/* Posição */}
                  <Box sx={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {medal ? (
                      <EmojiEventsIcon sx={{ fontSize: 20, color: medal }} />
                    ) : (
                      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700 }}>
                        {entry.position}
                      </Typography>
                    )}
                  </Box>

                  {/* Avatar */}
                  <Avatar
                    src={entry.avatar_url || ''}
                    sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'rgba(201,148,10,0.3)' }}
                    slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                  >
                    {entry.username.charAt(0).toUpperCase()}
                  </Avatar>

                  {/* Nome */}
                  <Typography sx={{
                    color: isCurrentUser ? '#C9940A' : '#fff',
                    fontWeight: isCurrentUser ? 700 : 500,
                    fontSize: 14,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entry.username}
                    {isCurrentUser && (
                      <Typography component="span" sx={{ color: 'rgba(201,148,10,0.6)', fontSize: 11, ml: 1 }}>
                        (você)
                      </Typography>
                    )}
                  </Typography>

                  {/* Pontos */}
                  <Box sx={{
                    bgcolor: 'rgba(201,148,10,0.1)',
                    border: '1px solid rgba(201,148,10,0.25)',
                    borderRadius: '8px',
                    px: 1.5,
                    py: 0.5,
                    minWidth: 60,
                    textAlign: 'center',
                  }}>
                    <Typography sx={{ color: '#C9940A', fontWeight: 800, fontSize: 15 }}>
                      {entry.points}
                    </Typography>
                    <Typography sx={{ color: 'rgba(201,148,10,0.6)', fontSize: 10, lineHeight: 1 }}>
                      pts
                    </Typography>
                  </Box>
                </Box>

                {idx < ranking.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mx: 2 }} />
                )}
              </React.Fragment>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
