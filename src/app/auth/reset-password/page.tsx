'use client'

import React, { useActionState } from 'react'
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material'
import Link from 'next/link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import { sendPasswordReset } from '../actions'

const initialState = { error: null as string | null, success: false }

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendPasswordReset, initialState)

  if (state?.success) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#111110', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Box sx={{
          width: '100%', maxWidth: 400,
          bgcolor: 'rgba(0,0,0,0.5)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          p: 4,
          textAlign: 'center',
        }}>
          <MarkEmailReadIcon sx={{ fontSize: 48, color: '#C9940A', mb: 2 }} />
          <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 600, mb: 1 }}>
            E-mail enviado!
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, mb: 3 }}>
            Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          </Typography>
          <Link href="/auth/login" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" sx={{ color: '#C9940A', borderColor: 'rgba(201,148,10,0.4)', textTransform: 'none', borderRadius: '10px' }}>
              Voltar ao login
            </Button>
          </Link>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#111110', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ mb: 4 }}>
          <Link href="/auth/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)' }}>
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 13 }}>Voltar ao login</Typography>
          </Link>
        </Box>

        <Box sx={{
          bgcolor: 'rgba(0,0,0,0.5)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          p: { xs: 3, sm: 4 },
        }}>
          <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 600, mb: 0.5 }}>
            Esqueci minha senha
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mb: 3 }}>
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </Typography>

          <form action={formAction}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)', borderRadius: '10px' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                    '&.Mui-focused fieldset': { borderColor: '#C9940A' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#C9940A' },
                }}
              />

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
                {isPending ? <CircularProgress size={22} color="inherit" /> : 'Enviar link'}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  )
}
