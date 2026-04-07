'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // URL의 code를 세션으로 교환
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user

        // 신규 유저면 크레딧 3개 지급 (upsert로 중복 방지)
        await supabase
          .from('profiles')
          .upsert(
            { id: user.id, email: user.email, credits: 3 },
            { onConflict: 'id', ignoreDuplicates: true }
          )

        router.replace('/dashboard')
      }
    })

    // Supabase가 URL hash/query에서 자동으로 세션 처리
    supabase.auth.getSession()
  }, [router])

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
      운명 · 로그인 중...
    </div>
  )
}
