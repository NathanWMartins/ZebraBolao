'use client'

import React, { useActionState } from 'react'
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material'
import { updatePassword } from '../actions'

type State = { error: string; success?: undefined } | { success: boolean; error?: undefined }
const initialState: State = { error: '' }

export default function UpdatePasswordPage() {
  const [state, formAction, isPending] = useActionState<State, FormData>(updatePassword, initialState)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#111110', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{
          bgcolor: 'rgba(0,0,0,0.5)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          p: { xs: 3, sm: 4 },
        }}>
          <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 600, mb: 0.5 }}>
            Nova senha
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mb: 3 }}>
            Digite sua nova senha abaixo.
          </Typography>

          <form action={formAction}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {state?.error && (
                <Box sx={{ p: 1.5, bgcolor: 'rgba(220,38,38,0.1)', border: '0.5px solid rgba(220,38,38,0.3)', borderRadius: '8px' }}>
                  <Typography sx={{ color: '#f87171', fontSize: 13 }}>{state.error}</Typography>
                </Box>
              )}

              <TextField
                label="Nova senha"
                name="password"
                type="password"
                required
                fullWidth
                disabled={isPending}
                autoComplete="new-password"
                helperText="Mínimo 8 caracteres"
                slotProps={{ formHelperText: { sx: { color: 'rgba(255,255,255,0.3)', fontSize: 11 } } }}
                sx={inputSx}
              />

              <TextField
                label="Confirmar nova senha"
                name="confirmPassword"
                type="password"
                required
                fullWidth
                disabled={isPending}
                autoComplete="new-password"
                sx={inputSx}
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
                  mt: 0.5,
                  '&:hover': { bgcolor: '#E6AC10' },
                  '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.4)', color: 'rgba(0,0,0,0.5)' },
                }}
              >
                {isPending ? <CircularProgress size={22} color="inherit" /> : 'Salvar nova senha'}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
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
