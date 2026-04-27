'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Button, Modal, Paper } from '@mui/material'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import GridViewIcon from '@mui/icons-material/GridView'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = createClient()

  // Lê erro de autenticação vindo do callback do Supabase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('auth_error')
    if (err) {
      setAuthError(decodeURIComponent(err))
      setModalOpen(true)
      // Limpa o param da URL sem recarregar
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function handleGoogleLogin() {
    setLoading(true)
    setAuthError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#111110',
      backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 36px)',
    }}>

      {/* Navbar */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'rgba(0, 0, 0, 0.7)',
        px: 3, py: 2.5,
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/LogoZebra.png"
            alt="Logo Zebra"
            width={140}
            height={60}
            style={{ objectFit: 'contain' }}
          />
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Copa 2026
        </Typography>
      </Box>

      {/* Hero */}
      <Box sx={{ px: 4, pt: 8, pb: 8, maxWidth: 1250, mx: 'auto' }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 4,
        }}>
          {/* Texto — lado esquerdo */}
          <Box sx={{ flex: 1, textAlign: 'left' }}>
            <Box sx={{
              display: 'inline-block',
              bgcolor: 'rgba(201,148,10,0.12)',
              border: '0.5px solid rgba(201,148,10,0.3)',
              borderRadius: '20px',
              px: 2, py: 0.6,
              mb: 3,
            }}>
              <Typography sx={{ fontSize: 12, color: '#C9940A' }}>
                Bolão da Copa do Mundo 2026
              </Typography>
            </Box>

            <Typography variant="h1" sx={{
              fontSize: { xs: 36, md: 48 },
              fontWeight: 500,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: -1,
              mb: 2,
            }}>
              Quem vai ser<br />
              a <Box component="span" sx={{ color: '#C9940A' }}>zebra</Box> da Copa?
            </Typography>

            <Typography sx={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.4)',
              maxWidth: 380,
              lineHeight: 1.6,
              mb: 4,
            }}>
              Crie seu grupo, escolha os jogos e dispute com seus amigos. Simples assim.
            </Typography>

            <Button
              variant="contained"
              onClick={() => setModalOpen(true)}
              sx={{
                bgcolor: '#fff',
                color: '#111110',
                borderRadius: '10px',
                px: 3.5, py: 1.6,
                fontSize: 15,
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
              startIcon={<GoogleIcon />}
            >
              Entrar com Google
            </Button>
          </Box>

          {/* Taça — lado direito (desktop) / abaixo (mobile) */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', md: 'flex-end' },
            flexShrink: 0,
            width: { xs: '100%', md: 'auto' },
          }}>
            <Image
              src="/World-CupWhiteLogo.png"
              alt="Taça da Copa do Mundo"
              width={200}
              height={240}
              style={{ objectFit: 'contain' }}
            />
          </Box>
        </Box>
      </Box>

      {/* Features */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 1.5,
        px: 4, pb: 6,
        maxWidth: 1300,
        mx: 'auto',
      }}>
        {[
          {
            title: 'Grupos privados',
            desc: 'Convide amigos com um link. Só quem tem acesso participa.',
            icon: <GridViewIcon sx={{ fontSize: 16, color: '#111110' }} />,
          },
          {
            title: 'Ranking ao vivo',
            desc: 'Pontuação atualizada em tempo real a cada resultado.',
            icon: <EmojiEventsIcon sx={{ fontSize: 16, color: '#111110' }} />,
          },
          {
            title: 'Palpite antes do jogo',
            desc: 'Apostas fecham quando a bola rola. Sem trapaça.',
            icon: <AccessTimeIcon sx={{ fontSize: 16, color: '#111110' }} />,
          },
        ].map((feat) => (
          <Box key={feat.title} sx={{
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            p: 2.5,
          }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '8px',
              bgcolor: '#C9940A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 1.5,
            }}>
              {feat.icon}
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 14, mb: 0.75 }}>
              {feat.title}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.5 }}>
              {feat.desc}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Modal de login */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
        }}>
          <Paper sx={{
            bgcolor: '#1a1a19',
            border: '0.5px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            p: 4,
            textAlign: 'center',
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 20, mb: 1 }}>
              Entrar no Zebra
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mb: authError ? 2 : 3.5 }}>
              Use sua conta Google para entrar ou criar sua conta.
            </Typography>

            {/* Mensagem de erro do OAuth */}
            {authError && (
              <Box sx={{
                bgcolor: 'rgba(220,38,38,0.1)',
                border: '0.5px solid rgba(220,38,38,0.3)',
                borderRadius: '8px',
                px: 2, py: 1.5,
                mb: 2.5,
                textAlign: 'left',
              }}>
                <Typography sx={{ color: '#f87171', fontSize: 12, lineHeight: 1.5 }}>
                  ⚠️ Erro ao entrar: {authError}
                </Typography>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{
                bgcolor: '#fff',
                color: '#111110',
                borderRadius: '10px',
                py: 1.6,
                fontSize: 14,
                fontWeight: 500,
                textTransform: 'none',
                mb: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
              startIcon={<GoogleIcon />}
            >
              {loading ? 'Redirecionando...' : 'Continuar com Google'}
            </Button>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
              Ao entrar, você concorda com os termos de uso do Zebra.
            </Typography>
          </Paper>
        </Box>
      </Modal>
    </Box>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}