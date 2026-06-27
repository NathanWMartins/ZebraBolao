'use client'

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WhatshotIcon from '@mui/icons-material/Whatshot'

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
        mb: 3,
        borderRadius: '16px',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        bgcolor: '#0f0f0e',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Gradiente das bandeiras dos países-sede */}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(60,59,110,0.5) 0%, transparent 35%, rgba(0,104,71,0.35) 60%, transparent 75%, rgba(178,34,52,0.45) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Conteúdo */}
      <Box sx={{
        position: 'relative',
        px: { xs: 2, md: 4 },
        py: { xs: 1.75, md: 3 },
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1.5, md: 3 },
      }}>
        {/* Ícone */}
        <Box sx={{
          flexShrink: 0,
          width: { xs: 40, md: 48 },
          height: { xs: 40, md: 48 },
          borderRadius: '12px',
          bgcolor: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '@keyframes pulse': {
            '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,204,68,0)' },
            '50%': { boxShadow: '0 0 0 8px rgba(255,204,68,0.08)' },
          },
          animation: 'pulse 2.5s ease-in-out infinite',
        }}>
          <WhatshotIcon sx={{ color: '#ffcc44', fontSize: { xs: 20, md: 24 } }} />
        </Box>

        {/* Texto */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{
              px: 1, py: 0.2,
              bgcolor: 'rgba(255,204,68,0.12)',
              border: '1px solid rgba(255,204,68,0.3)',
              borderRadius: '4px',
            }}>
              <Typography sx={{ color: '#ffcc44', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Ao vivo
              </Typography>
            </Box>
            <Box sx={{
              width: 5, height: 5, borderRadius: '50%', bgcolor: '#ffcc44',
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.15 },
              },
              animation: 'blink 1.2s ease-in-out infinite',
            }} />
          </Box>

          <Typography sx={{
            color: '#fff',
            fontSize: { xs: 13, md: 17 },
            fontWeight: 700,
            lineHeight: 1.3,
            mb: { xs: 0, md: 0.4 },
          }}>
            O Mata-Mata começou!
          </Typography>

          <Typography sx={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: { xs: 11, md: 13 },
            lineHeight: 1.5,
            display: { xs: 'none', md: 'block' },
          }}>
            Os pontos agora valem{' '}
            <Box component="span" sx={{ color: '#ffcc44', fontWeight: 700 }}>mais a cada fase</Box>
            {' '}— acerte os jogos do mata-mata e dispare no ranking.
          </Typography>
        </Box>

      </Box>
    </Box>
  )
}
