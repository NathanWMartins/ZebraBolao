import { Box } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import DashboardClient from "../dashboard/dashboard-client";
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Header() {
    const supabase = await createServerSupabaseClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
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
                    width={70}
                    height={70}
                    style={{ objectFit: 'contain', cursor: 'pointer' }}
                />
            </Link>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DashboardClient user={user} />
            </Box>
        </Box>
    )
}