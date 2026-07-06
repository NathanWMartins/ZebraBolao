'use client'

import React, { useState, useEffect, useId } from 'react'
import { Box, Typography, Avatar } from '@mui/material'
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
  home_pen_score?: number | null
  away_pen_score?: number | null
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

// Rodadas principais da chave (o 3° lugar é renderizado à parte)
const ROUND_MAIN = ['r32', 'r16', 'qf', 'sf', 'final']

const ROUND_LABELS: Record<string, string> = {
  r32: '16avos de Final',
  r16: 'Oitavas de Final',
  qf: 'Quartas de Final',
  sf: 'Semifinal',
  final: 'Final',
  third: '3° Lugar',
}

type Slot = KnockoutMatch | null

const LIVE_STATUSES = ['live', 'in_play', 'playing', 'halftime', 'delayed']

function getWinnerSide(m: KnockoutMatch): 'home' | 'away' | null {
  if (m.status !== 'completed' || m.home_score === null || m.away_score === null) return null
  const hasPen = m.home_pen_score != null && m.away_pen_score != null
  if (hasPen && m.home_pen_score !== m.away_pen_score) return m.home_pen_score! > m.away_pen_score! ? 'home' : 'away'
  if (m.home_score > m.away_score) return 'home'
  if (m.away_score > m.home_score) return 'away'
  return null
}

function matchHasTeam(m: KnockoutMatch, team: string | null, code: string | null): boolean {
  if (team && (m.home_team === team || m.away_team === team)) return true
  if (code && (m.home_team_code === code || m.away_team_code === code)) return true
  return false
}

function fmtDate(d: string): string {
  const dt = new Date(d)
  return `${dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h`
}

/**
 * Ordem fixa do R32 (16avos) — home_team de cada jogo na posição correta da chave.
 * Slots 0-7 = Lado A, Slots 8-15 = Lado B.
 */
const R32_BRACKET_ORDER: string[] = [
  // Lado A
  'South Africa',   // 0: Africa do Sul x Canada
  'Netherlands',    // 1: Holanda x Marrocos
  'Germany',        // 2: Alemanha x Paraguai
  'France',         // 3: França x Suécia
  'Belgium',        // 4: Bélgica x Senegal
  'USA',            // 5: EUA x Bósnia (nome no banco é "USA")
  'Spain',          // 6: Espanha x Áustria
  'Portugal',       // 7: Portugal x Croácia
  // Lado B
  'Brazil',         // 8: Brasil x Japão
  "Côte d'Ivoire",  // 9: Costa do Marfim x Noruega (nome no banco é "Côte d'Ivoire")
  'Mexico',         // 10: México x Equador
  'England',        // 11: Inglaterra x Congo
  'Switzerland',    // 12: Suíça x Argélia
  'Colombia',       // 13: Colômbia x Gana
  'Australia',      // 14: Austrália x Egito
  'Argentina',      // 15: Argentina x Cabo Verde
]

/**
 * Ordena cada rodada em slots de chave: os filhos 2s e 2s+1 alimentam o slot s
 * da rodada seguinte.
 * O R32 usa ordem fixa (hardcoded). As rodadas seguintes vinculam pelo time
 * que avançou; caso contrário preenchem na ordem cronológica.
 */
function buildOrderedRounds(byRound: Record<string, KnockoutMatch[]>, seq: string[]): Record<string, Slot[]> {
  const ordered: Record<string, Slot[]> = {}

  // ── R32: ordem fixa pelo home_team ──
  if (seq[0] === 'r32' && byRound['r32']?.length) {
    const pool = [...byRound['r32']]
    const slots: Slot[] = new Array(R32_BRACKET_ORDER.length).fill(null)

    for (let i = 0; i < R32_BRACKET_ORDER.length; i++) {
      const homeTeam = R32_BRACKET_ORDER[i]
      const idx = pool.findIndex(m =>
        m.home_team === homeTeam ||
        m.home_team_code === homeTeam ||
        m.away_team === homeTeam ||
        m.away_team_code === homeTeam
      )
      if (idx >= 0) {
        slots[i] = pool[idx]
        pool.splice(idx, 1)
      }
    }
    // Preenche slots restantes com jogos não mapeados
    for (let i = 0; i < slots.length && pool.length > 0; i++) {
      if (!slots[i]) slots[i] = pool.shift()!
    }
    ordered['r32'] = slots
  }

  // ── Rodadas seguintes (R16, QF, SF, Final): forward-matching por vencedor ──
  // Se R32 não existe, usa backward-matching original como fallback
  if (!ordered['r32']) {
    const last = seq[seq.length - 1]
    ordered[last] = [byRound[last]?.[0] ?? null]

    for (let j = seq.length - 2; j >= 0; j--) {
      const key = seq[j]
      const parents = ordered[seq[j + 1]]
      const pool = [...(byRound[key] ?? [])]
      const slots: Slot[] = new Array(parents.length * 2).fill(null)

      parents.forEach((parent, p) => {
        if (!parent) return
        const sides = [
          { team: parent.home_team, code: parent.home_team_code, slot: p * 2 },
          { team: parent.away_team, code: parent.away_team_code, slot: p * 2 + 1 },
        ]
        for (const side of sides) {
          const idx = pool.findIndex(m => matchHasTeam(m, side.team, side.code))
          if (idx >= 0) {
            slots[side.slot] = pool[idx]
            pool.splice(idx, 1)
          }
        }
      })

      for (let sIdx = 0; sIdx < slots.length && pool.length > 0; sIdx++) {
        if (!slots[sIdx]) slots[sIdx] = pool.shift()!
      }
      ordered[key] = slots
    }
    return ordered
  }

  // Forward: a partir do R32, cada par de jogos alimenta o slot da rodada seguinte.
  // Duas passadas: 1) vincula por vencedor, 2) preenche vazios cronologicamente.
  // Isso evita que o fallback cronológico "roube" jogos de slots que ainda não foram processados.
  for (let j = 1; j < seq.length; j++) {
    const key = seq[j]
    const children = ordered[seq[j - 1]]
    if (!children) continue

    const expectedSlots = Math.ceil(children.length / 2)
    const pool = [...(byRound[key] ?? [])]
    const slots: Slot[] = new Array(expectedSlots).fill(null)

    // Passada 1: vincula TODOS os slots que têm vencedores primeiro
    for (let s = 0; s < expectedSlots; s++) {
      const child0 = children[s * 2]
      const child1 = children[s * 2 + 1]
      const winners: string[] = []
      const winnerCodes: string[] = []

      for (const child of [child0, child1]) {
        if (!child) continue
        const win = getWinnerSide(child)
        if (win === 'home' && child.home_team) { winners.push(child.home_team); if (child.home_team_code) winnerCodes.push(child.home_team_code) }
        if (win === 'away' && child.away_team) { winners.push(child.away_team); if (child.away_team_code) winnerCodes.push(child.away_team_code) }
      }

      for (const w of winners) {
        const idx = pool.findIndex(m => matchHasTeam(m, w, null))
        if (idx >= 0) {
          slots[s] = pool[idx]
          pool.splice(idx, 1)
          break
        }
      }
      if (!slots[s] && winnerCodes.length > 0) {
        for (const wc of winnerCodes) {
          const idx = pool.findIndex(m => matchHasTeam(m, null, wc))
          if (idx >= 0) {
            slots[s] = pool[idx]
            pool.splice(idx, 1)
            break
          }
        }
      }
    }

    // Passada 2: também tenta vincular por times do próximo round (home/away do match da próxima rodada)
    // que possam aparecer nos filhos mesmo sem status completed
    for (let s = 0; s < expectedSlots; s++) {
      if (slots[s]) continue
      const child0 = children[s * 2]
      const child1 = children[s * 2 + 1]
      const teamNames: string[] = []
      const teamCodes: string[] = []

      for (const child of [child0, child1]) {
        if (!child) continue
        if (child.home_team) teamNames.push(child.home_team)
        if (child.away_team) teamNames.push(child.away_team)
        if (child.home_team_code) teamCodes.push(child.home_team_code)
        if (child.away_team_code) teamCodes.push(child.away_team_code)
      }

      for (const t of teamNames) {
        const idx = pool.findIndex(m => matchHasTeam(m, t, null))
        if (idx >= 0) {
          slots[s] = pool[idx]
          pool.splice(idx, 1)
          break
        }
      }
      if (!slots[s]) {
        for (const tc of teamCodes) {
          const idx = pool.findIndex(m => matchHasTeam(m, null, tc))
          if (idx >= 0) {
            slots[s] = pool[idx]
            pool.splice(idx, 1)
            break
          }
        }
      }
    }

    // Passada 3: preenche slots restantes cronologicamente
    pool.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    for (let s = 0; s < slots.length && pool.length > 0; s++) {
      if (!slots[s]) slots[s] = pool.shift()!
    }
    ordered[key] = slots
  }

  return ordered
}

// Linha de um time dentro do BracketCard
function TeamRow({ team, score, won, compact }: { team: string | null, score: number | null, won: boolean, compact: boolean }) {
  const flagSize = compact ? 18 : 22
  return (
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
}

// Card de um confronto (usado para o jogo de 3° lugar)
function BracketCard({ match, compact }: { match: KnockoutMatch | null, compact: boolean }) {
  const isLive = match ? LIVE_STATUSES.includes(match.status) : false
  const isCompleted = match?.status === 'completed'

  const hasPen = match?.home_pen_score != null && match?.away_pen_score != null
  const homeWon = isCompleted && match && match.home_score !== null && match.away_score !== null &&
    (hasPen ? (match.home_pen_score! > match.away_pen_score!) : match.home_score > match.away_score)
  const awayWon = isCompleted && match && match.home_score !== null && match.away_score !== null &&
    (hasPen ? (match.away_pen_score! > match.home_pen_score!) : match.away_score > match.home_score)

  return (
    <Box sx={{
      border: `1px solid ${isLive ? 'rgba(253,64,64,0.4)' : isCompleted ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '8px',
      bgcolor: isLive ? 'rgba(253,64,64,0.04)' : 'rgba(255,255,255,0.02)',
      px: compact ? 1 : 1.25,
      py: compact ? 0.25 : 0.25,
      width: '100%',
    }}>
      <TeamRow team={match?.home_team ?? null} score={match?.home_score ?? null} won={!!homeWon} compact={compact} />
      <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.05)' }} />
      <TeamRow team={match?.away_team ?? null} score={match?.away_score ?? null} won={!!awayWon} compact={compact} />
      {hasPen && (
        <Typography sx={{ color: '#ffcc44', fontSize: compact ? 8 : 9, fontWeight: 700, textAlign: 'right', mt: 0.25 }}>
          pen {match!.home_pen_score} x {match!.away_pen_score}
        </Typography>
      )}
      {match && (
        <Typography sx={{ color: isLive ? '#fd4040' : 'rgba(255,255,255,0.2)', fontSize: compact ? 8 : 9, fontWeight: 600, textAlign: 'right', mt: 0.25 }}>
          {isLive ? '● AO VIVO' : fmtDate(match.match_date)}
        </Typography>
      )}
    </Box>
  )
}

// ─── Bracket Radial ───────────────────────────────────────────────────────────

function KnockoutBracket({ matches, compact }: { matches: KnockoutMatch[], compact: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

  // Anima a entrada: bandeiras avançadas deslizam da posição anterior até o nó atual
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 80)
    return () => window.clearTimeout(t)
  }, [])

  // Confronto selecionado (toque/clique) — detalhes aparecem num card abaixo
  const [selected, setSelected] = useState<Slot>(null)
  const toggleSelect = (m: KnockoutMatch) =>
    setSelected(prev => (prev?.id === m.id ? null : m))

  // Agrupa por rodada
  const byRound: Record<string, KnockoutMatch[]> = {}
  for (const m of matches) {
    const key = getRoundKey(m.round)
    if (!byRound[key]) byRound[key] = []
    byRound[key].push(m)
  }

  const firstIdx = ROUND_MAIN.findIndex(r => (byRound[r]?.length ?? 0) > 0)

  if (matches.length === 0 || firstIdx === -1) {
    return (
      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', py: 6 }}>
        Chave do mata-mata ainda não disponível.
      </Typography>
    )
  }

  const seq = ROUND_MAIN.slice(firstIdx)
  const ordered = buildOrderedRounds(byRound, seq)
  const levels = seq.length
  const leaves = ordered[seq[0]].length * 2

  const finalMatch = ordered[seq[levels - 1]][0]
  const finalWinner = finalMatch ? getWinnerSide(finalMatch) : null
  const champion = finalMatch && finalWinner ? (finalWinner === 'home' ? finalMatch.home_team : finalMatch.away_team) : null
  const thirdMatch = byRound['third']?.[0] ?? null

  // ── Geometria (viewBox 1000×1000, centro em 500) ──
  const C = 500
  const s = compact ? 1.4 : 1
  const flagR = 26 * s
  const ringR = 492 - flagR                 // raio do anel de bandeiras
  const outerNodeR = ringR - flagR - 36     // raio dos nós da rodada mais externa
  const innerNodeR = 130
  const nodeR = (j: number) =>
    j === levels - 1 ? 0 : levels === 2 ? outerNodeR : outerNodeR - j * ((outerNodeR - innerNodeR) / (levels - 2))

  const rad = (deg: number) => (deg * Math.PI) / 180
  const leafAngle = (i: number) => rad(-90 + (i + 0.5) * (360 / leaves))
  const slotAngle = (j: number, slot: number) => rad(-90 + (slot + 0.5) * (360 / ordered[seq[j]].length))
  const pt = (r: number, a: number): [number, number] => [C + r * Math.cos(a), C + r * Math.sin(a)]

  const STUB = 62
  // Animação em revezamento: cada rodada dura STEP ms e começa exatamente
  // quando a anterior termina, encadeando o avanço desde o anel externo.
  const STEP = 700
  const stepDelay = (j: number) => 250 + j * STEP
  // Posição do "pai": a final vira dois pontos horizontais ao lado do troféu
  const parentPt = (j: number, slot: number, childAngle: number): [number, number] => {
    if (j === levels - 1) return [C + (Math.cos(childAngle) >= 0 ? STUB : -STUB), C]
    return pt(nodeR(j), slotAngle(j, slot))
  }

  const lineStroke = 'rgba(255,255,255,0.16)'
  const lines: React.ReactNode[] = []
  const dots: React.ReactNode[] = []
  const advanced: React.ReactNode[] = []
  const flags: React.ReactNode[] = []

  // Linhas bandeira → primeiro nó
  for (let i = 0; i < leaves; i++) {
    const a = leafAngle(i)
    const [x1, y1] = pt(ringR, a)
    const [x2, y2] = levels === 1 ? parentPt(0, 0, a) : pt(nodeR(0), slotAngle(0, i >> 1))
    lines.push(<line key={`lf${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineStroke} strokeWidth={2} />)
  }

  // Nós, linhas entre rodadas e vencedores avançando
  for (let j = 0; j < levels; j++) {
    ordered[seq[j]].forEach((m, slot) => {
      const isFinalRound = j === levels - 1
      const a = slotAngle(j, slot)
      const [x, y] = isFinalRound ? [C, C] : pt(nodeR(j), a)
      const tooltip = m
        ? `${m.home_team ? translateTeam(m.home_team) : 'A definir'} x ${m.away_team ? translateTeam(m.away_team) : 'A definir'} — ${fmtDate(m.match_date)}`
        : ''

      const live = m ? LIVE_STATUSES.includes(m.status) : false
      const hasPen = m?.home_pen_score != null && m?.away_pen_score != null
      const scoreLabel = m && m.home_score !== null && m.away_score !== null
        ? `${m.home_score}–${m.away_score}${hasPen ? ` p${m.home_pen_score}–${m.away_pen_score}` : ''}`
        : null

      if (isFinalRound) {
        dots.push(
          <circle key="stubL" cx={C - STUB} cy={C} r={4.5} fill={m ? '#C9940A' : 'rgba(255,255,255,0.14)'} />,
          <circle key="stubR" cx={C + STUB} cy={C} r={4.5} fill={m ? '#C9940A' : 'rgba(255,255,255,0.14)'} />,
        )
        // Placar da final abaixo do troféu
        if (scoreLabel) {
          advanced.push(
            <g key="finalscore">
              <title>{tooltip}</title>
              <text x={C} y={C + 97} textAnchor="middle" dominantBaseline="central"
                fill={live ? '#fd4040' : '#C9940A'} fontSize={16 * s} fontWeight={800}>{scoreLabel}</text>
            </g>
          )
        }
      } else {
        const [px, py] = parentPt(j + 1, slot >> 1, a)
        lines.push(<line key={`ln${j}-${slot}`} x1={x} y1={y} x2={px} y2={py} stroke={lineStroke} strokeWidth={2} />)

        const winSide = m ? getWinnerSide(m) : null
        const winTeam = m && winSide ? (winSide === 'home' ? m.home_team : m.away_team) : null

        if (winTeam) {
          // Vencedor avança: bandeira ocupa o nó do próximo confronto
          const advR = flagR * 0.82
          const clipId = `${uid}a${j}x${slot}`
          const badgeW = (scoreLabel!.length * 6 + 12) * s
          const badgeH = 15 * s

          // Origem da animação: de onde o time veio (anel externo ou nó anterior)
          let ox = x, oy = y
          if (j === 0) {
            const leafIdx = winSide === 'home' ? slot * 2 : slot * 2 + 1
            ;[ox, oy] = pt(ringR, leafAngle(leafIdx))
          } else {
            const winCode = winSide === 'home' ? m!.home_team_code : m!.away_team_code
            const prev = ordered[seq[j - 1]]
            let childSlot = slot * 2
            const inFirst = prev[slot * 2] && matchHasTeam(prev[slot * 2]!, winTeam, winCode)
            if (!inFirst && prev[slot * 2 + 1] && matchHasTeam(prev[slot * 2 + 1]!, winTeam, winCode)) {
              childSlot = slot * 2 + 1
            }
            ;[ox, oy] = pt(nodeR(j - 1), slotAngle(j - 1, childSlot))
          }

          advanced.push(
            <g
              key={`adv${j}-${slot}`}
              onClick={() => toggleSelect(m!)}
              style={{
                cursor: 'pointer',
                // Invisível até a etapa anterior terminar: a bandeira "surge"
                // sobre o nó onde o time acabou de chegar e segue adiante
                opacity: entered ? 1 : 0,
                transform: entered ? 'translate(0px, 0px)' : `translate(${ox - x}px, ${oy - y}px)`,
                transition: `transform ${STEP}ms cubic-bezier(0.25, 0.8, 0.3, 1) ${stepDelay(j)}ms, opacity 0ms linear ${stepDelay(j)}ms`,
              }}
            >
              <title>{tooltip}</title>
              <clipPath id={clipId}><circle cx={x} cy={y} r={advR} /></clipPath>
              <image href={getFlagUrl(winTeam, 80)} x={x - advR} y={y - advR} width={advR * 2} height={advR * 2}
                preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
              <circle cx={x} cy={y} r={advR} fill="none" stroke="#C9940A" strokeWidth={2} />
              {/* Placar em selo na borda inferior da bandeira (só no desktop;
                  no mobile o placar aparece tocando no confronto) */}
              {!compact ? (
                <>
                  <rect x={x - badgeW / 2} y={y + advR - badgeH / 2} width={badgeW} height={badgeH} rx={badgeH / 2}
                    fill="#151515" stroke="rgba(201,148,10,0.55)" strokeWidth={1} />
                  <text x={x} y={y + advR} textAnchor="middle" dominantBaseline="central"
                    fill="rgba(255,255,255,0.85)" fontSize={9.5 * s} fontWeight={800}>{scoreLabel}</text>
                </>
              ) : null}
            </g>
          )
        } else {
          dots.push(
            <g
              key={`nd${j}-${slot}`}
              onClick={m ? () => toggleSelect(m) : undefined}
              style={m ? { cursor: 'pointer' } : undefined}
            >
              {m ? <title>{tooltip}</title> : null}
              <circle cx={x} cy={y} r={live ? 6.5 : 5} fill={live ? '#fd4040' : m ? '#C9940A' : 'rgba(255,255,255,0.14)'}>
                {live ? <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" /> : null}
              </circle>
            </g>
          )
        }
      }
    })
  }

  // Bandeiras no anel externo
  ordered[seq[0]].forEach((m, slot) => {
    const win = m ? getWinnerSide(m) : null
    const sides = [
      { team: m?.home_team ?? null, leaf: slot * 2, won: win === 'home', lost: win === 'away' },
      { team: m?.away_team ?? null, leaf: slot * 2 + 1, won: win === 'away', lost: win === 'home' },
    ]
    for (const sd of sides) {
      const a = leafAngle(sd.leaf)
      const [x, y] = pt(ringR, a)
      if (sd.team) {
        const clipId = `${uid}f${sd.leaf}`
        flags.push(
          <g
            key={`fl${sd.leaf}`}
            opacity={sd.lost ? 0.4 : 1}
            onClick={m ? () => toggleSelect(m) : undefined}
            style={m ? { cursor: 'pointer' } : undefined}
          >
            <title>{translateTeam(sd.team)}</title>
            <clipPath id={clipId}><circle cx={x} cy={y} r={flagR} /></clipPath>
            <image href={getFlagUrl(sd.team, 80)} x={x - flagR} y={y - flagR} width={flagR * 2} height={flagR * 2}
              preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
            <circle cx={x} cy={y} r={flagR} fill="none"
              stroke={sd.won ? '#C9940A' : 'rgba(255,255,255,0.25)'} strokeWidth={sd.won ? 3 : 1.5} />
          </g>
        )
      } else {
        flags.push(
          <circle key={`fl${sd.leaf}`} cx={x} cy={y} r={flagR} fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeDasharray="5 5" />
        )
      }
    }
  })

  // Troféu no centro — silhueta da taça da Copa: globo no topo sustentado
  // por dois braços, cintura estreita e base com a faixa verde de malaquita
  const gold = `url(#${uid}gold)`
  const trophy = (
    <g>
      {/* Corpo: braços envolvem o globo, afunilam na cintura e alargam no pé */}
      <path
        d="M462 434
            C468 452 482 464 500 470
            C518 464 532 452 538 434
            C542 452 528 476 521 498
            C518 510 517 526 532 548
            L468 548
            C483 526 482 510 479 498
            C472 476 458 452 462 434
           Z"
        fill={gold}
      />
      {/* Globo maior, apoiado sobre os braços */}
      <circle cx={C} cy={428} r={45} fill={gold} />
      <path d="M474 412 Q500 400 526 412 M470 436 Q500 448 530 436 M500 395 Q485 428 500 461"
        fill="none" stroke="#7A5E12" strokeWidth={1.5} opacity={0.45} />
      {/* Base com faixa verde */}
      <rect x={467} y={546} width={66} height={8} rx={3} fill={gold} />
      <rect x={462} y={554} width={76} height={14} rx={4} fill="#0E6B45" stroke="#8F6E14" strokeWidth={1} />
      <rect x={458} y={568} width={84} height={9} rx={3.5} fill={gold} />
    </g>
  )

  // Campeão (bandeira acima do troféu quando a final termina)
  let championEl: React.ReactNode = null
  if (champion) {
    const cy2 = 350
    const r2 = 30 * s
    const clipId = `${uid}champ`
    championEl = (
      <g style={{
        opacity: entered ? 1 : 0,
        transition: `opacity 700ms ease ${stepDelay(levels)}ms`,
      }}>
        <text x={C} y={cy2 - r2 - 14} textAnchor="middle" fill="#C9940A" fontSize={13 * s} fontWeight={800} letterSpacing="2">
          CAMPEÃO
        </text>
        <clipPath id={clipId}><circle cx={C} cy={cy2} r={r2} /></clipPath>
        <image href={getFlagUrl(champion, 160)} x={C - r2} y={cy2 - r2} width={r2 * 2} height={r2 * 2}
          preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
        <circle cx={C} cy={cy2} r={r2} fill="none" stroke="#C9940A" strokeWidth={3} />
      </g>
    )
  }

  return (
    <Box>
      <Box sx={{ maxWidth: compact ? 460 : 660, mx: 'auto' }}>
        <svg viewBox="0 0 1000 1000" width="100%" style={{ display: 'block' }} fontFamily="inherit">
          <defs>
            <linearGradient id={`${uid}gold`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0D078" />
              <stop offset="100%" stopColor="#8F6E14" />
            </linearGradient>
          </defs>
          {lines}
          {dots}
          {trophy}
          {championEl}
          {flags}
          {advanced}
        </svg>
      </Box>

      {selected ? (
        <Box sx={{ maxWidth: 280, mx: 'auto', mt: compact ? 1.5 : 2 }}>
          <Typography sx={{
            color: '#C9940A', fontSize: compact ? 10 : 11, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', mb: 1,
          }}>
            {ROUND_LABELS[getRoundKey(selected.round)] ?? selected.round}
          </Typography>
          <BracketCard match={selected} compact={compact} />
        </Box>
      ) : compact ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center', mt: 1.5 }}>
          Toque em um confronto para ver os detalhes
        </Typography>
      ) : null}

      {thirdMatch ? (
        <Box sx={{ maxWidth: 260, mx: 'auto', mt: compact ? 2 : 3 }}>
          <Typography sx={{
            color: 'rgba(255,255,255,0.4)', fontSize: compact ? 9 : 11, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', mb: 1,
          }}>
            3° Lugar
          </Typography>
          <BracketCard match={thirdMatch} compact={compact} />
        </Box>
      ) : null}
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
