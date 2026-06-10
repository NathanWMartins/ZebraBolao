'use client'

import React, { useState, useActionState, useEffect, Suspense } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CircularProgress from '@mui/material/CircularProgress'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { joinGroup } from './actions'

const initialState = {
  error: null as string | null
}

function JoinGroupForm() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code') || ''
  
  const [code, setCode] = useState(codeFromUrl)
  const [password, setPassword] = useState('')
  const [state, formAction, isPending] = useActionState(joinGroup, initialState)

  useEffect(() => {
    if (codeFromUrl) {
      setCode(codeFromUrl)
    }
  }, [codeFromUrl])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#111110', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: { xs: 2, md: 8 } }}>
        <Box sx={{ mb: 4 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)' }}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 14, '&:hover': { color: '#fff' } }}>Voltar para Home</Typography>
          </Link>
        </Box>

        <Box sx={{
          bgcolor: 'rgba(0,0,0,0.5)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          p: { xs: 3, md: 5 },
        }}>
          <Typography variant="h1" sx={{ color: '#fff', fontSize: '28px', fontWeight: 600, mb: 1 }}>
            Entrar em um Bolão
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, mb: 4 }}>
            Insira o código de convite para participar do grupo.
          </Typography>

          <form action={formAction}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {state?.error && (
                <Box sx={{ p: 2, bgcolor: 'rgba(253, 64, 64, 0.1)', border: '1px solid rgba(253, 64, 64, 0.3)', borderRadius: '8px' }}>
                  <Typography sx={{ color: '#fd4040ff', fontSize: 14 }}>
                    {state.error}
                  </Typography>
                </Box>
              )}

              <TextField
                label="Código de Convite"
                name="code"
                variant="outlined"
                fullWidth
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isPending}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderRadius: '10px' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#C9940A' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#C9940A' },
                }}
              />

              <Box sx={{
                bgcolor: 'rgba(255,255,255,0.01)',
                p: 2,
                borderRadius: '12px',
                border: '0.5px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>
                    Grupo Privado?
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, mt: 0.5 }}>
                    Se o grupo for privado, você precisa informar a senha para entrar.
                  </Typography>
                </Box>

                <TextField
                  label="Senha (opcional)"
                  name="password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderRadius: '10px' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#C9940A' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#C9940A' },
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={isPending}
                sx={{
                  mt: 2,
                  bgcolor: '#C9940A',
                  color: '#000',
                  fontWeight: 600,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: 16,
                  borderRadius: '10px',
                  boxShadow: '0 4px 14px rgba(201,148,10,0.2)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#E6AC10',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(201,148,10,0.3)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(201,148,10,0.4)',
                    color: 'rgba(0,0,0,0.5)',
                  }
                }}
              >
                {isPending ? <CircularProgress size={24} color="inherit" /> : 'Entrar no Bolão'}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  )
}

export default function JoinGroupPageWrapper() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', bgcolor: '#111110', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#C9940A' }} />
      </Box>
    }>
      <JoinGroupForm />
    </Suspense>
  )
}
