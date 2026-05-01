import { Box, Typography, Skeleton, Stack, Divider } from '@mui/material'

export default function GroupDetailsLoading() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 3, md: 0 }, pb: 8 }}>
      {/* Voltar link */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton variant="text" width={120} sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 14 }} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }} />
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: '32px', mb: 1 }} />
          <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 14 }} />
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
        
        {/* Left Column: Bolões */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="text" width={100} sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 20 }} />
            <Skeleton variant="rectangular" width={120} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
          </Box>

          {/* Tabs Skeleton */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1 }}>
            <Skeleton variant="text" width={60} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Skeleton variant="text" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2].map(i => (
              <Box key={i} sx={{
                bgcolor: 'rgba(0,0,0,0.4)',
                border: '0.5px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
                    <Skeleton variant="text" width={150} sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 18 }} />
                    <Skeleton variant="rectangular" width={60} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '10px' }} />
                  </Stack>
                  <Skeleton variant="text" width={120} sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 13 }} />
                </Box>
                <Skeleton variant="rectangular" width={100} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }} />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right Column: Membros */}
        <Box>
          <Skeleton variant="text" width={120} sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 20, mb: 3 }} />

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'rgba(12, 12, 12)',
            p: 2,
            borderRadius: '12px',
            border: '0.5px solid rgba(255,255,255,0.03)'
          }}>
            {[1, 2, 3].map((i, index) => (
              <Box key={i}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 15 }} />
                    <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.08)', fontSize: 12 }} />
                  </Box>
                </Box>
                {index < 2 && (
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mt: 2 }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>

      </Box>
    </Box>
  )
}
