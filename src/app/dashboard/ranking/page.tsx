import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getGlobalRanking } from '../my-groups/actions'
import GlobalRanking from '../my-groups/GlobalRanking'

export default async function RankingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { ranking, isParticipant, currentUserId } = await getGlobalRanking()

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 3, md: 0 }, pb: 10 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)' }}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 14, '&:hover': { color: '#fff' } }}>Voltar ao Dashboard</Typography>
        </Link>
      </Box>

      <GlobalRanking ranking={ranking} isParticipant={isParticipant} currentUserId={currentUserId} openModalOnMount={!isParticipant} />
    </Box>
  )
}
