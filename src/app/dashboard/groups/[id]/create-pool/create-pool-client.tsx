'use client'

import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Card,
  Collapse,
  TextField,
  Stack,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import Link from 'next/link'
import { createPool } from './actions'
import { useRouter } from 'next/navigation'
import TeamFlag from '@/app/components/TeamFlag'

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

export default function CreatePoolClient({ groupId, groupName, initialMatches }: CreatePoolClientProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentDate, setCurrentDate] = useState<string>('2026-06-11')
  const [poolName, setPoolName] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lista única de datas dos jogos para o menu
  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    initialMatches.forEach(m => {
      const d = new Date(m.match_date).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
      dates.add(d)
    })
    return Array.from(dates).sort()
  }, [initialMatches])

  // Jogos do dia selecionado
  const filteredMatches = useMemo(() => {
    return initialMatches.filter(m => {
      const d = new Date(m.match_date).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
      return d === currentDate
    })
  }, [initialMatches, currentDate])

  // Jogos selecionados para exibição no resumo
  const selectedMatchesDetail = useMemo(() => {
    return initialMatches.filter(m => selectedIds.includes(m.id))
  }, [initialMatches, selectedIds])

  const handleToggleMatch = (matchId: string) => {
    setSelectedIds(prev =>
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    )
    if (!isDrawerOpen && selectedIds.length === 0) {
      setIsDrawerOpen(true)
    }
  }

  const handleSave = async () => {
    if (!poolName.trim()) {
      setError('Dê um nome ao seu bolão.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await createPool(groupId, poolName, selectedIds)
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/dashboard/groups/${groupId}`)
      }
    } catch (err) {
      setError('Erro ao salvar o bolão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ pb: selectedIds.length > 0 ? 30 : 5 }}>
      {/* Header Fixo/Sticky */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(10px)',
        pt: 4,
        pb: 2,
        px: { xs: 2, sm: 4 },
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href={`/dashboard/groups/${groupId}`} passHref>
              <IconButton sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)' }}>
                <ArrowBackIcon />
              </IconButton>
            </Link>
            <Box>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>Novo Bolão</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Grupo: {groupName}</Typography>
            </Box>
          </Box>

          <Typography sx={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: 14,
            fontWeight: 500,
            textAlign: 'right',
            display: { xs: 'none', md: 'block' },
            maxWidth: 250,
            mt: 0.5
          }}>
            Selecione os jogos do bolão
          </Typography>
        </Box>

        {/* Seletor de Datas */}
        <Box sx={{
          display: 'flex',
          overflowX: 'auto',
          gap: 1.5,
          pb: 1,
          '&::-webkit-scrollbar': { height: '3px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(201,148,10,0.3)', borderRadius: '10px' }
        }}>
          {availableDates.map(date => {
            const dateObj = new Date(`${date}T12:00:00`)
            const active = currentDate === date
            return (
              <Button
                key={date}
                onClick={() => setCurrentDate(date)}
                sx={{
                  minWidth: 80,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  py: 1,
                  px: 2,
                  bgcolor: active ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: active ? '#C9940A' : 'transparent',
                  borderRadius: '12px',
                  color: active ? '#C9940A' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: 'rgba(201,148,10,0.1)' }
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                  {dateObj.toLocaleDateString('pt-BR', { month: 'short' })}
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                  {dateObj.getDate()}
                </Typography>
              </Button>
            )
          })}
        </Box>
      </Box>

      {/* Lista de Jogos do Dia */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 3, fontWeight: 600 }}>
          Jogos de {new Date(`${currentDate}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>

        <Stack spacing={2}>
          {filteredMatches.map(match => (
            <Card key={match.id} sx={{
              bgcolor: 'rgba(12,12,12)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'none',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.01)' }
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, mb: 1, textTransform: 'uppercase' }}>
                  {match.round !== 'group' ? match.round : `Grupo ${match.group_name}`} • {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <TeamFlag teamName={match.home_team} size={20} />
                    <Typography sx={{ color: '#fff', fontSize: { xs: 14, sm: 16 }, fontWeight: 500 }}>{match.home_team}</Typography>
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 700, flexShrink: 0 }}>X</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
                    <Typography sx={{ color: '#fff', fontSize: { xs: 14, sm: 16 }, fontWeight: 500, textAlign: 'right' }}>{match.away_team}</Typography>
                    <TeamFlag teamName={match.away_team} size={20} />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ ml: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
                <Typography sx={{
                  fontSize: 10,
                  color: selectedIds.includes(match.id) ? '#C9940A' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  mb: -0.5,
                  transition: 'color 0.2s'
                }}>
                  {selectedIds.includes(match.id) ? 'Incluído' : 'Incluir'}
                </Typography>
                <Switch
                  checked={selectedIds.includes(match.id)}
                  onChange={() => handleToggleMatch(match.id)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#C9940A' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#C9940A' },
                  }}
                />
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Drawer Inferior (Carrinho de Jogos) */}
      {selectedIds.length > 0 && (
        <Box sx={{
          position: 'fixed',
          bottom: { xs: 0, md: 24 },
          left: { xs: 0, md: 'auto' },
          right: { xs: 0, md: 24 },
          zIndex: 100,
          width: { xs: '100%', md: 400 },
          px: { xs: 0, sm: 0 },
          pb: { xs: 0, sm: 0 }
        }}>
          <Card sx={{
            bgcolor: 'rgba(15,15,15,0.9)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(201,148,10,0.3)',
            borderLeft: { sm: '1px solid rgba(201,148,10,0.3)' },
            borderRight: { sm: '1px solid rgba(201,148,10,0.3)' },
            borderBottom: { sm: '1px solid rgba(201,148,10,0.3)' },
            borderRadius: { xs: '24px 24px 0 0', sm: '24px' },
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease-in-out'
          }}>
            {/* Cabeçalho do Drawer */}
            <Box
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`${selectedIds.length} Jogos`}
                  sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, p: 0.5 }}
                />
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>Resumo do Bolão</Typography>
              </Box>
              <IconButton sx={{ color: '#C9940A' }}>
                {isDrawerOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            </Box>

            <Collapse in={isDrawerOpen}>
              <Box sx={{ px: 3, pb: 4 }}>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }} />

                {/* Inputs do Bolão */}
                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, mb: 1, fontWeight: 500 }}>NOME DO BOLÃO</Typography>
                  <TextField
                    fullWidth
                    placeholder="Ex: Fase de Grupos - Primeira Rodada"
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value)}
                    variant="standard"
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        sx: {
                          color: '#fff',
                          fontSize: 20,
                          fontWeight: 600,
                          borderBottom: '2px solid rgba(201,148,10,0.3)',
                          pb: 1,
                          '&:hover': { borderBottom: '2px solid #C9940A' },
                          '&.Mui-focused': { borderBottom: '2px solid #C9940A' }
                        }
                      }
                    }}
                  />
                  {error && <Typography sx={{ color: '#ff4444', fontSize: 12, mt: 1 }}>{error}</Typography>}
                </Box>

                {/* Lista de Selecionados */}
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, mb: 2, fontWeight: 500 }}>JOGOS SELECIONADOS</Typography>
                <Box sx={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  mb: 4,
                  pr: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
                }}>
                  {selectedMatchesDetail.map(match => (
                    <Box key={match.id} sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      p: 1.5,
                      borderRadius: '12px'
                    }}>
                      <Box>
                        <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
                          {match.home_team} vs {match.away_team}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                          {new Date(match.match_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} • {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleMatch(match.id)}
                        sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#ff4444' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  onClick={handleSave}
                  sx={{
                    bgcolor: '#C9940A',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: 16,
                    py: 2,
                    borderRadius: '14px',
                    textTransform: 'none',
                    boxShadow: '0 8px 30px rgba(201,148,10,0.3)',
                    '&:hover': { bgcolor: '#E6AC10' },
                    '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.4)' }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Criar Bolão Agora'}
                </Button>
              </Box>
            </Collapse>
          </Card>
        </Box>
      )}
    </Box>
  )
}
