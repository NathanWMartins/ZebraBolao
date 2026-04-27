import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import MuiThemeProvider from './theme-provider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Zebra',
  description: 'O Bolão da Copa do Mundo 2026',
  icons: {
    icon: '/LogoZebraMinimalista.png',
    apple: '/LogoZebraMinimalista.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppRouterCacheProvider>
          <MuiThemeProvider>
            {children}
          </MuiThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}