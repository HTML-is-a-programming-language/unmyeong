import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'

const IMAGE_CREDIT_COST = 3
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

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

    // 4. File → base64 변환
    const toBase64 = async (file: File) => {
      const buffer = await file.arrayBuffer()
      return Buffer.from(buffer).toString('base64')
    }
    const getMimeType = (file: File) =>
      (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

    const [base64_1, base64_2] = await Promise.all([
      toBase64(face1),
      toBase64(face2),
    ])

    // 5. 크레딧 차감
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - IMAGE_CREDIT_COST })
      .eq('id', user.id)

    // 6. Gemini 이미지 생성
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'These are photos of two parents. Generate a realistic and adorable baby photo that combines the facial features of both people. The baby should look like a natural blend of both parents.',
            },
            { inlineData: { mimeType: getMimeType(face1), data: base64_1 } },
            { inlineData: { mimeType: getMimeType(face2), data: base64_2 } },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    })

    // 7. 응답에서 이미지 추출
    const parts = response.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p: any) => p.inlineData)

    if (!imagePart?.inlineData) {
      // 이미지 생성 실패 시 크레딧 복구
      await supabase
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id)
      return NextResponse.json({ error: '이미지 생성에 실패했어요.' }, { status: 502 })
    }

    // 8. base64 → data URL로 반환
    const { mimeType, data } = imagePart.inlineData
    const imageUrl = `data:${mimeType};base64,${data}`

    return NextResponse.json({
      imageUrl,
      remainingCredits: profile.credits - IMAGE_CREDIT_COST,
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Baby image generation error:', msg)
    return NextResponse.json({ error: `이미지 생성 중 오류: ${msg}` }, { status: 500 })
  }
}