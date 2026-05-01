'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  Stack,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { getPoolPredictions } from '../../actions'
import { Check } from '@mui/icons-material'
import TeamFlag from '@/app/components/TeamFlag'

interface Match {
  id: string
  home_team: string
  away_team: string
  match_date: string
  home_team_flag?: string
  away_team_flag?: string
  status: string
  home_score: number | null
  away_score: number | null
}

interface Prediction {
  user_id: string
  match_id: string
  prediction: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface PredictionsModalProps {
  open: boolean
  onClose: () => void
  poolId: string
  matches: Match[]
}

export default function PredictionsModal({ open, onClose, poolId, matches }: PredictionsModalProps) {
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPredictions()
    }
  }, [open, poolId])

  async function loadPredictions() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPoolPredictions(poolId)
      setPredictions(data as any)
    } catch (err) {
      setError('Erro ao carregar os palpites.')
    } finally {
      setLoading(false)
    }
  }

  const getPredictionColor = (choice: string) => {
    if (choice === 'Time A') return '#C9940A'
    if (choice === 'Time B') return '#C9940A'
    return '#fff'
  }

  const getMatchResult = (match: Match) => {
    if (match.home_score === null || match.away_score === null) return null
    if (match.home_score > match.away_score) return 'Time A'
    if (match.away_score > match.home_score) return 'Time B'
    return 'Empate'
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#111110',
            backgroundImage: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            maxHeight: '80vh'
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
        <Box component="span" sx={{ color: '#fff', fontWeight: 700 }}>Palpites do Grupo</Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#C9940A' }} />
          </Box>
        ) : error ? (
          <Typography sx={{ color: '#ff4444', textAlign: 'center', py: 4 }}>{error}</Typography>
        ) : (
          <Stack spacing={4}>
            {matches.map((match) => {
              const matchDate = new Date(match.match_date)
              const matchPredictions = predictions.filter(p => p.match_id === match.id)
              const actualResult = getMatchResult(match)
              const hasResult = actualResult !== null

              return (
                <Box key={match.id} sx={{ bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: '12px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                        {match.home_team}
                      </Typography>

                      {hasResult ? (
                        <Box sx={{
                          bgcolor: 'rgba(255,255,255,0.1)',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>
                            {match.home_score}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: 12 }}>x</Typography>
                          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>
                            {match.away_score}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: 12 }}>vs</Typography>
                      )}

                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                        {match.away_team}
                      </Typography>

                      {match.status === 'live' && (
                        <Box sx={{ px: 1, bgcolor: '#ff4444', borderRadius: '4px' }}>
                          <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>LIVE</Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                      {matchDate.toLocaleDateString('pt-BR')} {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 2 }} />

                  {matchPredictions.length === 0 ? (
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>
                      Nenhum palpite feito para este jogo.
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {matchPredictions.map((pred, idx) => {
                        const isCorrect = hasResult && pred.prediction === actualResult

                        return (
                          <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              bgcolor: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0,0,0,0.2)',
                              p: 1,
                              borderRadius: '8px',
                              border: isCorrect ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid transparent',
                              transition: 'all 0.3s ease'
                            }}>
                              <Avatar src={pred.profiles.avatar_url || ''} sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {pred.profiles.username.charAt(0)}
                              </Avatar>
                              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {pred.profiles.username}
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  color: isCorrect ? '#4caf50' : getPredictionColor(pred.prediction),
                                  fontWeight: 800,
                                  fontSize: 12,
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: '4px',
                                  bgcolor: isCorrect ? 'rgba(76, 175, 80, 0.1)' : (pred.prediction !== 'Empate' ? 'rgba(201,148,10,0.1)' : 'rgba(255,255,255,0.05)')
                                }}>
                                  {pred.prediction === 'Time A' && (
                                    <TeamFlag teamName={match.home_team} size={20} />
                                  )}
                                  {pred.prediction === 'Time B' && (
                                    <TeamFlag teamName={match.away_team} size={20} />
                                  )}
                                  <span>
                                    {pred.prediction === 'Time A' ? match.home_team : pred.prediction === 'Time B' ? match.away_team : 'Empate'}
                                  </span>
                                </Box>

                                {isCorrect && (
                                  <Box sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    bgcolor: '#4caf50',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Check sx={{ color: '#fff', fontSize: 12 }} />
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                        )
                      })}
                    </Grid>
                  )}
                </Box>
              )
            })}
          </Stack>
        )
        }
      </DialogContent>
    </Dialog>
  )
}
