import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import DashboardClient from './dashboard-client'
import CountdownClient from './countdown-client'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import LinkIcon from '@mui/icons-material/Link'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

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

  const targetDateObj = new Date(`${targetDay}T00:00:00-03:00`)
  const nextDateObj = new Date(targetDateObj.getTime() + 86400000)

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .gte('match_date', targetDateObj.toISOString())
    .lt('match_date', nextDateObj.toISOString())
    .order('match_date', { ascending: true })

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

      <Box component="section">
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
          <Typography sx={{ fontSize: 12, color: '#C9940A', cursor: 'pointer' }}>
            Ver todos →
          </Typography>
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
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      cursor: 'pointer',
      transition: 'border-color 0.2s, background-color 0.2s',
      height: '100%',
    }}>
      <Box sx={{
        width: 40,
        height: 40,
        borderRadius: '10px',
        bgcolor: highlight ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: highlight ? '#C9940A' : 'rgba(255,255,255,0.5)',
      }}>
        {icon}
      </Box>

      <Box>
        <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 15, mb: 0.75 }}>
          {title}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
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

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      bgcolor: 'rgba(0,0,0,0.5)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      px: 3,
      py: 2.5,
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', mb: 1, letterSpacing: '0.05em' }}>
          {match.round != "group" ? match.round : "Grupo " + match.group_name} • {matchTimeBRT}h
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography sx={{ fontSize: { xs: 13, md: 16 }, fontWeight: 500, color: '#fff' }}>
            {match.home_team}
          </Typography>
          <Typography sx={{ fontSize: { xs: 10, md: 14 }, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            vs
          </Typography>
          <Typography sx={{ fontSize: { xs: 13, md: 16 }, fontWeight: 500, color: '#fff' }}>
            {match.away_team}
          </Typography>
        </Box>
      </Box>
      <Box sx={{
        bgcolor: 'rgba(201,148,10,0.1)',
        color: match.status === 'live' ? '#fd4040ff' : '#C9940A',
        px: 2,
        py: 1,
        mt: { xs: 2, md: 0 },
        borderRadius: '8px',
        border: match.status === 'live' ? '0.5px solid rgba(201, 10, 10, 0.2)' : '0.5px solid rgba(201,148,10,0.2)',
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: match.status === 'live' ? 'rgba(201, 10, 10, 0.2)' : 'rgba(201,148,10,0.15)',
        }
      }}>
        <Typography sx={{ fontSize: { xs: 10, md: 13 }, fontWeight: 600 }}>{translate(match)}</Typography>
      </Box>
    </Box>
  )
}

function translate(match: any) {
  switch (match.status) {
    case 'scheduled':
      return 'Aguardo'
    case 'live':
      return 'Em andamento'
    case 'completes':
      return match.result
    default:
      return ''
  }
}