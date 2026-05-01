import { Box, Typography, Skeleton } from '@mui/material'

export default function DashboardLoading() {
  return (
    <Box component="main" sx={{ maxWidth: 1200, mx: 'auto', px: 4, py: 6 }}>
      {/* Header Skeleton */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
        mb: 5,
      }}>
        <Box sx={{ flex: 1, width: '100%' }}>
          <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 'clamp(28px, 4vw, 42px)' }} width="60%" />
          <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 'clamp(28px, 4vw, 42px)' }} width="40%" />
        </Box>
        <Box sx={{ flexShrink: 0, alignSelf: { xs: 'center', md: 'center' } }}>
          {/* Countdown Skeleton */}
          <Skeleton variant="rectangular" sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} width={280} height={100} />
        </Box>
      </Box>

      {/* Action Cards Skeleton */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 2,
        mb: 4,
      }}>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{
            bgcolor: 'rgba(0,0,0,0.5)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            height: '100%',
          }}>
            <Skeleton variant="rounded" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '10px' }} />
            <Box>
              <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 15 }} width="60%" />
              <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 13 }} width="90%" />
              <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 13 }} width="70%" />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Próximos Jogos Skeleton */}
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
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 2, md: 0 },
              bgcolor: 'rgba(0,0,0,0.5)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              px: 3,
              py: 2.5,
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 12, mb: 1 }} width="40%" />
                <Skeleton variant="rounded" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
              </Box>
              <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '8px', alignSelf: { xs: 'flex-end', md: 'auto' } }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
