'use client'

import React, { useState, useTransition } from 'react'
import {
  Box, Typography, Avatar, Divider, Stack, IconButton, Tooltip, CircularProgress
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import CloseIcon from '@mui/icons-material/Close'
import CheckIcon from '@mui/icons-material/Check'
import { removeMember } from './actions'

interface Member {
  id: string
  username: string
  avatar_url: string | null
  joined_at: string
}

interface MembersListClientProps {
  members: Member[]
  groupId: string
  ownerId: string
  isOwner: boolean
  currentUserId: string
}

export default function MembersListClient({
  members,
  groupId,
  ownerId,
  isOwner,
  currentUserId,
}: MembersListClientProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  function handleRemoveClick(memberId: string) {
    setConfirmId(memberId)
    setError(null)
  }

  function handleCancel() {
    setConfirmId(null)
    setError(null)
  }

  function handleConfirm(memberId: string) {
    setRemovingId(memberId)
    startTransition(async () => {
      const result = await removeMember(groupId, memberId)
      if (result?.error) {
        setError(result.error)
        setConfirmId(null)
      } else {
        setConfirmId(null)
      }
      setRemovingId(null)
    })
  }

  return (
    <Box>
      <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 600, mb: 3 }}>
        Membros ({members.length})
      </Typography>

      {error && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(220,38,38,0.1)', border: '0.5px solid rgba(220,38,38,0.3)', borderRadius: '8px' }}>
          <Typography sx={{ color: '#f87171', fontSize: 13 }}>{error}</Typography>
        </Box>
      )}

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: 'rgba(12,12,12)',
        p: 2,
        borderRadius: '12px',
        border: '0.5px solid rgba(255,255,255,0.03)',
      }}>
        {members.map((member, index) => {
          const isThisOwner = member.id === ownerId
          const isRemoving = removingId === member.id
          const isConfirming = confirmId === member.id
          const canRemove = isOwner && !isThisOwner && member.id !== currentUserId

          return (
            <React.Fragment key={member.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={member.avatar_url || ''}
                  alt={member.username}
                  sx={{ width: 40, height: 40, bgcolor: 'rgba(201,148,10,0.2)', color: '#C9940A' }}
                  slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                >
                  {member.username.charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ color: '#fff', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.username}
                    </Typography>
                    {isThisOwner && (
                      <Tooltip title="Administrador">
                        <AdminPanelSettingsIcon sx={{ fontSize: 16, color: '#C9940A', flexShrink: 0 }} />
                      </Tooltip>
                    )}
                  </Stack>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                  </Typography>
                </Box>

                {canRemove && (
                  <Box sx={{ flexShrink: 0 }}>
                    {isRemoving ? (
                      <CircularProgress size={18} sx={{ color: '#f87171' }} />
                    ) : isConfirming ? (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Confirmar remoção">
                          <IconButton
                            size="small"
                            onClick={() => handleConfirm(member.id)}
                            sx={{ color: '#f87171', p: 0.5, '&:hover': { bgcolor: 'rgba(248,113,113,0.1)' } }}
                          >
                            <CheckIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton
                            size="small"
                            onClick={handleCancel}
                            sx={{ color: 'rgba(255,255,255,0.4)', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Tooltip title="Remover membro">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveClick(member.id)}
                          sx={{
                            color: 'rgba(255,255,255,0.2)',
                            p: 0.5,
                            '&:hover': { color: '#f87171', bgcolor: 'rgba(248,113,113,0.1)' },
                          }}
                        >
                          <PersonRemoveIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>

              {index < members.length - 1 && (
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
              )}
            </React.Fragment>
          )
        })}
      </Box>
    </Box>
  )
}
