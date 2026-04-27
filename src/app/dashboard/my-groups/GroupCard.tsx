'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import LockIcon from '@mui/icons-material/Lock'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteGroup } from '../groups/[id]/actions'
import { DeleteOutlineOutlined } from '@mui/icons-material'

interface Group {
  id: string
  name: string
  owner_id: string
  is_private: boolean
  joined_at: string
}

interface GroupCardProps {
  group: Group
  isOwner: boolean
}

export default function GroupCard({ group, isOwner }: GroupCardProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const result = await deleteGroup(group.id)
      if (result.error) {
        setError(result.error)
        setDeleting(false)
      } else {
        setDialogOpen(false)
        router.refresh()
      }
    } catch {
      setError('Erro inesperado ao excluir o grupo.')
      setDeleting(false)
    }
  }

  return (
    <>
      <Box sx={{
        bgcolor: 'rgba(0,0,0,0.4)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(201,148,10,0.3)',
          transform: 'translateY(-2px)'
        }
      }}>
        {/* Badge Administrador */}
        {isOwner && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bgcolor: 'rgba(201,148,10,0.15)',
            color: '#C9940A',
            fontSize: 10,
            fontWeight: 700,
            px: 2,
            py: 0.5,
            borderBottomLeftRadius: '8px',
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Administrador
          </Box>
        )}

        {/* Info do grupo */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            bgcolor: 'rgba(201,148,10,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
            flexShrink: 0,
          }}>
            <SportsSoccerIcon sx={{ color: '#C9940A' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ color: '#fff', fontSize: 18, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {group.name}
              </Typography>
              {group.is_private && (
                <LockIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              )}
            </Stack>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, mt: 0.5 }}>
              Entrou em {new Date(group.joined_at).toLocaleDateString('pt-BR')}
            </Typography>
          </Box>
        </Box>

        {/* Ações */}
        <Box sx={{ mt: 'auto', pt: 2, borderTop: '0.5px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link href={`/dashboard/groups/${group.id}`} passHref style={{ flex: 1, textDecoration: 'none' }}>
            <Button
              fullWidth
              variant="text"
              sx={{
                color: '#fff',
                fontWeight: 600,
                justifyContent: 'space-between',
                px: 1,
              }}
            >
              Acessar Grupo
            </Button>
          </Link>

          {isOwner && (
            <IconButton
              onClick={() => setDialogOpen(true)}
              size="small"
              sx={{
                color: '#ff4444',
                '&:hover': {
                  color: '#8b1616ff',
                  bgcolor: 'rgba(255,68,68,0.08)',
                },
                transition: 'all 0.2s',
              }}
            >
              <DeleteOutlineOutlined fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Dialog de confirmação */}
      <Dialog
        open={dialogOpen}
        onClose={() => !deleting && setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#111110',
              backgroundImage: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
            }
          }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40,
              borderRadius: '10px',
              bgcolor: 'rgba(255,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <WarningAmberIcon sx={{ color: '#ff4444', fontSize: 20 }} />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
              Excluir grupo?
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 1 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
            Tem certeza que deseja excluir o grupo <Box component="span" sx={{ color: '#fff', fontWeight: 600 }}>"{group.name}"</Box>?
          </Typography>
          <Typography sx={{ color: 'rgba(255,68,68,0.8)', fontSize: 13, mt: 1.5, lineHeight: 1.5 }}>
            Esta ação é irreversível. Todos os bolões, palpites e membros serão permanentemente excluídos.
          </Typography>
          {error && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.2)' }}>
              <Typography sx={{ color: '#ff4444', fontSize: 13 }}>{error}</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={deleting}
            sx={{
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="contained"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineOutlined />}
            sx={{
              bgcolor: '#ff4444',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
              '&:hover': { bgcolor: '#ff2222' },
              '&.Mui-disabled': { bgcolor: 'rgba(255,68,68,0.4)' },
            }}
          >
            {deleting ? 'Excluindo...' : 'Sim, excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
