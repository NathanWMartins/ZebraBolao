'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Switch,
  IconButton,
  Card,
  Collapse,
  TextField,
  Stack,
  Divider,
  CircularProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Popover
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import Link from 'next/link'
import { createPool } from './actions'
import { useRouter } from 'next/navigation'
import TeamFlag from '@/app/components/TeamFlag'
import { translateTeam } from '@/lib/teamTranslations'

interface Match {
  id: string
  home_team: string
  away_team: string
  match_date: string
  round: string
  group_name: string
}

interface CreatePoolClientProps {
  groupId: string
  groupName: string
  initialMatches: any[]
}

const SPECIAL_BET_OPTIONS = [
  { key: 'champion', label: 'Seleção Campeã', description: 'Quem vence a Copa do Mundo' },
  { key: 'runner_up', label: 'Vice-Campeão', description: 'Quem perde a final' },
  { key: 'third_place', label: '3° Colocado', description: 'Quem vence a disputa pelo bronze' },
  { key: 'top_scorer', label: 'Artilheiro', description: 'Maior goleador do torneio' },
  { key: 'top_assist', label: 'Maior Assistente', description: 'Jogador com mais assistências' },
  { key: 'most_cards', label: 'Mais Cartões', description: 'Seleção com mais cartões' },
]

export default function CreatePoolClient({ groupId, groupName, initialMatches }: CreatePoolClientProps) {
  const router = useRouter()

  // Etapa: 'select' → escolha do tipo | 'games' → bolão por jogos | 'special' → bolão especial
  const [step, setStep] = useState<'select' | 'games' | 'special'>('select')

  // Estados do bolão por jogos
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const firstAvailableDate = initialMatches.length > 0
    ? new Date(initialMatches[0].match_date).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const [currentDate, setCurrentDate] = useState<string>(firstAvailableDate)
  const [poolType, setPoolType] = useState<'winner' | 'score'>('winner')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [groupAnchor, setGroupAnchor] = useState<null | HTMLElement>(null)

  // Estados compartilhados
  const [poolName, setPoolName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados do bolão especial
  const [specialBets, setSpecialBets] = useState<string[]>([])

  const toggleSpecialBet = (key: string) => {
    setSpecialBets(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const availableGroups = useMemo(() => {
    const groups = new Set<string>()
    initialMatches.forEach(m => {
      if (m.round === 'group' && m.group_name) groups.add(m.group_name)
    })
    return Array.from(groups).sort()
  }, [initialMatches])

  const handleSelectGroup = (groupName: string) => {
    const groupMatchIds = initialMatches
      .filter(m => m.group_name === groupName && m.round === 'group')
      .map((m: Match) => m.id)
    const allSelected = groupMatchIds.every((id: string) => selectedIds.includes(id))
    setSelectedIds(prev =>
      allSelected
        ? prev.filter(id => !groupMatchIds.includes(id))
        : [...new Set([...prev, ...groupMatchIds])]
    )
    // não fecha o popover para permitir múltiplas seleções
  }

  const handleSelectAllMatches = () => {
    const allIds = initialMatches.map((m: Match) => m.id)
    const allSelected = allIds.every((id: string) => selectedIds.includes(id))
    setSelectedIds(allSelected ? [] : allIds)
  }

  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    initialMatches.forEach(m => {
      const d = new Date(m.match_date).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
      dates.add(d)
    })
    return Array.from(dates).sort()
  }, [initialMatches])

  const filteredMatches = useMemo(() => {
    return initialMatches.filter(m => {
      const d = new Date(m.match_date).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
      return d === currentDate
    })
  }, [initialMatches, currentDate])

  const selectedMatchesDetail = useMemo(() => {
    return initialMatches.filter(m => selectedIds.includes(m.id))
  }, [initialMatches, selectedIds])

  const handleToggleMatch = (matchId: string) => {
    setSelectedIds(prev =>
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    )
  }

  const handleSaveGames = async () => {
    if (!poolName.trim()) { setError('Dê um nome ao seu bolão.'); return }
    setLoading(true); setError(null)
    try {
      const result = await createPool(groupId, poolName, selectedIds, poolType, [])
      if (result.error) setError(result.error)
      else router.push(`/dashboard/groups/${groupId}`)
    } catch { setError('Erro ao salvar o bolão. Tente novamente.') }
    finally { setLoading(false) }
  }

  const handleSaveSpecial = async () => {
    if (!poolName.trim()) { setError('Dê um nome ao bolão especial.'); return }
    if (specialBets.length === 0) { setError('Selecione pelo menos uma aposta especial.'); return }
    setLoading(true); setError(null)
    try {
      const result = await createPool(groupId, poolName, [], 'special' as any, specialBets)
      if (result.error) setError(result.error)
      else router.push(`/dashboard/groups/${groupId}`)
    } catch { setError('Erro ao salvar o bolão. Tente novamente.') }
    finally { setLoading(false) }
  }

  // ─────────────────────────────────────────────────────────────
  // Header reutilizável
  // ─────────────────────────────────────────────────────────────
  const Header = ({ onBack, subtitle }: { onBack: () => void; subtitle: string }) => (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 10,
      bgcolor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)',
      pt: { xs: 2, sm: 4 }, pb: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 4 },
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
        <IconButton size="small" onClick={onBack}
          sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)', p: { xs: 0.75, sm: 1 } }}>
          <ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
        </IconButton>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 18, sm: 24 } }}>Novo Bolão</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: 11, sm: 13 } }}>{subtitle}</Typography>
        </Box>
      </Box>
    </Box>
  )

  // ─────────────────────────────────────────────────────────────
  // ETAPA 1 — Selecionar tipo
  // ─────────────────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <Box>
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 10,
          bgcolor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)',
          pt: { xs: 2, sm: 4 }, pb: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 4 },
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Link href={`/dashboard/groups/${groupId}`} passHref>
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)', p: { xs: 0.75, sm: 1 } }}>
                <ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </IconButton>
            </Link>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 18, sm: 24 } }}>Novo Bolão</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: 11, sm: 13 } }}>Grupo: {groupName}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 4 }, pt: 5, pb: 6, maxWidth: 640, mx: 'auto' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, mb: 3, textAlign: 'center' }}>
            Escolha o tipo de bolão que deseja criar
          </Typography>

          <Stack spacing={2}>
            {/* Bolão por Jogos */}
            <Card
              onClick={() => setStep('games')}
              sx={{
                bgcolor: 'rgba(12,12,12)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                p: 3,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'all 0.2s',
                boxShadow: 'none',
                '&:hover': { borderColor: 'rgba(201,148,10,0.4)', bgcolor: 'rgba(201,148,10,0.04)' }
              }}
            >
              <Box sx={{
                width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
                bgcolor: 'rgba(201,148,10,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <SportsSoccerIcon sx={{ color: '#C9940A', fontSize: 28 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16, mb: 0.5 }}>Bolão por Jogos</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.4 }}>
                  Escolha os jogos e aposte no placar ou vencedor de cada partida
                </Typography>
              </Box>
              <ArrowBackIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 20, transform: 'rotate(180deg)', flexShrink: 0 }} />
            </Card>

            {/* Bolão Especial */}
            <Card
              onClick={() => setStep('special')}
              sx={{
                bgcolor: 'rgba(12,12,12)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                p: 3,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'all 0.2s',
                boxShadow: 'none',
                '&:hover': { borderColor: 'rgba(201,148,10,0.4)', bgcolor: 'rgba(201,148,10,0.04)' }
              }}
            >
              <Box sx={{
                width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
                bgcolor: 'rgba(201,148,10,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <EmojiEventsIcon sx={{ color: '#C9940A', fontSize: 28 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16, mb: 0.5 }}>Bolão Especial</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.4 }}>
                  Aposte em artilheiro, seleção campeã, vice-campeão e mais
                </Typography>
              </Box>
              <ArrowBackIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 20, transform: 'rotate(180deg)', flexShrink: 0 }} />
            </Card>
          </Stack>
        </Box>
      </Box>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // ETAPA 3 — Bolão Especial
  // ─────────────────────────────────────────────────────────────
  if (step === 'special') {
    return (
      <Box sx={{ pb: 6 }}>
        <Header onBack={() => { setStep('select'); setError(null); setPoolName(''); setSpecialBets([]) }} subtitle="Bolão Especial" />

        <Box sx={{ px: { xs: 2, sm: 4 }, pt: 4, maxWidth: 640, mx: 'auto' }}>
          {/* Nome */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>Nome do Bolão</Typography>
            <TextField
              fullWidth autoFocus
              placeholder="Ex: Especial Copa 2026"
              value={poolName}
              onChange={e => setPoolName(e.target.value)}
              variant="standard"
              slotProps={{ input: { disableUnderline: true, sx: { color: '#fff', fontSize: { xs: 18, sm: 22 }, fontWeight: 700, borderBottom: '2px solid rgba(201,148,10,0.3)', pb: 1, '&.Mui-focused': { borderBottom: '2px solid #C9940A' } } } }}
            />
          </Box>

          {/* Apostas */}
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, mb: 1.5, fontWeight: 600, textTransform: 'uppercase' }}>
            Apostas incluídas
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 4 }}>
            {SPECIAL_BET_OPTIONS.map(opt => {
              const active = specialBets.includes(opt.key)
              return (
                <Box
                  key={opt.key}
                  onClick={() => toggleSpecialBet(opt.key)}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2, py: 1.5, borderRadius: '14px', border: '1px solid',
                    borderColor: active ? 'rgba(201,148,10,0.5)' : 'rgba(255,255,255,0.07)',
                    bgcolor: active ? 'rgba(201,148,10,0.07)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <Box>
                    <Typography sx={{ color: active ? '#C9940A' : '#fff', fontSize: 14, fontWeight: 600 }}>{opt.label}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{opt.description}</Typography>
                  </Box>
                  <Switch
                    checked={active} size="small"
                    onChange={() => toggleSpecialBet(opt.key)}
                    onClick={e => e.stopPropagation()}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#C9940A' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#C9940A' },
                    }}
                  />
                </Box>
              )
            })}
          </Stack>

          {error && <Typography sx={{ color: '#ff4444', fontSize: 12, mb: 2 }}>{error}</Typography>}

          <Button
            fullWidth variant="contained"
            disabled={loading || specialBets.length === 0 || !poolName.trim()}
            onClick={handleSaveSpecial}
            sx={{
              bgcolor: '#C9940A', color: '#000', fontWeight: 800,
              fontSize: { xs: 14, sm: 16 }, py: { xs: 1.5, sm: 2 },
              borderRadius: '14px', textTransform: 'none',
              boxShadow: '0 8px 30px rgba(201,148,10,0.3)',
              '&:hover': { bgcolor: '#E6AC10' },
              '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' }
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Criar Bolão Especial'}
          </Button>
        </Box>
      </Box>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // ETAPA 2 — Bolão por Jogos (fluxo original)
  // ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ pb: selectedIds.length > 0 ? 30 : 5 }}>
      {/* Header com seletor de datas */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 10,
        bgcolor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)',
        pt: { xs: 2, sm: 4 }, pb: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 4 },
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 1.5, sm: 3 } }}>
          <IconButton size="small" onClick={() => { setStep('select'); setError(null); setPoolName(''); setSelectedIds([]) }}
            sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)', p: { xs: 0.75, sm: 1 } }}>
            <ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
          </IconButton>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: { xs: 18, sm: 24 } }}>Bolão por Jogos</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: 11, sm: 13 } }}>Grupo: {groupName}</Typography>
          </Box>
        </Box>

        {/* Seletor de Datas */}
        <Box sx={{
          display: 'flex', overflowX: 'auto', gap: 1.5, pb: 1,
          '&::-webkit-scrollbar': { height: '3px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(201,148,10,0.3)', borderRadius: '10px' }
        }}>
          {availableDates.map(date => {
            const dateObj = new Date(`${date}T12:00:00`)
            const active = currentDate === date
            const hasKnockout = initialMatches.some(m => {
              const d = new Date(m.match_date).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
              return d === date && m.round !== 'group'
            })
            return (
              <Button key={date} onClick={() => setCurrentDate(date)} sx={{
                minWidth: { xs: 54, sm: 80 }, flexShrink: 0,
                display: 'flex', flexDirection: 'column',
                py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 },
                bgcolor: active ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.03)',
                border: '1px solid', borderColor: active ? '#C9940A' : 'transparent',
                borderRadius: '12px', color: active ? '#C9940A' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(201,148,10,0.1)' }
              }}>
                <Typography sx={{ fontSize: { xs: 9, sm: 11 }, fontWeight: 600, textTransform: 'uppercase' }}>
                  {dateObj.toLocaleDateString('pt-BR', { month: 'short' })}
                </Typography>
                <Typography sx={{ fontSize: { xs: 15, sm: 20 }, fontWeight: 700 }}>
                  {dateObj.getDate()}
                </Typography>
                {hasKnockout && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
                    <WhatshotIcon sx={{ fontSize: 9, color: '#C9940A' }} />
                    <Typography sx={{ fontSize: 7, fontWeight: 800, textTransform: 'uppercase', color: '#C9940A', letterSpacing: '0.03em', lineHeight: 1 }}>
                      mata-mata
                    </Typography>
                  </Box>
                )}
              </Button>
            )
          })}
        </Box>
      </Box>

      {/* Lista de Jogos */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 4, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: 14, sm: 20 } }}>
            Jogos de {new Date(`${currentDate}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
          {availableGroups.length > 0 && (
            <Button size="small" onClick={(e) => setGroupAnchor(e.currentTarget)} sx={{
              color: '#C9940A', border: '1px solid', borderColor: 'rgba(201,148,10,0.4)',
              borderRadius: '10px', textTransform: 'none', fontWeight: 600,
              fontSize: { xs: 12, sm: 13 }, px: { xs: 1, sm: 1.5 }, py: { xs: 0.25, sm: 0.5 },
              flexShrink: 0, '&:hover': { bgcolor: 'rgba(201,148,10,0.1)' }
            }}>
              Por Grupo
            </Button>
          )}
        </Box>

        <Popover
          open={Boolean(groupAnchor)} anchorEl={groupAnchor}
          onClose={() => setGroupAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { bgcolor: 'rgba(20,20,20,0.98)', border: '1px solid rgba(201,148,10,0.3)', borderRadius: '16px', p: 2, backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: 220 } } }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>
            Selecionar por grupo:
          </Typography>

          {/* Botão: todos os jogos */}
          {(() => {
            const allIds = initialMatches.map((m: Match) => m.id)
            const allSelected = allIds.length > 0 && allIds.every((id: string) => selectedIds.includes(id))
            return (
              <Button onClick={handleSelectAllMatches} sx={{
                width: '100%', mb: 1.5, py: 1, px: 1.5, borderRadius: '10px', border: '1px solid',
                borderColor: allSelected ? '#C9940A' : 'rgba(255,255,255,0.15)',
                bgcolor: allSelected ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.03)',
                color: allSelected ? '#C9940A' : 'rgba(255,255,255,0.7)',
                fontWeight: 700, fontSize: 13, textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(201,148,10,0.1)', borderColor: '#C9940A' }
              }}>
                {allSelected ? 'Desmarcar todos os jogos' : 'Selecionar todos os jogos'}
              </Button>
            )
          })()}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 1.5 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableGroups.map(group => {
              const groupMatchIds = initialMatches.filter((m: Match) => m.group_name === group && m.round === 'group').map((m: Match) => m.id)
              const allSelected = groupMatchIds.every((id: string) => selectedIds.includes(id))
              return (
                <Button key={group} onClick={() => handleSelectGroup(group)} sx={{
                  minWidth: 56, py: 1, px: 1.5, borderRadius: '10px', border: '1px solid',
                  borderColor: allSelected ? '#C9940A' : 'rgba(255,255,255,0.1)',
                  bgcolor: allSelected ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.03)',
                  color: allSelected ? '#C9940A' : 'rgba(255,255,255,0.7)',
                  fontWeight: 700, fontSize: 14, textTransform: 'none', flexDirection: 'column', gap: 0.25,
                  '&:hover': { bgcolor: 'rgba(201,148,10,0.1)', borderColor: '#C9940A' }
                }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'inherit', lineHeight: 1 }}>Grupo</Typography>
                  {group}
                </Button>
              )
            })}
          </Box>
        </Popover>

        <Stack spacing={2}>
          {filteredMatches.map(match => (
            <Card key={match.id} sx={{
              bgcolor: 'rgba(12,12,12)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px', p: { xs: 1.5, sm: 2.5 },
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: 'none', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.01)' }
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: { xs: 10, sm: 11 }, fontWeight: 600, mb: 0.75, textTransform: 'uppercase' }}>
                  {match.round !== 'group' ? match.round : `Grupo ${match.group_name}`} • {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flex: 1, minWidth: 0 }}>
                    <TeamFlag teamName={match.home_team} size={20} />
                    <Typography sx={{ color: '#fff', fontSize: { xs: 12, sm: 16 }, fontWeight: 500 }} noWrap>{translateTeam(match.home_team)}</Typography>
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 700, flexShrink: 0, fontSize: { xs: 12, sm: 16 } }}>X</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                    <Typography sx={{ color: '#fff', fontSize: { xs: 12, sm: 16 }, fontWeight: 500, textAlign: 'right' }} noWrap>{translateTeam(match.away_team)}</Typography>
                    <TeamFlag teamName={match.away_team} size={20} />
                  </Box>
                </Box>
              </Box>
              <Box sx={{ ml: { xs: 1.5, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
                <Typography sx={{ fontSize: 10, color: selectedIds.includes(match.id) ? '#C9940A' : 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', mb: -0.5, transition: 'color 0.2s' }}>
                  {selectedIds.includes(match.id) ? 'Incluído' : 'Incluir'}
                </Typography>
                <Switch checked={selectedIds.includes(match.id)} onChange={() => handleToggleMatch(match.id)}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#C9940A' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#C9940A' } }}
                />
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Drawer Inferior */}
      {selectedIds.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: { xs: 0, md: 24 }, left: { xs: 0, md: 'auto' }, right: { xs: 0, md: 24 }, zIndex: 100, width: { xs: '100%', md: 400 } }}>
          <Card sx={{
            bgcolor: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(201,148,10,0.3)',
            borderLeft: { sm: '1px solid rgba(201,148,10,0.3)' },
            borderRight: { sm: '1px solid rgba(201,148,10,0.3)' },
            borderBottom: { sm: '1px solid rgba(201,148,10,0.3)' },
            borderRadius: { xs: '24px 24px 0 0', sm: '24px' },
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', transition: 'all 0.3s ease-in-out'
          }}>
            <Box onClick={() => setIsDrawerOpen(!isDrawerOpen)} sx={{ p: { xs: 1.5, sm: 2.5 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip label={`${selectedIds.length} Jogos`} size="small" sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700 }} />
                <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: 14, sm: 16 } }}>Resumo do Bolão</Typography>
              </Box>
              <IconButton size="small" sx={{ color: '#C9940A' }}>
                {isDrawerOpen ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
              </IconButton>
            </Box>

            <Collapse in={isDrawerOpen}>
              <Box sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2.5, sm: 4 } }}>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: { xs: 2, sm: 3 } }} />

                <Box sx={{ mb: { xs: 2, sm: 4 } }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, mb: 0.75, fontWeight: 500 }}>NOME DO BOLÃO</Typography>
                  <TextField fullWidth placeholder="Ex: Fase de Grupos" value={poolName} onChange={e => setPoolName(e.target.value)} variant="standard"
                    slotProps={{ input: { disableUnderline: true, sx: { color: '#fff', fontSize: { xs: 15, sm: 20 }, fontWeight: 600, borderBottom: '2px solid rgba(201,148,10,0.3)', pb: 0.75, '&:hover': { borderBottom: '2px solid #C9940A' }, '&.Mui-focused': { borderBottom: '2px solid #C9940A' } } } }}
                  />
                  {error && <Typography sx={{ color: '#ff4444', fontSize: 11, mt: 0.75 }}>{error}</Typography>}
                </Box>

                <Box sx={{ mb: { xs: 2, sm: 4 } }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, mb: 0.75, fontWeight: 500 }}>TIPO DE BOLÃO</Typography>
                  <ToggleButtonGroup value={poolType} exclusive onChange={(_e, v) => { if (v !== null) setPoolType(v) }} fullWidth
                    sx={{ '& .MuiToggleButton-root': { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', textTransform: 'none', fontWeight: 600, fontSize: { xs: 12, sm: 14 }, py: { xs: 0.75, sm: 1 }, '&.Mui-selected': { color: '#C9940A', bgcolor: 'rgba(201,148,10,0.1)', borderColor: '#C9940A', '&:hover': { bgcolor: 'rgba(201,148,10,0.2)' } }, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } } }}
                  >
                    <ToggleButton value="score">Placar Exato</ToggleButton>
                    <ToggleButton value="winner">Vencedor ou Empate</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, mb: 1, fontWeight: 500 }}>JOGOS SELECIONADOS</Typography>
                <Box sx={{ maxHeight: { xs: 120, sm: 200 }, overflowY: 'auto', mb: { xs: 2, sm: 4 }, pr: 1, display: 'flex', flexDirection: 'column', gap: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '10px' } }}>
                  {selectedMatchesDetail.map(match => (
                    <Box key={match.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.03)', px: 1.5, py: 1, borderRadius: '10px' }}>
                      <Box>
                        <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{translateTeam(match.home_team)} vs {translateTeam(match.away_team)}</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                          {new Date(match.match_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} • {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => handleToggleMatch(match.id)} sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#ff4444' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                <Button fullWidth variant="contained" disabled={loading} onClick={handleSaveGames} sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 800, fontSize: { xs: 14, sm: 16 }, py: { xs: 1.25, sm: 2 }, borderRadius: '14px', textTransform: 'none', boxShadow: '0 8px 30px rgba(201,148,10,0.3)', '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.4)' } }}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Criar Bolão'}
                </Button>
              </Box>
            </Collapse>
          </Card>
        </Box>
      )}
    </Box>
  )
}