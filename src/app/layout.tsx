import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import MuiThemeProvider from './theme-provider'
import type { Metadata } from 'next'
import Script from 'next/script'

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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8642501943006086"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}