'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import { deleteQuickPool, type QuickMatch, type QuickParticipant, type QuickPrediction, type PoolType } from '../actions'
import { translateTeam } from '@/lib/teamTranslations'

function getMatchWinner(m: QuickMatch): 'home' | 'draw' | 'away' | null {
  if (m.status !== 'completed' || m.home_score == null || m.away_score == null) return null
  if (m.home_pen_score != null && m.away_pen_score != null) {
    return m.home_pen_score > m.away_pen_score ? 'home' : 'away'
  }
  if (m.home_score > m.away_score) return 'home'
  if (m.home_score < m.away_score) return 'away'
  return 'draw'
}

function calcScore(pred: QuickPrediction, match: QuickMatch, poolType: PoolType): number {
  const actual = getMatchWinner(match)
  if (!actual) return 0

  if (poolType === 'exact') {
    // 1 pt só se acertar o placar exato
    return pred.home_score_pred === match.home_score && pred.away_score_pred === match.away_score ? 1 : 0
  }

  // 'winner': 1 pt vencedor correto
  return pred.predicted_winner === actual ? 1 : 0
}

function MatchDateLabel(match: QuickMatch) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(match.match_date))
}

const WINNER_LABELS: Record<string, string> = { home: 'C', draw: 'E', away: 'F' }
const WINNER_COLORS: Record<string, string> = { home: '#C9940A', draw: 'rgba(255,255,255,0.6)', away: '#60a5fa' }

export default function QuickPoolDetailClient({
  pool, participants, predictions, matches,
}: {
  pool: any
  participants: QuickParticipant[]
  predictions: QuickPrediction[]
  matches: QuickMatch[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const poolType: PoolType = pool.type || 'winner'

  // Build lookup: predMap[participantId][matchId] = prediction
  const predMap: Record<string, Record<string, QuickPrediction>> = {}
  for (const p of predictions) {
    if (!predMap[p.participant_id]) predMap[p.participant_id] = {}
    predMap[p.participant_id][p.match_id] = p
  }

  // Calculate total scores
  const scores: Record<string, number> = {}
  for (const participant of participants) {
    let pts = 0
    for (const m of matches) {
      const pred = predMap[participant.id]?.[m.id]
      if (pred) pts += calcScore(pred, m, poolType)
    }
    scores[participant.id] = pts
  }

  const completedCount = matches.filter(m => m.status === 'completed').length
  const sortedParticipants = [...participants].sort((a, b) => scores[b.id] - scores[a.id])

  const maxPtsPerMatch = 1
  const maxPossible = completedCount * maxPtsPerMatch

  function handleDelete() {
    setDeleteError(null)
    setConfirmDelete(true)
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      try {
        await deleteQuickPool(pool.id)
        router.push('/dashboard/quick-pool')
      } catch {
        setDeleteError('Erro ao excluir bolão. Tente novamente.')
        setConfirmDelete(false)
      }
    })
  }

  return (
    <>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography sx={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>{pool.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              {matches.length} jogo(s) • {participants.length} participante(s) • {completedCount}/{matches.length} finalizado(s)
            </Typography>
            <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: poolType === 'exact' ? 'rgba(96,165,250,0.1)' : 'rgba(201,148,10,0.1)', border: `1px solid ${poolType === 'exact' ? 'rgba(96,165,250,0.3)' : 'rgba(201,148,10,0.3)'}` }}>
              <Typography sx={{ color: poolType === 'exact' ? '#60a5fa' : '#C9940A', fontSize: 11, fontWeight: 700 }}>
                {poolType === 'exact' ? 'Placar Exato' : 'Resultado'}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Button
          onClick={handleDelete}
          disabled={isPending}
          startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
          size="small"
          variant="outlined"
          sx={{ color: 'rgba(220,38,38,0.6)', borderColor: 'rgba(220,38,38,0.3)', textTransform: 'none', fontSize: 12, flexShrink: 0, '&:hover': { color: '#f87171', bgcolor: 'rgba(220,38,38,0.08)' } }}
        >
          Excluir
        </Button>
      </Box>

      {/* Classificação */}
      {completedCount > 0 && (
        <Box sx={{ mb: 4, bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, p: 2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>
            Classificação
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sortedParticipants.map((p, i) => {
              const pts = scores[p.id]
              const isFirst = i === 0 && pts > 0
              return (
                <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, borderRadius: 1.5, bgcolor: isFirst ? 'rgba(201,148,10,0.08)' : 'transparent' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ color: isFirst ? '#C9940A' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, width: 18 }}>{i + 1}</Typography>
                    <Typography sx={{ color: isFirst ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: isFirst ? 700 : 500 }}>{p.name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ color: isFirst ? '#C9940A' : 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 800 }}>{pts}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>/ {maxPossible} pts</Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Abas por participante */}
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        {/* Tab headers */}
        <Box sx={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)', '&::-webkit-scrollbar': { display: 'none' } }}>
          {sortedParticipants.map((p, i) => {
            const isActive = activeTab === i
            const pts = scores[p.id]
            return (
              <Box
                key={p.id}
                onClick={() => setActiveTab(i)}
                sx={{
                  px: 2, py: 1.5, cursor: 'pointer', flexShrink: 0,
                  borderBottom: `2px solid ${isActive ? '#C9940A' : 'transparent'}`,
                  bgcolor: isActive ? 'rgba(201,148,10,0.06)' : 'transparent',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                  display: 'flex', alignItems: 'center', gap: 1,
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: isActive ? '#C9940A' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                  {p.name}
                </Typography>
                {completedCount > 0 && (
                  <Box sx={{ px: 0.75, py: 0.1, borderRadius: 1, bgcolor: pts > 0 ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.05)' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: pts > 0 ? '#C9940A' : 'rgba(255,255,255,0.25)' }}>
                      {pts}pt
                    </Typography>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>

        {/* Tab content */}
        {(() => {
          const participant = sortedParticipants[activeTab]
          if (!participant) return null
          return (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {matches.map(m => {
                const pred = predMap[participant.id]?.[m.id]
                const actual = getMatchWinner(m)
                const pts = pred ? calcScore(pred, m, poolType) : 0
                const isCorrect = actual != null && pts === 1
                const isWrong = actual != null && pred != null && pts === 0
                const isCompleted = m.status === 'completed'

                return (
                  <Box key={m.id} sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    p: 1.5, borderRadius: 2,
                    bgcolor: isCorrect ? 'rgba(99,202,132,0.06)' : isWrong ? 'rgba(255,80,80,0.05)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCorrect ? 'rgba(99,202,132,0.2)' : isWrong ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <Box>
                      <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                        {m.home_team_code} × {m.away_team_code}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, mt: 0.25 }}>
                        {isCompleted && m.home_score != null
                          ? `Placar: ${m.home_score}–${m.away_score}${m.home_pen_score != null ? ` (pen ${m.home_pen_score}–${m.away_pen_score})` : ''}`
                          : MatchDateLabel(m) + 'h'
                        }
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Palpite */}
                      {poolType === 'exact' ? (
                        pred?.home_score_pred != null ? (
                          <Box sx={{
                            px: 1.25, py: 0.4, borderRadius: 1,
                            bgcolor: isCorrect ? 'rgba(99,202,132,0.15)' : isWrong ? 'rgba(255,80,80,0.1)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${isCorrect ? 'rgba(99,202,132,0.35)' : isWrong ? 'rgba(255,80,80,0.25)' : 'rgba(255,255,255,0.1)'}`,
                          }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: isCorrect ? '#63ca84' : isWrong ? '#ff6b6b' : 'rgba(255,255,255,0.6)' }}>
                              {pred.home_score_pred}–{pred.away_score_pred}
                            </Typography>
                          </Box>
                        ) : <Typography sx={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>—</Typography>
                      ) : (
                        pred?.predicted_winner ? (
                          <Box sx={{
                            width: 34, height: 28, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: isCorrect ? 'rgba(99,202,132,0.15)' : isWrong ? 'rgba(255,80,80,0.1)' : `${WINNER_COLORS[pred.predicted_winner]}18`,
                            border: `1px solid ${isCorrect ? 'rgba(99,202,132,0.35)' : isWrong ? 'rgba(255,80,80,0.25)' : `${WINNER_COLORS[pred.predicted_winner]}44`}`,
                          }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: isCorrect ? '#63ca84' : isWrong ? '#ff6b6b' : WINNER_COLORS[pred.predicted_winner] }}>
                              {WINNER_LABELS[pred.predicted_winner]}
                            </Typography>
                          </Box>
                        ) : <Typography sx={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>—</Typography>
                      )}

                      {/* Resultado */}
                      {isCorrect && <Typography sx={{ fontSize: 16 }}>✓</Typography>}
                      {isWrong && <Typography sx={{ fontSize: 16, color: 'rgba(255,80,80,0.6)' }}>✗</Typography>}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )
        })()}
      </Box>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ backgroundColor: '#1a1a19', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.12)', border: '0.5px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 3.5h16M6.5 3.5V2a1 1 0 011-1h5a1 1 0 011 1v1.5M4 3.5l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: '#fff' }}>Excluir bolão rápido</p>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Tem certeza que deseja excluir <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{pool.name}</strong>?
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              Todos os participantes, palpites e pontuações serão perdidos permanentemente.
            </p>

            {deleteError && (
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#f87171', backgroundColor: 'rgba(220,38,38,0.1)', border: '0.5px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '8px 12px' }}>
                {deleteError}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                style={{ flex: 1, padding: '10px', background: 'none', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.6)', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                style={{ flex: 1, padding: '10px', background: 'rgba(220,38,38,0.15)', border: '0.5px solid rgba(220,38,38,0.4)', borderRadius: 10, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, color: '#f87171', transition: 'all 0.15s', opacity: isPending ? 0.6 : 1 }}
                onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.25)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.15)' }}
              >
                {isPending ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
        , document.body)}
    </>
  )
}
