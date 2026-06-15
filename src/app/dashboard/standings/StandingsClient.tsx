'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { translateTeam } from '@/lib/teamTranslations'
import TeamFlag from '@/app/components/TeamFlag'

export type StandingEntry = {
  id: string
  group_name: string
  team: string
  position: number
  played: number
  points: number
  goals_for: number
  goals_against: number
  wins?: number
  draws?: number
  losses?: number
}

interface Props {
  standings: StandingEntry[]
  compact?: boolean
  onClose?: () => void
}

const COL_HEADER = { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textAlign: 'center' as const, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

function StandingTable({ groupName, entries, compact }: { groupName: string, entries: StandingEntry[], compact: boolean }) {
  const fs = compact ? 10 : 12
  const flagSize = 20

  return (
    <Box sx={{ mb: compact ? 2.5 : 4 }}>
      {/* Título do grupo */}
      <Typography sx={{
        color: '#fff',
        fontWeight: 800,
        fontSize: compact ? 12 : 15,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        mb: 1,
        px: 0.5,
      }}>
        Grupo {groupName}
      </Typography>

      {/* Tabela */}
      <Box sx={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        {/* Cabeçalho */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: compact
            ? '20px 1fr 22px 22px 22px 22px 22px 22px 24px'
            : '24px 1fr 28px 28px 28px 28px 28px 28px 32px',
          gap: 0,
          px: compact ? 1 : 1.5,
          py: 0.75,
          bgcolor: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'center',
        }}>
          <Typography sx={{ ...COL_HEADER, fontSize: 9 }}>#</Typography>
          <Typography sx={{ ...COL_HEADER, textAlign: 'left', fontSize: 9 }}>Seleção</Typography>
          <Typography sx={COL_HEADER}>P</Typography>
          <Typography sx={COL_HEADER}>J</Typography>
          <Typography sx={COL_HEADER}>V</Typography>
          <Typography sx={COL_HEADER}>E</Typography>
          <Typography sx={COL_HEADER}>D</Typography>
          <Typography sx={COL_HEADER}>GP</Typography>
          <Typography sx={COL_HEADER}>SG</Typography>
        </Box>

        {/* Linhas */}
        {entries.map((s, i) => {
          const isQualified = i < 2
          const diff = s.goals_for - s.goals_against
          // Calcular V/E/D a partir dos dados disponíveis
          // Como não temos V/E/D na tabela, estimamos:
          // (guardado para quando o schema tiver essas colunas)
          // Por ora deixamos —
          return (
            <Box
              key={s.team}
              sx={{
                display: 'grid',
                gridTemplateColumns: compact
                  ? '20px 1fr 22px 22px 22px 22px 22px 22px 24px'
                  : '24px 1fr 28px 28px 28px 28px 28px 28px 32px',
                gap: 0,
                px: compact ? 1 : 1.5,
                py: compact ? 0.65 : 0.9,
                alignItems: 'center',
                borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                bgcolor: isQualified ? 'rgba(99,202,132,0.04)' : 'transparent',
                borderLeft: isQualified ? '3px solid rgba(99,202,132,0.5)' : '3px solid transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* Posição */}
              <Typography sx={{ color: isQualified ? '#63ca84' : 'rgba(255,255,255,0.3)', fontSize: fs, fontWeight: 700, lineHeight: 1 }}>
                {s.position || i + 1}
              </Typography>

              {/* Seleção */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <TeamFlag teamName={s.team} size={flagSize} />
                <Typography sx={{ color: '#fff', fontSize: fs, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {translateTeam(s.team)}
                </Typography>
              </Box>

              {/* Pts */}
              <Typography sx={{ color: '#C9940A', fontSize: compact ? 11 : 13, fontWeight: 800, textAlign: 'center' }}>
                {s.points}
              </Typography>

              {/* J */}
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>
                {s.played}
              </Typography>

              {/* V */}
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>
                {s.wins ?? '—'}
              </Typography>
              {/* E */}
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>
                {s.draws ?? '—'}
              </Typography>
              {/* D */}
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>
                {s.losses ?? '—'}
              </Typography>

              {/* GP */}
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>
                {s.goals_for}
              </Typography>

              {/* SG */}
              <Typography sx={{
                color: diff > 0 ? '#63ca84' : diff < 0 ? '#ff6b6b' : 'rgba(255,255,255,0.4)',
                fontSize: fs, fontWeight: 700, textAlign: 'center'
              }}>
                {diff > 0 ? `+${diff}` : diff}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default function StandingsClient({ standings, compact = false }: Props) {
  const groups: Record<string, StandingEntry[]> = {}
  for (const s of standings) {
    if (!groups[s.group_name]) groups[s.group_name] = []
    groups[s.group_name].push(s)
  }
  const groupNames = Object.keys(groups).sort()

  if (compact) {
    return (
      <Box>
        {groupNames.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', py: 3 }}>
            Classificação ainda não disponível.
          </Typography>
        ) : (
          groupNames.map(g => (
            <StandingTable key={g} groupName={g} entries={groups[g]} compact />
          ))
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 2, md: 0 }, pb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)' }}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 14 }}>Voltar ao Dashboard</Typography>
        </Link>
      </Box>

      <Typography variant="h1" sx={{ color: '#fff', fontSize: 28, fontWeight: 800, mb: 1 }}>
        Classificação — Fase de Grupos
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, mb: 5 }}>
        Top 2 de cada grupo se classificam para o mata-mata.
      </Typography>

      {groupNames.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', py: 6 }}>
          Classificação ainda não disponível.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 1, md: 3 } }}>
          {groupNames.map(g => (
            <StandingTable key={g} groupName={g} entries={groups[g]} compact={false} />
          ))}
        </Box>
      )}
    </Box>
  )
}
