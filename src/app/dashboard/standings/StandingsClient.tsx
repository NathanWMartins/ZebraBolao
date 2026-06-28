'use client'

import React, { useState } from 'react'
import { Box, Typography, Avatar } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { translateTeam } from '@/lib/teamTranslations'
import TeamFlag from '@/app/components/TeamFlag'
import { getFlagUrl } from '@/lib/teamFlags'
import BackButton from '@/app/components/BackButton'

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

export interface KnockoutMatch {
  id: string
  home_team: string | null
  away_team: string | null
  home_team_code: string | null
  away_team_code: string | null
  match_date: string
  round: string
  status: string
  home_score: number | null
  away_score: number | null
}

interface Props {
  standings: StandingEntry[]
  knockoutMatches?: KnockoutMatch[]
  compact?: boolean
  onClose?: () => void
}

// ─── Tabela de Grupos ─────────────────────────────────────────────────────────

const COL_HEADER = { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textAlign: 'center' as const, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

function StandingTable({ groupName, entries, compact }: { groupName: string, entries: StandingEntry[], compact: boolean }) {
  const fs = compact ? 10 : 12
  const flagSize = 20

  return (
    <Box sx={{ mb: compact ? 2.5 : 4 }}>
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

      <Box sx={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
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

        {entries.map((s, i) => {
          const isQualified = i < 2
          const diff = s.goals_for - s.goals_against
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
              }}
            >
              <Typography sx={{ color: isQualified ? '#63ca84' : 'rgba(255,255,255,0.3)', fontSize: fs, fontWeight: 700, lineHeight: 1 }}>
                {s.position || i + 1}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <TeamFlag teamName={s.team} size={flagSize} />
                <Typography sx={{ color: '#fff', fontSize: fs, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {translateTeam(s.team)}
                </Typography>
              </Box>
              <Typography sx={{ color: '#C9940A', fontSize: compact ? 11 : 13, fontWeight: 800, textAlign: 'center' }}>{s.points}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>{s.played}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>{s.wins ?? '—'}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>{s.draws ?? '—'}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>{s.losses ?? '—'}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: fs, textAlign: 'center' }}>{s.goals_for}</Typography>
              <Typography sx={{ color: diff > 0 ? '#63ca84' : diff < 0 ? '#ff6b6b' : 'rgba(255,255,255,0.4)', fontSize: fs, fontWeight: 700, textAlign: 'center' }}>
                {diff > 0 ? `+${diff}` : diff}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

// ─── Bracket de Mata-Mata ─────────────────────────────────────────────────────

// Ordem das rodadas: oitavas esquerda → quartas esq → semi esq → final → semi dir → quartas dir → oitavas dir
// Vamos organizar em colunas: R16 | QF | SF | F | SF | QF | R16

function getRoundKey(round: string): string {
  const r = round.toLowerCase()
  if (r === 'r32' || r.includes('32')) return 'r32'
  if (r === 'r16' || r.includes('round-of-16') || r.includes('round_of_16')) return 'r16'
  if (r.includes('quarter') || r === 'qf') return 'qf'
  if (r.includes('semi') || r === 'sf') return 'sf'
  if (r.includes('3rd') || r === '3rd' || r.includes('third')) return 'third'
  if (r === 'final') return 'final'
  return r
}

const ROUND_LABELS: Record<string, string> = {
  r32: '16avos de Final',
  r16: 'Oitavas de Final',
  qf: 'Quartas de Final',
  sf: 'Semifinal',
  final: 'Final',
  third: '3° Lugar',
}

// Card de um confronto no bracket
function BracketCard({ match, compact, winner }: { match: KnockoutMatch | null, compact: boolean, winner?: 'home' | 'away' | null }) {
  const isLive = match ? ['live', 'in_play', 'playing', 'halftime', 'delayed'].includes(match.status) : false
  const isCompleted = match?.status === 'completed'
  const flagSize = compact ? 18 : 22

  const homeWon = isCompleted && match && match.home_score !== null && match.away_score !== null && match.home_score > match.away_score
  const awayWon = isCompleted && match && match.home_score !== null && match.away_score !== null && match.away_score > match.home_score

  const TeamRow = ({ team, score, won }: { team: string | null, score: number | null, won: boolean }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.6 : 0.75, py: compact ? 0.4 : 0.5 }}>
      {team ? (
        <Avatar
          src={getFlagUrl(team, 40)}
          sx={{ width: flagSize, height: flagSize, flexShrink: 0, border: won ? '1.5px solid #C9940A' : '1px solid rgba(255,255,255,0.1)' }}
        />
      ) : (
        <Box sx={{
          width: flagSize, height: flagSize, borderRadius: '50%', flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)',
        }} />
      )}
      <Typography sx={{
        color: won ? '#fff' : team ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)',
        fontSize: compact ? 10 : 12,
        fontWeight: won ? 700 : 500,
        flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}>
        {team ? translateTeam(team) : 'A definir'}
      </Typography>
      {score !== null && (
        <Typography sx={{ color: won ? '#C9940A' : 'rgba(255,255,255,0.5)', fontSize: compact ? 11 : 13, fontWeight: 800, ml: 0.25, flexShrink: 0 }}>
          {score}
        </Typography>
      )}
    </Box>
  )

  return (
    <Box sx={{
      border: `1px solid ${isLive ? 'rgba(253,64,64,0.4)' : isCompleted ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '8px',
      bgcolor: isLive ? 'rgba(253,64,64,0.04)' : 'rgba(255,255,255,0.02)',
      px: compact ? 1 : 1.25,
      py: compact ? 0.25 : 0.25,
      width: '100%',
    }}>
      <TeamRow team={match?.home_team ?? null} score={match?.home_score ?? null} won={!!homeWon} />
      <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.05)' }} />
      <TeamRow team={match?.away_team ?? null} score={match?.away_score ?? null} won={!!awayWon} />
      {match && (
        <Typography sx={{ color: isLive ? '#fd4040' : 'rgba(255,255,255,0.2)', fontSize: compact ? 8 : 9, fontWeight: 600, textAlign: 'right', mt: 0.25 }}>
          {isLive ? '● AO VIVO' : `${new Date(match.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })} · ${new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h`}
        </Typography>
      )}
    </Box>
  )
}

function KnockoutBracket({ matches, compact }: { matches: KnockoutMatch[], compact: boolean }) {
  if (matches.length === 0) {
    return (
      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', py: 6 }}>
        Chave do mata-mata ainda não disponível.
      </Typography>
    )
  }

  // Agrupa por rodada
  const byRound: Record<string, KnockoutMatch[]> = {}
  for (const m of matches) {
    const key = getRoundKey(m.round)
    if (!byRound[key]) byRound[key] = []
    byRound[key].push(m)
  }

  // Ordem das rodadas
  const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'final', 'third']
  const rounds = ROUND_ORDER.filter(r => byRound[r]?.length > 0)

  const cardWidth = compact ? 160 : 220

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 3 : 4 }}>
      {rounds.map(roundKey => {
        const items = byRound[roundKey]
        const isFinal = roundKey === 'final'
        const isThird = roundKey === 'third'
        const label = ROUND_LABELS[roundKey] ?? roundKey

        return (
          <Box key={roundKey}>
            {/* Label da rodada */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: compact ? 1.5 : 2 }}>
              <Typography sx={{
                color: isFinal ? '#C9940A' : 'rgba(255,255,255,0.4)',
                fontSize: compact ? 9 : 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                flexShrink: 0,
              }}>
                {label}
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: isFinal ? 'rgba(201,148,10,0.3)' : 'rgba(255,255,255,0.06)' }} />
            </Box>

            {/* Grid de confrontos */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: roundKey === 'r32'
                ? { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }
                : roundKey === 'r16'
                ? { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }
                : roundKey === 'qf'
                ? { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }
                : roundKey === 'sf'
                ? { xs: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' }
                : { xs: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' },
              gap: compact ? 1 : 1.5,
            }}>
              {items.map(m => (
                <BracketCard key={m.id} match={m} compact={compact} />
              ))}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function Tabs({ active, onChange, compact }: { active: 'grupos' | 'matamata', onChange: (t: 'grupos' | 'matamata') => void, compact: boolean }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: compact ? 2 : 3 }}>
      {(['grupos', 'matamata'] as const).map(t => (
        <Box
          key={t}
          onClick={() => onChange(t)}
          sx={{
            px: compact ? 2 : 2.5, py: compact ? 0.6 : 0.8,
            borderRadius: '20px', cursor: 'pointer', border: '1px solid',
            borderColor: active === t ? '#C9940A' : 'rgba(255,255,255,0.1)',
            bgcolor: active === t ? 'rgba(201,148,10,0.12)' : 'transparent',
            transition: 'all 0.15s',
          }}
        >
          <Typography sx={{ color: active === t ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: compact ? 11 : 13, fontWeight: 700 }}>
            {t === 'grupos' ? 'Fase de Grupos' : 'Mata-Mata'}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

// ─── Export principal ─────────────────────────────────────────────────────────

export default function StandingsClient({ standings, knockoutMatches = [], compact = false }: Props) {
  const [tab, setTab] = useState<'grupos' | 'matamata'>('matamata')

  const groups: Record<string, StandingEntry[]> = {}
  for (const s of standings) {
    if (!groups[s.group_name]) groups[s.group_name] = []
    groups[s.group_name].push(s)
  }
  const groupNames = Object.keys(groups).sort()

  if (compact) {
    return (
      <Box>
        <Tabs active={tab} onChange={setTab} compact />
        {tab === 'grupos' ? (
          groupNames.length === 0 ? (
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', py: 3 }}>
              Classificação ainda não disponível.
            </Typography>
          ) : (
            groupNames.map(g => <StandingTable key={g} groupName={g} entries={groups[g]} compact />)
          )
        ) : (
          <KnockoutBracket matches={knockoutMatches} compact />
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 2, md: 0 }, pb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <BackButton />
      </Box>

      <Typography variant="h1" sx={{ color: '#fff', fontSize: 28, fontWeight: 800, mb: 2 }}>
        Classificação
      </Typography>

      <Tabs active={tab} onChange={setTab} compact={false} />

      {tab === 'grupos' ? (
        groupNames.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', py: 6 }}>
            Classificação ainda não disponível.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 1, md: 3 } }}>
            {groupNames.map(g => (
              <StandingTable key={g} groupName={g} entries={groups[g]} compact={false} />
            ))}
          </Box>
        )
      ) : (
        <KnockoutBracket matches={knockoutMatches} compact={false} />
      )}
    </Box>
  )
}
