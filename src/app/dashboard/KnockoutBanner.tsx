'use client'

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

function TrophyBanner() {
  return (
    <svg width="90" height="120" viewBox="0 0 200 340" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      {/* === ESFERA === */}
      <circle cx="100" cy="85" r="72" fill="url(#kb-sphere)" />
      {/* Sombra na esfera */}
      <circle cx="100" cy="85" r="72" fill="url(#kb-shadow)" />
      {/* Highlight esfera */}
      <circle cx="100" cy="85" r="72" fill="url(#kb-highlight)" />

      {/* Globo terrestre linhas */}
      <g transform="translate(100,85)">
        <path d="M-60,0 Q0,-20 60,0" stroke="rgba(100,70,0,0.3)" strokeWidth="1.5" fill="none"/>
        <path d="M-60,20 Q0,0 60,20" stroke="rgba(100,70,0,0.3)" strokeWidth="1.5" fill="none"/>
        <path d="M0,-72 Q20,0 0,72" stroke="rgba(100,70,0,0.25)" strokeWidth="1.5" fill="none"/>
        <path d="M-30,-65 Q-10,0 -30,65" stroke="rgba(100,70,0,0.2)" strokeWidth="1" fill="none"/>
        <path d="M30,-65 Q10,0 30,65" stroke="rgba(100,70,0,0.2)" strokeWidth="1" fill="none"/>
      </g>

      {/* === PESCOÇO / CONE === */}
      <path d="M72,155 C76,168 80,178 82,192 L118,192 C120,178 124,168 128,155 Z" fill="url(#kb-body)" />
      {/* highlight no cone */}
      <path d="M88,157 C90,170 92,180 93,192" stroke="rgba(255,240,150,0.4)" strokeWidth="3" strokeLinecap="round" fill="none"/>

      {/* === CORPO ALARGADO === */}
      <path d="M82,192 C78,205 72,225 70,248 C68,265 67,278 68,292 L132,292 C133,278 132,265 130,248 C128,225 122,205 118,192 Z" fill="url(#kb-body)" />
      {/* costelas / relevos no corpo */}
      <path d="M86,210 C92,208 108,208 114,210" stroke="rgba(255,240,150,0.3)" strokeWidth="2" fill="none"/>
      <path d="M84,228 C90,225 110,225 116,228" stroke="rgba(255,240,150,0.25)" strokeWidth="2" fill="none"/>
      <path d="M83,248 C90,244 110,244 117,248" stroke="rgba(255,240,150,0.2)" strokeWidth="2" fill="none"/>
      <path d="M83,268 C90,265 110,265 117,268" stroke="rgba(255,240,150,0.15)" strokeWidth="2" fill="none"/>
      {/* highlight lateral corpo */}
      <path d="M88,195 C86,215 84,240 85,290" stroke="rgba(255,240,150,0.35)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>

      {/* === ANEL DOURADO === */}
      <rect x="65" y="292" width="70" height="11" rx="5.5" fill="url(#kb-base)" />
      <rect x="67" y="292" width="66" height="5" rx="4" fill="rgba(255,240,150,0.3)" />

      {/* === FAIXAS VERDES === */}
      <rect x="62" y="303" width="76" height="13" rx="4" fill="#1a7a1a" />
      <rect x="62" y="303" width="76" height="5" rx="3" fill="rgba(100,220,100,0.25)" />
      {/* texto FIFA simplificado */}
      <text x="100" y="313" textAnchor="middle" fontSize="6" fill="rgba(255,255,200,0.7)" fontFamily="serif" letterSpacing="1">FIFA</text>

      {/* === BASE LARGA === */}
      <rect x="55" y="316" width="90" height="13" rx="5" fill="url(#kb-base)" />
      <rect x="57" y="316" width="86" height="6" rx="4" fill="rgba(255,240,150,0.28)" />

      {/* === FAIXA VERDE BASE === */}
      <rect x="50" y="329" width="100" height="12" rx="4" fill="#1a7a1a" />
      <rect x="50" y="329" width="100" height="5" rx="3" fill="rgba(100,220,100,0.2)" />

      {/* === PEDESTAL === */}
      <rect x="45" y="341" width="110" height="16" rx="7" fill="url(#kb-base)" />
      <rect x="47" y="341" width="106" height="7" rx="5" fill="rgba(255,240,150,0.25)" />
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
