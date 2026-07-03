'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { motion } from 'motion/react'

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  highlight?: boolean
  gold?: boolean
  href?: string
}

export default function ActionCard({
  icon,
  title,
  description,
  cta,
  highlight = false,
  gold = false,
  href,
}: ActionCardProps) {
  const accentColor = gold ? '#E8C44A' : highlight ? '#C9940A' : 'rgba(255,255,255,0.5)'

  const content = (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ height: '100%' }}
    >
      <Box sx={{
        borderRadius: '12px',
        p: { xs: 1.5, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 1.5,
        cursor: 'pointer',
        transition: 'background-color 0.2s, border-color 0.2s',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...(gold ? {
          background: 'linear-gradient(135deg, rgba(232,196,74,0.1) 0%, rgba(0,0,0,0.55) 65%)',
          border: '1px solid rgba(232,196,74,0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(232,196,74,0.16) 0%, rgba(0,0,0,0.55) 65%)',
            borderColor: 'rgba(232,196,74,0.7)',
          },
        } : highlight ? {
          bgcolor: 'rgba(201,148,10,0.07)',
          border: '0.5px solid rgba(201,148,10,0.25)',
          '&:hover': { bgcolor: 'rgba(201,148,10,0.11)', borderColor: 'rgba(201,148,10,0.4)' },
        } : {
          bgcolor: 'rgba(0,0,0,0.5)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.15)' },
        }),
      }}>
        <Box sx={{
          width: { xs: 32, sm: 40 },
          height: { xs: 32, sm: 40 },
          flexShrink: 0,
          borderRadius: '10px',
          bgcolor: gold ? 'rgba(232,196,74,0.15)' : highlight ? 'rgba(201,148,10,0.15)' : 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          '& svg': { fontSize: { xs: 18, sm: 22 } },
        }}>
          {icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            color: gold ? '#E8C44A' : '#fff',
            fontWeight: gold ? 700 : 500,
            fontSize: { xs: 13, sm: 15 },
            mb: 0.5,
          }}>
            {title}
          </Typography>
          <Typography sx={{
            color: gold ? 'rgba(232,196,74,0.5)' : 'rgba(255,255,255,0.4)',
            fontSize: { xs: 11, sm: 13 },
            lineHeight: 1.4,
          }}>
            {description}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Typography sx={{ fontSize: { xs: 11, sm: 13 }, color: accentColor, fontWeight: 500 }}>{cta}</Typography>
          <ArrowForwardIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: accentColor }} />
        </Box>
      </Box>
    </motion.div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {content}
      </Link>
    )
  }

  return content
}
