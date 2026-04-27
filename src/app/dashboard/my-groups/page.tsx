import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import AddIcon from '@mui/icons-material/Add'
import GroupCard from './GroupCard'

export default async function MyGroupsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch groups where user is a member
  const { data: memberships } = await supabase
    .from('group_members')
    .select(`
      group_id,
      joined_at,
      groups (
        id,
        name,
        created_at,
        owner_id,
        is_private
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupsList = memberships?.map((m: any) => ({
    ...m.groups,
    joined_at: m.joined_at,
  })).filter(g => g && g.id) || []

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 3, md: 0 } }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)' }}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 14, '&:hover': { color: '#fff' } }}>Voltar ao Dashboard</Typography>
        </Link>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
        <Box>
          <Typography variant="h1" sx={{ color: '#fff', fontSize: '32px', fontWeight: 800, mb: 1 }}>
            Meus Grupos
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Gerencie e acesse todos os bolões dos quais você participa.
          </Typography>
        </Box>
        <Link href="/dashboard/groups/create" passHref>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ mr: { xs: -1.5, md: 0 } }} />}
            sx={{
              bgcolor: '#C9940A',
              color: '#000',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: { xs: '42px', md: 'auto' },
              height: { xs: '42px', md: 'auto' },
              borderRadius: { xs: '50%', md: '8px' },
              px: { xs: 0, md: 3 },
              '&:hover': { bgcolor: '#E6AC10' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              Criar Grupo
            </Box>
          </Button>
        </Link>
      </Box>

      {groupsList.length === 0 ? (
        <Box sx={{
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '12px',
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <SportsSoccerIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
          <Typography sx={{ color: '#fff', fontSize: 18, fontWeight: 500, mb: 1 }}>
            Você ainda não participa de nenhum grupo
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, maxWidth: 400 }}>
            Crie o seu próprio grupo para convidar seus amigos ou entre em um usando o código de convite.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="/dashboard/groups/create" passHref>
              <Button variant="contained" sx={{ bgcolor: '#C9940A', color: '#000', '&:hover': { bgcolor: '#E6AC10' } }}>
                Criar Grupo
              </Button>
            </Link>
            <Link href="/dashboard/groups/join" passHref>
              <Button variant="outlined" sx={{ color: '#C9940A', borderColor: 'rgba(201,148,10,0.5)' }}>
                Usar Código
              </Button>
            </Link>
          </Box>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 3
        }}>
          {groupsList.map(group => {
            const isOwner = group.owner_id === user.id
            return (
              <GroupCard key={group.id} group={group} isOwner={isOwner} />
            )
          })}
        </Box>
      )}
    </Box>
  )
}
