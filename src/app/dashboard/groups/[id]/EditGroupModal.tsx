'use client'

import React, { useState } from 'react'
import { Modal, Box, Typography, Button, IconButton, TextField, CircularProgress } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import { updateGroupSettings } from './actions'

interface EditGroupModalProps {
  groupId: string;
}

export default function EditGroupModal({ groupId }: EditGroupModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setName('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Se preencheu a senha, as senhas devem coincidir
    if (password && password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password && password.length < 3) {
      setError('A senha deve ter pelo menos 3 caracteres.')
      return
    }

    if (!name && !password) {
      setError('Preencha ao menos um campo para alterar.')
      return
    }

    setLoading(true)
    try {
      const result = await updateGroupSettings(groupId, name, password)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => handleClose(), 2000)
      }
    } catch (err) {
      setError('Erro ao tentar atualizar as configurações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<EditIcon sx={{ mr: { xs: -1.5, sm: 0 } }} />}
        onClick={handleOpen}
        sx={{
          color: '#C9940A',
          borderColor: 'rgba(201,148,10,0.5)',
          minWidth: { xs: '42px', sm: 'auto' },
          height: { xs: '42px', sm: 'auto' },
          borderRadius: { xs: '50%', sm: '8px' },
          px: { xs: 0, sm: 2 },
          textTransform: 'none',
          fontSize: 14,
          '&:hover': {
            borderColor: '#C9940A',
            bgcolor: 'rgba(201,148,10,0.08)'
          }
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          Editar
        </Box>
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="edit-group-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          bgcolor: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 24,
          p: 4,
          borderRadius: 3,
          outline: 'none'
        }}>
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.5)' }}
          >
            <CloseIcon />
          </IconButton>

          <Typography id="edit-group-modal-title" variant="h6" component="h2" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
            Editar Grupo
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, fontSize: 14 }}>
            Preencha apenas os campos que deseja alterar.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {error && (
                <Box sx={{ p: 1.5, bgcolor: 'rgba(253, 64, 64, 0.1)', border: '1px solid rgba(253, 64, 64, 0.3)', borderRadius: '8px' }}>
                  <Typography sx={{ color: '#fd4040ff', fontSize: 13 }}>
                    {error}
                  </Typography>
                </Box>
              )}

              {success && (
                <Box sx={{ p: 1.5, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '8px' }}>
                  <Typography sx={{ color: '#4caf50', fontSize: 13 }}>
                    Configurações atualizadas!
                  </Typography>
                </Box>
              )}

              <TextField
                label="Novo Nome do Grupo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || success}
                fullWidth
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

              <TextField
                label="Nova Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
                fullWidth
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

              <TextField
                label="Confirmar Nova Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || success}
                fullWidth
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

              <Button
                type="submit"
                variant="contained"
                disabled={loading || success}
                fullWidth
                sx={{
                  bgcolor: '#C9940A',
                  color: '#000',
                  fontWeight: 600,
                  py: 1.5,
                  textTransform: 'none',
                  borderRadius: '10px',
                  '&:hover': { bgcolor: '#E6AC10' },
                  '&.Mui-disabled': { bgcolor: 'rgba(201,148,10,0.4)' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar Alterações'}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>
    </>
  )
}