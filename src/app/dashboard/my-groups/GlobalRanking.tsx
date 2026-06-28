'use client'

import React, { useState } from 'react'
import {
  Box, Typography, Button, Avatar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import PublicIcon from '@mui/icons-material/Public'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { joinGlobalRanking } from './actions'
import type { GlobalRankingEntry } from './actions'

const SCORING_RULES = [
  { label: 'Fase de Grupos', pts: 1, color: 'rgba(255,255,255,0.5)' },
  { label: '16avos de Final', pts: 2, color: '#60a5fa' },
  { label: 'Oitavas de Final', pts: 3, color: '#34d399' },
  { label: 'Quartas de Final', pts: 5, color: '#a78bfa' },
  { label: 'Semifinal', pts: 8, color: '#fb923c' },
  { label: 'Final', pts: 12, color: '#E8C44A' },
]

interface GlobalRankingProps {
  ranking: GlobalRankingEntry[]
  isParticipant: boolean
  currentUserId: string | null
  openModalOnMount?: boolean
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function GlobalRanking({
  ranking,
  isParticipant: initialParticipant,
  currentUserId,
  openModalOnMount = false,
}: GlobalRankingProps) {
  const [isParticipant, setIsParticipant] = useState(initialParticipant)
  const [dialogOpen, setDialogOpen] = useState(openModalOnMount)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    setJoining(true)
    setError(null)
    const res = await joinGlobalRanking()
    if (res.ok) {
      setIsParticipant(true)
      setDialogOpen(false)
    } else {
      setError(res.error ?? 'Erro ao entrar no ranking.')
    }
    setJoining(false)
  }

  return (
    <>
      <Box sx={{ mt: 6 }}>
        {/* Header da seção */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36,
              borderRadius: '10px',
              bgcolor: 'rgba(232,196,74,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PublicIcon sx={{ color: '#E8C44A', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#E8C44A', fontWeight: 700, fontSize: 18 }}>Ranking Geral</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                Melhor bolão entre todos os grupos
              </Typography>
            </Box>
          </Box>

          {!isParticipant && (
            <Button
              onClick={() => setDialogOpen(true)}
              size="small"
              sx={{
                bgcolor: 'rgba(232,196,74,0.1)',
                color: '#E8C44A',
                fontWeight: 700,
                fontSize: 12,
                px: 2,
                borderRadius: '8px',
                border: '1px solid rgba(232,196,74,0.3)',
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(232,196,74,0.18)' },
              }}
            >
              Participar
            </Button>
          )}
        </Box>

        {/* Tabela de pontuação */}
        <Box sx={{
          mb: 3,
          p: 2,
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Pontos por acerto
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {SCORING_RULES.map(rule => (
              <Box key={rule.label} sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '8px', px: 1.5, py: 0.75,
                border: `0.5px solid rgba(255,255,255,0.06)`,
              }}>
                <Box sx={{
                  width: 22, height: 22, borderRadius: '6px',
                  bgcolor: `${rule.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Typography sx={{ color: rule.color, fontSize: 11, fontWeight: 800 }}>{rule.pts}</Typography>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{rule.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Se não participou ainda: tela de convite */}
        {!isParticipant ? (
          <Box sx={{
            bgcolor: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(232,196,74,0.2)',
            borderRadius: '14px',
            p: 5,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(232,196,74,0.06) 0%, rgba(0,0,0,0.4) 60%)',
          }}>
            <EmojiEventsIcon sx={{ fontSize: 44, color: 'rgba(232,196,74,0.5)', mb: 1.5 }} />
            <Typography sx={{ color: '#fff', fontSize: 16, fontWeight: 600, mb: 1 }}>
              Você ainda não está no Ranking Geral
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, mb: 3, maxWidth: 360, mx: 'auto', lineHeight: 1.6 }}>
              Participe para disputar com todos os jogadores da plataforma. Seu melhor bolão — de qualquer grupo — é o que conta.
            </Typography>
            <Button
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: '#E8C44A',
                color: '#000',
                fontWeight: 700,
                fontSize: 14,
                px: 4,
                py: 1,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#f0d060' },
              }}
            >
              Entrar no Ranking
            </Button>
          </Box>
        ) : ranking.length === 0 ? (
          <Box sx={{
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: '12px',
            p: 4,
            textAlign: 'center',
          }}>
            <EmojiEventsIcon sx={{ fontSize: 36, color: 'rgba(255,255,255,0.15)', mb: 1 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Nenhum jogador com pontos ainda.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {ranking.map((entry) => {
              const isMe = entry.user_id === currentUserId
              const medalColor = entry.position <= 3 ? MEDAL_COLORS[entry.position - 1] : null

              return (
                <Box
                  key={entry.user_id}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: '#0f0f0e',
                    border: `1px solid ${isMe ? 'rgba(232,196,74,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    px: 2.5,
                    py: 1.5,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: isMe
                        ? 'linear-gradient(135deg, rgba(232,196,74,0.15) 0%, transparent 50%)'
                        : 'linear-gradient(135deg, rgba(60,59,110,0.3) 0%, transparent 35%, rgba(0,104,71,0.2) 60%, transparent 75%, rgba(178,34,52,0.25) 100%)',
                      pointerEvents: 'none',
                    },
                  }}
                >
                  {/* Posição */}
                  <Box sx={{ position: 'relative', zIndex: 1, width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {medalColor ? (
                      <EmojiEventsIcon sx={{ color: medalColor, fontSize: 20 }} />
                    ) : (
                      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700 }}>
                        {entry.position}
                      </Typography>
                    )}
                  </Box>

                  {/* Avatar + Nome */}
                  <Avatar
                    src={entry.avatar_url ?? undefined}
                    sx={{ position: 'relative', zIndex: 1, width: 32, height: 32, bgcolor: 'rgba(232,196,74,0.2)', fontSize: 14 }}
                  >
                    {entry.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography sx={{
                    position: 'relative', zIndex: 1,
                    color: isMe ? '#E8C44A' : '#fff',
                    fontWeight: isMe ? 700 : 500,
                    fontSize: 14,
                    flex: 1,
                  }}>
                    {entry.username}{isMe ? ' (você)' : ''}
                  </Typography>

                  {/* Pontos */}
                  <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                      {entry.total_points}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>pts</Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>

      {/* Modal de opt-in */}
      <Dialog
        open={dialogOpen}
        onClose={() => !joining && setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#111110',
              backgroundImage: 'none',
              border: '1px solid rgba(232,196,74,0.2)',
              borderRadius: '20px',
            }
          }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40,
              borderRadius: '10px',
              bgcolor: 'rgba(232,196,74,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <EmojiEventsIcon sx={{ color: '#E8C44A', fontSize: 22 }} />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
              Entrar no Ranking Geral?
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 1 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7 }}>
            Seu nome vai aparecer no ranking geral visível para todos os participantes.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
              📊 Seus pontos são o <Box component="span" sx={{ color: '#fff' }}>melhor resultado de um único bolão</Box> — de qualquer grupo. Quem está em mais grupos não leva vantagem.
            </Typography>
          </Box>
          {error && (
            <Typography sx={{ color: '#ff6b6b', fontSize: 13, mt: 2 }}>✗ {error}</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={joining}
            sx={{
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            Agora não
          </Button>
          <Button
            onClick={handleJoin}
            disabled={joining}
            variant="contained"
            sx={{
              bgcolor: '#E8C44A',
              color: '#000',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
              '&:hover': { bgcolor: '#f0d060' },
              '&.Mui-disabled': { bgcolor: 'rgba(232,196,74,0.3)' },
            }}
          >
            {joining ? <CircularProgress size={16} color="inherit" /> : 'Sim, participar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
