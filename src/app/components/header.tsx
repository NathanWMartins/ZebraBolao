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

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'rgba(0,0,0,0.7)',
            px: 4,
            py: 2,
            borderBottom: '0.5px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        }}>
            <Link href="/dashboard" passHref>
                <Image
                    src="/LogoZebraMinimalista.png"
                    alt="Zebra Bolão"
                    width={60}
                    height={60}
                    style={{ objectFit: 'contain', cursor: 'pointer' }}
                />
            </Link>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DashboardClient user={user} />
            </Box>
        </Box>
    )
}