import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'
import TournamentStats from './TournamentStats'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import LinkIcon from '@mui/icons-material/Link'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LeaderboardIcon from '@mui/icons-material/Leaderboard'
import BoltIcon from '@mui/icons-material/Bolt'
import KnockoutBanner from './KnockoutBanner'
import ActionCard from './ActionCard'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: topScorers } = await supabase
    .from('player_stats')
    .select('*')
    .gt('goals', 0)
    .order('goals', { ascending: false })
    .limit(7)

  const { data: topAssists } = await supabase
    .from('player_stats')
    .select('*')
    .gt('assists', 0)
    .order('assists', { ascending: false })
    .limit(7)

  const { data: teamStatsRaw } = await supabase
    .from('team_stats')
    .select('*')
    .or('yellow_cards.gt.0,red_cards.gt.0')
  const teamStats = (teamStatsRaw ?? [])
    .sort((a: any, b: any) => (b.yellow_cards + b.red_cards) - (a.yellow_cards + a.red_cards))
    .slice(0, 10)

  const showStats = !!(topScorers?.length || topAssists?.length || teamStats?.length)
  const isCupOver = new Date() >= new Date('2026-07-19T16:00:00-03:00')

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
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(3, 1fr)' },
        gap: 2,
        mb: 4,
      }}>
        {!isCupOver && (
        <ActionCard
          icon={<GroupAddIcon />}
          title="Criar grupo"
          description="Monte seu bolão e convide amigos com um link exclusivo."
          cta="Criar agora"
          href="/dashboard/groups/create"
          highlight
        />
        )}
        {!isCupOver && (
        <ActionCard
          icon={<LinkIcon />}
          title="Entrar em grupo"
          description="Tem um código de convite? Entre no bolão dos seus amigos."
          cta="Usar código"
          href="/dashboard/groups/join"
        />
        )}
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
        {!isCupOver && (
        <ActionCard
          icon={<BoltIcon />}
          title="Bolão Rápido"
          description="Registre os palpites de todos sem grupos ou convites."
          cta="Criar agora"
          href="/dashboard/quick-pool"
        />
        )}
      </Box>

      <Box>
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

