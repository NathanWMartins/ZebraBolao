'use client'

import React, { useState } from 'react'
import {
    Box, Typography, IconButton, Card, Stack, CircularProgress,
    Select, MenuItem, TextField, Button, Avatar, Divider, Autocomplete
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { updateMatch, incrementStat, decrementStat, addPlayerStat, calculateScoresForMatch } from '../admin-actions'
import { translateTeam } from '@/lib/teamTranslations'
import { getFlagUrl } from '@/lib/teamFlags'
import TeamFlag from '@/app/components/TeamFlag'
import { PLAYERS } from '@/lib/players'

interface Match {
    id: string
    home_team: string
    away_team: string
    match_date: string
    round: string
    group_name: string
    status: string
    home_score: number | null
    away_score: number | null
}

interface PlayerStat {
    id: string
    player_name: string
    team: string
    goals: number
    assists: number
}

export default function AdminClient({ matches, playerStats: initialStats }: { matches: Match[], playerStats: PlayerStat[] }) {
    const [matchStates, setMatchStates] = useState<Record<string, { status: string, home_score: string, away_score: string }>>(
        () => Object.fromEntries(matches.map(m => [m.id, {
            status: m.status,
            home_score: m.home_score?.toString() ?? '',
            away_score: m.away_score?.toString() ?? '',
        }]))
    )
    const [savingMatch, setSavingMatch] = useState<string | null>(null)
    const [calculatingMatch, setCalculatingMatch] = useState<string | null>(null)
    const [calcResult, setCalcResult] = useState<Record<string, string>>({})
    const [playerStats, setPlayerStats] = useState(initialStats)
    const [newPlayer, setNewPlayer] = useState<{ player: typeof PLAYERS[0] | null, goals: string, assists: string }>({ player: null, goals: '0', assists: '0' })
    const [addingPlayer, setAddingPlayer] = useState(false)
    const [section, setSection] = useState<'matches' | 'stats'>('matches')

    const handleCalculateScores = async (id: string) => {
        setCalculatingMatch(id)
        try {
            const res = await calculateScoresForMatch(id)
            setCalcResult(prev => ({ ...prev, [id]: `✓ ${res.poolsUpdated} bolão(ões) atualizados` }))
        } catch (e: any) {
            setCalcResult(prev => ({ ...prev, [id]: `Erro: ${e.message}` }))
        } finally {
            setCalculatingMatch(null)
        }
    }

    const handleSaveMatch = async (id: string) => {
        setSavingMatch(id)
        const s = matchStates[id]
        try {
            await updateMatch(
                id,
                s.status,
                s.home_score !== '' ? Number(s.home_score) : null,
                s.away_score !== '' ? Number(s.away_score) : null,
            )
        } finally {
            setSavingMatch(null)
        }
    }

    const handleStat = async (id: string, field: 'goals' | 'assists', delta: 1 | -1) => {
        if (delta === 1) await incrementStat(id, field)
        else await decrementStat(id, field)
        setPlayerStats(prev => prev.map(p => p.id === id ? { ...p, [field]: p[field] + delta } : p))
    }

    const handleAddPlayer = async () => {
        if (!newPlayer.player) return
        setAddingPlayer(true)
        try {
            await addPlayerStat(newPlayer.player.name, newPlayer.player.team, Number(newPlayer.goals), Number(newPlayer.assists))
            setPlayerStats(prev => [...prev, { id: Date.now().toString(), player_name: newPlayer.player!.name, team: newPlayer.player!.team, goals: Number(newPlayer.goals), assists: Number(newPlayer.assists) }])
            setNewPlayer({ player: null, goals: '0', assists: '0' })
        } finally {
            setAddingPlayer(false)
        }
    }

    return (
        <Box sx={{ pb: 10, px: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ pt: 2, pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Link href="/dashboard" passHref>
                    <IconButton sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)' }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Link>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>Admin</Typography>
            </Box>

            {/* Section tabs */}
            <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
                {(['matches', 'stats'] as const).map(s => (
                    <Box key={s} onClick={() => setSection(s)} sx={{
                        px: 2, py: 0.75, borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                        borderColor: section === s ? '#C9940A' : 'rgba(255,255,255,0.1)',
                        bgcolor: section === s ? 'rgba(201,148,10,0.12)' : 'transparent',
                    }}>
                        <Typography sx={{ color: section === s ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700 }}>
                            {s === 'matches' ? 'Jogos' : 'Artilheiros & Assists'}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Matches */}
            {section === 'matches' && (
                <Stack spacing={2}>
                    {matches.map(match => {
                        const s = matchStates[match.id]
                        const saving = savingMatch === match.id
                        const date = new Date(match.match_date)
                        return (
                            <Card key={match.id} sx={{ bgcolor: 'rgba(12,12,12)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Avatar src={getFlagUrl(match.home_team, 40)} sx={{ width: 24, height: 24 }} />
                                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{translateTeam(match.home_team)}</Typography>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>x</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{translateTeam(match.away_team)}</Typography>
                                    <Avatar src={getFlagUrl(match.away_team, 40)} sx={{ width: 24, height: 24 }} />
                                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, ml: 'auto' }}>
                                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Select
                                        value={s.status}
                                        onChange={e => setMatchStates(prev => ({ ...prev, [match.id]: { ...prev[match.id], status: e.target.value } }))}
                                        size="small"
                                        sx={{ color: '#fff', fontSize: 12, '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)' }, bgcolor: 'rgba(255,255,255,0.04)', minWidth: 120 }}
                                    >
                                        <MenuItem value="scheduled">Scheduled</MenuItem>
                                        <MenuItem value="live">Live</MenuItem>
                                        <MenuItem value="finished">Finished</MenuItem>
                                    </Select>
                                    <TextField
                                        value={s.home_score}
                                        onChange={e => setMatchStates(prev => ({ ...prev, [match.id]: { ...prev[match.id], home_score: e.target.value } }))}
                                        placeholder="Casa"
                                        size="small"
                                        slotProps={{ htmlInput: { style: { color: '#fff', width: 48, textAlign: 'center' } } }}
                                        sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 70 }}
                                    />
                                    <Typography sx={{ color: 'rgba(255,255,255,0.3)' }}>x</Typography>
                                    <TextField
                                        value={s.away_score}
                                        onChange={e => setMatchStates(prev => ({ ...prev, [match.id]: { ...prev[match.id], away_score: e.target.value } }))}
                                        placeholder="Fora"
                                        size="small"
                                        slotProps={{ htmlInput: { style: { color: '#fff', width: 48, textAlign: 'center' } } }}
                                        sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 70 }}
                                    />
                                    <Button
                                        onClick={() => handleSaveMatch(match.id)}
                                        disabled={saving}
                                        size="small"
                                        sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, fontSize: 12, px: 2, borderRadius: '8px', ml: 'auto', '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' } }}
                                    >
                                        {saving ? <CircularProgress size={14} color="inherit" /> : 'Salvar'}
                                    </Button>
                                    {s.status === 'finished' && (
                                        <Button
                                            onClick={() => handleCalculateScores(match.id)}
                                            disabled={calculatingMatch === match.id}
                                            size="small"
                                            sx={{ bgcolor: 'rgba(255,255,255,0.07)', color: '#fff', fontWeight: 700, fontSize: 12, px: 2, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }, '&.Mui-disabled': { opacity: 0.4 } }}
                                        >
                                            {calculatingMatch === match.id ? <CircularProgress size={14} color="inherit" /> : '⚡ Calcular Pontos'}
                                        </Button>
                                    )}
                                </Box>
                                {calcResult[match.id] && (
                                    <Typography sx={{ color: calcResult[match.id].startsWith('Erro') ? '#ff6b6b' : '#4caf50', fontSize: 11, mt: 1 }}>
                                        {calcResult[match.id]}
                                    </Typography>
                                )}
                            </Card>
                        )
                    })}
                </Stack>
            )}

            {/* Stats */}
            {section === 'stats' && (
                <Box>
                    <Stack spacing={1.5} sx={{ mb: 4 }}>
                        {playerStats.map(p => (
                            <Card key={p.id} sx={{ bgcolor: 'rgba(12,12,12)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar src={getFlagUrl(p.team, 40)} sx={{ width: 28, height: 28 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{p.player_name}</Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{translateTeam(p.team)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, mr: 0.5 }}>⚽</Typography>
                                        <IconButton size="small" onClick={() => handleStat(p.id, 'goals', -1)} sx={{ color: '#fff', p: 0.3 }}>−</IconButton>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{p.goals}</Typography>
                                        <IconButton size="small" onClick={() => handleStat(p.id, 'goals', 1)} sx={{ color: '#fff', p: 0.3 }}>+</IconButton>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, mr: 0.5 }}>🅰️</Typography>
                                        <IconButton size="small" onClick={() => handleStat(p.id, 'assists', -1)} sx={{ color: '#fff', p: 0.3 }}>−</IconButton>
                                        <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{p.assists}</Typography>
                                        <IconButton size="small" onClick={() => handleStat(p.id, 'assists', 1)} sx={{ color: '#fff', p: 0.3 }}>+</IconButton>
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </Stack>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 3 }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>Adicionar jogador</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Autocomplete
                            options={PLAYERS}
                            getOptionLabel={o => o.name}
                            value={newPlayer.player}
                            onChange={(_, val) => setNewPlayer(p => ({ ...p, player: val }))}
                            sx={{ flex: 1, minWidth: 200 }}
                            slotProps={{ paper: { sx: { bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', '& .MuiAutocomplete-option': { '&:hover': { bgcolor: 'rgba(201,148,10,0.1)' } } } } }}
                            renderOption={(props, option, { index }) => {
                                const { key, ...rest } = props as any
                                return (
                                    <Box key={`${option.name}-${option.team}-${index}`} component="li" {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5 }}>
                                        <TeamFlag teamName={option.team} size={20} />
                                        <Box>
                                            <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{option.name}</Typography>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{translateTeam(option.team)}</Typography>
                                        </Box>
                                    </Box>
                                )
                            }}
                            renderInput={params => (
                                <TextField {...params} placeholder="Buscar jogador..." size="small"
                                    sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', input: { color: '#fff' } }} />
                            )}
                        />
                        <TextField value={newPlayer.goals} onChange={e => setNewPlayer(p => ({ ...p, goals: e.target.value }))} placeholder="Gols" size="small" type="number"
                            slotProps={{ htmlInput: { style: { color: '#fff', textAlign: 'center' } } }} sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 80 }} />
                        <TextField value={newPlayer.assists} onChange={e => setNewPlayer(p => ({ ...p, assists: e.target.value }))} placeholder="Assists" size="small" type="number"
                            slotProps={{ htmlInput: { style: { color: '#fff', textAlign: 'center' } } }} sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 80 }} />
                        <Button onClick={handleAddPlayer} disabled={addingPlayer || !newPlayer.player}
                            sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, fontSize: 13, px: 3, borderRadius: '10px', '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' } }}>
                            {addingPlayer ? <CircularProgress size={16} color="inherit" /> : 'Adicionar'}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    )
}