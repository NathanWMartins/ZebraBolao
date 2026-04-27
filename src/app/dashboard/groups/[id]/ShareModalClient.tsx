'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Modal from '@mui/material/Modal'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import ShareIcon from '@mui/icons-material/Share'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { QRCodeSVG } from 'qrcode.react'

interface ShareModalProps {
  inviteCode: string;
  groupName: string;
}

export default function ShareModalClient({ inviteCode, groupName }: ShareModalProps) {
  const [open, setOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInviteUrl(`${window.location.origin}/dashboard/groups/join?code=${inviteCode}`)
    }
  }, [inviteCode])

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setCopied(false)
  }

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ShareIcon sx={{ mr: { xs: -1.5, sm: 0 } }} />}
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
          Compartilhar
        </Box>
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="share-modal-title"
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
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.5)' }}
          >
            <CloseIcon />
          </IconButton>

          <Typography id="share-modal-title" variant="h6" component="h2" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
            Convide a Galera!
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, textAlign: 'center', fontSize: 14 }}>
            Compartilhe o código ou o QR Code para seus amigos entrarem no grupo <strong>{groupName}</strong>.
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
            Código de Convite
          </Typography>
          <Typography sx={{ color: '#C9940A', fontSize: 28, fontWeight: 800, mb: 3, letterSpacing: 3 }}>
            {inviteCode}
          </Typography>

          <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 2, mb: 3 }}>
            {inviteUrl && <QRCodeSVG value={inviteUrl} size={180} />}
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
              }
            }}
          >
            {copied ? 'Link Copiado!' : 'Copiar Link do Grupo'}
          </Button>
        </Box>
      </Modal>
    </>
  )
}
