'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckIcon from '@mui/icons-material/Check'
import BoltIcon from '@mui/icons-material/Bolt'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import { createQuickPool, type QuickMatch, type PoolType, type WinnerPredictions, type ExactPredictions } from '../actions'
import { translateTeam } from '@/lib/teamTranslations'

const STEPS = ['Nome & Tipo', 'Jogos', 'Participantes', 'Palpites']

function StepIndicator({ current }: { current: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
      {STEPS.map((label, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: done ? '#C9940A' : active ? 'rgba(201,148,10,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${done || active ? '#C9940A' : 'rgba(255,255,255,0.1)'}`,
              flexShrink: 0,
            }}>
              {done
                ? <CheckIcon sx={{ fontSize: 14, color: '#000' }} />
                : <Typography sx={{ fontSize: 12, fontWeight: 700, color: active ? '#C9940A' : 'rgba(255,255,255,0.3)' }}>{idx}</Typography>
              }
            </Box>
            <Typography sx={{ fontSize: 12, color: active ? '#C9940A' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', display: { xs: active ? 'block' : 'none', sm: 'block' } }}>
              {label}
            </Typography>
            {i < STEPS.length - 1 && <Box sx={{ width: { xs: 12, sm: 24 }, height: 1, bgcolor: 'rgba(255,255,255,0.08)', mx: 0.5 }} />}
          </Box>
        )
      })}
    </Box>
  )
}

function MatchDateLabel(match: QuickMatch) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(match.match_date))
}

function WinnerBtn({ label, selected, onClick, color }: { label: string; selected: boolean; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 8px', borderRadius: 5,
      border: `1px solid ${selected ? color : 'rgba(255,255,255,0.1)'}`,
      background: selected ? `${color}22` : 'transparent',
      color: selected ? color : 'rgba(255,255,255,0.35)',
      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', minWidth: 28,
    }}>
      {label}
    </button>
  )
}

function ScoreInput({ value, onChange }: { value: number | ''; onChange: (v: number | '') => void }) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      value={value}
      onChange={e => {
        const n = e.target.value === '' ? '' : parseInt(e.target.value)
        onChange(n as number | '')
      }}
      style={{
        width: 36, height: 28, textAlign: 'center', borderRadius: 5, fontSize: 13, fontWeight: 700,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff', outline: 'none',
      }}
    />
  )
}

export default function QuickPoolCreateClient({ matches }: { matches: QuickMatch[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [name, setName] = useState('')
  const [poolType, setPoolType] = useState<PoolType>('winner')

  // Step 2
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Step 3
  const [participants, setParticipants] = useState<string[]>([''])

  // Step 4
  const [winnerPreds, setWinnerPreds] = useState<WinnerPredictions>({})
  const [exactPreds, setExactPreds] = useState<ExactPredictions>({})
  const [participantIdx, setParticipantIdx] = useState(0)

  const selectedMatches = matches.filter(m => selectedIds.includes(m.id))
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
  const validParticipants = [...new Set(participants.map(p => p.trim()).filter(Boolean))]

  function toggleMatch(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function setWinnerPred(p: string, matchId: string, winner: 'home' | 'draw' | 'away') {
    setWinnerPreds(prev => ({ ...prev, [p]: { ...(prev[p] || {}), [matchId]: winner } }))
  }

  function setExactPred(p: string, matchId: string, side: 'home' | 'away', val: number | '') {
    setExactPreds(prev => {
      const curr = prev[p]?.[matchId] || { home: 0, away: 0 }
      return { ...prev, [p]: { ...(prev[p] || {}), [matchId]: { ...curr, [side]: val === '' ? 0 : val } } }
    })
  }

  function canGoNext() {
    if (step === 1) return name.trim().length >= 2
    if (step === 2) return selectedIds.length >= 1
    if (step === 3) return validParticipants.length >= 1
    return true
  }

  function goBack() {
    if (step > 1) setStep(s => s - 1)
    else router.back()
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        const id = await createQuickPool({
          name: name.trim(),
          type: poolType,
          matchIds: selectedIds,
          participants: validParticipants,
          winnerPredictions: winnerPreds,
          exactPredictions: exactPreds,
        })
        router.push(`/dashboard/quick-pool/${id}`)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  // Group matches by date
  const matchesByDate: Record<string, QuickMatch[]> = {}
  for (const m of matches) {
    const key = new Date(m.match_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    if (!matchesByDate[key]) matchesByDate[key] = []
    matchesByDate[key].push(m)
  }

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 2, md: 0 }, pb: 14 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={goBack} sx={{ color: 'rgba(255,255,255,0.5)', p: 0.5 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>Novo Bolão Rápido</Typography>
      </Box>

      <StepIndicator current={step} />

      {/* ── Step 1: Nome + Tipo ── */}
      {step === 1 && (
        <Box>
          <Typography sx={{ color: '#fff', fontSize: 18, fontWeight: 700, mb: 1 }}>Nome do bolão</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mb: 2 }}>Ex: "Família Copa", "Amigos do Trabalho"</Typography>
          <TextField
            fullWidth autoFocus
            placeholder="Nome do bolão"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canGoNext() && setStep(2)}
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': {
                color: '#fff', fontSize: 16,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#C9940A' },
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.25)' },
            }}
          />

          <Typography sx={{ color: '#fff', fontSize: 18, fontWeight: 700, mb: 1 }}>Tipo de palpite</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mb: 2 }}>Como os participantes vão palpitar?</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {[
              {
                key: 'winner' as PoolType,
                icon: <BoltIcon sx={{ fontSize: 24 }} />,
                title: 'Resultado',
                desc: 'Quem vence? Casa, Empate ou Fora. 1 ponto por acerto.',
              },
              {
                key: 'exact' as PoolType,
                icon: <SportsSoccerIcon sx={{ fontSize: 24 }} />,
                title: 'Placar Exato',
                desc: 'Placar exato do jogo. 1 ponto se acertar o placar exato.',
              },
            ].map(opt => {
              const active = poolType === opt.key
              return (
                <Box
                  key={opt.key}
                  onClick={() => setPoolType(opt.key)}
                  sx={{
                    p: 2.5, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                    border: `1.5px solid ${active ? '#C9940A' : 'rgba(255,255,255,0.08)'}`,
                    bgcolor: active ? 'rgba(201,148,10,0.08)' : 'rgba(0,0,0,0.3)',
                    '&:hover': { borderColor: active ? '#C9940A' : 'rgba(255,255,255,0.2)' },
                  }}
                >
                  <Box sx={{ color: active ? '#C9940A' : 'rgba(255,255,255,0.4)', mb: 1 }}>{opt.icon}</Box>
                  <Typography sx={{ color: active ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 15, mb: 0.5 }}>{opt.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.4 }}>{opt.desc}</Typography>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* ── Step 2: Jogos ── */}
      {step === 2 && (
        <Box>
          <Typography sx={{ color: '#fff', fontSize: 18, fontWeight: 700, mb: 1 }}>Quais jogos incluir?</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mb: 3 }}>
            {selectedIds.length === 0 ? 'Selecione ao menos 1 jogo' : `${selectedIds.length} jogo(s) selecionado(s)`}
          </Typography>

          {matches.length === 0 ? (
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', py: 4 }}>Nenhum jogo disponível no momento.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Object.entries(matchesByDate).map(([date, dayMatches]) => (
                <Box key={date}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                    {date}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dayMatches.map(m => {
                      const sel = selectedIds.includes(m.id)
                      return (
                        <Box key={m.id} onClick={() => toggleMatch(m.id)} sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          p: 1.5, borderRadius: 2, cursor: 'pointer',
                          border: `1px solid ${sel ? 'rgba(201,148,10,0.5)' : 'rgba(255,255,255,0.07)'}`,
                          bgcolor: sel ? 'rgba(201,148,10,0.08)' : 'rgba(0,0,0,0.3)',
                          transition: 'all 0.15s',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                              border: `2px solid ${sel ? '#C9940A' : 'rgba(255,255,255,0.2)'}`,
                              bgcolor: sel ? '#C9940A' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {sel && <CheckIcon sx={{ fontSize: 12, color: '#000' }} />}
                            </Box>
                            <Box>
                              <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                                {translateTeam(m.home_team)} × {translateTeam(m.away_team)}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                                {MatchDateLabel(m)}h • {m.round === 'group' ? `Grupo ${m.group_name}` : m.round}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Step 3: Participantes ── */}
      {step === 3 && (
        <Box>
          <Typography sx={{ color: '#fff', fontSize: 18, fontWeight: 700, mb: 1 }}>Quem vai participar?</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mb: 3 }}>Adicione o nome de cada pessoa. Enter para adicionar mais.</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            {participants.map((p, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  autoFocus={i === participants.length - 1 && participants.length > 1}
                  placeholder={`Participante ${i + 1}`}
                  value={p}
                  onChange={e => {
                    const next = [...participants]; next[i] = e.target.value; setParticipants(next)
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setParticipants(prev => [...prev, '']) } }}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                      '&.Mui-focused fieldset': { borderColor: '#C9940A' },
                    },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.2)' },
                  }}
                />
                {participants.length > 1 && (
                  <IconButton onClick={() => setParticipants(prev => prev.filter((_, idx) => idx !== i))} size="small" sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#ff6b6b' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
          <Button startIcon={<AddIcon />} onClick={() => setParticipants(prev => [...prev, ''])} sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none', fontSize: 13, '&:hover': { color: '#fff' } }}>
            Adicionar participante
          </Button>
        </Box>
      )}

      {/* ── Step 4: Palpites (participante a participante) ── */}
      {step === 4 && (() => {
        const participant = validParticipants[participantIdx]
        const isLast = participantIdx === validParticipants.length - 1
        const progressPct = ((participantIdx) / validParticipants.length) * 100

        return (
          <Box>
            {/* Cabeçalho do participante */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{participant}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                {participantIdx + 1} / {validParticipants.length}
              </Typography>
            </Box>

            {/* Barra de progresso */}
            <Box sx={{ height: 3, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, mb: 3, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${progressPct}%`, bgcolor: '#C9940A', borderRadius: 2, transition: 'width 0.3s' }} />
            </Box>

            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, mb: 3 }}>
              {poolType === 'winner'
                ? <><Box component="span" sx={{ color: '#C9940A', fontWeight: 700 }}>C</Box> = Casa &nbsp; <Box component="span" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>E</Box> = Empate &nbsp; <Box component="span" sx={{ color: '#60a5fa', fontWeight: 700 }}>F</Box> = Fora</>
                : 'Digite o placar que a pessoa prevê'
              }
            </Typography>

            {/* Lista de jogos */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {selectedMatches.map(m => (
                <Box key={m.id} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 1.5, borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <Box>
                    <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                      {translateTeam(m.home_team)} × {translateTeam(m.away_team)}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, mt: 0.25 }}>
                      {MatchDateLabel(m)}h
                    </Typography>
                  </Box>

                  {poolType === 'winner' ? (
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <WinnerBtn label="C" selected={winnerPreds[participant]?.[m.id] === 'home'} onClick={() => setWinnerPred(participant, m.id, 'home')} color="#C9940A" />
                      <WinnerBtn label="E" selected={winnerPreds[participant]?.[m.id] === 'draw'} onClick={() => setWinnerPred(participant, m.id, 'draw')} color="rgba(255,255,255,0.7)" />
                      <WinnerBtn label="F" selected={winnerPreds[participant]?.[m.id] === 'away'} onClick={() => setWinnerPred(participant, m.id, 'away')} color="#60a5fa" />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <ScoreInput
                        value={exactPreds[participant]?.[m.id]?.home ?? ''}
                        onChange={v => setExactPred(participant, m.id, 'home', v)}
                      />
                      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>×</Typography>
                      <ScoreInput
                        value={exactPreds[participant]?.[m.id]?.away ?? ''}
                        onChange={v => setExactPred(participant, m.id, 'away', v)}
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>

            {error && <Typography sx={{ color: '#ff6b6b', fontSize: 13, mt: 2 }}>{error}</Typography>}
          </Box>
        )
      })()}

      {/* ── Botões fixos no rodapé ── */}
      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        bgcolor: '#0f0f0e',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        px: { xs: 2, md: 4 }, py: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Button
          onClick={() => {
            if (step === 4 && participantIdx > 0) {
              setParticipantIdx(i => i - 1)
            } else {
              goBack()
            }
          }}
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none', '&:hover': { color: '#fff' } }}
        >
          Voltar
        </Button>

        {step < 4 ? (
          <Button
            variant="contained"
            disabled={!canGoNext()}
            onClick={() => { setParticipantIdx(0); setStep(s => s + 1) }}
            sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.2)', color: 'rgba(0,0,0,0.3)' } }}
          >
            Continuar
          </Button>
        ) : participantIdx < validParticipants.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setParticipantIdx(i => i + 1)}
            sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#E6AC10' } }}
          >
            Próximo
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={isPending}
            onClick={handleSave}
            sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#E6AC10' } }}
          >
            {isPending ? 'Salvando...' : 'Salvar Bolão'}
          </Button>
        )}
      </Box>
    </Box>
  )
}
