import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import DashboardClient from './dashboard-client'
import CountdownClient from './countdown-client'
import TournamentStats from './TournamentStats'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import LinkIcon from '@mui/icons-material/Link'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import TeamFlag from '../components/TeamFlag'
import { translateTeam } from '@/lib/teamTranslations'

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
    .in('status', ['live', 'in_play', 'playing', 'halftime', 'delayed'])
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

  const showStats = !!(topScorers?.length || topAssists?.length)

  return (
    <Box component="main" sx={{ maxWidth: 1200, mx: 'auto', px: 4, py: 6 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
        mb: 5,
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1" sx={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 500,
            color: '#fff',
            lineHeight: 1.15,
            letterSpacing: -1,
          }}>
            Pronto para acertar<br />
            a <Box component="span" sx={{ color: '#C9940A' }}>zebra</Box> da Copa?
          </Typography>
        </Box>

        {/* Countdown — direita */}
        <Box sx={{
          flexShrink: 0,
          alignSelf: { xs: 'center', md: 'center' },
        }}>
          <CountdownClient />
        </Box>
      </Box>

      {/* Cards grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  highlight?: boolean
  href?: string
}) {
  const content = (
    <Box sx={{
      bgcolor: highlight ? 'rgba(201,148,10,0.07)' : 'rgba(0,0,0,0.5)',
      border: `0.5px solid ${highlight ? 'rgba(201,148,10,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '12px',
      p: { xs: 1.5, sm: 3 },
      display: 'flex',
      flexDirection: { xs: 'row', sm: 'column' },
      alignItems: { xs: 'center', sm: 'flex-start' },
      gap: { xs: 1.5, sm: 1.5 },
      cursor: 'pointer',
      transition: 'border-color 0.2s, background-color 0.2s',
      height: '100%',
    }}>
      <Box sx={{
        width: { xs: 36, sm: 40 },
        height: { xs: 36, sm: 40 },
        flexShrink: 0,
        borderRadius: '10px',
        bgcolor: highlight ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: highlight ? '#C9940A' : 'rgba(255,255,255,0.5)',
        '& svg': { fontSize: { xs: 18, sm: 22 } },
      }}>
        {icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: { xs: 13, sm: 15 }, mb: { xs: 0, sm: 0.75 } }}>
            {title}
          </Typography>
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
            <Typography sx={{ fontSize: 12, color: highlight ? '#C9940A' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {cta}
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 12, color: highlight ? '#C9940A' : 'rgba(255,255,255,0.5)' }} />
          </Box>
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: { xs: 11, sm: 13 }, lineHeight: 1.4, display: { xs: 'none', sm: 'block' } }}>
          {description}
        </Typography>
      </Box>

      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <Typography sx={{
          fontSize: 13,
          color: highlight ? '#C9940A' : 'rgba(255,255,255,0.5)',
          fontWeight: 500,
        }}>
          {cta}
        </Typography>
        <ArrowForwardIcon sx={{
          fontSize: 14,
          color: highlight ? '#C9940A' : 'rgba(255,255,255,0.5)',
        }} />
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
  const isLive = ['live', 'in_play', 'playing'].includes(match.status)
  const isHalftime = match.status === 'halftime'
  const isDelayed = match.status === 'delayed'
  const isFinished = ['finished', 'completed', 'completes'].includes(match.status)

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      alignItems: { xs: 'center', md: 'center' },
      justifyContent: 'space-between',
      gap: { xs: 2, md: 0 },
      bgcolor: 'rgba(0,0,0,0.5)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      px: 3,
      py: 2.5,
    }}>
      <Box sx={{
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

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TeamFlag teamName={match.home_team} size={20} />
            <Typography sx={{ fontSize: { xs: 13, md: 16 }, fontWeight: 500, color: '#fff' }}>
              {translateTeam(match.home_team)}
            </Typography>
          </Box>

          {match.home_score !== null && match.away_score !== null ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.05)', px: 1.5, py: 0.5, borderRadius: '6px' }}>
              <Typography sx={{ fontSize: { xs: 13, md: 16 }, fontWeight: 700, color: '#C9940A' }}>
                {match.home_score}
              </Typography>
              <Typography sx={{ fontSize: { xs: 10, md: 12 }, color: 'rgba(255,255,255,0.3)' }}>
                x
              </Typography>
              <Typography sx={{ fontSize: { xs: 13, md: 16 }, fontWeight: 700, color: '#C9940A' }}>
                {match.away_score}
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: { xs: 10, md: 14 }, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              vs
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TeamFlag teamName={match.away_team} size={20} />
            <Typography sx={{ fontSize: { xs: 13, md: 16 }, fontWeight: 500, color: '#fff' }}>
              {translateTeam(match.away_team)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{
        bgcolor: isLive ? 'rgba(201,10,10,0.1)' : isFinished ? 'rgba(99,202,132,0.12)' : isHalftime ? 'rgba(100,160,255,0.1)' : isDelayed ? 'rgba(255,160,50,0.1)' : 'rgba(201,148,10,0.1)',
        color: isLive ? '#fd4040' : isFinished ? '#63ca84' : isHalftime ? '#64a0ff' : isDelayed ? '#ffa032' : '#C9940A',
        px: 2,
        py: 1,
        alignSelf: { xs: 'center', md: 'auto' },
        borderRadius: '8px',
        border: isLive ? '0.5px solid rgba(201,10,10,0.2)' : isFinished ? '0.5px solid rgba(99,202,132,0.3)' : isHalftime ? '0.5px solid rgba(100,160,255,0.2)' : isDelayed ? '0.5px solid rgba(255,160,50,0.2)' : '0.5px solid rgba(201,148,10,0.2)',
      }}>
        <Typography sx={{ fontSize: { xs: 10, md: 13 }, fontWeight: 600 }}>{translate(match)}</Typography>
      </Box>
    </Box>
  )
}

function translate(match: any) {
  switch (match.status) {
    case 'scheduled':
      return 'Em breve'
    case 'live':
    case 'in_play':
    case 'playing':
      return 'Ao vivo'
    case 'halftime':
      return 'Intervalo'
    case 'delayed':
      return 'Atrasado'
    case 'finished':
    case 'completed':
    case 'completes':
      return 'Finalizado'
    default:
      return match.status || ''
  }
}