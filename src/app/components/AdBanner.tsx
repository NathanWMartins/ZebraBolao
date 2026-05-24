'use client'

import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface AdBannerProps {
  slot: string
  format?: string
}

export default function AdBanner({ slot, format = 'auto' }: AdBannerProps) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // script ainda não carregado
    }
  }, [])

  return (
    <Box sx={{ width: '100%', textAlign: 'center', overflow: 'hidden' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8642501943006086"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </Box>
  )
}
