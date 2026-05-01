import { Box, Typography } from '@mui/material'
import Link from 'next/link'

export default function Footer() {
    return (
        <Box sx={{
            borderTop: '0.5px solid rgba(255,255,255,0.06)',
            py: 3,
            px: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
        }}>
            <Link href="/privacidade" style={{ textDecoration: 'none' }}>
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', '&:hover': { color: '#C9940A' }, transition: 'color 0.2s' }}>
                    Política de Privacidade
                </Typography>
            </Link>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.1)' }}>·</Typography>
            <Link href="/termos" style={{ textDecoration: 'none' }}>
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', '&:hover': { color: '#C9940A' }, transition: 'color 0.2s' }}>
                    Termos de Uso
                </Typography>
            </Link>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.1)' }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
                © 2026 Zebra Bolão
            </Typography>
        </Box>
    )
}