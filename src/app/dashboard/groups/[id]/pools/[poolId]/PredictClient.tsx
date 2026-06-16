'use client'

import React, { useEffect, useState, useMemo } from 'react'
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
  Grid,
  TextField,
  Autocomplete,
  Collapse
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckIcon from '@mui/icons-material/Check'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PeopleIcon from '@mui/icons-material/People'
import FilterListIcon from '@mui/icons-material/FilterList'
import LeaderboardIcon from '@mui/icons-material/Leaderboard'
import Link from 'next/link'
import { savePredictions, saveSpecialPredictions } from '../../actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PredictionsModal from './PredictionsModal'
import StandingsModal from '@/app/dashboard/standings/StandingsModal'
import { getFlagUrl } from '@/lib/teamFlags'
import { translateTeam } from '@/lib/teamTranslations'
import TeamFlag from '@/app/components/TeamFlag'
import { PLAYERS } from '@/lib/players'

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
  poolType: string
  poolStatus: string
  specialBets: string[]
  matches: Match[]
  initialPredictions: any[]
  initialSpecialPredictions: any[]
  allTeams: string[]
}

const SPECIAL_BET_LABELS: Record<string, string> = {
  champion: 'Seleção Campeã',
  runner_up: 'Vice-Campeão',
  third_place: '3° Colocado',
  top_scorer: 'Artilheiro',
  top_assist: 'Maior Assistente',
  most_cards: 'Mais Cartões',
}

const TEAM_BETS = ['champion', 'runner_up', 'third_place', 'most_cards']
const PLAYER_BETS = ['top_scorer', 'top_assist']


export default function PredictClient({ groupId, poolId, poolName, poolType, poolStatus, specialBets, matches, initialPredictions, initialSpecialPredictions, allTeams }: PredictClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [skippedWarning, setSkippedWarning] = useState<string | null>(null)
  const [showGroupPredictions, setShowGroupPredictions] = useState(false)
  const [showStandings, setShowStandings] = useState(false)
  const [localMatches, setLocalMatches] = useState<Match[]>(matches)
  const [filterGroup, setFilterGroup] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const alreadySavedSpecial = initialSpecialPredictions.length > 0
  const [specialValues, setSpecialValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    initialSpecialPredictions.forEach((p: any) => { map[p.bet_type] = p.value })
    return map
  })
  const [specialLoading, setSpecialLoading] = useState(false)
  const [specialError, setSpecialError] = useState<string | null>(null)
  const [specialSuccess, setSpecialSuccess] = useState(false)
  const [playerTeamFilter, setPlayerTeamFilter] = useState<Record<string, string>>({})
  const [playerInputValue, setPlayerInputValue] = useState<Record<string, string>>(() => {
    // Inicializa com os nomes dos jogadores já salvos
    const map: Record<string, string> = {}
    initialSpecialPredictions.forEach((p: any) => {
      if (PLAYER_BETS.includes(p.bet_type)) {
        map[p.bet_type] = p.value
      }
    })
    return map
  })
  const [playerSearchOpen, setPlayerSearchOpen] = useState<Record<string, boolean>>({})

  const FEATURED_TEAMS = ['Argentina', 'Brazil', 'England', 'France', 'Germany', 'Portugal', 'Spain']

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

  // Tab: 'pending' | 'finished'
  const [matchTab, setMatchTab] = useState<'pending' | 'finished'>('pending')

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
    setPredictions(prev => prev.map(p =>
      p.matchId === matchId
        ? { ...p, prediction: value }
        : p
    ))
    setSuccess(false)
  }

  const handleScoreChange = (matchId: string, team: 'home' | 'away', scoreStr: string) => {

    // Only allow numbers
    if (scoreStr !== '' && !/^\d+$/.test(scoreStr)) return

    setPredictions(prev => prev.map(p => {
      if (p.matchId !== matchId) return p

      let currentPrediction = p.prediction || '-'
      let [home, away] = currentPrediction.split('-')

      if (team === 'home') {
        home = scoreStr
      } else {
        away = scoreStr
      }

      // Se ambos estiverem vazios, volta pra null
      if (home === '' && away === '') {
        return { ...p, prediction: null }
      }

      return { ...p, prediction: `${home}-${away}` }
    }))
    setSuccess(false)
  }

  const handleSave = async () => {
    const now = new Date()

    // Filtra só jogos que ainda não começaram e têm palpite preenchido
    const toSave = predictions.filter(p => {
      const match = localMatches.find(m => m.id === p.matchId)
      if (!match) return false
      if (new Date(match.match_date) <= now) return false
      if (!p.prediction) return false
      if (poolType === 'score') {
        const [home, away] = p.prediction.split('-')
        return home !== '' && away !== '' && home !== undefined && away !== undefined
      }
      return true
    })

    if (toSave.length === 0) {
      setError('Faça pelo menos um palpite em um jogo que ainda não começou.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await savePredictions(poolId, toSave as any)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        if (result.skippedCount && result.skippedCount > 0) {
          setSkippedWarning(`${result.skippedCount} jogo${result.skippedCount > 1 ? 's' : ''} não ${result.skippedCount > 1 ? 'foram salvos porque já começaram' : 'foi salvo porque já começou'} enquanto a página estava aberta.`)
        }
        setTimeout(() => { setSuccess(false); setSkippedWarning(null) }, 5000)
      }
    } catch (err) {
      setError('Erro ao salvar seus palpites. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSpecial = async () => {
    const filled = specialBets.filter(key => specialValues[key]?.trim())
    if (filled.length === 0) {
      setSpecialError('Preencha pelo menos uma aposta especial.')
      return
    }
    setSpecialLoading(true)
    setSpecialError(null)
    try {
      const result = await saveSpecialPredictions(
        poolId,
        filled.map(key => ({ betType: key, value: specialValues[key].trim() }))
      )
      if (result.error) {
        setSpecialError(result.error)
      } else {
        setSpecialSuccess(true)
      }
    } catch {
      setSpecialError('Erro ao salvar as apostas especiais.')
    } finally {
      setSpecialLoading(false)
    }
  }

  return (
    <Box sx={{ pb: 10, px: { xs: 2, md: 0 }, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ pt: 2, pb: 1.5 }}>
        <Link href={`/dashboard/groups/${groupId}`} passHref>
          <IconButton sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)', mb: 1.5 }}>
            <ArrowBackIcon />
          </IconButton>
        </Link>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mt: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: { xs: 19, md: 22 },
              lineHeight: 1.2,
              mb: 0.5,
            }}>
              {poolName}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {poolType === 'score' ? 'Qual o placar?' : 'Quem vence?'}
            </Typography>
          </Box>

          <IconButton
            onClick={() => setShowStandings(true)}
            sx={{
              color: '#C9940A',
              bgcolor: 'rgba(255,255,255,0.92)',
              borderRadius: '8px',
              flexShrink: 0,
              gap: 0.5,
              px: { xs: 1, md: 2 },
              border: '1px solid rgba(201,148,10,0.4)',
              '&:hover': { bgcolor: '#fff', boxShadow: '0 0 12px rgba(201,148,10,0.25)' }
            }}
          >
            <LeaderboardIcon sx={{ fontSize: 18, color: '#C9940A' }} />
            <Typography sx={{
              display: { xs: 'none', md: 'block' },
              color: '#C9940A',
              fontSize: 12,
              fontWeight: 800,
            }}>
              Classificação
            </Typography>
          </IconButton>
          <IconButton
            onClick={() => setShowGroupPredictions(true)}
            sx={{
              color: '#C9940A',
              bgcolor: 'rgba(201,148,10,0.05)',
              borderRadius: '8px',
              flexShrink: 0,
              gap: 0.5,
              px: { xs: 1, md: 2 },
              '&:hover': { bgcolor: 'rgba(201,148,10,0.1)' }
            }}
          >
            <PeopleIcon sx={{ fontSize: 18 }} />
            <Typography sx={{
              display: { xs: 'none', md: 'block' },
              color: '#C9940A',
              fontSize: 12,
              fontWeight: 700,
            }}>
              Palpites do Grupo
            </Typography>
          </IconButton>
        </Box>
      </Box>

      {alreadyPredicted && poolStatus !== 'completed' && (
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
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Você já tem palpites salvos</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Jogos que ainda não começaram podem ser alterados.</Typography>
          </Box>
        </Paper>
      )}

      {error && (
        <Paper sx={{ bgcolor: 'rgba(255, 68, 68, 0.1)', p: 2, mb: 3, border: '1px solid rgba(255, 68, 68, 0.3)' }}>
          <Typography sx={{ color: '#ff4444', fontSize: 14 }}>{error}</Typography>
        </Paper>
      )}

      {success && (
        <Paper sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', p: 2, mb: 2, border: '1px solid rgba(76, 175, 80, 0.3)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: '#4caf50' }} />
          <Typography sx={{ color: '#fff', fontSize: 14 }}>Palpites salvos! Você pode continuar palpitando os demais jogos.</Typography>
        </Paper>
      )}

      {skippedWarning && (
        <Paper sx={{ bgcolor: 'rgba(255,165,0,0.08)', p: 2, mb: 3, border: '1px solid rgba(255,165,0,0.3)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontSize: 16 }}>⚠️</Box>
          <Typography sx={{ color: '#ffb347', fontSize: 13 }}>{skippedWarning}</Typography>
        </Paper>
      )}

      {/* Filter Controls */}
      {localMatches.length > 0 && (() => {
        const hasGroupStage = localMatches.some(m => m.round === 'group')
        const groups = hasGroupStage
          ? Array.from(new Set(localMatches.filter(m => m.round === 'group').map(m => m.group_name))).sort()
          : []
        const dates = Array.from(new Set(localMatches.map(m =>
          new Date(m.match_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
        )))
        const activeCount = (filterGroup ? 1 : 0) + (filterDate ? 1 : 0)
        return (
          <Box sx={{ mb: 3 }}>
            <Box
              onClick={() => setFilterOpen(prev => !prev)}
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.75,
                px: 2, py: 0.75, borderRadius: '20px', cursor: 'pointer',
                border: '1px solid',
                borderColor: activeCount > 0 ? '#C9940A' : 'rgba(255,255,255,0.1)',
                bgcolor: activeCount > 0 ? 'rgba(201,148,10,0.12)' : 'transparent',
                transition: 'all 0.2s',
                mb: filterOpen ? 2 : 0,
              }}
            >
              <FilterListIcon sx={{ fontSize: 14, color: activeCount > 0 ? '#C9940A' : 'rgba(255,255,255,0.4)' }} />
              <Typography sx={{ color: activeCount > 0 ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>
                Filtro{activeCount > 0 && ` (${activeCount})`}
              </Typography>
            </Box>
            <Collapse in={filterOpen} timeout={50}>
              <Box sx={{ pt: 0.5 }}>
                {groups.length > 0 && (
                  <>
                    <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Grupo</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {groups.map(g => (
                        <Box key={g} onClick={() => setFilterGroup(prev => prev === g ? null : g)}
                          sx={{
                            px: 2, py: 0.6, borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                            borderColor: filterGroup === g ? '#C9940A' : 'rgba(255,255,255,0.1)',
                            bgcolor: filterGroup === g ? 'rgba(201,148,10,0.12)' : 'transparent', transition: 'all 0.2s'
                          }}>
                          <Typography sx={{ color: filterGroup === g ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>{g}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
                <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Data</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {dates.map(d => (
                    <Box key={d} onClick={() => setFilterDate(prev => prev === d ? null : d)}
                      sx={{
                        px: 2, py: 0.6, borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                        borderColor: filterDate === d ? '#C9940A' : 'rgba(255,255,255,0.1)',
                        bgcolor: filterDate === d ? 'rgba(201,148,10,0.12)' : 'transparent', transition: 'all 0.2s'
                      }}>
                      <Typography sx={{ color: filterDate === d ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>{d}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Collapse>
          </Box>
        )
      })()}

      {/* Matches List */}
      {(() => {
        // Helper: calcula resultado real de um jogo
        const getMatchResult = (match: Match): 'home' | 'away' | 'draw' | null => {
          if (match.home_score === null || match.away_score === null) return null
          if (match.home_score > match.away_score) return 'home'
          if (match.away_score > match.home_score) return 'away'
          return 'draw'
        }

        // Helper: checa se acertou
        const checkHit = (match: Match, pred: string | null | undefined): 'hit' | 'miss' | null => {
          if (!pred || match.status !== 'completed') return null
          if (match.home_score === null || match.away_score === null) return null
          const realResult = getMatchResult(match)
          if (poolType === 'score') {
            const [ph, pa] = pred.split('-').map(Number)
            if (ph === match.home_score && pa === match.away_score) return 'hit'
            const predResult = ph > pa ? 'home' : pa > ph ? 'away' : 'draw'
            return predResult === realResult ? 'hit' : 'miss'
          } else {
            // palpite é 'Time A' (casa), 'Time B' (fora) ou 'Empate'
            if (pred === 'Time A' && realResult === 'home') return 'hit'
            if (pred === 'Time B' && realResult === 'away') return 'hit'
            if (pred === 'Empate' && realResult === 'draw') return 'hit'
            return 'miss'
          }
        }

        const allFiltered = localMatches
          .filter(m => {
            if (filterGroup && m.group_name !== filterGroup) return false
            if (filterDate) {
              const d = new Date(m.match_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
              if (d !== filterDate) return false
            }
            return true
          })
          .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

        const pendingMatches = allFiltered.filter(m => m.status !== 'completed' && !(['live','in_play','playing','halftime','delayed'].includes(m.status)))
        const finishedMatches = allFiltered.filter(m => m.status === 'completed' || ['live','in_play','playing','halftime','delayed'].includes(m.status))
          .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())

        const finishedHits = finishedMatches.filter(m => {
          const pred = predictions.find(p => p.matchId === m.id)?.prediction
          const r = checkHit(m, pred)
          return r === 'hit'
        }).length
        const finishedTotal = finishedMatches.filter(m => m.status === 'completed').length

        const filtered = matchTab === 'pending' ? pendingMatches : finishedMatches

        return (
          <>
            {/* Tabs A palpitar / Finalizados */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Box onClick={() => setMatchTab('pending')} sx={{
                px: 2.5, py: 0.8, borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                borderColor: matchTab === 'pending' ? '#C9940A' : 'rgba(255,255,255,0.1)',
                bgcolor: matchTab === 'pending' ? 'rgba(201,148,10,0.12)' : 'transparent',
                transition: 'all 0.15s',
              }}>
                <Typography sx={{ color: matchTab === 'pending' ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>
                  A palpitar {pendingMatches.length > 0 && `(${pendingMatches.length})`}
                </Typography>
              </Box>
              <Box onClick={() => setMatchTab('finished')} sx={{
                px: 2.5, py: 0.8, borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                borderColor: matchTab === 'finished' ? '#C9940A' : 'rgba(255,255,255,0.1)',
                bgcolor: matchTab === 'finished' ? 'rgba(201,148,10,0.12)' : 'transparent',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                <Typography sx={{ color: matchTab === 'finished' ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>
                  Finalizados {finishedMatches.length > 0 && `(${finishedMatches.length})`}
                </Typography>
                {finishedTotal > 0 && (
                  <Box sx={{
                    px: 1, py: 0.1, borderRadius: '10px',
                    bgcolor: finishedHits > 0 ? 'rgba(99,202,132,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${finishedHits > 0 ? 'rgba(99,202,132,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    <Typography sx={{ color: finishedHits > 0 ? '#63ca84' : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800 }}>
                      {finishedHits}/{finishedTotal}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {filtered.length === 0 ? (
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', py: 4 }}>
                {matchTab === 'pending' ? 'Nenhum jogo aguardando palpite.' : 'Nenhum jogo finalizado ainda.'}
              </Typography>
            ) : (
          <Stack spacing={3} sx={{ alignItems: 'center' }}>
            {filtered.map(match => {
              const prediction = predictions.find(p => p.matchId === match.id)
              const matchDate = new Date(match.match_date)
              const isStarted = matchDate < new Date()
              const currentChoice = prediction?.prediction
              const isCompleted = match.status === 'completed'
              const isLive = ['live', 'in_play', 'playing', 'halftime', 'delayed'].includes(match.status)
              const hitResult = checkHit(match, currentChoice)
              const isHit = hitResult === 'hit'
              const isMiss = hitResult === 'miss'

              const selectedGold = '#C9940A'
              const isDisabled = isStarted

              return (
                <Card key={match.id} sx={{
                  bgcolor: isHit
                    ? 'rgba(99,202,132,0.04)'
                    : isMiss ? 'rgba(255,80,80,0.03)' : 'rgba(12,12,12)',
                  border: isHit
                    ? '1px solid rgba(99,202,132,0.45)'
                    : isMiss
                      ? '1px solid rgba(255,80,80,0.2)'
                      : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: isHit
                    ? '0 4px 20px rgba(99,202,132,0.08)'
                    : '0 4px 20px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  maxWidth: 600,
                  mx: 'auto',
                  width: '100%',
                  opacity: isDisabled && !currentChoice ? 0.6 : 1,
                  '&:hover': { borderColor: isHit ? 'rgba(99,202,132,0.5)' : isDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }
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
                      {isHit && (
                        <Box sx={{ px: 1, py: 0.15, bgcolor: 'rgba(99,202,132,0.15)', border: '1px solid rgba(99,202,132,0.3)', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ color: '#63ca84', fontSize: 9, fontWeight: 900 }}>✓ ACERTOU</Typography>
                        </Box>
                      )}
                      {isMiss && (
                        <Box sx={{ px: 1, py: 0.15, bgcolor: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ color: '#ff7070', fontSize: 9, fontWeight: 900 }}>✗ ERROU</Typography>
                        </Box>
                      )}
                      {isCompleted && !isHit && !isMiss && (
                        <Box sx={{ px: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 900 }}>ENCERRADO</Typography>
                        </Box>
                      )}
                      {!isCompleted && isLive && (
                        <Box sx={{ px: 1, bgcolor: '#ff4444', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>AO VIVO</Typography>
                        </Box>
                      )}
                      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}>
                        {matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h
                      </Typography>
                    </Box>
                  </Box>

                  {/* Main Selection Area */}
                  {poolType === 'score' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                      {/* Home Team */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <Avatar
                          src={getFlagUrl(match.home_team, 80)}
                          sx={{ width: 48, height: 48, mb: 1, border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          {match.home_team.charAt(0)}
                        </Avatar>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, mb: 2, textAlign: 'center' }}>
                          {translateTeam(match.home_team)}
                        </Typography>
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={isDisabled}
                          value={currentChoice ? currentChoice.split('-')[0] : ''}
                          onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                          style={{
                            width: '60px',
                            height: '60px',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            color: '#fff',
                            outline: 'none'
                          }}
                        />
                      </Box>

                      <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 900, fontSize: 20, mx: 2 }}>X</Typography>

                      {/* Away Team */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <Avatar
                          src={getFlagUrl(match.away_team, 80)}
                          sx={{ width: 48, height: 48, mb: 1, border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          {match.away_team.charAt(0)}
                        </Avatar>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, mb: 2, textAlign: 'center' }}>
                          {translateTeam(match.away_team)}
                        </Typography>
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={isDisabled}
                          value={currentChoice ? currentChoice.split('-')[1] : ''}
                          onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                          style={{
                            width: '60px',
                            height: '60px',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            color: '#fff',
                            outline: 'none'
                          }}
                        />
                      </Box>
                    </Box>
                  ) : (
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
                          {translateTeam(match.home_team)}
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
                          {translateTeam(match.away_team)}
                        </Typography>
                        <Typography sx={{ color: isDisabled && currentChoice !== 'Time B' ? 'transparent' : 'rgba(255,255,255,0.2)', fontSize: 9, mt: 0.5, fontWeight: 800 }}>
                          {currentChoice === 'Time B' ? 'ESCOLHIDO' : 'VENCE'}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {isStarted && (
                    <Box sx={{ p: 1, bgcolor: currentChoice ? 'rgba(255,165,0,0.04)' : 'rgba(255,68,68,0.05)', textAlign: 'center' }}>
                      <Typography sx={{ color: currentChoice ? 'rgba(255,165,0,0.7)' : '#ff4444', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>
                        {isCompleted
                          ? (currentChoice ? 'Jogo encerrado • Palpite registrado ✓' : 'Jogo encerrado • Você não palpitou neste jogo')
                          : isLive
                            ? (currentChoice ? 'Jogo em andamento • Palpite registrado ✓' : 'Jogo em andamento • Você não palpitou neste jogo')
                            : (currentChoice ? 'Jogo finalizado • Palpite registrado ✓' : 'Jogo finalizado • Você não palpitou neste jogo')}
                      </Typography>
                    </Box>
                  )}
                </Card>
              )
            })}
          </Stack>
            )}
          </>
        )
      })()}

      {/* Action Button */}
      <Box sx={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'auto',
        zIndex: 100
      }}>
        {matches.length === 0 ? (
          // Bolão só especial: botão de voltar
          <Link href={`/dashboard/groups/${groupId}`} passHref style={{ textDecoration: 'none' }}>
            <Button
              variant="outlined"
              size="large"
              sx={{
                bgcolor: 'rgba(0,0,0,0.8)',
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.2)',
                fontWeight: 700,
                px: { xs: 4, md: 6 },
                py: { xs: 1.5, md: 2 },
                borderRadius: '20px',
                fontSize: 14,
                textTransform: 'none',
                backdropFilter: 'blur(10px)',
                '&:hover': { borderColor: '#fff', color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' }
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
            disabled={loading || success}
            sx={{
              bgcolor: '#C9940A',
              color: '#000',
              fontWeight: 800,
              px: { xs: 4, md: 8 },
              py: { xs: 1.5, md: 2 },
              fontSize: { xs: 14, md: 16 },
              borderRadius: '20px',
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

      {/* Apostas Especiais */}
      {specialBets.length > 0 && (
        <Box sx={{ mt: 6, mb: 12 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
              Apostas Especiais
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />
          </Box>

          <Paper sx={{ bgcolor: 'rgba(201,148,10,0.05)', border: '1px solid rgba(201,148,10,0.15)', borderRadius: '12px', p: 2, mb: 3 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              Prazo: início das oitavas de final • {alreadySavedSpecial ? 'Palpites confirmados — não podem ser alterados.' : 'Você pode salvar uma vez.'}
            </Typography>
          </Paper>

          {specialError && (
            <Paper sx={{ bgcolor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '12px', p: 2, mb: 2 }}>
              <Typography sx={{ color: '#ff4444', fontSize: 13 }}>{specialError}</Typography>
            </Paper>
          )}

          {specialSuccess && (
            <Paper sx={{ bgcolor: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: '12px', p: 2, mb: 2 }}>
              <Typography sx={{ color: '#fff', fontSize: 13 }}>Apostas especiais salvas!</Typography>
            </Paper>
          )}

          <Stack spacing={2}>
            {specialBets.map(key => {
              const isTeamBet = TEAM_BETS.includes(key)
              const isPlayerBet = PLAYER_BETS.includes(key)
              const isDisabled = alreadySavedSpecial || specialSuccess

              const autocompleteInputSx = {
                '& input': { color: '#fff', fontSize: 15, fontWeight: 600, WebkitTextFillColor: '#fff' },
                '& input.Mui-disabled': { WebkitTextFillColor: '#fff', color: '#fff' },
                '& .MuiInput-underline:before': { borderBottomColor: 'rgba(201,148,10,0.3)' },
                '& .MuiInput-underline:after': { borderBottomColor: '#C9940A' },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#C9940A' },
                '& .MuiAutocomplete-endAdornment svg': { color: 'rgba(255,255,255,0.3)' },
              }

              const dropdownSlotProps = {
                paper: {
                  sx: {
                    bgcolor: '#111',
                    border: '1px solid rgba(201,148,10,0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    mt: 0.5,
                    '& .MuiAutocomplete-listbox': { p: 0.5 },
                    '& .MuiAutocomplete-option': {
                      borderRadius: '8px',
                      '&:hover': { bgcolor: 'rgba(201,148,10,0.12)' },
                      '&[aria-selected="true"]': { bgcolor: 'rgba(201,148,10,0.18) !important' },
                    },
                  }
                }
              }

              return (
                <Card key={key} sx={{ bgcolor: 'rgba(12,12,12)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', p: 2.5, boxShadow: 'none' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>
                    {SPECIAL_BET_LABELS[key] ?? key}
                  </Typography>

                  {isTeamBet && (
                    <Autocomplete
                      disabled={isDisabled}
                      options={allTeams}
                      getOptionLabel={(option) => translateTeam(option)}
                      value={specialValues[key] ?? null}
                      onChange={(_e, val) => setSpecialValues(prev => ({ ...prev, [key]: val ?? '' }))}
                      slotProps={dropdownSlotProps}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props as any
                        return (
                          <Box key={key} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5 }}>
                            <TeamFlag teamName={option} size={20} />
                            <Typography sx={{ color: '#fff', fontSize: 14 }}>{translateTeam(option)}</Typography>
                          </Box>
                        )
                      }}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Selecione a seleção..." variant="standard" sx={autocompleteInputSx} />
                      )}
                    />
                  )}

                  {isPlayerBet && (() => {
                    const teamFilter = playerTeamFilter[key] ?? ''
                    const inputVal = playerInputValue[key] ?? ''
                    const isOpen = playerSearchOpen[key] ?? false
                    const savedPlayerName = specialValues[key]

                    const filteredPlayers = PLAYERS.filter(p => {
                      const matchesTeam = teamFilter ? p.team === teamFilter : true
                      const matchesText = inputVal.length >= 3 ? p.name.toLowerCase().includes(inputVal.toLowerCase()) : true
                      if (teamFilter && inputVal.length >= 3) return matchesTeam && matchesText
                      if (teamFilter) return matchesTeam
                      if (inputVal.length >= 3) return matchesText
                      return false
                    })
                    const showOptions = teamFilter !== '' || inputVal.length >= 3

                    return (
                      <Box>
                        {/* Input que abre o painel */}
                        <Autocomplete
                          disabled={isDisabled}
                          options={showOptions ? filteredPlayers : []}
                          filterOptions={(x) => x}
                          getOptionLabel={(o) => o.name}
                          value={PLAYERS.find(p => p.name === specialValues[key]) ?? null}
                          inputValue={inputVal}
                          onInputChange={(_e, val, reason) => {
                            if (reason === 'input') {
                              setPlayerInputValue(prev => ({ ...prev, [key]: val }))
                            }
                          }}
                          onChange={(_e, val) => {
                            setSpecialValues(prev => ({ ...prev, [key]: val?.name ?? '' }))
                            setPlayerInputValue(prev => ({ ...prev, [key]: val?.name ?? '' }))
                            setPlayerSearchOpen(prev => ({ ...prev, [key]: false }))
                          }}
                          onOpen={() => setPlayerSearchOpen(prev => ({ ...prev, [key]: true }))}
                          onClose={(_e, reason) => {
                            if (reason !== 'blur') {
                              setPlayerSearchOpen(prev => ({ ...prev, [key]: false }))
                            }
                          }}
                          noOptionsText={
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                              {!showOptions ? 'Selecione uma seleção acima ou digite 3 letras' : 'Nenhum jogador encontrado'}
                            </Typography>
                          }
                          slotProps={{ listbox: { sx: { p: 0.5, '& .MuiAutocomplete-option': { borderRadius: '8px', '&:hover': { bgcolor: 'rgba(201,148,10,0.12)' }, '&[aria-selected="true"]': { bgcolor: 'rgba(201,148,10,0.18) !important' } } } } }}
                          renderOption={(props, option) => {
                            const { key: optKey, ...optionProps } = props as any
                            const posColor: Record<string, string> = { GOL: '#5b9bd5', DEF: '#70b96e', MEI: '#e0a830', ATA: '#e05c5c' }
                            const posLabel: Record<string, string> = { GOL: 'GOL', DEF: 'DEF', MEI: 'MEI', ATA: 'ATA' }
                            return (
                              <Box key={optKey} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5 }}>
                                <TeamFlag teamName={option.team} size={20} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{option.name}</Typography>
                                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{translateTeam(option.team)}</Typography>
                                </Box>
                                {option.position && (
                                  <Box sx={{
                                    px: 0.8, py: 0.2, borderRadius: '4px',
                                    bgcolor: `${posColor[option.position]}22`,
                                    border: `1px solid ${posColor[option.position]}55`,
                                  }}>
                                    <Typography sx={{ color: posColor[option.position], fontSize: 10, fontWeight: 700 }}>
                                      {posLabel[option.position] ?? option.position}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )
                          }}
                          slots={{
                            paper: ({ children, ...paperProps }: any) => (
                              <Box {...paperProps} sx={{
                                bgcolor: '#111',
                                border: '1px solid rgba(201,148,10,0.2)',
                                borderRadius: '12px',
                                color: '#fff',
                                mt: 0.5,
                                overflow: 'hidden',
                              }}>
                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                  {FEATURED_TEAMS.map(team => {
                                    const selected = teamFilter === team
                                    return (
                                      <Box
                                        key={team}
                                        onMouseDown={(e: React.MouseEvent) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          const next = teamFilter === team ? '' : team
                                          setPlayerTeamFilter(prev => ({ ...prev, [key]: next }))
                                          if (next) setPlayerInputValue(prev => ({ ...prev, [key]: '' }))
                                        }}
                                        sx={{
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          width: 32, height: 32, borderRadius: '8px', cursor: 'pointer',
                                          border: '1.5px solid',
                                          borderColor: selected ? '#C9940A' : 'rgba(255,255,255,0.1)',
                                          bgcolor: selected ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.03)',
                                          transition: 'all 0.15s',
                                          '&:hover': { borderColor: 'rgba(201,148,10,0.5)' },
                                        }}
                                      >
                                        <TeamFlag teamName={team} size={20} />
                                      </Box>
                                    )
                                  })}
                                </Box>
                                {children}
                              </Box>
                            )
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Buscar jogador..."
                              variant="standard"
                              sx={autocompleteInputSx}
                            />
                          )}
                        />
                      </Box>
                    )
                  })()}
                </Card>
              )
            })}
          </Stack>

          {!alreadySavedSpecial && !specialSuccess && (
            <Button
              fullWidth
              variant="contained"
              disabled={specialLoading}
              onClick={handleSaveSpecial}
              sx={{
                mt: 3,
                bgcolor: 'rgba(201,148,10,0.9)',
                color: '#000',
                fontWeight: 800,
                px: { xs: 4, md: 8 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: 14, md: 16 },
                borderRadius: '14px',
                textTransform: 'none',
                boxShadow: '0 8px 30px rgba(201,148,10,0.2)',
                '&:hover': { bgcolor: '#E6AC10' },
                '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' }
              }}
            >
              {specialLoading ? <CircularProgress size={20} color="inherit" /> : 'Salvar Apostas Especiais'}
            </Button>
          )}
        </Box>
      )}

      <PredictionsModal
        open={showGroupPredictions}
        onClose={() => setShowGroupPredictions(false)}
        poolId={poolId}
        poolType={poolType}
        matches={localMatches}
      />

      <StandingsModal
        open={showStandings}
        onClose={() => setShowStandings(false)}
      />
    </Box>
  )
}
