'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Image from 'next/image'

// Jogo de abertura: 11 jun 2026 às 16h (BRT, UTC-3) = 19h UTC
const WC_START = new Date('2026-06-11T19:00:00Z')

function getTimeLeft() {
  const diff = WC_START.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  }
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{
        bgcolor: 'rgba(0,0,0,0.5)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1, sm: 1.25 },
        minWidth: { xs: 44, sm: 54 },
        backdropFilter: 'blur(8px)',
      }}>
        <Typography sx={{
          fontSize: { xs: 22, sm: 28 },
          fontWeight: 600,
          color: '#fff',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.5px',
        }}>
          {String(value).padStart(2, '0')}
        </Typography>
      </Box>
      <Typography sx={{
        fontSize: 10,
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        mt: 0.75,
      }}>
        {label}
      </Typography>
    </Box>
  )
}

function Separator() {
  return (
    <Typography sx={{
      fontSize: 22,
      fontWeight: 300,
      color: 'rgba(255,255,255,0.2)',
      pb: 2.5,
      lineHeight: 1,
    }}>
      :
    </Typography>
  )
}

export default function CountdownClient() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setTime(getTimeLeft())
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
      {/* Logo da Copa */}
      <Box sx={{ position: 'relative' }}>
        {/* Glow atrás da taça */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(201,148,10,0.9) 0%, transparent 70%)',
          filter: 'blur(16px)',
          transform: 'scale(1.4)',
        }} />
        <Image
          src="/World-CupWhiteLogo.png"
          alt="Copa do Mundo 2026"
          width={90}
          height={110}
          style={{ objectFit: 'contain', position: 'relative' }}
        />
      </Box>

      {/* Badge */}
      <Box sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        bgcolor: 'rgba(201,148,10,0.10)',
        border: '0.5px solid rgba(201,148,10,0.28)',
        borderRadius: '20px',
        px: 1.75,
        py: 0.5,
      }}>
        <Box sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: '#C9940A',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.3 },
          },
        }} />
        <Typography sx={{ fontSize: 11, color: '#C9940A', fontWeight: 500 }}>
          Contagem regressiva · Copa 2026
        </Typography>
      </Box>

      {/* Timer */}
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: { xs: 0.5, sm: 0.75 },
      }}>
        <TimeUnit value={time.days} label="dias" />
        <Separator />
        <TimeUnit value={time.hours} label="horas" />
        <Separator />
        <TimeUnit value={time.minutes} label="min" />
        <Separator />
        <TimeUnit value={time.seconds} label="seg" />
      </Box>
    </Box>
  )
}
