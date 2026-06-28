'use client'

import React, { useState } from 'react'
import { Box, Typography, Avatar, IconButton, Button, Dialog, DialogTitle, DialogContent, TextField, Autocomplete, CircularProgress, Stack } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import TeamFlag from '../components/TeamFlag'
import { translateTeam } from '@/lib/teamTranslations'
import { getFlagUrl } from '@/lib/teamFlags'
import { PLAYERS } from '@/lib/players'
import { incrementStat, decrementStat, addPlayerStat } from './admin-actions'

function PlayerStatCard({ player, stat, statLabel, rank, isAdmin, statField }: { player: any, stat: number, statLabel: string, rank: number, isAdmin: boolean, statField: 'goals' | 'assists' }) {
  const [loading, setLoading] = useState(false)

  const handleInc = async () => {
    setLoading(true)
    await incrementStat(player.id, statField)
    setLoading(false)
  }

  const handleDec = async () => {
    setLoading(true)
    await decrementStat(player.id, statField)
    setLoading(false)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: loading ? 0.5 : 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, width: 14 }}>
          {rank}
        </Typography>
        <Avatar
          src={player.team ? getFlagUrl(player.team, 80) : undefined}
          sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <Box>
          <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{player.player_name}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{translateTeam(player.team)}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isAdmin && (
          <IconButton size="small" onClick={handleDec} disabled={loading || stat <= 0} sx={{ color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.05)', p: 0.5 }}>
            <RemoveIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: 40 }}>
          <Typography sx={{ color: '#C9940A', fontSize: 16, fontWeight: 800 }}>{stat}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase' }}>{statLabel}</Typography>
        </Box>
        {isAdmin && (
          <IconButton size="small" onClick={handleInc} disabled={loading} sx={{ color: '#C9940A', bgcolor: 'rgba(201,148,10,0.1)', p: 0.5 }}>
            <AddIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>
    </Box>
  )
}

export default function TournamentStats({ topScorers, topAssists, teamStats, isAdmin, showStats }: { topScorers: any[], topAssists: any[], teamStats: any[], isAdmin: boolean, showStats: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null)
  const [goals, setGoals] = useState(0)
  const [assists, setAssists] = useState(0)

  const allTeams = Array.from(new Set(PLAYERS.map(p => p.team))).sort()
  const teamPlayers = selectedTeam ? PLAYERS.filter(p => p.team === selectedTeam) : []

  const handleSave = async () => {
    if (!selectedPlayer || !selectedTeam) return
    if (goals === 0 && assists === 0) return

    setLoading(true)
    await addPlayerStat(selectedPlayer.name, selectedTeam, goals, assists)
    setLoading(false)
    setOpen(false)
    setSelectedTeam(null)
    setSelectedPlayer(null)
    setGoals(0)
    setAssists(0)
  }

  return (
    <Box component="section" sx={{ flex: { xs: '1 1 auto', md: '1 1 0%' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{
          fontSize: 14,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Estatísticas
        </Typography>
        {isAdmin && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ color: '#C9940A', fontSize: 12, textTransform: 'none' }}>
            Add Jogador
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Artilheiros */}
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.5)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'rgba(201,148,10,0.1)', px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsSoccerIcon sx={{ color: '#C9940A', fontSize: 18 }} />
            <Typography sx={{ color: '#C9940A', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>Artilheiros</Typography>
          </Box>
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {showStats && topScorers && topScorers.length > 0 ? (
              topScorers.map((player: any, idx: number) => (
                <PlayerStatCard key={player.id} player={player} stat={player.goals} statLabel="gols" rank={idx + 1} isAdmin={isAdmin} statField="goals" />
              ))
            ) : (
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', py: 2 }}>
                Nenhum gol registrado.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Assistentes */}
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.5)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'rgba(201,148,10,0.1)', px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon sx={{ color: '#C9940A', fontSize: 18 }} />
            <Typography sx={{ color: '#C9940A', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>Assistências</Typography>
          </Box>
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {showStats && topAssists && topAssists.length > 0 ? (
              topAssists.map((player: any, idx: number) => (
                <PlayerStatCard key={player.id} player={player} stat={player.assists} statLabel="assistências" rank={idx + 1} isAdmin={isAdmin} statField="assists" />
              ))
            ) : (
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', py: 2 }}>
                Nenhuma assistência registrada.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Cartões por seleção */}
        {teamStats && teamStats.length > 0 && (
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.5)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'rgba(245,197,24,0.08)', px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 14, bgcolor: '#f5c518', borderRadius: '1px' }} />
              <Typography sx={{ color: '#f5c518', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>Cartões</Typography>
            </Box>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {teamStats.map((t: any, idx: number) => (
                <Box key={t.team} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, width: 14 }}>{idx + 1}</Typography>
                    <TeamFlag teamName={t.team} size={20} />
                    <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{translateTeam(t.team)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {t.yellow_cards > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <Box sx={{ width: 9, height: 12, bgcolor: '#f5c518', borderRadius: '1px' }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700 }}>{t.yellow_cards}</Typography>
                      </Box>
                    )}
                    {t.red_cards > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <Box sx={{ width: 9, height: 12, bgcolor: '#ff4444', borderRadius: '1px' }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700 }}>{t.red_cards}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Dialog para Adicionar Jogador */}
      <Dialog open={open} onClose={() => setOpen(false)} sx={{ '& .MuiDialog-paper': { bgcolor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', minWidth: 320 } }}>
        <DialogTitle sx={{ color: '#fff' }}>Adicionar Estatística</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={allTeams}
              getOptionLabel={(o) => translateTeam(o)}
              value={selectedTeam}
              onChange={(_, val) => { setSelectedTeam(val); setSelectedPlayer(null) }}
              renderInput={(params) => <TextField {...params} label="Seleção" variant="outlined" sx={{ '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }, input: { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }} />}
              renderOption={(props, option) => {
                const { key, ...rest } = props as any;
                return (
                  <Box component="li" key={key} {...rest} sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#222', color: '#fff' }}>
                    <TeamFlag teamName={option} size={20} />
                    {translateTeam(option)}
                  </Box>
                )
              }}
              slotProps={{ paper: { sx: { bgcolor: '#222', color: '#fff' } } }}
            />

            <Autocomplete
              options={teamPlayers}
              getOptionLabel={(o) => o.name}
              value={selectedPlayer}
              disabled={!selectedTeam}
              onChange={(_, val) => setSelectedPlayer(val)}
              renderInput={(params) => <TextField {...params} label="Jogador" variant="outlined" sx={{ '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }, input: { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }} />}
              slotProps={{ paper: { sx: { bgcolor: '#222', color: '#fff' } } }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Gols"
                type="number"
                value={goals}
                onChange={e => setGoals(parseInt(e.target.value) || 0)}
                sx={{ '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }, input: { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              />
              <TextField
                label="Assistências"
                type="number"
                value={assists}
                onChange={e => setAssists(parseInt(e.target.value) || 0)}
                sx={{ '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }, input: { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              />
            </Box>

            <Button
              variant="contained"
              disabled={loading || !selectedPlayer || (goals === 0 && assists === 0)}
              onClick={handleSave}
              sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#E6AC10' } }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
