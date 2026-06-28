'use client'

import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function BackButton({ label = 'Voltar' }: { label?: string }) {
  const router = useRouter()
  return (
    <Box
      onClick={() => router.back()}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        '&:hover': { color: '#fff' },
        transition: 'color 0.15s',
      }}
    >
      <ArrowBackIcon sx={{ fontSize: 18 }} />
      <Typography sx={{ fontSize: 14 }}>{label}</Typography>
    </Box>
  )
}
