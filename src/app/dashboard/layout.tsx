import Box from '@mui/material/Box'
import Header from '@/app/components/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#111110',
      backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 36px)',
    }}>
      <Header />
      {children}
    </Box>
  )
}
