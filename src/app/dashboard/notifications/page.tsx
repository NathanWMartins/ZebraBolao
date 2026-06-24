'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

      if (filter === 'unread') query = query.eq('read', false)

      const { data } = await query
      if (data) {
        setNotifications(prev => page === 0 ? data : [...prev, ...data])
        setHasMore(data.length === PAGE_SIZE + 1)
        if (data.length === PAGE_SIZE + 1) data.pop()
      }
      setLoading(false)
    }
    load()
  }, [filter, page])

  // reset page when filter changes
  useEffect(() => { setPage(0); setNotifications([]) }, [filter])

  const markRead = async (notif: Notification) => {
    if (!notif.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    }
    if (notif.link) router.push(notif.link)
  }

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}min atrás`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h atrás`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 18 }}>
          ←
        </Link>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>Notificações</h1>
      </div>

      {/* Filtros + ação */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${filter === f ? '#C9940A' : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: filter === f ? 'rgba(201,148,10,0.12)' : 'transparent',
                color: filter === f ? '#C9940A' : 'rgba(255,255,255,0.4)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'Todas' : 'Não lidas'}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: 0 }}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Carregando...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            {filter === 'unread' ? 'Nenhuma notificação não lida.' : 'Nenhuma notificação ainda.'}
          </div>
        ) : (
          notifications.map((notif, i) => (
            <div
              key={notif.id}
              onClick={() => markRead(notif)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                borderBottom: i < notifications.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                backgroundColor: notif.read ? 'transparent' : 'rgba(201,148,10,0.04)',
                cursor: notif.link ? 'pointer' : 'default',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { if (notif.link) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = notif.read ? 'transparent' : 'rgba(201,148,10,0.04)' }}
            >
              {/* Indicador lida/não lida */}
              <div style={{ flexShrink: 0, marginTop: 4, width: 8, height: 8, borderRadius: '50%', backgroundColor: notif.read ? 'transparent' : '#C9940A', border: notif.read ? '1.5px solid rgba(255,255,255,0.12)' : 'none' }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: notif.read ? 500 : 700, color: notif.read ? 'rgba(255,255,255,0.7)' : '#fff' }}>
                  {notif.title}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45 }}>
                  {notif.body}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }} suppressHydrationWarning>
                  {formatDate(notif.created_at)}
                </p>
              </div>

              {notif.link && (
                <div style={{ flexShrink: 0, color: 'rgba(255,255,255,0.2)', fontSize: 14, marginTop: 2 }}>›</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Carregar mais */}
      {hasMore && (
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={loading}
          style={{ display: 'block', width: '100%', marginTop: 12, padding: '11px', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          {loading ? 'Carregando...' : 'Carregar mais'}
        </button>
      )}
    </div>
  )
}
