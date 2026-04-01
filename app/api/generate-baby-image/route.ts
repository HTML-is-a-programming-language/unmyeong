import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const IMAGE_CREDIT_COST = 3

// TODO: 나노바나나 API 키 환경변수 추가 후 아래 연동
// const NANOBANA_API_KEY = process.env.NANOBANA_API_KEY!
// const NANOBANA_API_URL = process.env.NANOBANA_API_URL!  // 나노바나나에서 제공하는 엔드포인트

export async function POST(request: Request) {
  try {
    // 1. 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    // 2. FormData 파싱
    const formData = await request.formData()
    const face1 = formData.get('face1') as File | null
    const face2 = formData.get('face2') as File | null

    if (!face1 || !face2) {
      return NextResponse.json({ error: '얼굴 사진 2장이 필요해요.' }, { status: 400 })
    }

    // 3. 크레딧 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < IMAGE_CREDIT_COST) {
      return NextResponse.json(
        { error: `크레딧이 부족해요. 2세 이미지는 ${IMAGE_CREDIT_COST}크레딧이 필요해요.` },
        { status: 402 }
      )
    }

    // 4. 크레딧 차감
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - IMAGE_CREDIT_COST })
      .eq('id', user.id)

    // ── 나노바나나 API 연동 (API 정보 받은 후 여기에 구현) ──────────────
    //
    // 예시 구조 (실제 API 문서에 맞게 수정 필요):
    //
    // const body = new FormData()
    // body.append('image1', face1)
    // body.append('image2', face2)
    // body.append('prompt', 'a cute baby combining facial features of both parents')
    //
    // const response = await fetch(NANOBANA_API_URL, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${NANOBANA_API_KEY}` },
    //   body,
    // })
    // const result = await response.json()
    // const imageUrl = result.imageUrl ?? result.url ?? result.data?.url
    //
    // ───────────────────────────────────────────────────────────────

    // 나노바나나 미연동 상태 — 크레딧 복구 후 안내 메시지
    await supabase
      .from('profiles')
      .update({ credits: profile.credits })
      .eq('id', user.id)

    return NextResponse.json(
      { error: '2세 이미지 기능은 곧 오픈됩니다. 크레딧은 차감되지 않았어요.' },
      { status: 503 }
    )

  } catch (error) {
    console.error('Baby image generation error:', error)
    return NextResponse.json({ error: '이미지 생성 중 오류가 발생했어요.' }, { status: 500 })
  }
}
