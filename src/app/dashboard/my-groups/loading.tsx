import { Box, Typography, Skeleton } from '@mui/material'

export default function MyGroupsLoading() {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 3, md: 0 } }}>
      {/* Voltar link */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Skeleton variant="text" width={150} sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 14 }} />
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: '32px', mb: 1 }} />
          <Skeleton variant="text" width="90%" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 14 }} />
        </Box>
        <Skeleton variant="rectangular" width={120} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '8px', display: { xs: 'none', md: 'block' } }} />
        <Skeleton variant="circular" width={42} height={42} sx={{ bgcolor: 'rgba(255,255,255,0.08)', display: { xs: 'block', md: 'none' } }} />
      </Box>

      {/* Grid of Cards */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 3
      }}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Skeleton variant="text" width="50%" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 18 }} />
              <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Skeleton variant="rounded" width={80} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
              <Skeleton variant="rounded" width={80} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
            </Box>

            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Skeleton variant="text" width={100} sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 10 }} />
                <Skeleton variant="text" width={60} sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 14 }} />
              </Box>
              <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
