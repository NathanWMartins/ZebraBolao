import { Box } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import DashboardClient from "../dashboard/dashboard-client";
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function Header() {
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        const headersList = await headers()
        const nextUrl = headersList.get('x-pathname') || '/dashboard'
        redirect(`/auth/login?next=${encodeURIComponent(nextUrl)}`)
    }

    const adminEmails = [process.env.ADMIN_EMAIL].filter(Boolean) as string[]
    const isAdmin = !!user.email && adminEmails.includes(user.email)

    return (
        <Box sx={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#0f0f0e',
            px: 4,
            py: 2,
            borderBottom: '0.5px solid rgba(255,255,255,0.08)',
            '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(60,59,110,0.12) 0%, transparent 35%, rgba(0,104,71,0.12) 60%, transparent 75%, rgba(178,34,52,0.12) 100%)',
                pointerEvents: 'none',
            },
        }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Link href="/dashboard" passHref>
                    <Image
                        src="/LogoZebraMinimalista.png"
                        alt="Zebra Bolão"
                        width={60}
                        height={60}
                        style={{ objectFit: 'contain', cursor: 'pointer' }}
                    />
                </Link>
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DashboardClient user={user} isAdmin={isAdmin} />
            </Box>
        </Box>
    )
}