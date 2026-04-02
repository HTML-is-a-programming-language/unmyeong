import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

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

function buildImagePrompt(sajuResult: string, mode: string, gender: string, category?: string): string {
  // Gender-aware figure description
  const genderMap: Record<string, string> = {
    male:      'a handsome young Asian man',
    female:    'a beautiful young Asian woman',
    nonbinary: 'a beautiful young Asian person',
  }
  const personDesc = genderMap[gender] ?? 'a beautiful young Asian person'

  const themes = extractThemes(sajuResult)
  const palette = extractColorPalette(sajuResult)

  // ── Baby / 2세 mode ──────────────────────────────────────────────
  if (mode === 'baby') {
    return `Digital illustration artwork: A magical, heartwarming image of a beautiful baby — the destined child of two souls connected by fate and the stars.

Scene: A precious infant wrapped in soft light, surrounded by floating petals, tiny stars, and a sense of cosmic wonder. Tiny fingers reaching toward a glowing orb of fate. Pure innocence meeting ancient destiny.

Art style:
- Soft, painterly digital illustration — like a premium Korean children's book or a dreamy baby shower illustration
- Warm, tender, magical atmosphere — like the opening scene of a fairy tale
- Delicate details: tiny fingers and toes, soft baby skin glowing with light, flower petals, floating star fragments
- Colors: soft cream, warm peach, pale gold, gentle pink and blue woven together harmoniously
- Beautiful, innocent, heartwarming — the kind of image that makes everyone melt

${palette.includes('rose') || palette.includes('pink') ? 'Color palette: soft peach, warm cream, pale rose gold, baby pink, gentle stardust gold' : 'Color palette: soft cream, warm peach, pale sky blue, golden light, gentle ivory'}

Quality: ultra-detailed, beautiful, warm, heartwarming — pure joy and wonder
No text, no letters, no watermarks in the image.`
  }

  // ── Category-aware scene ─────────────────────────────────────────
  const categoryScenes: Record<string, string> = {
    personality: `${personDesc} whose inner world is being revealed — their true self expressed through light, nature, and atmosphere`,
    career:      `${personDesc} at the peak of their potential — confidence, ambition, and purpose radiating outward`,
    wealth:      `${personDesc} surrounded by an aura of abundance — golden light, prosperity, and flow`,
    love:        `${personDesc} in the midst of a deeply felt emotion — love, longing, and beauty`,
    marriage:    `${personDesc} in a moment of deep connection and partnership — warmth and commitment`,
    health:      `${personDesc} glowing with vitality and natural energy — balanced, alive, radiant`,
    family:      `${personDesc} in a warm, safe, connected atmosphere — roots, belonging, and love`,
    children:    `${personDesc} with a gentle, nurturing light — the energy of caring and legacy`,
    mentor:      `${personDesc} with a guiding light around them — the aura of someone who helps others`,
    destiny:     `${personDesc} standing at the crossroads of a grand, cinematic life journey — destiny unfolding`,
  }

  const modeScenes: Record<string, string> = {
    compatibility: `two young Asian people drawn together by fate — their energies intertwining like ${themes}`,
    idol:          `a cinematic, emotional moment of connection between two souls across different worlds — ${themes}`,
  }

  const scene = (category && categoryScenes[category])
    ?? modeScenes[mode]
    ?? `${personDesc} in a dreamy, ethereal atmosphere — ${themes}`

  return `Digital illustration artwork: ${scene}.

Visual atmosphere and themes: ${themes}

Art style:
- Soft, painterly digital illustration — like a premium K-webtoon or K-pop album art cover
- Dreamy, romantic atmosphere with warm and cool color harmony
- Delicate details: petals floating, light particles, flowing hair, translucent fabric
- Beautiful lighting: soft rim light, golden hour glow, or moonlight depending on the theme
- Lush floral and nature elements woven throughout
- Cinematic composition, like a still from a high-budget K-drama or music video
- Aesthetic similar to: NewJeans album art, aespa concept art, IU music video visuals

Color palette: ${palette}

Quality: ultra-detailed, high resolution, beautiful — the kind of image someone saves to their phone immediately
No text, no letters, no watermarks in the image.`
}

export async function POST(request: Request) {
  try {
    // 1. 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { sajuResult, mode, language, gender, category } = await request.json()
    if (!sajuResult) {
      return NextResponse.json({ error: '사주 결과가 없어요.' }, { status: 400 })
    }

    // 2. 크레딧 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < IMAGE_CREDIT_COST) {
      return NextResponse.json({ error: `크레딧이 부족해요. AI 이미지는 ${IMAGE_CREDIT_COST}크레딧이 필요해요.` }, { status: 402 })
    }

    // 3. 크레딧 차감
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - IMAGE_CREDIT_COST })
      .eq('id', user.id)

    // 4. Gemini 이미지 생성
    const prompt = buildImagePrompt(sajuResult, mode, gender ?? 'female', category)

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseModalities: ['IMAGE', 'TEXT'] },
    })

    const parts = response.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p: any) => p.inlineData)

    if (!imagePart?.inlineData) {
      console.error('No image in Gemini response:', JSON.stringify(response.candidates?.[0]))
      // 크레딧 복구
      await supabase
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id)
      return NextResponse.json({ error: '이미지 생성에 실패했어요.' }, { status: 500 })
    }

    const { mimeType, data } = imagePart.inlineData
    const imageUrl = `data:${mimeType};base64,${data}`

    return NextResponse.json({
      imageUrl,
      remainingCredits: profile.credits - IMAGE_CREDIT_COST,
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Image generation error:', msg)
    return NextResponse.json({ error: `이미지 생성 중 오류: ${msg}` }, { status: 500 })
  }
}
