'use client'

import React, { useState, useActionState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { Typography, TextField, Button, Switch, CircularProgress } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { createGroup } from './actions'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

const initialState: any = {
  error: null as string | null,
  success: false,
  group: null
}

export default function CreateGroupPage() {
  const [isPrivate, setIsPrivate] = useState(false)
  const [state, formAction, isPending] = useActionState(createGroup, initialState)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (state?.success && state.group) {
      setInviteUrl(`${window.location.origin}/dashboard/groups/join?code=${state.group.invite_code}`)
    }
  }, [state])

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (state?.success && state.group) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: { xs: 2, md: 8 }, px: { xs: 3, md: 0 } }}>
          <Box sx={{
            bgcolor: 'rgba(0,0,0,0.5)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Typography variant="h1" sx={{ color: '#fff', fontSize: '28px', fontWeight: 600, mb: 1 }}>
              Bolão Criado!
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, mb: 4 }}>
              Seu grupo <strong>{state.group.name}</strong> está pronto. Convide a galera:
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
              Código de Convite
            </Typography>
            <Typography sx={{ color: '#C9940A', fontSize: { xs: 24, md: 32 }, fontWeight: 800, mb: 4, letterSpacing: 4 }}>
              {state.group.invite_code}
            </Typography>

            <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: '16px', mb: 3 }}>
              {inviteUrl && <QRCodeSVG value={inviteUrl} size={200} level="H" includeMargin={false} />}
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={handleCopy}
              startIcon={copied ? null : <ContentCopyIcon />}
              sx={{
                bgcolor: copied ? '#4caf50' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: copied ? '#45a049' : 'rgba(255,255,255,0.2)'
                },
                mb: 2
              }}
            >
              {copied ? 'Link Copiado!' : 'Copiar Link do Grupo'}
            </Button>

            <Button
              component={Link}
              href={`/dashboard/groups/${state.group.id}`}
              variant="contained"
              fullWidth
              sx={{
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
                }
              }}
            >
              Ir para o Grupo
            </Button>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
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
            Criar novo Bolão
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, mb: 4 }}>
            Dê um nome para o seu grupo de apostas e defina como será o acesso.
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
                label="Nome do Grupo"
                name="name"
                variant="outlined"
                fullWidth
                required
                disabled={isPending}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderRadius: '10px' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#C9940A' },
                    '& input:-webkit-autofill': {
                      WebkitBoxShadow: '0 0 0 100px #111110 inset',
                      WebkitTextFillColor: '#fff',
                      transition: 'background-color 5000s ease-in-out 0s',
                    },
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
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>
                    Grupo Privado
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, mt: 0.5 }}>
                    Apenas pessoas com a senha poderão entrar no grupo.
                  </Typography>
                </Box>
                <Switch
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  name="is_private"
                  value="true"
                  disabled={isPending}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#C9940A',
                      '&:hover': {
                        backgroundColor: 'rgba(201,148,10,0.1)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#C9940A',
                    },
                  }}
                />
              </Box>

              <Box sx={{
                height: isPrivate ? 'auto' : 0,
                opacity: isPrivate ? 1 : 0,
                transition: 'all 0.3s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                pt: isPrivate ? 1 : 0 // Espaço para o label não cortar
              }}>
                <TextField
                  label="Senha para convidados"
                  name="password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  disabled={isPending}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)', borderRadius: '10px' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#C9940A' },
                      '& input:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 100px #111110 inset',
                        WebkitTextFillColor: '#fff',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
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
                {isPending ? <CircularProgress size={24} color="inherit" /> : 'Criar Bolão'}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  )
}
