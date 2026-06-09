'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Jogo de abertura: 11 jun 2026 às 16h (BRT, UTC-3) = 19h UTC
const WC_START = new Date('2026-06-11T19:00:00Z')

function getTimeLeft() {
  const diff = WC_START.getTime() - Date.now()
  if (diff <= 0) return null
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

function TrophySmall() {
  return (
    <svg width="170" height="185" viewBox="0 0 680 440" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tsg" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F5D060" />
          <stop offset="50%" stopColor="#C9940A" />
          <stop offset="100%" stopColor="#8B6000" />
        </radialGradient>
        <linearGradient id="tbg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A07008" />
          <stop offset="30%" stopColor="#D4A017" />
          <stop offset="60%" stopColor="#E6C040" />
          <stop offset="100%" stopColor="#A07008" />
        </linearGradient>
        <linearGradient id="thg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B6000" />
          <stop offset="50%" stopColor="#E6C040" />
          <stop offset="100%" stopColor="#8B6000" />
        </linearGradient>
        <radialGradient id="tbaseg" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#E6AC10" />
          <stop offset="100%" stopColor="#A07008" />
        </radialGradient>
      </defs>
      <g transform="translate(340,250)">
        <circle cx="0" cy="-165" r="88" fill="url(#tsg)" />
        <ellipse cx="-28" cy="-205" rx="24" ry="16" fill="rgba(255,245,180,0.45)" transform="rotate(-20,-28,-205)" />
        <path d="M-55,-80 C-40,-40 -22,10 -24,45 C-26,65 -30,80 -32,95 L32,95 C30,80 26,65 24,45 C22,10 40,-40 55,-80 Z" fill="url(#tbg)" />
        <path d="M-30,-75 C-20,-40 -12,10 -13,45 C-14,62 -16,78 -18,92" stroke="rgba(87, 164, 3, 0.3)" strokeWidth="6" strokeLinecap="round" fill="none" />
        <rect x="-36" y="95" width="72" height="14" rx="7" fill="url(#tbaseg)" />
        <rect x="-34" y="95" width="68" height="7" rx="5" fill="rgba(87, 164, 3, 0.3)" />
        <rect x="-28" y="107" width="56" height="12" rx="6" fill="#067904ff" />
        <rect x="-52" y="117" width="104" height="20" rx="10" fill="url(#tbaseg)" />
        <rect x="-50" y="117" width="100" height="9" rx="7" fill="rgba(87, 164, 3, 0.3)" />
      </g>
    </svg>
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

export function TrophyLarge() {
  return (
    <svg width="260" height="310" viewBox="0 0 680 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tlsg" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F5D060" />
          <stop offset="50%" stopColor="#C9940A" />
          <stop offset="100%" stopColor="#8B6000" />
        </radialGradient>
        <linearGradient id="tlbg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A07008" />
          <stop offset="30%" stopColor="#D4A017" />
          <stop offset="60%" stopColor="#E6C040" />
          <stop offset="100%" stopColor="#A07008" />
        </linearGradient>
        <linearGradient id="tlhg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B6000" />
          <stop offset="50%" stopColor="#E6C040" />
          <stop offset="100%" stopColor="#8B6000" />
        </linearGradient>
        <radialGradient id="tlbaseg" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#E6AC10" />
          <stop offset="100%" stopColor="#A07008" />
        </radialGradient>
      </defs>
      <g transform="translate(340,250)">
        <circle cx="0" cy="-165" r="88" fill="url(#tlsg)" />
        <ellipse cx="-28" cy="-205" rx="24" ry="16" fill="rgba(255,245,180,0.45)" transform="rotate(-20,-28,-205)" />
        <path d="M-55,-80 C-40,-40 -22,10 -24,45 C-26,65 -30,80 -32,95 L32,95 C30,80 26,65 24,45 C22,10 40,-40 55,-80 Z" fill="url(#tlbg)" />
        <path d="M-30,-75 C-20,-40 -12,10 -13,45 C-14,62 -16,78 -18,92" stroke="rgba(255,235,120,0.3)" strokeWidth="6" strokeLinecap="round" fill="none" />
        <rect x="-36" y="95" width="72" height="14" rx="7" fill="url(#tlbaseg)" />
        <rect x="-34" y="95" width="68" height="7" rx="5" fill="rgba(255,235,120,0.3)" />
        <rect x="-28" y="107" width="56" height="12" rx="6" fill="#067904ff" />
        <rect x="-52" y="117" width="104" height="20" rx="10" fill="url(#tlbaseg)" />
        <rect x="-50" y="117" width="100" height="9" rx="7" fill="rgba(255,235,120,0.3)" />
      </g>
    </svg>
  )
}

export default function CountdownClient() {
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft>>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(getTimeLeft())
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const started = mounted && time === null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Taça ilustrada */}
      <Box sx={{ position: 'relative', mb: '-12px' }}>
        <Box sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(201,148,10,0.5) 0%, transparent 70%)',
          filter: 'blur(16px)',
          transform: 'scale(1.4)',
        }} />
        <Box sx={{ position: 'relative' }}>
          <TrophySmall />
        </Box>
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
        mb: 2,
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
          {started ? 'Ao vivo · Copa 2026' : 'Contagem regressiva · Copa 2026'}
        </Typography>
      </Box>

      {started ? (
        /* Copa em andamento */
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{
            fontSize: { xs: 24, sm: 28 },
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
          }}>
            Copa em andamento!
          </Typography>
          <Typography sx={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.4)',
            mt: 0.75,
          }}>
            Faça seus palpites antes do apito inicial.
          </Typography>
        </Box>
      ) : (
        /* Timer */
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.5, sm: 0.75 } }}>
          <TimeUnit value={time!.days} label="dias" />
          <Separator />
          <TimeUnit value={time!.hours} label="horas" />
          <Separator />
          <TimeUnit value={time!.minutes} label="min" />
          <Separator />
          <TimeUnit value={time!.seconds} label="seg" />
        </Box>
      )}
    </Box>
  )
}
