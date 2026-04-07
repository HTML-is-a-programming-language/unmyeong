import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_PACKAGES } from '@/lib/packages'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 로그인 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { credits, packageId } = await request.json()

    // 유효한 패키지인지 확인
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId && p.credits === credits)
    if (!pkg) {
      return NextResponse.json({ error: '유효하지 않은 패키지예요.' }, { status: 400 })
    }

    // 현재 크레딧 조회
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없어요.' }, { status: 400 })
    }

    // 크레딧 추가
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits + credits })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: '크레딧 지급 실패.' }, { status: 500 })
    }

    // 거래 기록
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      credits_added: credits,
      paddle_transaction_id: `iap_${Date.now()}_${user.id}`,
      amount_paid: pkg.price,
    })

    return NextResponse.json({ success: true, credits: profile.credits + credits })

  } catch (error) {
    console.error('Credit grant error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 })
  }
}
