'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
}

export default function DashboardClient({ user }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const name = (user.user_metadata?.full_name ?? user.email ?? 'Usuário') as string
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

  return (
    <div style={{ position: 'relative' }}>
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
        {/* Avatar */}
        <div style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#C9940A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              width={26}
              height={26}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#111110' }}>{initials}</span>
          )}
        </div>

        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name.split(' ')[0]}
        </span>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setMenuOpen(false)}
          />

          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 20,
            minWidth: 180,
            backgroundColor: '#1a1a19',
            border: '0.5px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: '4px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {/* User info */}
            <div style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 500 }}>{name.split(' ')[0]}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{user.email}</p>
            </div>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'left',
                transition: 'background-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5M9.5 10l2.5-3-2.5-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}
