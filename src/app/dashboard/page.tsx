import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from './dashboard-client'
import TournamentStats from './TournamentStats'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import LinkIcon from '@mui/icons-material/Link'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LeaderboardIcon from '@mui/icons-material/Leaderboard'
import TeamFlag from '../components/TeamFlag'
import { translateTeam } from '@/lib/teamTranslations'
import KnockoutBanner from './KnockoutBanner'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
  const todayBRT = formatter.format(now)

  let targetDay = todayBRT
  if (todayBRT < '2026-06-11') {
    targetDay = '2026-06-11'
  }

  // Janela: início do dia atual até fim do dia seguinte (48h)
  const targetDateObj = new Date(`${targetDay}T00:00:00-03:00`)
  const twoDaysLaterObj = new Date(targetDateObj.getTime() + 2 * 86400000)

  // Busca jogos de hoje + amanhã
  const { data: scheduledMatches } = await supabase
    .from('matches')
    .select('*')
    .gte('match_date', targetDateObj.toISOString())
    .lt('match_date', twoDaysLaterObj.toISOString())
    .order('match_date', { ascending: true })

  // Busca jogos ao vivo que podem ter ficado de fora (ex: jogo de 23h que passou da meia-noite)
  const { data: liveMatches } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['live', 'in_play', 'playing', 'halftime', 'delayed', 'extra_time', 'penalties'])
    .order('match_date', { ascending: true })

  // Merge: ao vivo primeiro, depois agendados (sem duplicatas)
  const scheduledIds = new Set((scheduledMatches ?? []).map((m: any) => m.id))
  const extraLive = (liveMatches ?? []).filter((m: any) => !scheduledIds.has(m.id))
  const matches = [...extraLive, ...(scheduledMatches ?? [])]
    .sort((a: any, b: any) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

  const { data: topScorers } = await supabase
    .from('player_stats')
    .select('*')
    .gt('goals', 0)
    .order('goals', { ascending: false })
    .limit(5)

  const { data: topAssists } = await supabase
    .from('player_stats')
    .select('*')
    .gt('assists', 0)
    .order('assists', { ascending: false })
    .limit(5)

  const { data: teamStatsRaw } = await supabase
    .from('team_stats')
    .select('*')
    .or('yellow_cards.gt.0,red_cards.gt.0')
  const teamStats = (teamStatsRaw ?? [])
    .sort((a: any, b: any) => (b.yellow_cards + b.red_cards) - (a.yellow_cards + a.red_cards))
    .slice(0, 8)

  const showStats = !!(topScorers?.length || topAssists?.length || teamStats?.length)

  return (
    <Box component="main" sx={{ maxWidth: 1200, mx: 'auto', px: 4, py: 6 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{
          fontSize: 'clamp(24px, 3.5vw, 36px)',
          fontWeight: 500,
          color: '#fff',
          lineHeight: 1.15,
          letterSpacing: -1,
          mb: 3,
        }}>
          Pronto para acertar<br />
          a <Box component="span" sx={{ color: '#C9940A' }}>zebra</Box> da Copa?
        </Typography>

        {/* Banner Mata-Mata com taça integrada */}
        <KnockoutBanner />
      </Box>

      {/* Cards grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' },
        gap: 2,
        mb: 4,
      }}>
        <ActionCard
          icon={<GroupAddIcon />}
          title="Criar grupo"
          description="Monte seu bolão e convide amigos com um link exclusivo."
          cta="Criar agora"
          href="/dashboard/groups/create"
          highlight
        />
        <ActionCard
          icon={<LinkIcon />}
          title="Entrar em grupo"
          description="Tem um código de convite? Entre no bolão dos seus amigos."
          cta="Usar código"
          href="/dashboard/groups/join"
        />
        <ActionCard
          icon={<SportsSoccerIcon />}
          title="Meus Grupos"
          description="Veja os grupos que você está cadastrado e como está indo"
          cta="Ver Grupos"
          href="/dashboard/my-groups"
        />
        <ActionCard
          icon={<EmojiEventsIcon />}
          title="Ranking Geral"
          description="Dispute com todos os jogadores da plataforma. Seu melhor bolão conta."
          cta="Ver Ranking"
          href="/dashboard/ranking"
          gold
        />
        <ActionCard
          icon={<LeaderboardIcon />}
          title="Classificação"
          description="Acompanhe a tabela de cada grupo da fase de grupos."
          cta="Ver tabela"
          href="/dashboard/standings"
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Próximos Jogos */}
        <Box component="section" sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Próximos jogos
            </Typography>
            <Link href="/dashboard/matches" style={{ textDecoration: 'none' }}>
              <Typography sx={{ fontSize: 12, color: '#C9940A', cursor: 'pointer', '&:hover': { color: '#E6AC10' } }}>
                Ver todos →
              </Typography>
            </Link>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {matches && matches.length > 0 ? (
              matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <Box sx={{
                bgcolor: 'rgba(0,0,0,0.5)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                px: 3,
                py: 4,
                textAlign: 'center',
              }}>
                <CalendarMonthIcon sx={{ fontSize: 36, color: 'rgba(255,255,255,0.2)', mb: 1.5 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 1.6 }}>
                  Nenhum jogo previsto para este dia.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Artilheiros & Assistências */}
        <TournamentStats
          topScorers={topScorers ?? []}
          topAssists={topAssists ?? []}
          teamStats={teamStats ?? []}
          isAdmin={false}
          showStats={showStats}
        />
      </Box>
    </Box>
  )
}

function ActionCard({
  icon,
  title,
  description,
  cta,
  highlight = false,
  gold = false,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  highlight?: boolean
  gold?: boolean
  href?: string
}) {
  const accentColor = gold ? '#E8C44A' : highlight ? '#C9940A' : 'rgba(255,255,255,0.5)'

  const content = (
    <Box sx={{
      borderRadius: '12px',
      p: { xs: 1.5, sm: 3 },
      display: 'flex',
      flexDirection: { xs: 'row', sm: 'column' },
      alignItems: { xs: 'center', sm: 'flex-start' },
      gap: { xs: 1.5, sm: 1.5 },
      cursor: 'pointer',
      transition: 'all 0.2s',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      ...(gold ? {
        background: 'linear-gradient(135deg, rgba(232,196,74,0.1) 0%, rgba(0,0,0,0.55) 65%)',
        border: '1px solid rgba(232,196,74,0.4)',
        '&:hover': {
          background: 'linear-gradient(135deg, rgba(232,196,74,0.16) 0%, rgba(0,0,0,0.55) 65%)',
          borderColor: 'rgba(232,196,74,0.7)',
        },
      } : highlight ? {
        bgcolor: 'rgba(201,148,10,0.07)',
        border: '0.5px solid rgba(201,148,10,0.25)',
        '&:hover': { bgcolor: 'rgba(201,148,10,0.11)', borderColor: 'rgba(201,148,10,0.4)' },
      } : {
        bgcolor: 'rgba(0,0,0,0.5)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.15)' },
      }),
    }}>
      <Box sx={{
        width: { xs: 36, sm: 40 },
        height: { xs: 36, sm: 40 },
        flexShrink: 0,
        borderRadius: '10px',
        bgcolor: gold ? 'rgba(232,196,74,0.15)' : highlight ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accentColor,
        '& svg': { fontSize: { xs: 18, sm: 22 } },
      }}>
        {icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{
            color: gold ? '#E8C44A' : '#fff',
            fontWeight: gold ? 700 : 500,
            fontSize: { xs: 13, sm: 15 },
            mb: { xs: 0, sm: 0.75 },
          }}>
            {title}
          </Typography>
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
            <Typography sx={{ fontSize: 12, color: accentColor, fontWeight: 500 }}>{cta}</Typography>
            <ArrowForwardIcon sx={{ fontSize: 12, color: accentColor }} />
          </Box>
        </Box>
        <Typography sx={{
          color: gold ? 'rgba(232,196,74,0.5)' : 'rgba(255,255,255,0.4)',
          fontSize: { xs: 11, sm: 13 },
          lineHeight: 1.4,
          display: { xs: 'none', sm: 'block' },
        }}>
          {description}
        </Typography>
      </Box>

      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: accentColor, fontWeight: 500 }}>{cta}</Typography>
        <ArrowForwardIcon sx={{ fontSize: 14, color: accentColor }} />
      </Box>
    </Box>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {content}
      </Link>
    )
  }

  return content
}

function MatchCard({ match }: { match: any }) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  const matchTimeBRT = formatter.format(new Date(match.match_date))
  const isLive = ['live', 'in_play', 'playing', 'extra_time', 'penalties'].includes(match.status)
  const isHalftime = match.status === 'halftime'
  const isDelayed = match.status === 'delayed'
  const isExtraTime = match.status === 'extra_time'
  const isPenalties = match.status === 'penalties'
  const isCompleted = ['completed'].includes(match.status)

  return (
    <Box sx={{
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      alignItems: { xs: 'center', md: 'center' },
      justifyContent: 'space-between',
      gap: { xs: 2, md: 0 },
      bgcolor: '#0f0f0e',
      border: `1px solid ${isLive ? 'rgba(253,64,64,0.3)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: '14px',
      px: 3,
      py: 2.5,
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: isLive
          ? 'linear-gradient(135deg, rgba(253,64,64,0.12) 0%, transparent 50%)'
          : 'linear-gradient(135deg, rgba(60,59,110,0.3) 0%, transparent 35%, rgba(0,104,71,0.2) 60%, transparent 75%, rgba(178,34,52,0.25) 100%)',
        pointerEvents: 'none',
      },
    }}>
      <Box sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: { xs: 'center', md: 'flex-start' }
      }}>
        <Typography sx={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          mb: 1,
          letterSpacing: '0.05em',
          textAlign: { xs: 'center', md: 'left' }
        }}>
          {match.round !== 'group' ? match.round : 'Grupo ' + match.group_name} • {matchTimeBRT}h
        </Typography>

        {/* Times + placar + cartões inline */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Time casa */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TeamFlag teamName={match.home_team} size={20} />
            <Typography sx={{ fontSize: { xs: 13, md: 15 }, fontWeight: 600, color: '#fff' }}>
              {translateTeam(match.home_team)}
            </Typography>
            {isCompleted && (match.home_yellows > 0 || match.home_reds > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                {match.home_yellows > 0 && <>
                  <Box sx={{ width: 7, height: 10, bgcolor: '#f5c518', borderRadius: '1px' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700 }}>{match.home_yellows}</Typography>
                </>}
                {match.home_reds > 0 && <>
                  <Box sx={{ width: 7, height: 10, bgcolor: '#ff4444', borderRadius: '1px', ml: 0.3 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700 }}>{match.home_reds}</Typography>
                </>}
              </Box>
            )}
          </Box>

          {/* Placar ou vs */}
          {match.home_score !== null && match.away_score !== null ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: 'rgba(255,255,255,0.05)', px: 1.25, py: 0.4, borderRadius: '6px' }}>
              <Typography sx={{ fontSize: { xs: 13, md: 15 }, fontWeight: 700, color: '#C9940A' }}>{match.home_score}</Typography>
              <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>x</Typography>
              <Typography sx={{ fontSize: { xs: 13, md: 15 }, fontWeight: 700, color: '#C9940A' }}>{match.away_score}</Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>vs</Typography>
          )}

          {/* Time fora */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {isCompleted && (match.away_yellows > 0 || match.away_reds > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                {match.away_yellows > 0 && <>
                  <Box sx={{ width: 7, height: 10, bgcolor: '#f5c518', borderRadius: '1px' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700 }}>{match.away_yellows}</Typography>
                </>}
                {match.away_reds > 0 && <>
                  <Box sx={{ width: 7, height: 10, bgcolor: '#ff4444', borderRadius: '1px', ml: 0.3 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700 }}>{match.away_reds}</Typography>
                </>}
              </Box>
            )}
            <TeamFlag teamName={match.away_team} size={20} />
            <Typography sx={{ fontSize: { xs: 13, md: 15 }, fontWeight: 600, color: '#fff' }}>
              {translateTeam(match.away_team)}
            </Typography>
          </Box>
        </Box>

      </Box>

      <Box sx={{
        position: 'relative',
        bgcolor: isLive ? 'rgba(253,64,64,0.1)' : isCompleted ? 'rgba(99,202,132,0.1)' : isHalftime ? 'rgba(100,160,255,0.1)' : isExtraTime ? 'rgba(167,139,250,0.1)' : isPenalties ? 'rgba(251,146,60,0.1)' : isDelayed ? 'rgba(255,160,50,0.1)' : 'rgba(255,255,255,0.05)',
        color: isLive ? '#fd4040' : isCompleted ? '#63ca84' : isHalftime ? '#64a0ff' : isExtraTime ? '#a78bfa' : isPenalties ? '#fb923c' : isDelayed ? '#ffa032' : 'rgba(255,255,255,0.5)',
        px: 2,
        py: 1,
        alignSelf: { xs: 'center', md: 'auto' },
        borderRadius: '8px',
        border: isLive ? '1px solid rgba(253,64,64,0.25)' : isCompleted ? '1px solid rgba(99,202,132,0.2)' : isHalftime ? '1px solid rgba(100,160,255,0.2)' : isExtraTime ? '1px solid rgba(167,139,250,0.2)' : isPenalties ? '1px solid rgba(251,146,60,0.2)' : isDelayed ? '1px solid rgba(255,160,50,0.2)' : '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <Typography sx={{ fontSize: { xs: 10, md: 13 }, fontWeight: 600 }}>{translate(match)}</Typography>
      </Box>
    </Box>
  )
}


const PHASE_LABELS: Record<string, string> = {
  '1H': '1º Tempo', 'HT': 'Intervalo', '2H': '2º Tempo',
  'ET1': 'Prorrog.', 'ET2': 'Prorrog.', 'PEN': 'Pênaltis',
}

function translate(match: any) {
  switch (match.status) {
    case 'scheduled': return 'Em breve'
    case 'live':
    case 'in_play':
    case 'playing':
      return match.phase && PHASE_LABELS[match.phase] ? PHASE_LABELS[match.phase] : 'Ao vivo'
    case 'halftime': return 'Intervalo'
    case 'extra_time': return match.phase === 'ET2' ? 'Prorrog. 2T' : 'Prorrogação'
    case 'penalties': return 'Pênaltis'
    case 'delayed': return 'Atrasado'
    case 'completed':
    case 'completes': return 'Finalizado'
    default: return match.status || ''
  }
}
