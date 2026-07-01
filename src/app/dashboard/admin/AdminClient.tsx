'use client'

import React, { useState } from 'react'
import {
    Box, Typography, IconButton, Card, Stack, CircularProgress,
    Select, MenuItem, TextField, Button, Avatar, Divider, Autocomplete,
    Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { updateMatch, incrementStat, decrementStat, addPlayerStat, processMatchAndCalculate, recalculateAllScores, recalculateKnockoutScores, recalculateGlobalRanking, recalculatePoolStatuses, addTeamCard, decrementTeamCard, setSyncPaused, runSync, upsertTeamStanding, reorderGroupStandings, GroupStandingEntry, getMatchHits, notifyMatchHits, MatchHit } from '../admin-actions'
import { translateTeam } from '@/lib/teamTranslations'
import { getFlagUrl } from '@/lib/teamFlags'
import TeamFlag from '@/app/components/TeamFlag'
import { PLAYERS } from '@/lib/players'
import { TEAMS } from '@/lib/teams'

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
    home_yellows: number
    home_reds: number
    away_yellows: number
    away_reds: number
    notifications_sent: boolean
}

interface PlayerStat {
    id: string
    player_name: string
    team: string
    goals: number
    assists: number
}

interface TeamStat {
    team: string
    yellow_cards: number
    red_cards: number
}

type StatsSubTab = 'scorers' | 'assists' | 'cards' | 'groups'

export default function AdminClient({
    matches,
    playerStats: initialStats,
    teamStats: initialTeamStats,
    syncPaused: initialSyncPaused,
    groupStandings: initialStandings,
    scoredMatchIds: initialScoredMatchIds,
}: {
    matches: Match[]
    playerStats: PlayerStat[]
    teamStats: TeamStat[]
    syncPaused: boolean
    groupStandings: GroupStandingEntry[]
    scoredMatchIds: string[]
}) {
    const [matchStates, setMatchStates] = useState<Record<string, { status: string, home_score: string, away_score: string, home_pen_score: string, away_pen_score: string }>>(
        () => Object.fromEntries(matches.map(m => [m.id, {
            status: m.status,
            home_score: m.home_score?.toString() ?? '',
            away_score: m.away_score?.toString() ?? '',
            home_pen_score: (m as any).home_pen_score?.toString() ?? '',
            away_pen_score: (m as any).away_pen_score?.toString() ?? '',
        }]))
    )
    const [savingMatch, setSavingMatch] = useState<string | null>(null)
    const [matchFeedback, setMatchFeedback] = useState<Record<string, { ok: boolean, msg: string }>>({})
    const [calculatingMatch, setCalculatingMatch] = useState<string | null>(null)
    const [calcResult, setCalcResult] = useState<Record<string, { ok: boolean, msg: string }>>({})
    const [scoredMatchIds, setScoredMatchIds] = useState<Set<string>>(new Set(initialScoredMatchIds))
    const [notifiedMatchIds, setNotifiedMatchIds] = useState<Set<string>>(
        new Set(matches.filter(m => m.notifications_sent).map(m => m.id))
    )
    const [recalculating, setRecalculating] = useState(false)
    const [recalcResult, setRecalcResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const [recalcKnockout, setRecalcKnockout] = useState(false)
    const [recalcKnockoutResult, setRecalcKnockoutResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const [recalcGlobal, setRecalcGlobal] = useState(false)
    const [recalcGlobalResult, setRecalcGlobalResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const [recalcPools, setRecalcPools] = useState(false)
    const [recalcPoolsResult, setRecalcPoolsResult] = useState<{ ok: boolean; msg: string } | null>(null)

    // Modal de notificações por jogo
    const [notifModalMatchId, setNotifModalMatchId] = useState<string | null>(null)
    const [notifModalHits, setNotifModalHits] = useState<MatchHit[]>([])
    const [loadingHits, setLoadingHits] = useState(false)
    const [notifying, setNotifying] = useState(false)
    const [notifyResult, setNotifyResult] = useState<{ ok: boolean; msg: string } | null>(null)

    const openNotifModal = async (matchId: string) => {
        setNotifModalMatchId(matchId)
        setNotifModalHits([])
        setNotifyResult(null)
        setLoadingHits(true)
        try {
            const hits = await getMatchHits(matchId)
            setNotifModalHits(hits)
        } finally {
            setLoadingHits(false)
        }
    }

    const handleNotifyAll = async () => {
        if (!notifModalMatchId) return
        setNotifying(true)
        setNotifyResult(null)
        try {
            const res = await notifyMatchHits(notifModalMatchId)
            setNotifyResult({ ok: true, msg: `${res.notified} notificações enviadas` })
            setNotifiedMatchIds(prev => new Set([...prev, notifModalMatchId]))
        } catch (e: any) {
            setNotifyResult({ ok: false, msg: e.message })
        } finally {
            setNotifying(false)
        }
    }

    const handleRecalculateKnockout = async () => {
        setRecalcKnockout(true)
        setRecalcKnockoutResult(null)
        try {
            const res = await recalculateKnockoutScores()
            setRecalcKnockoutResult({ ok: true, msg: res.matchesProcessed === 0 ? 'Nenhum jogo de mata-mata finalizado' : `${res.matchesProcessed} jogo(s) recalculados` })
        } catch (e: any) {
            setRecalcKnockoutResult({ ok: false, msg: e.message })
        } finally {
            setRecalcKnockout(false)
        }
    }

    const handleRecalculatePoolStatuses = async () => {
        setRecalcPools(true)
        setRecalcPoolsResult(null)
        try {
            const res = await recalculatePoolStatuses()
            setRecalcPoolsResult({ ok: true, msg: res.updated === 0 ? 'Todos os bolões já estão atualizados' : `${res.updated} bolão(ões) atualizado(s)` })
        } catch (e: any) {
            setRecalcPoolsResult({ ok: false, msg: e.message })
        } finally {
            setRecalcPools(false)
        }
    }

    const handleRecalculateGlobal = async () => {
        setRecalcGlobal(true)
        setRecalcGlobalResult(null)
        try {
            const res = await recalculateGlobalRanking()
            setRecalcGlobalResult({ ok: true, msg: res.matchesProcessed === 0 ? 'Nenhum jogo processado' : `${res.matchesProcessed} jogo(s) processados` })
        } catch (e: any) {
            setRecalcGlobalResult({ ok: false, msg: e.message })
        } finally {
            setRecalcGlobal(false)
        }
    }

    const handleRecalculateAll = async () => {
        setRecalculating(true)
        setRecalcResult(null)
        try {
            const res = await recalculateAllScores()
            setRecalcResult({ ok: true, msg: `${res.matchesProcessed} jogos recalculados` })
        } catch (e: any) {
            setRecalcResult({ ok: false, msg: e.message })
        } finally {
            setRecalculating(false)
        }
    }

    // Player stats
    const [playerStats, setPlayerStats] = useState(initialStats)
    const [newPlayer, setNewPlayer] = useState<{ player: typeof PLAYERS[0] | null, goals: string, assists: string }>({ player: null, goals: '0', assists: '0' })
    const [addingPlayer, setAddingPlayer] = useState(false)
    const [addPlayerFeedback, setAddPlayerFeedback] = useState<{ ok: boolean, msg: string } | null>(null)

    // Team cards stats
    const [teamStats, setTeamStats] = useState<TeamStat[]>(initialTeamStats)
    const [selectedTeam, setSelectedTeam] = useState<string>('')
    const [addingCard, setAddingCard] = useState(false)
    const [addCardFeedback, setAddCardFeedback] = useState<{ ok: boolean, msg: string } | null>(null)

    // Sync control
    const [syncPaused, setSyncPausedState] = useState(initialSyncPaused)
    const [togglingSync, setTogglingSync] = useState(false)
    const handleToggleSync = async (paused: boolean) => {
        setTogglingSync(true)
        setSyncPausedState(paused)
        await setSyncPaused(paused)
        setTogglingSync(false)
    }

    // Sync manual
    const [syncing, setSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const handleRunSync = async () => {
        setSyncing(true)
        setSyncResult(null)
        try {
            const data = await runSync()
            if ('skipped' in data && data.skipped) {
                setSyncResult({ ok: true, msg: `Pulado: ${(data as any).reason}` })
            } else if ('error' in data) {
                setSyncResult({ ok: false, msg: (data as any).error })
            } else {
                const d = data as any
                setSyncResult({ ok: true, msg: `${d.groupMatchesSynced ?? 0} jogos sincronizados • ${d.matchesFinished ?? 0} processados` })
            }
        } catch (e: any) {
            setSyncResult({ ok: false, msg: e.message })
        } finally {
            setSyncing(false)
        }
    }


    // Group standings
    const [standings, setStandings] = useState<GroupStandingEntry[]>(initialStandings)
    const [standingEdits, setStandingEdits] = useState<Record<string, GroupStandingEntry>>({})
    const [savingStanding, setSavingStanding] = useState<string | null>(null)

    const standingGroups = [...new Set(standings.map(s => s.group_name))].sort()

    const getStandingKey = (s: GroupStandingEntry) => `${s.group_name}__${s.team}`

    const getEditedStanding = (s: GroupStandingEntry): GroupStandingEntry =>
        standingEdits[getStandingKey(s)] ?? s

    const updateStandingField = (s: GroupStandingEntry, field: keyof GroupStandingEntry, value: string) => {
        const key = getStandingKey(s)
        setStandingEdits(prev => ({
            ...prev,
            [key]: { ...(prev[key] ?? s), [field]: field === 'group_name' || field === 'team' || field === 'id' ? value : Number(value) }
        }))
    }

    const handleSaveStanding = async (s: GroupStandingEntry) => {
        const key = getStandingKey(s)
        const edited = standingEdits[key] ?? s
        setSavingStanding(key)
        const { id, ...rest } = edited
        await upsertTeamStanding(rest)
        setStandings(prev => prev.map(x => getStandingKey(x) === key ? edited : x))
        setStandingEdits(prev => { const n = { ...prev }; delete n[key]; return n })
        setSavingStanding(null)
    }

    // Navigation
    const [section, setSection] = useState<'matches' | 'stats'>('matches')
    const [statsSubTab, setStatsSubTab] = useState<StatsSubTab>('scorers')
    const [matchTab, setMatchTab] = useState<'started' | 'upcoming'>('started')

    const liveStatuses = ['live', 'in_play', 'playing', 'halftime', 'delayed']
    const isMatchStarted = (m: Match) =>
        m.status === 'completed' || liveStatuses.includes(m.status) || new Date(m.match_date) < new Date()

    const startedMatches = [...matches]
        .filter(m => isMatchStarted(m))
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
    const upcomingMatches = [...matches]
        .filter(m => !isMatchStarted(m))
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

    const filteredMatches = matchTab === 'started' ? startedMatches : upcomingMatches

    const handleProcessMatch = async (id: string) => {
        setCalculatingMatch(id)
        setCalcResult(prev => { const n = { ...prev }; delete n[id]; return n })
        try {
            const res = await processMatchAndCalculate(id)
            setCalcResult(prev => ({ ...prev, [id]: { ok: true, msg: `${res.goalsUpdated} gol(s) • ${res.poolsUpdated} bolão(ões) atualizados${res.statsNote}` } }))
            setScoredMatchIds(prev => new Set([...prev, id]))
        } catch (e: any) {
            setCalcResult(prev => ({ ...prev, [id]: { ok: false, msg: e.message } }))
        } finally {
            setCalculatingMatch(null)
        }
    }

    const handleSaveMatch = async (id: string) => {
        setSavingMatch(id)
        setMatchFeedback(prev => { const n = { ...prev }; delete n[id]; return n })
        const s = matchStates[id]
        try {
            await updateMatch(
                id,
                s.status,
                s.home_score !== '' ? Number(s.home_score) : null,
                s.away_score !== '' ? Number(s.away_score) : null,
                s.home_pen_score !== '' ? Number(s.home_pen_score) : null,
                s.away_pen_score !== '' ? Number(s.away_pen_score) : null,
            )
            setMatchFeedback(prev => ({ ...prev, [id]: { ok: true, msg: 'Salvo com sucesso' } }))
        } catch (e: any) {
            setMatchFeedback(prev => ({ ...prev, [id]: { ok: false, msg: e.message } }))
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
        setAddPlayerFeedback(null)
        try {
            await addPlayerStat(newPlayer.player.name, newPlayer.player.team, Number(newPlayer.goals), Number(newPlayer.assists))
            setPlayerStats(prev => [...prev, { id: Date.now().toString(), player_name: newPlayer.player!.name, team: newPlayer.player!.team, goals: Number(newPlayer.goals), assists: Number(newPlayer.assists) }])
            setNewPlayer({ player: null, goals: '0', assists: '0' })
            setAddPlayerFeedback({ ok: true, msg: 'Jogador adicionado com sucesso' })
        } catch (e: any) {
            setAddPlayerFeedback({ ok: false, msg: e.message })
        } finally {
            setAddingPlayer(false)
        }
    }

    const handleAddCard = async (team: string, cardType: 'yellow' | 'red') => {
        if (!team) return
        setAddingCard(true)
        setAddCardFeedback(null)
        try {
            await addTeamCard(team, cardType)
            setTeamStats(prev => {
                const existing = prev.find(t => t.team === team)
                if (existing) {
                    return prev.map(t => t.team === team
                        ? {
                            ...t,
                            yellow_cards: cardType === 'yellow' ? t.yellow_cards + 1 : t.yellow_cards,
                            red_cards: cardType === 'red' ? t.red_cards + 1 : t.red_cards,
                        }
                        : t
                    )
                }
                return [...prev, { team, yellow_cards: cardType === 'yellow' ? 1 : 0, red_cards: cardType === 'red' ? 1 : 0 }]
            })
            setAddCardFeedback({ ok: true, msg: `Cartão ${cardType === 'yellow' ? 'amarelo' : 'vermelho'} adicionado` })
        } catch (e: any) {
            setAddCardFeedback({ ok: false, msg: e.message })
        } finally {
            setAddingCard(false)
        }
    }

    const handleDecrementCard = async (team: string, cardType: 'yellow' | 'red') => {
        await decrementTeamCard(team, cardType)
        setTeamStats(prev => prev.map(t => t.team === team
            ? {
                ...t,
                yellow_cards: cardType === 'yellow' ? Math.max(0, t.yellow_cards - 1) : t.yellow_cards,
                red_cards: cardType === 'red' ? Math.max(0, t.red_cards - 1) : t.red_cards,
            }
            : t
        ))
    }

const scorersSorted = [...playerStats].filter(p => p.goals > 0).sort((a, b) => a.team.localeCompare(b.team) || a.player_name.localeCompare(b.player_name))
    const assistsSorted = [...playerStats].filter(p => p.assists > 0).sort((a, b) => a.team.localeCompare(b.team) || a.player_name.localeCompare(b.player_name))
    const cardsSorted = [...teamStats].sort((a, b) => a.team.localeCompare(b.team))

    const subTabLabel: Record<StatsSubTab, string> = {
        scorers: 'Artilheiros',
        assists: 'Assistentes',
        cards: 'Cartões',
        groups: 'Grupos',
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

            {/* Sync control */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: syncPaused ? 'rgba(255,68,68,0.07)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${syncPaused ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '12px', px: 2, py: 1.5, mb: 3,
            }}>
                <Box>
                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Sync automático</Typography>
                    <Typography sx={{ color: syncPaused ? '#ff6b6b' : 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {syncPaused ? 'Pausado — nenhum sync será feito' : 'Ativo — sincroniza durante os jogos'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {togglingSync && <CircularProgress size={14} sx={{ color: 'rgba(255,255,255,0.4)' }} />}
                    <Switch
                        checked={!syncPaused}
                        onChange={e => handleToggleSync(!e.target.checked)}
                        disabled={togglingSync}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4caf50' },
                        }}
                    />
                </Box>
            </Box>

            {/* Sync manual */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', px: 2, py: 1.5, mb: 3,
            }}>
                <Box>
                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Rodar sync agora</Typography>
                    <Typography sx={{ color: syncResult ? (syncResult.ok ? '#4caf50' : '#ff6b6b') : 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {syncResult ? syncResult.msg : 'Busca jogos da API e processa encerrados'}
                    </Typography>
                </Box>
                <Button
                    onClick={handleRunSync}
                    disabled={syncing}
                    size="small"
                    variant="outlined"
                    startIcon={syncing ? <CircularProgress size={12} color="inherit" /> : undefined}
                    sx={{
                        color: '#60a5fa',
                        borderColor: 'rgba(96,165,250,0.4)',
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: 'none',
                        px: 2,
                        '&:hover': { borderColor: '#60a5fa', bgcolor: 'rgba(96,165,250,0.08)' },
                        '&.Mui-disabled': { color: 'rgba(96,165,250,0.3)', borderColor: 'rgba(96,165,250,0.2)' },
                    }}
                >
                    {syncing ? 'Sincronizando...' : '🔄 Rodar sync'}
                </Button>
            </Box>


            {/* Recalcular pontos mata-mata */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', px: 2, py: 1.5, mb: 3,
            }}>
                <Box>
                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Recalcular pontos Mata-Mata</Typography>
                    <Typography sx={{ color: recalcKnockoutResult ? (recalcKnockoutResult.ok ? '#4caf50' : '#ff6b6b') : 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {recalcKnockoutResult ? recalcKnockoutResult.msg : 'Recalcula só os jogos finalizados do mata-mata (R32, R16, QF, SF, 3rd, Final)'}
                    </Typography>
                </Box>
                <Button
                    onClick={handleRecalculateKnockout}
                    disabled={recalcKnockout}
                    size="small"
                    variant="outlined"
                    startIcon={recalcKnockout ? <CircularProgress size={12} color="inherit" /> : undefined}
                    sx={{
                        color: '#a78bfa',
                        borderColor: 'rgba(167,139,250,0.4)',
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: 'none',
                        px: 2,
                        '&:hover': { borderColor: '#a78bfa', bgcolor: 'rgba(167,139,250,0.08)' },
                        '&.Mui-disabled': { color: 'rgba(167,139,250,0.3)', borderColor: 'rgba(167,139,250,0.2)' },
                    }}
                >
                    {recalcKnockout ? 'Calculando...' : '🏆 Recalcular Mata-Mata'}
                </Button>
            </Box>

            {/* Recalcular Status dos Bolões */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', mb: 2 }}>
                <Box>
                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Recalcular Status dos Bolões</Typography>
                    <Typography sx={{ color: recalcPoolsResult ? (recalcPoolsResult.ok ? '#4caf50' : '#ff6b6b') : 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {recalcPoolsResult ? recalcPoolsResult.msg : 'Move bolões finalizados para histórico'}
                    </Typography>
                </Box>
                <Button
                    onClick={handleRecalculatePoolStatuses}
                    disabled={recalcPools}
                    size="small"
                    variant="outlined"
                    startIcon={recalcPools ? <CircularProgress size={12} color="inherit" /> : undefined}
                    sx={{
                        color: '#60a5fa',
                        borderColor: 'rgba(96,165,250,0.4)',
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: 'none',
                        px: 2,
                        '&:hover': { borderColor: '#60a5fa', bgcolor: 'rgba(96,165,250,0.08)' },
                        '&.Mui-disabled': { color: 'rgba(96,165,250,0.3)', borderColor: 'rgba(96,165,250,0.2)' },
                    }}
                >
                    {recalcPools ? 'Calculando...' : '📋 Recalcular Bolões'}
                </Button>
            </Box>

            {/* Recalcular Ranking Global */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', mb: 2 }}>
                <Box>
                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Recalcular Ranking Global</Typography>
                    <Typography sx={{ color: recalcGlobalResult ? (recalcGlobalResult.ok ? '#4caf50' : '#ff6b6b') : 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {recalcGlobalResult ? recalcGlobalResult.msg : 'Reconstrói pontos por jogo (independente de bolão)'}
                    </Typography>
                </Box>
                <Button
                    onClick={handleRecalculateGlobal}
                    disabled={recalcGlobal}
                    size="small"
                    variant="outlined"
                    startIcon={recalcGlobal ? <CircularProgress size={12} color="inherit" /> : undefined}
                    sx={{
                        color: '#34d399',
                        borderColor: 'rgba(52,211,153,0.4)',
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: 'none',
                        px: 2,
                        '&:hover': { borderColor: '#34d399', bgcolor: 'rgba(52,211,153,0.08)' },
                        '&.Mui-disabled': { color: 'rgba(52,211,153,0.3)', borderColor: 'rgba(52,211,153,0.2)' },
                    }}
                >
                    {recalcGlobal ? 'Calculando...' : '🌍 Recalcular Global'}
                </Button>
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
                            {s === 'matches' ? 'Jogos' : 'Estatísticas'}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Matches */}
            {section === 'matches' && (
                <Stack spacing={2}>
                    {/* Tabs */}
                    <Box sx={{ display: 'flex', gap: 1, pb: 1 }}>
                        {(['started', 'upcoming'] as const).map(t => (
                            <Box key={t} onClick={() => setMatchTab(t)} sx={{
                                px: 2.5, py: 0.75, borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                                borderColor: matchTab === t ? '#C9940A' : 'rgba(255,255,255,0.1)',
                                bgcolor: matchTab === t ? 'rgba(201,148,10,0.12)' : 'transparent',
                            }}>
                                <Typography sx={{ color: matchTab === t ? '#C9940A' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>
                                    {t === 'started'
                                        ? `Iniciados/Completados${startedMatches.length > 0 ? ` (${startedMatches.length})` : ''}`
                                        : `Em breve${upcomingMatches.length > 0 ? ` (${upcomingMatches.length})` : ''}`}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {filteredMatches.map(match => {
                        const s = matchStates[match.id]
                        const saving = savingMatch === match.id
                        const date = new Date(match.match_date)
                        return (
                            <Card key={match.id} sx={{ bgcolor: 'rgba(12,12,12)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Avatar src={getFlagUrl(match.home_team, 40)} sx={{ width: 24, height: 24 }} />
                                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{translateTeam(match.home_team)}</Typography>
                                    {match.status === 'completed' && (match.home_yellows > 0 || match.home_reds > 0) && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {match.home_yellows > 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                    <Box sx={{ width: 8, height: 11, bgcolor: '#f5c518', borderRadius: '1px' }} />
                                                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>{match.home_yellows}</Typography>
                                                </Box>
                                            )}
                                            {match.home_reds > 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                    <Box sx={{ width: 8, height: 11, bgcolor: '#ff4444', borderRadius: '1px' }} />
                                                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>{match.home_reds}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>x</Typography>
                                    {match.status === 'completed' && (match.away_yellows > 0 || match.away_reds > 0) && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {match.away_yellows > 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                    <Box sx={{ width: 8, height: 11, bgcolor: '#f5c518', borderRadius: '1px' }} />
                                                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>{match.away_yellows}</Typography>
                                                </Box>
                                            )}
                                            {match.away_reds > 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                                    <Box sx={{ width: 8, height: 11, bgcolor: '#ff4444', borderRadius: '1px' }} />
                                                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>{match.away_reds}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{translateTeam(match.away_team)}</Typography>
                                    <Avatar src={getFlagUrl(match.away_team, 40)} sx={{ width: 24, height: 24 }} />
                                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, ml: 'auto' }}>
                                        <span suppressHydrationWarning>
                                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })} • {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h
                                    </span>
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
                                        <MenuItem value="halftime">Intervalo</MenuItem>
                                        <MenuItem value="extra_time">Prorrogação</MenuItem>
                                        <MenuItem value="penalties">Pênaltis</MenuItem>
                                        <MenuItem value="delayed">Atrasado</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
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
                                    {!match.round.toLowerCase().startsWith('group') && (s.status === 'penalties' || s.status === 'completed') && (
                                        <>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}>pen</Typography>
                                            <TextField
                                                value={s.home_pen_score}
                                                onChange={e => setMatchStates(prev => ({ ...prev, [match.id]: { ...prev[match.id], home_pen_score: e.target.value } }))}
                                                placeholder="C"
                                                size="small"
                                                slotProps={{ htmlInput: { style: { color: '#fff', width: 24, textAlign: 'center', fontSize: 12, padding: '4px 2px' } } }}
                                                sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 46 }}
                                            />
                                            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>x</Typography>
                                            <TextField
                                                value={s.away_pen_score}
                                                onChange={e => setMatchStates(prev => ({ ...prev, [match.id]: { ...prev[match.id], away_pen_score: e.target.value } }))}
                                                placeholder="F"
                                                size="small"
                                                slotProps={{ htmlInput: { style: { color: '#fff', width: 24, textAlign: 'center', fontSize: 12, padding: '4px 2px' } } }}
                                                sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 46 }}
                                            />
                                        </>
                                    )}
                                    <Button
                                        onClick={() => handleSaveMatch(match.id)}
                                        disabled={saving}
                                        size="small"
                                        sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, fontSize: 12, px: 2, borderRadius: '8px', ml: 'auto', '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' } }}
                                    >
                                        {saving ? <CircularProgress size={14} color="inherit" /> : 'Salvar'}
                                    </Button>
                                    {s.status === 'completed' && (
                                        scoredMatchIds.has(match.id) ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)' }}>
                                                    <Typography sx={{ color: '#4caf50', fontSize: 11, fontWeight: 700 }}>✓ Pontos calculados</Typography>
                                                </Box>
                                                <Button
                                                    onClick={() => handleProcessMatch(match.id)}
                                                    disabled={calculatingMatch === match.id}
                                                    size="small"
                                                    sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 11, px: 1.5, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }, '&.Mui-disabled': { opacity: 0.4 } }}
                                                >
                                                    {calculatingMatch === match.id ? <CircularProgress size={12} color="inherit" /> : '↻'}
                                                </Button>
                                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                                    <Button
                                                        onClick={() => openNotifModal(match.id)}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: notifiedMatchIds.has(match.id) ? 'rgba(76,175,80,0.08)' : 'rgba(255,200,0,0.08)',
                                                            color: notifiedMatchIds.has(match.id) ? '#4caf50' : '#f5c518',
                                                            fontWeight: 700, fontSize: 11, px: 1.5, borderRadius: '8px',
                                                            border: `1px solid ${notifiedMatchIds.has(match.id) ? 'rgba(76,175,80,0.3)' : 'rgba(245,197,24,0.25)'}`,
                                                            '&:hover': { bgcolor: notifiedMatchIds.has(match.id) ? 'rgba(76,175,80,0.15)' : 'rgba(245,197,24,0.15)' },
                                                        }}
                                                    >
                                                        {notifiedMatchIds.has(match.id) ? '🔔✓' : '🔔'}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Button
                                                onClick={() => handleProcessMatch(match.id)}
                                                disabled={calculatingMatch === match.id}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(255,255,255,0.07)', color: '#fff', fontWeight: 700, fontSize: 12, px: 2, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }, '&.Mui-disabled': { opacity: 0.4 } }}
                                            >
                                                {calculatingMatch === match.id ? <CircularProgress size={14} color="inherit" /> : '⚡ Stats + Pontos'}
                                            </Button>
                                        )
                                    )}
                                </Box>
                                {(matchFeedback[match.id] || calcResult[match.id]) && (
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                        {matchFeedback[match.id] && (
                                            <Typography sx={{ fontSize: 11, color: matchFeedback[match.id].ok ? '#4caf50' : '#ff6b6b' }}>
                                                {matchFeedback[match.id].ok ? '✓' : '✗'} {matchFeedback[match.id].msg}
                                            </Typography>
                                        )}
                                        {calcResult[match.id] && (
                                            <Typography sx={{ fontSize: 11, color: calcResult[match.id].ok ? '#4caf50' : '#ff6b6b' }}>
                                                {calcResult[match.id].ok ? '✓' : '✗'} {calcResult[match.id].msg}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Card>
                        )
                    })}
                </Stack>
            )}

            {/* Modal de notificações por jogo */}
            <Dialog
                open={!!notifModalMatchId}
                onClose={() => setNotifModalMatchId(null)}
                slotProps={{ paper: { sx: { bgcolor: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', minWidth: 340, maxWidth: 480 } } }}
            >
                <DialogTitle sx={{ color: '#fff', fontWeight: 800, fontSize: 16, pb: 1 }}>
                    🔔 Quem acertou?
                </DialogTitle>
                <DialogContent sx={{ pt: 0 }}>
                    {loadingHits ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={24} sx={{ color: '#C9940A' }} />
                        </Box>
                    ) : notifModalHits.length === 0 ? (
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, py: 2 }}>
                            Nenhum palpite certo neste jogo ainda.
                        </Typography>
                    ) : (
                        <Stack spacing={1} sx={{ mt: 1 }}>
                            {notifModalHits.map((hit, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <Box>
                                        <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{hit.userName}</Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{hit.poolName}</Typography>
                                    </Box>
                                    <Chip
                                        label={hit.prediction}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#4caf50', fontWeight: 700, fontSize: 11, border: '1px solid rgba(76,175,80,0.3)' }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    )}
                    {notifyResult && (
                        <Typography sx={{ fontSize: 12, mt: 2, color: notifyResult.ok ? '#4caf50' : '#ff6b6b' }}>
                            {notifyResult.ok ? '✓' : '✗'} {notifyResult.msg}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setNotifModalMatchId(null)} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 13, textTransform: 'none' }}>
                        Fechar
                    </Button>
                    <Button
                        onClick={handleNotifyAll}
                        disabled={notifying || notifModalHits.length === 0 || loadingHits}
                        variant="contained"
                        sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, fontSize: 13, textTransform: 'none', borderRadius: '10px', px: 3, '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' } }}
                    >
                        {notifying ? <CircularProgress size={16} color="inherit" /> : `Notificar ${notifModalHits.length > 0 ? `(${notifModalHits.length})` : 'todos'}`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Stats */}
            {section === 'stats' && (
                <Box>
                    {/* Stats sub-tabs */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                        {(['scorers', 'assists', 'cards', 'groups'] as StatsSubTab[]).map(t => (
                            <Box key={t} onClick={() => setStatsSubTab(t)} sx={{
                                px: 2, py: 0.6, borderRadius: '16px', cursor: 'pointer', border: '1px solid',
                                borderColor: statsSubTab === t ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)',
                                bgcolor: statsSubTab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                            }}>
                                <Typography sx={{ color: statsSubTab === t ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700 }}>
                                    {subTabLabel[t]}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Artilheiros */}
                    {statsSubTab === 'scorers' && (
                        <Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, mb: 4 }}>
                                {scorersSorted.length === 0 && (
                                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Nenhum artilheiro registrado ainda.</Typography>
                                )}
                                {scorersSorted.map(p => (
                                    <Card key={p.id} sx={{ bgcolor: 'rgba(12,12,12)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', p: 1.5 }}>
                                        <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 1 }}>{p.player_name}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar src={getFlagUrl(p.team, 40)} sx={{ width: 20, height: 20, flexShrink: 0 }} />
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                                                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>⚽</Typography>
                                                <IconButton size="small" onClick={() => handleStat(p.id, 'goals', -1)} sx={{ color: '#fff', p: 0.2, fontSize: 14 }}>−</IconButton>
                                                <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{p.goals}</Typography>
                                                <IconButton size="small" onClick={() => handleStat(p.id, 'goals', 1)} sx={{ color: '#fff', p: 0.2, fontSize: 14 }}>+</IconButton>
                                            </Box>
                                        </Box>
                                    </Card>
                                ))}
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 3 }} />
                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>Adicionar artilheiro</Typography>
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
                                <Button onClick={handleAddPlayer} disabled={addingPlayer || !newPlayer.player}
                                    sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, fontSize: 13, px: 3, borderRadius: '10px', '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' } }}>
                                    {addingPlayer ? <CircularProgress size={16} color="inherit" /> : 'Adicionar'}
                                </Button>
                            </Box>
                            {addPlayerFeedback && (
                                <Typography sx={{ fontSize: 12, mt: 1.5, color: addPlayerFeedback.ok ? '#4caf50' : '#ff6b6b' }}>
                                    {addPlayerFeedback.ok ? '✓' : '✗'} {addPlayerFeedback.msg}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Assistentes */}
                    {statsSubTab === 'assists' && (
                        <Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, mb: 4 }}>
                                {assistsSorted.length === 0 && (
                                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Nenhuma assistência registrada ainda.</Typography>
                                )}
                                {assistsSorted.map(p => (
                                    <Card key={p.id} sx={{ bgcolor: 'rgba(12,12,12)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', p: 1.5 }}>
                                        <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 1 }}>{p.player_name}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar src={getFlagUrl(p.team, 40)} sx={{ width: 20, height: 20, flexShrink: 0 }} />
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                                                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>🅰️</Typography>
                                                <IconButton size="small" onClick={() => handleStat(p.id, 'assists', -1)} sx={{ color: '#fff', p: 0.2, fontSize: 14 }}>−</IconButton>
                                                <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{p.assists}</Typography>
                                                <IconButton size="small" onClick={() => handleStat(p.id, 'assists', 1)} sx={{ color: '#fff', p: 0.2, fontSize: 14 }}>+</IconButton>
                                            </Box>
                                        </Box>
                                    </Card>
                                ))}
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 3 }} />
                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>Adicionar assistente</Typography>
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
                                <TextField value={newPlayer.assists} onChange={e => setNewPlayer(p => ({ ...p, assists: e.target.value }))} placeholder="Assistências" size="small" type="number"
                                    slotProps={{ htmlInput: { style: { color: '#fff', textAlign: 'center' } } }} sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', width: 100 }} />
                                <Button onClick={handleAddPlayer} disabled={addingPlayer || !newPlayer.player}
                                    sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, fontSize: 13, px: 3, borderRadius: '10px', '&:hover': { bgcolor: '#E6AC10' }, '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' } }}>
                                    {addingPlayer ? <CircularProgress size={16} color="inherit" /> : 'Adicionar'}
                                </Button>
                            </Box>
                            {addPlayerFeedback && (
                                <Typography sx={{ fontSize: 12, mt: 1.5, color: addPlayerFeedback.ok ? '#4caf50' : '#ff6b6b' }}>
                                    {addPlayerFeedback.ok ? '✓' : '✗'} {addPlayerFeedback.msg}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Cartões */}
                    {statsSubTab === 'cards' && (
                        <Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, mb: 4 }}>
                                {cardsSorted.length === 0 && (
                                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Nenhum cartão registrado ainda.</Typography>
                                )}
                                {cardsSorted.map(t => (
                                    <Card key={t.team} sx={{ bgcolor: 'rgba(12,12,12)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', p: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Avatar src={getFlagUrl(t.team, 40)} sx={{ width: 20, height: 20, flexShrink: 0 }} />
                                            <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{translateTeam(t.team)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {/* Amarelos */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                                                <Box sx={{ width: 10, height: 13, bgcolor: '#FFD700', borderRadius: '2px', border: '1px solid rgba(0,0,0,0.3)' }} />
                                                <IconButton size="small" onClick={() => handleDecrementCard(t.team, 'yellow')} sx={{ color: '#fff', p: 0.2, fontSize: 14 }}>−</IconButton>
                                                <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{t.yellow_cards}</Typography>
                                                <IconButton size="small" onClick={() => handleAddCard(t.team, 'yellow')} sx={{ color: '#fff', p: 0.2, fontSize: 14 }}>+</IconButton>
                                            </Box>
                                            {/* Vermelhos */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, ml: 0.5 }}>
                                                <Box sx={{ width: 10, height: 13, bgcolor: '#f44336', borderRadius: '2px', border: '1px solid rgba(0,0,0,0.3)' }} />
                                                <IconButton size="small" onClick={() => handleDecrementCard(t.team, 'red')} sx={{ color: '#fff', p: 0.2, fontSize: 14 }}>−</IconButton>
                                                <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{t.red_cards}</Typography>
                                                <IconButton size="small" onClick={() => handleAddCard(t.team, 'red')} sx={{ color: '#fff', p: 0.2, fontSize: 14 }}>+</IconButton>
                                            </Box>
                                        </Box>
                                    </Card>
                                ))}
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 3 }} />
                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 2 }}>Registrar cartão</Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Autocomplete
                                    options={TEAMS}
                                    getOptionLabel={o => translateTeam(o)}
                                    value={selectedTeam || null}
                                    onChange={(_, val) => setSelectedTeam(val ?? '')}
                                    sx={{ flex: 1, minWidth: 200 }}
                                    slotProps={{ paper: { sx: { bgcolor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', '& .MuiAutocomplete-option': { '&:hover': { bgcolor: 'rgba(201,148,10,0.1)' } } } } }}
                                    renderOption={(props, option, { index }) => {
                                        const { key, ...rest } = props as any
                                        return (
                                            <Box key={`${option}-${index}`} component="li" {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5 }}>
                                                <TeamFlag teamName={option} size={20} />
                                                <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{translateTeam(option)}</Typography>
                                            </Box>
                                        )
                                    }}
                                    renderInput={params => (
                                        <TextField {...params} placeholder="Selecionar seleção..." size="small"
                                            sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }, bgcolor: 'rgba(255,255,255,0.04)', input: { color: '#fff' } }} />
                                    )}
                                />
                                <Button
                                    onClick={() => handleAddCard(selectedTeam, 'yellow')}
                                    disabled={addingCard || !selectedTeam}
                                    size="small"
                                    sx={{ bgcolor: '#c8a000', color: '#000', fontWeight: 700, fontSize: 12, px: 2, borderRadius: '8px', '&:hover': { bgcolor: '#a88800' }, '&.Mui-disabled': { bgcolor: 'rgba(200,160,0,0.3)' } }}
                                >
                                    {addingCard ? <CircularProgress size={14} color="inherit" /> : '🟨 Amarelo'}
                                </Button>
                                <Button
                                    onClick={() => handleAddCard(selectedTeam, 'red')}
                                    disabled={addingCard || !selectedTeam}
                                    size="small"
                                    sx={{ bgcolor: '#c62828', color: '#fff', fontWeight: 700, fontSize: 12, px: 2, borderRadius: '8px', '&:hover': { bgcolor: '#a31515' }, '&.Mui-disabled': { bgcolor: 'rgba(198,40,40,0.3)' } }}
                                >
                                    {addingCard ? <CircularProgress size={14} color="inherit" /> : '🟥 Vermelho'}
                                </Button>
                            </Box>
                            {addCardFeedback && (
                                <Typography sx={{ fontSize: 12, mt: 1.5, color: addCardFeedback.ok ? '#4caf50' : '#ff6b6b' }}>
                                    {addCardFeedback.ok ? '✓' : '✗'} {addCardFeedback.msg}
                                </Typography>
                            )}
                        </Box>
                    )}
           
                                {/* Grupos */}
                    {statsSubTab === 'groups' && (
                        <GroupStandingsAdmin
                            standings={standings}
                            standingGroups={standingGroups}
                            standingEdits={standingEdits}
                            savingStanding={savingStanding}
                            getStandingKey={getStandingKey}
                            getEditedStanding={getEditedStanding}
                            updateStandingField={updateStandingField}
                            handleSaveStanding={handleSaveStanding}
                            setStandings={setStandings}
                        />
                    )}
                </Box>
            )}
        </Box>
    )
}

// ─── Componente de Grupos com Drag-and-Drop ───────────────────────────────────

interface GroupStandingsAdminProps {
    standings: GroupStandingEntry[]
    standingGroups: string[]
    standingEdits: Record<string, GroupStandingEntry>
    savingStanding: string | null
    getStandingKey: (s: GroupStandingEntry) => string
    getEditedStanding: (s: GroupStandingEntry) => GroupStandingEntry
    updateStandingField: (s: GroupStandingEntry, field: keyof GroupStandingEntry, value: string) => void
    handleSaveStanding: (s: GroupStandingEntry) => Promise<void>
    setStandings: React.Dispatch<React.SetStateAction<GroupStandingEntry[]>>
}

function GroupStandingsAdmin({
    standings, standingGroups, standingEdits, savingStanding,
    getStandingKey, getEditedStanding, updateStandingField, handleSaveStanding, setStandings
}: GroupStandingsAdminProps) {
    const [dragGroup, setDragGroup] = useState<string | null>(null)
    const [dragFrom, setDragFrom] = useState<number | null>(null)
    const [dragOver, setDragOver] = useState<number | null>(null)
    const [reordering, setReordering] = useState<string | null>(null)

    const getGroupEntries = (g: string) =>
        standings.filter(s => s.group_name === g).sort((a, b) => a.position - b.position)

    const handleDragStart = (groupName: string, idx: number) => {
        setDragGroup(groupName)
        setDragFrom(idx)
    }

    const handleDrop = async (groupName: string, toIdx: number) => {
        if (dragFrom === null || dragGroup !== groupName || dragFrom === toIdx) {
            setDragFrom(null); setDragOver(null); setDragGroup(null)
            return
        }
        const entries = getGroupEntries(groupName)
        const reordered = [...entries]
        const [moved] = reordered.splice(dragFrom, 1)
        reordered.splice(toIdx, 0, moved)

        const updatedPositions = reordered.map((e, i) => ({ ...e, position: i + 1 }))
        setStandings(prev => {
            const others = prev.filter(s => s.group_name !== groupName)
            return [...others, ...updatedPositions].sort((a, b) =>
                a.group_name.localeCompare(b.group_name) || a.position - b.position
            )
        })

        setReordering(groupName)
        await reorderGroupStandings(groupName, reordered.map(e => e.team))
        setReordering(null)

        setDragFrom(null); setDragOver(null); setDragGroup(null)
    }

    const STAT_FIELDS = [
        { field: 'played' as const, label: 'J' },
        { field: 'wins' as const, label: 'V' },
        { field: 'draws' as const, label: 'E' },
        { field: 'losses' as const, label: 'D' },
        { field: 'goals_for' as const, label: 'GP' },
        { field: 'goals_against' as const, label: 'GC' },
        { field: 'points' as const, label: 'Pts' },
    ] as const

    if (standingGroups.length === 0) {
        return (
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                Nenhuma classificação registrada. Execute o SQL para criar a tabela e adicionar os times.
            </Typography>
        )
    }

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {standingGroups.map(groupName => {
                const entries = getGroupEntries(groupName)
                return (
                    <Box key={groupName}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Grupo {groupName}
                            </Typography>
                            {reordering === groupName && <CircularProgress size={12} sx={{ color: '#C9940A' }} />}
                        </Box>

                        {/* Cabeçalho */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: '24px 1fr 32px 32px 32px 32px 32px 32px 36px 48px',
                            gap: 0,
                            px: 1.5, py: 0.6,
                            bgcolor: 'rgba(255,255,255,0.04)',
                            borderRadius: '8px 8px 0 0',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderBottom: 'none',
                        }}>
                            <Box />
                            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700 }}>Seleção</Typography>
                            {STAT_FIELDS.map(f => (
                                <Typography key={f.field} sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textAlign: 'center' }}>{f.label}</Typography>
                            ))}
                            <Box />
                        </Box>

                        {/* Linhas draggable */}
                        <Box sx={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderTop: 'none',
                            borderRadius: '0 0 10px 10px',
                            overflow: 'hidden',
                        }}>
                            {entries.map((s, i) => {
                                const edited = getEditedStanding(s)
                                const key = getStandingKey(s)
                                const saving = savingStanding === key
                                const isDraggingThis = dragGroup === groupName && dragFrom === i
                                const isDragTarget = dragGroup === groupName && dragOver === i

                                return (
                                    <Box
                                        key={key}
                                        draggable
                                        onDragStart={() => handleDragStart(groupName, i)}
                                        onDragOver={e => { e.preventDefault(); setDragOver(i) }}
                                        onDragLeave={() => setDragOver(null)}
                                        onDrop={() => handleDrop(groupName, i)}
                                        onDragEnd={() => { setDragFrom(null); setDragOver(null); setDragGroup(null) }}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '24px 1fr 32px 32px 32px 32px 32px 32px 36px 48px',
                                            gap: 0,
                                            px: 1.5,
                                            py: 0.75,
                                            alignItems: 'center',
                                            borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                            bgcolor: isDragTarget
                                                ? 'rgba(201,148,10,0.1)'
                                                : isDraggingThis
                                                    ? 'rgba(255,255,255,0.02)'
                                                    : i < 2 ? 'rgba(99,202,132,0.04)' : 'transparent',
                                            borderLeft: i < 2 && !isDragTarget ? '3px solid rgba(99,202,132,0.4)' : isDragTarget ? '3px solid rgba(201,148,10,0.6)' : '3px solid transparent',
                                            cursor: 'grab',
                                            opacity: isDraggingThis ? 0.4 : 1,
                                            transition: 'background 0.1s, border-color 0.1s',
                                        }}
                                    >
                                        <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, lineHeight: 1, userSelect: 'none' }}>⠿</Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                                            <TeamFlag teamName={s.team} size={20} />
                                            <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {translateTeam(s.team)}
                                            </Typography>
                                        </Box>

                                        {STAT_FIELDS.map(f => (
                                            <TextField
                                                key={f.field}
                                                value={edited[f.field] ?? 0}
                                                onChange={e => updateStandingField(s, f.field, e.target.value)}
                                                size="small"
                                                type="number"
                                                onClick={e => e.stopPropagation()}
                                                onMouseDown={e => e.stopPropagation()}
                                                slotProps={{
                                                    htmlInput: {
                                                        style: { color: '#fff', textAlign: 'center', padding: '3px 2px', fontSize: 11 },
                                                        min: 0,
                                                    }
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                                                    '& .MuiOutlinedInput-root': { borderRadius: '4px' },
                                                    bgcolor: 'rgba(255,255,255,0.04)',
                                                    width: 32,
                                                    mx: 0,
                                                    cursor: 'text',
                                                }}
                                            />
                                        ))}

                                        <Button
                                            onClick={e => { e.stopPropagation(); handleSaveStanding(s) }}
                                            disabled={saving}
                                            size="small"
                                            sx={{
                                                bgcolor: '#C9940A', color: '#000', fontWeight: 700,
                                                fontSize: 10, px: 1, minWidth: 0, borderRadius: '6px',
                                                '&:hover': { bgcolor: '#E6AC10' },
                                                '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.3)' },
                                            }}
                                        >
                                            {saving ? <CircularProgress size={10} color="inherit" /> : 'OK'}
                                        </Button>
                                    </Box>
                                )
                            })}
                        </Box>
                    </Box>
                )
            })}
        </Box>
    )
}
