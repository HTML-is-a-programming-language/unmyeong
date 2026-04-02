import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 게스트 모드: 로그인 없이도 대시보드 접근 허용 (Paddle 승인용)
  if (!user) {
    return (
      <DashboardClient
        user={{ id: '', email: 'guest@unmyeong.com' }}
        initialCredits={0}
      />
    )
  }

  // 크레딧 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? '' }}
      initialCredits={profile?.credits ?? 0}
    />
  )
}
