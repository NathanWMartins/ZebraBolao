'use client'
import React, { useState } from 'react'
import { IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { deletePool } from './actions'

interface DeletePoolButtonProps {
  poolId: string
  groupId: string
  poolName: string
}

export default function DeletePoolButton({ poolId, groupId, poolName }: DeletePoolButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClickOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(true)
  }

  const handleClose = (e?: any, reason?: string) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setOpen(false)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await deletePool(poolId, groupId)
      setOpen(false)
    } catch (error) {
      console.error(error)
      alert('Erro ao excluir o bolão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Tooltip title="Excluir bolão">
        <IconButton 
          onClick={handleClickOpen}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.3)', 
            '&:hover': { color: '#ff4d4d', bgcolor: 'rgba(255, 77, 77, 0.1)' } 
          }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : <DeleteIcon />}
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#111110',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Excluir Bolão</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Tem certeza que deseja excluir o bolão <strong>"{poolName}"</strong>? 
            Esta ação é permanente e todos os palpites relacionados serão removidos.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            autoFocus 
            disabled={loading}
            sx={{ 
              bgcolor: '#ff4d4d', 
              color: '#fff', 
              fontWeight: 600,
              '&:hover': { bgcolor: '#cc0000' }
            }}
          >
            {loading ? 'Excluindo...' : 'Sim, Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
