import { NextResponse } from 'next/server'
import { paddle } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/server'
import { EventName } from '@paddle/paddle-node-sdk'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('paddle-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  // 1. Paddle 서명 검증 — 위조 요청 차단
  try {
    event = paddle.webhooks.unmarshal(
      body,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    )
} catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. 결제 완료 이벤트 처리
  if (!event) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
  }

  if (event.eventType === EventName.TransactionCompleted) {
    const tx = event.data

    const customData = tx.customData as {
      userId?: string
      credits?: string
      packageId?: string
    } | null

    const userId  = customData?.userId
    const credits = parseInt(customData?.credits ?? '0')

    if (!userId || !credits) {
      console.error('Missing customData:', customData)
      return NextResponse.json({ error: 'Missing customData' }, { status: 400 })
    }

    const supabase = await createClient()

    // 3. 중복 처리 방지 — 같은 트랜잭션 ID가 이미 있으면 스킵
    const { data: existing } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('paddle_transaction_id', tx.id)
      .single()

    if (existing) {
      console.log(`Already processed transaction: ${tx.id}`)
      return NextResponse.json({ received: true })
    }

    // 4. 현재 크레딧 조회
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      console.error('Profile fetch error:', fetchError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    // 5. 크레딧 추가
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits + credits })
      .eq('id', userId)

    if (updateError) {
      console.error('Credit update error:', updateError)
      return NextResponse.json({ error: 'Credit update failed' }, { status: 500 })
    }

    // 6. 결제 내역 기록
    const amountPaid = tx.details?.totals?.total
      ? parseInt(tx.details.totals.total) / 100
      : 0

    await supabase.from('credit_transactions').insert({
      user_id: userId,
      credits_added: credits,
      paddle_transaction_id: tx.id,
      amount_paid: amountPaid,
    })

    console.log(`✓ Credits added: ${credits} → user ${userId}`)
  }

  return NextResponse.json({ received: true })
}
