import { NextResponse } from 'next/server'
import { paddle, CREDIT_PACKAGES } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. 로그인 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { packageId } = await request.json()

    // 2. 패키지 확인
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: '유효하지 않은 패키지예요.' }, { status: 400 })
    }

    const priceId = process.env[pkg.priceEnvKey]
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID가 설정되지 않았어요.' }, { status: 500 })
    }

    // 3. Paddle 트랜잭션 생성
    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      // 유저 ID와 크레딧 수량을 customData에 저장 → 웹훅에서 사용
      customData: {
        userId: user.id,
        credits: pkg.credits.toString(),
        packageId: pkg.id,
      },
      // 결제 완료 후 돌아올 URL
      checkout: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success`,
      },
    })

    // Paddle Checkout URL 반환
    return NextResponse.json({
      checkoutUrl: `https://checkout.paddle.com/checkout/custom/${transaction.id}`,
      transactionId: transaction.id,
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: '결제 세션 생성 중 오류가 발생했어요.' }, { status: 500 })
  }
}
