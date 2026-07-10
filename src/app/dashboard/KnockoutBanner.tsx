'use client'

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

function TrophyBanner() {
  return (
    <svg width="75" height="120" viewBox="440 380 120 192" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradiente principal da esfera */}
        <radialGradient id="kb-sphere" cx="38%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#FFF0A0" />
          <stop offset="25%" stopColor="#F5D060" />
          <stop offset="60%" stopColor="#C9940A" />
          <stop offset="100%" stopColor="#7A5200" />
        </radialGradient>
        {/* Gradiente do corpo */}
        <linearGradient id="kb-body" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7A5200" />
          <stop offset="20%" stopColor="#C9940A" />
          <stop offset="45%" stopColor="#F0CC50" />
          <stop offset="70%" stopColor="#C9940A" />
          <stop offset="100%" stopColor="#7A5200" />
        </linearGradient>
        {/* Gradiente base */}
        <linearGradient id="kb-base" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B4500" />
          <stop offset="30%" stopColor="#D4A017" />
          <stop offset="55%" stopColor="#F0CC50" />
          <stop offset="80%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#6B4500" />
        </linearGradient>
        {/* Highlight esfera */}
        <radialGradient id="kb-highlight" cx="30%" cy="25%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,220,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,220,0)" />
        </radialGradient>
        {/* Sombra esfera */}
        <radialGradient id="kb-shadow" cx="65%" cy="70%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* === CORPO: braços, cintura e pé (mesma silhueta do bracket) === */}
      <path
        d="M462 434 C468 452 482 464 500 470 C518 464 532 452 538 434 C542 452 528 476 521 498 C518 510 517 526 532 548 L468 548 C483 526 482 510 479 498 C472 476 458 452 462 434 Z"
        fill="url(#kb-body)"
      />
      {/* highlight lateral do corpo */}
      <path d="M484 486 C481 505 481 524 488 545" stroke="rgba(255,240,150,0.35)" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* === GLOBO === */}
      <circle cx="500" cy="428" r="45" fill="url(#kb-sphere)" />
      <circle cx="500" cy="428" r="45" fill="url(#kb-shadow)" />
      <circle cx="500" cy="428" r="45" fill="url(#kb-highlight)" />
      {/* meridianos */}
      <g stroke="rgba(100,70,0,0.3)" strokeWidth="1.5" fill="none">
        <path d="M457 415 Q500 401 543 415" />
        <path d="M456 441 Q500 456 544 441" />
        <path d="M500 383 Q483 428 500 473" />
        <path d="M500 383 Q517 428 500 473" strokeOpacity="0.6" />
      </g>

      {/* === ANEL DOURADO === */}
      <rect x="467" y="546" width="66" height="8" rx="3" fill="url(#kb-base)" />
      <rect x="469" y="546" width="62" height="4" rx="2" fill="rgba(255,240,150,0.3)" />

      {/* === FAIXA VERDE === */}
      <rect x="462" y="554" width="76" height="14" rx="4" fill="#0E6B45" />
      <rect x="462" y="554" width="76" height="5" rx="3" fill="rgba(100,220,100,0.25)" />
      <text x="500" y="564" textAnchor="middle" fontSize="7" fill="rgba(255,255,200,0.7)" fontFamily="serif" letterSpacing="1">FIFA</text>

      {/* === ARO INFERIOR (cortado pelo viewBox, mantendo o recorte) === */}
      <rect x="458" y="568" width="84" height="9" rx="3.5" fill="url(#kb-base)" />
      <rect x="460" y="568" width="80" height="4" rx="2" fill="rgba(255,240,150,0.28)" />
    </svg>
  )
}

export default function KnockoutBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        bgcolor: '#0f0f0e',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Gradiente países-sede */}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(60,59,110,0.55) 0%, transparent 35%, rgba(0,104,71,0.4) 60%, transparent 75%, rgba(178,34,52,0.5) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Brilho dourado atrás da taça */}
      <Box sx={{
        position: 'absolute',
        left: { xs: 48, md: 80 },
        top: '50%',
        transform: 'translateY(-50%)',
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(201,148,10,0.4) 0%, transparent 70%)',
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      {/* Conteúdo */}
      <Box sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 2, md: 3 },
      }}>
        {/* Taça */}
        <Box sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          pl: { xs: 1.5, md: 3 },
        }}>
          <TrophyBanner />
        </Box>

        {/* Texto */}
        <Box sx={{ flex: 1, minWidth: 0, py: { xs: 2, md: 2.5 }, pr: { xs: 2, md: 3 } }}>
          <Typography sx={{
            color: '#fff',
            fontSize: { xs: 16, md: 20 },
            fontWeight: 700,
            lineHeight: 1.2,
            mb: { xs: 0.5, md: 0.75 },
          }}>
            O Mata-Mata começou!
          </Typography>
          <Typography sx={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: { xs: 12, md: 13 },
            lineHeight: 1.5,
          }}>
            Os pontos agora valem{' '}
            <Box component="span" sx={{ color: '#ffcc44', fontWeight: 700 }}>mais a cada fase</Box>
            {' '}— acerte os jogos e dispare no ranking.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
