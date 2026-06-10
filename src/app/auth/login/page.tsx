'use client'

import React, { useActionState } from 'react'
import {
  Box, Typography, TextField, Button, CircularProgress, Divider
} from '@mui/material'
import Link from 'next/link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { createClient } from '@/lib/supabase'
import { signInWithEmail } from '../actions'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type State = { error: string; success?: undefined } | { success: boolean; error?: undefined }
const initialState: State = { error: '' }

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

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [state, formAction, isPending] = useActionState<State, FormData>(signInWithEmail, initialState)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const supabase = createClient()

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    setGoogleLoading(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#111110', backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, rgba(255,255,255,0.03) 18px, rgba(255,255,255,0.03) 36px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ mb: 4 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)' }}>
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 13 }}>Voltar</Typography>
          </Link>
        </Box>

        <Box sx={{
          bgcolor: 'rgba(0,0,0,0.5)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          p: { xs: 3, sm: 4 },
        }}>
          <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 600, mb: 0.5 }}>
            Entrar
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mb: 3 }}>
            Acesse sua conta no Zebra Bolão
          </Typography>

          {/* Google */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleLogin}
            disabled={googleLoading || isPending}
            startIcon={<GoogleIcon />}
            sx={{
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.15)',
              borderRadius: '10px',
              py: 1.4,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: 14,
              mb: 2.5,
              '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.04)' },
            }}
          >
            {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
          </Button>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 2.5 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, px: 1 }}>ou</Typography>
          </Divider>

          {/* Form email/senha */}
          <form action={formAction}>
            <input type="hidden" name="next" value={next} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {state?.error && (
                <Box sx={{ p: 1.5, bgcolor: 'rgba(220,38,38,0.1)', border: '0.5px solid rgba(220,38,38,0.3)', borderRadius: '8px' }}>
                  <Typography sx={{ color: '#f87171', fontSize: 13 }}>{state.error}</Typography>
                </Box>
              )}

              <TextField
                label="E-mail"
                name="email"
                type="email"
                required
                fullWidth
                disabled={isPending}
                autoComplete="email"
                sx={inputSx}
              />

              <TextField
                label="Senha"
                name="password"
                type="password"
                required
                fullWidth
                disabled={isPending}
                autoComplete="current-password"
                sx={inputSx}
              />

              <Box sx={{ textAlign: 'right', mt: -1 }}>
                <Link href="/auth/reset-password" style={{ textDecoration: 'none' }}>
                  <Typography sx={{ color: '#C9940A', fontSize: 12, '&:hover': { textDecoration: 'underline' } }}>
                    Esqueci minha senha
                  </Typography>
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isPending}
                sx={{
                  bgcolor: '#C9940A',
                  color: '#000',
                  fontWeight: 600,
                  py: 1.4,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontSize: 15,
                  '&:hover': { bgcolor: '#E6AC10' },
                  '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.4)', color: 'rgba(0,0,0,0.5)' },
                }}
              >
                {isPending ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
              </Button>
            </Box>
          </form>

          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', mt: 3 }}>
            Não tem uma conta?{' '}
            <Link href={`/auth/signup${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`} style={{ textDecoration: 'none' }}>
              <Typography component="span" sx={{ color: '#C9940A', fontSize: 13, '&:hover': { textDecoration: 'underline' } }}>
                Criar conta
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: '100vh', bgcolor: '#111110', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}>
      <LoginForm />
    </Suspense>
  )
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)', borderRadius: '10px' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
    '&.Mui-focused fieldset': { borderColor: '#C9940A' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#C9940A' },
}
