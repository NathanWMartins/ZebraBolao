import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import BackButton from '@/app/components/BackButton'
import { getQuickPoolDetail, deleteQuickPool, type QuickMatch, type QuickParticipant, type QuickPrediction } from '../actions'
import QuickPoolDetailClient from './QuickPoolDetailClient'

export default async function QuickPoolDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const detail = await getQuickPoolDetail(id)
  if (!detail) notFound()

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 2, md: 0 }, pb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <BackButton />
      </Box>
      <QuickPoolDetailClient
        pool={detail.pool}
        participants={detail.participants}
        predictions={detail.predictions}
        matches={detail.matches}
      />
    </Box>
  )
}
