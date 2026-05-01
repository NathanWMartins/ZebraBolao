'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  Stack,
  CircularProgress,
  Avatar,
  Paper,
  Grid
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckIcon from '@mui/icons-material/Check'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Link from 'next/link'
import { savePredictions } from '../../actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PredictionsModal from './PredictionsModal'
import { getFlagUrl } from '@/lib/teamFlags'

interface Match {
  id: string
  home_team: string
  away_team: string
  match_date: string
  round: string
  group_name: string
  home_team_flag?: string
  away_team_flag?: string
  status: string
  home_score: number | null
  away_score: number | null
}

interface Prediction {
  matchId: string
  prediction: string | null
}

interface PredictClientProps {
  groupId: string
  poolId: string
  poolName: string
  matches: Match[]
  initialPredictions: any[]
}

export default function PredictClient({ groupId, poolId, poolName, matches, initialPredictions }: PredictClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showGroupPredictions, setShowGroupPredictions] = useState(false)
  const [localMatches, setLocalMatches] = useState<Match[]>(matches)

  const supabase = createClient()

  // Realtime subscription for matches
  useEffect(() => {
    const channel = supabase
      .channel('matches_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const updatedMatch = payload.new as any
          setLocalMatches(prev => prev.map(m =>
            m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Verificar se o usuário já tem palpites salvos
  const alreadyPredicted = initialPredictions.length > 0

  // Inicializar estado dos palpites
  const [predictions, setPredictions] = useState<Prediction[]>(() => {
    return localMatches.map(match => {
      const existing = initialPredictions.find(p => p.match_id === match.id)
      return {
        matchId: match.id,
        prediction: existing ? existing.prediction : null
      }
    })
  })

  const handleSelect = (matchId: string, value: string) => {
    if (alreadyPredicted) return
    setPredictions(prev => prev.map(p =>
      p.matchId === matchId
        ? { ...p, prediction: value }
        : p
    ))
    setSuccess(false)
  }

  const handleSave = async () => {
    if (alreadyPredicted) return

    // Validar se todos os campos estão preenchidos
    const isComplete = predictions.every(p => p.prediction !== null)
    if (!isComplete) {
      setError('Por favor, faça suas escolhas para todos os jogos.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await savePredictions(poolId, predictions as any)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/dashboard/groups/${groupId}`)
        }, 1500)
      }
    } catch (err) {
      setError('Erro ao salvar seus palpites. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ pb: 10, px: { xs: 2, md: 0 }, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href={`/dashboard/groups/${groupId}`} passHref>
            <IconButton sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)' }}>
              <ArrowBackIcon />
            </IconButton>
          </Link>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>{poolName}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {alreadyPredicted ? 'Visualizando seus palpites' : 'Quem vence?'}
            </Typography>
          </Box>
        </Box>

        <Button
          onClick={() => setShowGroupPredictions(true)}
          sx={{
            color: '#C9940A',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'none',
            bgcolor: 'rgba(201,148,10,0.05)',
            px: 2,
            borderRadius: '8px',
            '&:hover': { bgcolor: 'rgba(201,148,10,0.1)' }
          }}
        >
          Palpites do Grupo
        </Button>
      </Box>

      {alreadyPredicted && (
        <Paper sx={{
          bgcolor: 'rgba(201,148,10,0.05)',
          p: 2.5,
          mb: 4,
          border: '1px solid rgba(201,148,10,0.2)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: 'rgba(201,148,10,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckIcon sx={{ color: '#C9940A' }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Palpites Confirmados!</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Seus palpites não podem ser alterados.</Typography>
          </Box>
        </Paper>
      )}

      {error && (
        <Paper sx={{ bgcolor: 'rgba(255, 68, 68, 0.1)', p: 2, mb: 3, border: '1px solid rgba(255, 68, 68, 0.3)' }}>
          <Typography sx={{ color: '#ff4444', fontSize: 14 }}>{error}</Typography>
        </Paper>
      )}

      {success && (
        <Paper sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', p: 2, mb: 3, border: '1px solid rgba(76, 175, 80, 0.3)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: '#fff' }} />
          <Typography sx={{ color: '#fff', fontSize: 14 }}>Palpites salvos com sucesso! Redirecionando...</Typography>
        </Paper>
      )}

      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        {localMatches.map(match => {
          const prediction = predictions.find(p => p.matchId === match.id)
          const matchDate = new Date(match.match_date)
          const isStarted = matchDate < new Date()
          const currentChoice = prediction?.prediction

          const selectedGold = '#C9940A'
          const isDisabled = isStarted || alreadyPredicted

          return (
            <Card key={match.id} sx={{
              bgcolor: 'rgba(12,12,12)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              maxWidth: 600,
              mx: 'auto',
              width: '100%',
              opacity: isDisabled && !currentChoice ? 0.6 : 1,
              '&:hover': { borderColor: isDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }
            }}>
              {/* Top Banner with Match Info */}
              <Box sx={{
                bgcolor: 'rgba(255,255,255,0.02)',
                px: 2,
                py: 1,
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {match.round !== 'group' ? match.round : `Grupo ${match.group_name}`}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {match.status === 'live' && (
                    <Box sx={{ px: 1, bgcolor: '#ff4444', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>AO VIVO</Typography>
                    </Box>
                  )}
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}>
                    {matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h
                  </Typography>
                </Box>
              </Box>

              {/* Main Selection Area using Box Flexbox */}
              <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                {/* Team A Selection */}
                <Box
                  onClick={() => !isDisabled && !loading && handleSelect(match.id, 'Time A')}
                  sx={{
                    flex: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: isDisabled ? 'default' : 'pointer',
                    bgcolor: currentChoice === 'Time A' ? `${selectedGold}15` : 'transparent',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    '&:hover': !isDisabled && !loading ? { bgcolor: currentChoice === 'Time A' ? `${selectedGold}25` : 'rgba(255,255,255,0.02)' } : {}
                  }}
                >
                  {currentChoice === 'Time A' && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', bgcolor: selectedGold }} />
                  )}
                  <Avatar
                    src={getFlagUrl(match.home_team, 80)}
                    sx={{ width: 40, height: 40, mx: 'auto', mb: 1.5, border: currentChoice === 'Time A' ? `2px solid ${selectedGold}` : '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {match.home_team.charAt(0)}
                  </Avatar>
                  <Typography sx={{ color: currentChoice === 'Time A' ? selectedGold : '#fff', fontWeight: 700, fontSize: 13 }}>
                    {match.home_team}
                  </Typography>
                  <Typography sx={{ color: isDisabled && currentChoice !== 'Time A' ? 'transparent' : 'rgba(255,255,255,0.2)', fontSize: 9, mt: 0.5, fontWeight: 800 }}>
                    {currentChoice === 'Time A' ? 'ESCOLHIDO' : 'VENCE'}
                  </Typography>
                </Box>

                {/* Draw Selection */}
                <Box
                  onClick={() => !isDisabled && !loading && handleSelect(match.id, 'Empate')}
                  sx={{
                    flex: 0.6,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    cursor: isDisabled ? 'default' : 'pointer',
                    bgcolor: currentChoice === 'Empate' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    '&:hover': !isDisabled && !loading ? { bgcolor: currentChoice === 'Empate' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)' } : {}
                  }}
                >
                  {currentChoice === 'Empate' && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', bgcolor: 'rgba(255,255,255,0.4)' }} />
                  )}
                  <Typography sx={{
                    color: currentChoice === 'Empate' ? '#fff' : 'rgba(255,255,255,0.2)',
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: '1px'
                  }}>
                    {match.home_score !== null ? `${match.home_score} x ${match.away_score}` : 'X'}
                  </Typography>
                  <Typography sx={{
                    color: currentChoice === 'Empate' ? '#fff' : 'rgba(255,255,255,0.2)',
                    fontSize: 9,
                    fontWeight: 800,
                    mt: 0.5
                  }}>
                    EMPATE
                  </Typography>
                </Box>

                {/* Team B Selection */}
                <Box
                  onClick={() => !isDisabled && !loading && handleSelect(match.id, 'Time B')}
                  sx={{
                    flex: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: isDisabled ? 'default' : 'pointer',
                    bgcolor: currentChoice === 'Time B' ? `${selectedGold}15` : 'transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    '&:hover': !isDisabled && !loading ? { bgcolor: currentChoice === 'Time B' ? `${selectedGold}25` : 'rgba(255,255,255,0.02)' } : {}
                  }}
                >
                  {currentChoice === 'Time B' && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', bgcolor: selectedGold }} />
                  )}
                  <Avatar
                    src={getFlagUrl(match.away_team, 80)}
                    sx={{ width: 40, height: 40, mx: 'auto', mb: 1.5, border: currentChoice === 'Time B' ? `2px solid ${selectedGold}` : '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {match.away_team.charAt(0)}
                  </Avatar>
                  <Typography sx={{ color: currentChoice === 'Time B' ? selectedGold : '#fff', fontWeight: 700, fontSize: 13 }}>
                    {match.away_team}
                  </Typography>
                  <Typography sx={{ color: isDisabled && currentChoice !== 'Time B' ? 'transparent' : 'rgba(255,255,255,0.2)', fontSize: 9, mt: 0.5, fontWeight: 800 }}>
                    {currentChoice === 'Time B' ? 'ESCOLHIDO' : 'VENCE'}
                  </Typography>
                </Box>
              </Box>

              {isStarted && !alreadyPredicted && (
                <Box sx={{ p: 1, bgcolor: 'rgba(255, 68, 68, 0.05)', textAlign: 'center' }}>
                  <Typography sx={{ color: '#ff4444', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>
                    Jogo em andamento • Palpites encerrados
                  </Typography>
                </Box>
              )}
            </Card>
          )
        })}
      </Stack>

      {/* Action Button */}
      <Box sx={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'auto',
        zIndex: 100
      }}>
        {alreadyPredicted ? (
          <Link href={`/dashboard/groups/${groupId}`} passHref style={{ textDecoration: 'none' }}>
            <Button
              variant="outlined"
              size="large"
              sx={{
                bgcolor: 'rgba(0,0,0,0.8)',
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.2)',
                fontWeight: 700,
                px: 6,
                py: 2,
                borderRadius: '20px',
                fontSize: 14,
                textTransform: 'none',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderColor: '#fff',
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Voltar
            </Button>
          </Link>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            onClick={handleSave}
            disabled={loading || success || matches.length === 0}
            sx={{
              bgcolor: '#C9940A',
              color: '#000',
              fontWeight: 800,
              px: 8,
              py: 2,
              borderRadius: '20px',
              fontSize: 16,
              textTransform: 'none',
              boxShadow: '0 12px 40px rgba(201,148,10,0.4)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              '&:hover': {
                bgcolor: '#E6AC10',
                transform: 'translateY(-2px)'
              },
              '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.4)' }
            }}
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </Button>
        )}
      </Box>

      <PredictionsModal
        open={showGroupPredictions}
        onClose={() => setShowGroupPredictions(false)}
        poolId={poolId}
        matches={localMatches}
      />
    </Box>
  )
}