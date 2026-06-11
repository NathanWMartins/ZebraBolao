'use client'

import React, { useState } from 'react'
import {
    Box, Typography, IconButton, Card, Stack, CircularProgress,
    Select, MenuItem, TextField, Button, Avatar, Divider
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { updateMatch, incrementStat, decrementStat, addPlayerStat } from '../admin-actions'
import { translateTeam } from '@/lib/teamTranslations'
import { getFlagUrl } from '@/lib/teamFlags'

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
    const [playerStats, setPlayerStats] = useState(initialStats)
    const [newPlayer, setNewPlayer] = useState({ name: '', team: '', goals: '0', assists: '0' })
    const [addingPlayer, setAddingPlayer] = useState(false)
    const [section, setSection] = useState<'matches' | 'stats'>('matches')

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
        setAddingPlayer(true)
        try {
            await addPlayerStat(newPlayer.name, newPlayer.team, Number(newPlayer.goals), Number(newPlayer.assists))
            setNewPlayer({ name: '', team: '', goals: '0', assists: '0' })
            // reload stats
            setPlayerStats(prev => [...prev, { id: Date.now().toString(), player_name: newPlayer.name, team: newPlayer.team, goals: Number(newPlayer.goals), assists: Number(newPlayer.assists) }])
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
                                </Box>
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
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <TextField value={newPlayer.name} onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))} placeholder="Nome" size="small"
                            slotProps={{ htmlInput: { style: { color: '#fff' } } }} sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', flex: 1, minWidth: 140 }} />
                        <TextField value={newPlayer.team} onChange={e => setNewPlayer(p => ({ ...p, team: e.target.value }))} placeholder="Seleção (en)" size="small"
                            slotProps={{ htmlInput: { style: { color: '#fff' } } }} sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', flex: 1, minWidth: 120 }} />
                        <TextField value={newPlayer.goals} onChange={e => setNewPlayer(p => ({ ...p, goals: e.target.value }))} placeholder="Gols" size="small" type="number"
                            slotProps={{ htmlInput: { style: { color: '#fff', width: 48 } } }} sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 80 }} />
                        <TextField value={newPlayer.assists} onChange={e => setNewPlayer(p => ({ ...p, assists: e.target.value }))} placeholder="Assists" size="small" type="number"
                            slotProps={{ htmlInput: { style: { color: '#fff', width: 48 } } }} sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 80 }} />
                        <Button onClick={handleAddPlayer} disabled={addingPlayer || !newPlayer.name || !newPlayer.team}
                            sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, fontSize: 13, px: 3, borderRadius: '10px', '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' } }}>
                            {addingPlayer ? <CircularProgress size={16} color="inherit" /> : 'Adicionar'}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    )
}