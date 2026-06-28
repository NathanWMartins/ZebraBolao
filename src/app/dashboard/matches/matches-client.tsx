'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Stack,
  Card,
  OutlinedInput,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchIcon from '@mui/icons-material/Search'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import PlaceIcon from '@mui/icons-material/Place'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TeamFlag from '@/app/components/TeamFlag'
import { translateTeam } from '@/lib/teamTranslations'
import BackButton from '@/app/components/BackButton'

interface Match {
  id: string
  external_id: string
  home_team: string | null
  away_team: string | null
  match_date: string
  status: string
  phase?: string | null
  home_score: number | null
  away_score: number | null
  result: string | null
  stadium: string
  round: string
  group_name: string
  home_yellows: number | null
  home_reds: number | null
  away_yellows: number | null
  away_reds: number | null
}

interface MatchesClientProps {
  initialMatches: Match[]
}

export default function MatchesClient({ initialMatches }: MatchesClientProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'grupos' | 'matamata' | 'aovivo' | 'finalizados'>('todos')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const supabase = createClient()

  // Inscrição em tempo real para atualizações nos jogos
  useEffect(() => {
    const channel = supabase
      .channel('matches_page_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const updatedMatch = payload.new as Match
          setMatches(prev => prev.map(m =>
            m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: typeof activeTab) => {
    setActiveTab(newValue)
    setActiveGroup(null)
  }

  // Grupos únicos disponíveis (só para fase de grupos)
  const availableGroups = useMemo(() => {
    const groups = matches
      .filter(m => m.round === 'group' && m.group_name)
      .map(m => m.group_name)
    return [...new Set(groups)].sort()
  }, [matches])

  // Filtragem dos jogos com base nos filtros e na pesquisa
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const homeTranslated = (match.home_team ? translateTeam(match.home_team) : '').toLowerCase()
      const awayTranslated = (match.away_team ? translateTeam(match.away_team) : '').toLowerCase()
      // 1. Filtro de pesquisa (nome das seleções)
      const matchesSearch =
        (match.home_team?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
        (match.away_team?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
        homeTranslated.includes(search.toLowerCase()) ||
        awayTranslated.includes(search.toLowerCase()) ||
        (match.stadium && match.stadium.toLowerCase().includes(search.toLowerCase())) ||
        (match.group_name && match.group_name.toLowerCase().includes(search.toLowerCase()))

      if (!matchesSearch) return false

      // 2. Filtro de Abas
      switch (activeTab) {
        case 'grupos':
          if (match.round !== 'group') return false
          if (activeGroup && match.group_name !== activeGroup) return false
          return true
        case 'matamata':
          return match.round !== 'group'
        case 'aovivo':
          return match.status === 'live' || match.status === 'in_play' || match.status === 'playing'
        case 'finalizados':
          return match.status === 'completed'
        case 'todos':
        default:
          return true
      }
    })
  }, [matches, search, activeTab, activeGroup])

  // Formatação de data em português
  const formatHeaderDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const formatted = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      timeZone: 'America/Sao_Paulo'
    })
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  const PHASE_LABELS: Record<string, string> = {
    '1H': '1º Tempo', 'HT': 'Intervalo', '2H': '2º Tempo',
    'ET1': 'Prorrog.', 'ET2': 'Prorrog.', 'PEN': 'Pênaltis',
  }

  const translateStatus = (match: Match) => {
    switch (match.status) {
      case 'scheduled':
        return 'Em breve'
      case 'live':
      case 'in_play':
      case 'playing':
        return match.phase && PHASE_LABELS[match.phase] ? PHASE_LABELS[match.phase] : 'Ao vivo'
      case 'halftime':
        return 'Intervalo'
      case 'delayed':
        return 'Atrasado'
      case 'completed':
      case 'completes':
        return 'Finalizado'
      default:
        return match.status || ''
    }
  }

  // Renderizador de cada card de partida
  const renderMatchCard = (match: Match) => {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    })
    const matchTimeBRT = formatter.format(new Date(match.match_date))
    const isLive = match.status === 'live' || match.status === 'in_play' || match.status === 'playing'
    const isCompleted = match.status === 'completed'

    return (
      <Card
        key={match.id}
        sx={{
          bgcolor: 'rgba(0,0,0,0.5)',
          border: isLive ? '1px solid rgba(253, 64, 64, 0.3)' : '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          p: 3,
          gap: 2
        }}>
          {/* Lado Esquerdo: Info da Rodada e Times */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Typography sx={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              mb: 1.5,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              {match.round !== 'group' ? match.round : `Grupo ${match.group_name}`} • {matchTimeBRT}h
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {match.home_team && <TeamFlag teamName={match.home_team} size={20} />}
                <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 600, color: '#fff' }}>
                  {match.home_team ? translateTeam(match.home_team) : 'A definir'}
                </Typography>
              </Box>

              {match.home_score !== null && match.away_score !== null ? (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: isLive ? 'rgba(253, 64, 64, 0.1)' : 'rgba(255,255,255,0.06)',
                  border: `0.5px solid ${isLive ? 'rgba(253, 64, 64, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                  px: 2,
                  py: 0.5,
                  borderRadius: '8px'
                }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: isLive ? '#ff4444' : '#C9940A' }}>
                    {match.home_score}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                    x
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: isLive ? '#ff4444' : '#C9940A' }}>
                    {match.away_score}
                  </Typography>
                </Box>
              ) : (
                <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', px: 1 }}>
                  vs
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {match.away_team && <TeamFlag teamName={match.away_team} size={20} />}
                <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 600, color: '#fff' }}>
                  {match.away_team ? translateTeam(match.away_team) : 'A definir'}
                </Typography>
              </Box>
            </Box>

            {/* Cartões por time (só para jogos finalizados) */}
            {isCompleted && ((match.home_yellows ?? 0) > 0 || (match.home_reds ?? 0) > 0 || (match.away_yellows ?? 0) > 0 || (match.away_reds ?? 0) > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                {/* Casa */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{match.home_team ? translateTeam(match.home_team) : 'A definir'}</Typography>
                  {(match.home_yellows ?? 0) > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 11, bgcolor: '#f5c518', borderRadius: '1px' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>{match.home_yellows}</Typography>
                    </Box>
                  )}
                  {(match.home_reds ?? 0) > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 11, bgcolor: '#ff4444', borderRadius: '1px' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>{match.home_reds}</Typography>
                    </Box>
                  )}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>•</Typography>
                {/* Fora */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{match.away_team ? translateTeam(match.away_team) : 'A definir'}</Typography>
                  {(match.away_yellows ?? 0) > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 11, bgcolor: '#f5c518', borderRadius: '1px' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>{match.away_yellows}</Typography>
                    </Box>
                  )}
                  {(match.away_reds ?? 0) > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <Box sx={{ width: 8, height: 11, bgcolor: '#ff4444', borderRadius: '1px' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>{match.away_reds}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* Lado Direito: Estádio e Status */}
          <Stack
            spacing={2}
            sx={{
              flexDirection: { xs: 'row', md: 'column' },
              alignItems: { xs: 'center', md: 'flex-end' },
              justifyContent: 'space-between',
              width: { xs: '100%', md: 'auto' },
              borderTop: { xs: '0.5px solid rgba(255,255,255,0.05)', md: 'none' },
              pt: { xs: 2, md: 0 }
            }}
          >
            {match.stadium && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PlaceIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  {match.stadium}
                </Typography>
              </Box>
            )}

            <Box sx={{
              bgcolor: isLive ? 'rgba(253, 64, 64, 0.1)' : 'rgba(201,148,10,0.1)',
              color: isLive ? '#fd4040ff' : '#C9940A',
              px: 2,
              py: 0.75,
              borderRadius: '8px',
              border: isLive ? '0.5px solid rgba(253, 64, 64, 0.2)' : '0.5px solid rgba(201,148,10,0.2)',
              minWidth: 90,
              textAlign: 'center'
            }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.02em' }}>
                {translateStatus(match)}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Card>
    )
  }

  // Agrupamento de jogos por data para renderizar os divisores diários
  let lastDateHeader = ''

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 3, md: 0 }, pb: 8 }}>
      {/* Botão de Voltar */}
      <Box sx={{ mb: 4 }}>
        <BackButton />
      </Box>

      {/* Título da Página */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{ color: '#fff', fontSize: '32px', fontWeight: 800, mb: 1 }}>
          Calendário de Jogos
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Confira as datas, horários e resultados em tempo real de todas as partidas da Copa do Mundo 2026.
        </Typography>
      </Box>

      {/* Controles de Filtro (Busca + Abas) */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        <OutlinedInput
          placeholder="Buscar por seleção, estádio ou grupo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
            </InputAdornment>
          }
          sx={{
            bgcolor: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: 14,
            '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            '&.Mui-focused fieldset': { borderColor: '#C9940A' },
          }}
        />

        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.05)', overflowX: 'auto' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#C9940A' },
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 13,
                minWidth: 'auto',
                px: 2.5,
                '&.Mui-selected': { color: '#C9940A' }
              }
            }}
          >
            <Tab value="todos" label="Todos" />
            <Tab value="grupos" label="Fase de Grupos" />
            <Tab value="matamata" label="Mata-Mata" />
            <Tab value="aovivo" label="Ao Vivo" />
            <Tab value="finalizados" label="Finalizados" />
          </Tabs>
        </Box>

        {/* Sub-filtro de grupo */}
        {activeTab === 'grupos' && availableGroups.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Box
              onClick={() => setActiveGroup(null)}
              sx={{
                px: 2, py: 0.5, borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                borderColor: activeGroup === null ? '#C9940A' : 'rgba(255,255,255,0.1)',
                bgcolor: activeGroup === null ? 'rgba(201,148,10,0.12)' : 'transparent',
              }}
            >
              <Typography sx={{ color: activeGroup === null ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>
                Todos
              </Typography>
            </Box>
            {availableGroups.map(g => (
              <Box
                key={g}
                onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                sx={{
                  px: 2, py: 0.5, borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                  borderColor: activeGroup === g ? '#C9940A' : 'rgba(255,255,255,0.1)',
                  bgcolor: activeGroup === g ? 'rgba(201,148,10,0.12)' : 'transparent',
                }}
              >
                <Typography sx={{ color: activeGroup === g ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>
                  Grupo {g}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Stack>

      {/* Lista de Partidas com Divisores de Data */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredMatches.length === 0 ? (
          <Box sx={{
            bgcolor: 'rgba(0,0,0,0.3)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '16px',
            p: 6,
            textAlign: 'center'
          }}>
            <SportsSoccerIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Nenhum jogo encontrado.
            </Typography>
          </Box>
        ) : (
          filteredMatches.map((match) => {
            const currentDateHeader = formatHeaderDate(match.match_date)
            const showDivider = currentDateHeader !== lastDateHeader
            lastDateHeader = currentDateHeader

            return (
              <React.Fragment key={match.id}>
                {showDivider && (
                  <Box sx={{ mt: 3, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarMonthIcon sx={{ color: '#C9940A', fontSize: 18 }} />
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                      {currentDateHeader}
                    </Typography>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.05)' }} />
                  </Box>
                )}
                {renderMatchCard(match)}
              </React.Fragment>
            )
          })
        )}
      </Box>
    </Box>
  )
}
