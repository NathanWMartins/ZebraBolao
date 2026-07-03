import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import BoltIcon from '@mui/icons-material/Bolt'
import BackButton from '@/app/components/BackButton'
import { getQuickPools } from './actions'

export default async function QuickPoolPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const pools = await getQuickPools()

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 3, md: 0 }, pb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <BackButton />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
        <Box>
          <Typography variant="h1" sx={{ color: '#fff', fontSize: 32, fontWeight: 800, mb: 1 }}>
            Bolão Rápido
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Registre os palpites de todos sem precisar de grupos ou convites.
          </Typography>
        </Box>
        <Link href="/dashboard/quick-pool/create" passHref>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#E6AC10' } }}
          >
            Novo
          </Button>
        </Link>
      </Box>

      {pools.length === 0 ? (
        <Box sx={{
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 3,
          p: 6,
          textAlign: 'center',
        }}>
          <BoltIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
          <Typography sx={{ color: '#fff', fontSize: 18, fontWeight: 500, mb: 1 }}>
            Nenhum bolão rápido ainda
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', mb: 4, maxWidth: 360, mx: 'auto' }}>
            Crie um bolão rápido e registre os palpites de todos sem complicação.
          </Typography>
          <Link href="/dashboard/quick-pool/create" passHref>
            <Button variant="contained" sx={{ bgcolor: '#C9940A', color: '#000', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#E6AC10' } }}>
              Criar Bolão Rápido
            </Button>
          </Link>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {pools.map((pool: any) => (
            <Link key={pool.id} href={`/dashboard/quick-pool/${pool.id}`} style={{ textDecoration: 'none' }}>
              <Box sx={{
                bgcolor: 'rgba(0,0,0,0.4)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${pool.status === 'completed' ? '#63ca84' : pool.status === 'live' ? '#ff4444' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 2,
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{pool.name}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, mt: 0.5 }}>
                      {new Date(pool.created_at).toLocaleDateString('pt-BR')} • {(pool.match_ids || []).length} jogo(s)
                    </Typography>
                  </Box>
                  <Box sx={{
                    px: 1.5, py: 0.5, borderRadius: 1, fontSize: 11, fontWeight: 700,
                    color: pool.status === 'completed' ? '#63ca84' : pool.status === 'live' ? '#ff4444' : 'rgba(255,255,255,0.5)',
                    bgcolor: pool.status === 'completed' ? 'rgba(99,202,132,0.1)' : pool.status === 'live' ? 'rgba(255,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${pool.status === 'completed' ? 'rgba(99,202,132,0.3)' : pool.status === 'live' ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'inherit' }}>
                      {pool.status === 'completed' ? 'Finalizado' : pool.status === 'live' ? 'Ao Vivo' : 'Agendado'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Link>
          ))}
        </Box>
      )}
    </Box>
  )
}
