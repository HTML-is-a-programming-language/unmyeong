import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const IMAGE_CREDIT_COST = 3

function extractThemes(text: string): string {
  const themes: string[] = []

  if (text.match(/leader|leadership|독립적|리더십|자신감|confident|powerful|strong-willed/i))
    themes.push('confident aura, standing tall, golden light radiating from within')
  if (text.match(/creative|artistic|imagination|creative|창의|예술|꿈|dreamer/i))
    themes.push('surrounded by swirling colors and creative light, painterly atmosphere')
  if (text.match(/love|romance|heart|연애|사랑|romantic|passionate/i))
    themes.push('rose petals drifting through soft pink and gold light, warm intimacy')
  if (text.match(/wisdom|deep|insight|intellectual|thoughtful|지혜|깊은|철학/i))
    themes.push('soft moonlight, calm deep water reflection, mysterious depth and stillness')
  if (text.match(/warm|nurturing|kind|caring|gentle|따뜻|포용|배려/i))
    themes.push('warm golden hour light, blooming garden, soft welcoming comfort')
  if (text.match(/challenge|struggle|difficult|shadow|복잡|어려움|극복|고난/i))
    themes.push('contrast of light emerging through shadow, poignant beauty in complexity')
  if (text.match(/success|achievement|성공|목표|꿈을 이루|accomplish/i))
    themes.push('triumphant light, stars aligning, a sense of destiny fulfilled')
  if (text.match(/harmony|balance|together|connection|united|조화|함께|균형/i))
    themes.push('two energies merging beautifully, balance of light and shadow')
  if (text.match(/free|freedom|independent|자유|독립|liberation/i))
    themes.push('open sky, wind in hair, sense of infinite possibility')
  if (text.match(/mystery|hidden|depth|신비|깊이|비밀/i))
    themes.push('soft mist, moonlit mystery, half-hidden beauty')

  if (themes.length === 0)
    themes.push('ethereal floating light, blooming flowers, soft dreamy atmosphere')

  return themes.slice(0, 3).join('; ')
}

function extractColorPalette(text: string): string {
  if (text.match(/fire|불|火|passion|열정/i))
    return 'warm rose gold, soft coral, amber, cream white — like a golden sunset'
  if (text.match(/water|물|水|wisdom|지혜/i))
    return 'soft lavender, pale blue, silver, misty white — like moonlight on water'
  if (text.match(/wood|나무|Wood|growth|성장/i))
    return 'soft mint green, blush pink, cream, warm gold — like spring morning'
  if (text.match(/metal|쇠|Metal|crystal/i))
    return 'icy silver, pearl white, soft lilac, crystalline blue — like winter starlight'
  if (text.match(/earth|흙|Earth|stable/i))
    return 'warm peach, golden honey, soft brown, cream — like a cozy autumn afternoon'
  return 'soft pink, dreamy lavender, warm gold, pearl white — romantic and ethereal'
}

function personDesc(gender: string): string {
  const map: Record<string, string> = {
    male:      'a handsome young Asian man',
    female:    'a beautiful young Asian woman',
    nonbinary: 'a beautiful young Asian person',
  }
  return map[gender] ?? 'a beautiful young Asian person'
}

function buildImagePrompt(sajuResult: string, mode: string, gender: string, category?: string, gender2?: string): string {
  const person1 = personDesc(gender)
  const person2 = gender2 ? personDesc(gender2) : null

  const themes = extractThemes(sajuResult)
  const palette = extractColorPalette(sajuResult)

  // ── 개인 사주 ────────────────────────────────────────────────────
  if (mode === 'personal') {
    const categoryScenes: Record<string, string> = {
      personality: `${person1} whose inner world is being revealed — their true self expressed through light, nature, and atmosphere`,
      career:      `${person1} at the peak of their potential — confidence, ambition, and purpose radiating outward`,
      wealth:      `${person1} surrounded by an aura of abundance — golden light, prosperity, and flow`,
      love:        `${person1} in the midst of a deeply felt emotion — love, longing, and beauty`,
      marriage:    `${person1} in a moment of deep connection and partnership — warmth and commitment`,
      health:      `${person1} glowing with vitality and natural energy — balanced, alive, radiant`,
      family:      `${person1} in a warm, safe, connected atmosphere — roots, belonging, and love`,
      children:    `${person1} with a gentle, nurturing light — the energy of caring and legacy`,
      mentor:      `${person1} with a guiding light around them — the aura of someone who helps others`,
      destiny:     `${person1} standing at the crossroads of a grand, cinematic life journey — destiny unfolding`,
    }
    const scene = (category && categoryScenes[category])
      ?? `${person1} in a dreamy, ethereal atmosphere — ${themes}`

    return `Digital illustration artwork: ${scene}.

Visual atmosphere and themes: ${themes}

Art style:
- Soft, painterly digital illustration — like a premium K-webtoon or K-pop album art cover
- Dreamy, romantic atmosphere with warm and cool color harmony
- Delicate details: petals floating, light particles, flowing hair, translucent fabric
- Beautiful lighting: soft rim light, golden hour glow, or moonlight depending on the theme
- Cinematic composition, like a still from a high-budget K-drama or music video

Color palette: ${palette}

Quality: ultra-detailed, high resolution, beautiful.
No text, no letters, no watermarks in the image.`
  }

  // ── 궁합 / 아이돌 궁합 — 두 사람 ───────────────────────────────
  const p2 = person2 ?? 'a beautiful young Asian person'

  // 사주 결과에서 두 사람의 관계 키워드 추출
  const relationshipTone = (() => {
    if (sajuResult.match(/장점|좋은|편안|케미|완벽|운명|강한|빛나|행복|harmonious|perfect|strong|destiny|powerful/i))
      return 'deeply in love, drawn irresistibly toward each other, warmth and chemistry radiating between them'
    if (sajuResult.match(/도전|단점|충돌|갈등|차이|어려움|challenging|conflict|difficult|friction/i))
      return 'tension and magnetic pull between them — a complex, passionate connection full of depth'
    return 'a fated connection, two souls sharing a quiet but profound moment together'
  })()

  const isIdol = mode === 'idol'
  const sceneDesc = isIdol
    ? `${person1} and ${p2} in a cinematic, emotional K-drama-style scene — ${relationshipTone}`
    : `${person1} and ${p2} together in a beautiful, romantic scene — ${relationshipTone}`

  return `Digital illustration artwork: ${sceneDesc}.

Two characters clearly visible together in the scene. Their body language and the atmosphere reflect their relationship: ${relationshipTone}.

Visual atmosphere: ${themes}

Art style:
- Soft, painterly digital illustration — cinematic, like a premium K-drama poster or K-pop album art
- Two figures as the clear focus — their connection is the heart of the image
- Dreamy lighting: golden hour, soft backlight, or moonlit glow depending on the mood
- Delicate details: floating petals, light particles, flowing fabric, lush natural surroundings
- The overall feeling should immediately communicate the nature of their relationship
- Cinematic composition, beautiful and emotional — like a still from a high-budget music video

Color palette: ${palette}

Quality: ultra-detailed, high resolution, cinematic, emotionally resonant.
No text, no letters, no watermarks in the image.`
}

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

    const { sajuResult, mode, language, gender, gender2, category } = await request.json()
    if (!sajuResult) {
      return NextResponse.json({ error: '사주 결과가 없어요.' }, { status: 400 })
    }

    // 2. 크레딧 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!profile || profile.credits < IMAGE_CREDIT_COST) {
      return NextResponse.json({ error: `크레딧이 부족해요. AI 이미지는 ${IMAGE_CREDIT_COST}크레딧이 필요해요.` }, { status: 402 })
    }

    originalCredits = profile.credits

    // 3. 크레딧 차감
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - IMAGE_CREDIT_COST })
      .eq('id', userId)
    creditDeducted = true

    // 4. 이미지 생성
    const prompt = buildImagePrompt(sajuResult, mode, gender ?? 'female', category, gender2)

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseModalities: ['IMAGE', 'TEXT'] },
    })

    const parts = response.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p: any) => p.inlineData)

    if (!imagePart?.inlineData) {
      // 크레딧 복구
      await supabase
        .from('profiles')
        .update({ credits: originalCredits })
        .eq('id', userId)
      return NextResponse.json({ error: '이미지 생성에 실패했어요.' }, { status: 500 })
    }

    const { mimeType, data } = imagePart.inlineData
    const imageUrl = `data:${mimeType};base64,${data}`

    return NextResponse.json({
      imageUrl,
      remainingCredits: originalCredits - IMAGE_CREDIT_COST,
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Image generation error:', msg)
    if (creditDeducted && userId) {
      await supabase
        .from('profiles')
        .update({ credits: originalCredits })
        .eq('id', userId)
    }
    return NextResponse.json({ error: `이미지 생성 중 오류가 발생했어요. 크레딧은 환불됩니다.` }, { status: 500 })
  }
}
