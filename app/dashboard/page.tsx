'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardClient from './DashboardClient'

export default function DashboardPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<{
    user: { id: string; email: string }
    initialCredits: number
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      setUserData({
        user: { id: user.id, email: user.email ?? '' },
        initialCredits: profile?.credits ?? 0,
      })
    }

    load()
  }, [router])

  if (!userData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0f',
        color: '#c9b06b',
        fontSize: '1.2rem',
        letterSpacing: '0.1em',
      }}>
        운명 · 로딩 중...
      </div>
    )
  }

  return (
    <DashboardClient
      user={userData.user}
      initialCredits={userData.initialCredits}
    />
  )
}
