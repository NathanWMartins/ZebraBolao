import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('group_standings')
    .select('*')
    .order('group_name', { ascending: true })
    .order('position', { ascending: true })
  return NextResponse.json(data ?? [])
}
