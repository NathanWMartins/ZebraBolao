'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { deleteAccount } from './account-actions'

interface Props {
  user: User
}

export default function DashboardClient({ user }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [supportCopied, setSupportCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!menuOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [menuOpen])

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const name = (user.user_metadata?.full_name ?? user.user_metadata?.username ?? user.email ?? 'Usuário') as string
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleDeleteClick() {
    setMenuOpen(false)
    setDeleteError(null)
    setConfirmDelete(true)
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      try {
        await deleteAccount()
      } catch (err: any) {
        setDeleteError('Erro ao excluir conta. Tente novamente.')
        setConfirmDelete(false)
      }
    })
  }

  return (
    <>
      <div ref={containerRef} style={{ position: 'relative' }}>
        {/* Avatar button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: '0.5px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
          aria-label="Menu do usuário"
        >
          <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#C9940A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={name} width={26} height={26} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#111110' }}>{initials}</span>
            )}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name.split(' ')[0]}
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
            <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 20, minWidth: 190, backgroundColor: '#1a1a19', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {/* User info */}
            <div style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 500 }}>{name.split(' ')[0]}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{user.email}</p>
            </div>

            {/* Sair */}
            <button
              onClick={handleSignOut}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'left', transition: 'background-color 0.15s, color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5M9.5 10l2.5-3-2.5-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sair
            </button>

            {/* Suporte */}
            <div style={{ padding: '4px 12px 8px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Suporte</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 8px' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>nathanwillmartins@gmail.com</span>
                <button
                  onClick={() => { navigator.clipboard.writeText('nathanwillmartins@gmail.com'); setSupportCopied(true); setTimeout(() => setSupportCopied(false), 2000) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: supportCopied ? '#C9940A' : 'rgba(255,255,255,0.35)', flexShrink: 0 }}
                  title="Copiar email"
                >
                  {supportCopied ? (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M4.5 8.5H3a1 1 0 01-1-1V3a1 1 0 011-1h4.5a1 1 0 011 1v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Excluir conta */}
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', marginTop: 4, paddingTop: 4 }}>
              <button
                onClick={handleDeleteClick}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: 'rgba(220,38,38,0.6)', textAlign: 'left', transition: 'background-color 0.15s, color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,0.6)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1M3 3.5l.667 8A1 1 0 004.664 12.5h4.672a1 1 0 00.997-.929L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Excluir conta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação — renderizado no body via portal */}
      {confirmDelete && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ backgroundColor: '#1a1a19', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.12)', border: '0.5px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v4m0 4h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: '#fff' }}>Excluir conta</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Esta ação é <strong style={{ color: 'rgba(255,255,255,0.8)' }}>permanente e irreversível</strong>.
              Todos os seus dados serão excluídos: palpites, grupos criados, histórico e pontuação.
            </p>

            {deleteError && (
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#f87171', backgroundColor: 'rgba(220,38,38,0.1)', border: '0.5px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '8px 12px' }}>
                {deleteError}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                style={{ flex: 1, padding: '10px', background: 'none', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.6)', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                style={{ flex: 1, padding: '10px', background: 'rgba(220,38,38,0.15)', border: '0.5px solid rgba(220,38,38,0.4)', borderRadius: 10, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, color: '#f87171', transition: 'all 0.15s', opacity: isPending ? 0.6 : 1 }}
                onMouseEnter={(e) => { if (!isPending) { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.25)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.15)' }}
              >
                {isPending ? 'Excluindo...' : 'Sim, excluir minha conta'}
              </button>
            </div>
          </div>
        </div>
        , document.body)}
    </>
  )
}
