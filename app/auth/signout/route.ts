import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/`)
}
