import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'
export const maxDuration = 120

const IMAGE_CREDIT_COST = 3
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(request: Request) {
  const supabase = await createClient()
  let creditDeducted = false
  let originalCredits = 0
  let userId = ''

  try {
    // 1. 인증
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }
    userId = user.id

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
      .eq('id', userId)
      .single()

    if (!profile || profile.credits < IMAGE_CREDIT_COST) {
      return NextResponse.json(
        { error: `크레딧이 부족해요. 2세 이미지는 ${IMAGE_CREDIT_COST}크레딧이 필요해요.` },
        { status: 402 }
      )
    }

    originalCredits = profile.credits

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
      .eq('id', userId)
    creditDeducted = true

    // 6. Gemini 이미지 생성
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are given two parent face photos. Generate a single realistic baby photo following these strict rules:

STRICT REQUIREMENTS:
- The baby must be facing directly forward (front-facing, straight-on view)
- Eyes must be fully open, looking at the camera
- Realistic photo style — NOT illustration, NOT cartoon, NOT painting
- The baby's face should be a natural genetic blend of both parents' facial features (eye shape, nose, lips, face shape, skin tone)
- Age: newborn to 6 months old
- The baby should have a neutral or slightly smiling expression
- Clear, sharp focus on the baby's face
- Simple clean background (white, cream, or soft neutral)
- Natural lighting, soft and even
- Photo should look like a real professional baby portrait

DO NOT:
- Do not make the baby's eyes closed or half-closed
- Do not make a cartoon or illustration
- Do not add decorative elements or fantasy elements
- Do not make the baby look away from camera

The two parent photos are attached below.`,
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
        .update({ credits: originalCredits })
        .eq('id', userId)
      return NextResponse.json({ error: '이미지 생성에 실패했어요.' }, { status: 502 })
    }

    // 8. base64 → data URL로 반환
    const { mimeType, data } = imagePart.inlineData
    const imageUrl = `data:${mimeType};base64,${data}`

    return NextResponse.json({
      imageUrl,
      remainingCredits: originalCredits - IMAGE_CREDIT_COST,
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Baby image generation error:', msg)
    if (creditDeducted && userId) {
      await supabase
        .from('profiles')
        .update({ credits: originalCredits })
        .eq('id', userId)
    }
    return NextResponse.json({ error: `이미지 생성 중 오류가 발생했어요. 크레딧은 환불됩니다.` }, { status: 500 })
  }
}