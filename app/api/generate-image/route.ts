import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const IMAGE_CREDIT_COST = 2

// 사주 결과 → DALL-E 프롬프트 변환
function buildImagePrompt(sajuResult: string, mode: string): string {

  // 모드별 장면 설정
  const sceneMap: Record<string, string> = {
    personal: 'a beautiful young Korean woman in a dreamy, ethereal setting that reflects her unique inner universe and destiny',
    compatibility: 'two figures surrounded by intertwining cosmic energies, flowers, and soft light — a fateful connection told through color and nature',
    idol: 'a cinematic K-drama moment: two souls drawn together by fate, surrounded by blooming flowers, soft starlight, and flowing fabric — like the most beautiful scene of a romance drama',
  }
  const scene = sceneMap[mode] || sceneMap['personal']

  // 오행별 색상/요소 매핑
  const elements = extractMZElements(sajuResult)

  return `Digital illustration artwork: ${scene}.

Visual elements to include: ${elements}

Art style:
- Soft, painterly digital illustration — like a premium K-webtoon or K-pop album art cover
- Dreamy, romantic atmosphere with warm and cool color harmony
- Delicate details: petals floating, light particles, flowing hair, translucent fabric
- Beautiful lighting: soft rim light, golden hour glow, or moonlight depending on elements
- Lush floral and nature elements woven throughout
- Cinematic composition, like a still from a high-budget K-drama or music video
- Aesthetic similar to: NewJeans album art, aespa concept art, IU music video visuals

Color palette: ${extractColorPalette(sajuResult)}

Quality: ultra-detailed, high resolution, beautiful — the kind of image someone saves to their phone immediately
No text, no letters, no watermarks in the image.`
}

function extractMZElements(text: string): string {
  const elements: string[] = []

  if (text.match(/wood|나무|木|forest|tree/i)) {
    elements.push('cherry blossom petals falling, delicate spring branches, soft green leaves')
  }
  if (text.match(/fire|불|火|flame|passion/i)) {
    elements.push('warm sunset glow, golden light particles, red and orange flower petals')
  }
  if (text.match(/earth|흙|土|mountain|stable/i)) {
    elements.push('golden wheat fields, warm earth tones, sunflowers, autumn leaves')
  }
  if (text.match(/metal|쇠|金|crystal|sharp/i)) {
    elements.push('silver moonlight, sparkling crystals, white roses, shimmering stars')
  }
  if (text.match(/water|물|水|flow|ocean/i)) {
    elements.push('soft blue petals floating on water, glowing jellyfish-like lights, misty atmosphere')
  }
  if (text.match(/star|별|fate|운명|destiny/i)) {
    elements.push('thousands of tiny stars, constellations glowing softly, cosmic ribbons of light')
  }
  if (text.match(/love|연애|romance|heart/i)) {
    elements.push('rose petals, soft pink lighting, heart-shaped bokeh lights')
  }

  if (elements.length === 0) {
    elements.push('blooming flowers in soft pastels, floating light orbs, dreamy atmosphere')
  }

  return elements.join(', ')
}

function extractColorPalette(text: string): string {
  if (text.match(/fire|불|火|passion|열정/i)) {
    return 'warm rose gold, soft coral, amber, cream white — like a golden sunset'
  }
  if (text.match(/water|물|Water|wisdom|지혜/i)) {
    return 'soft lavender, pale blue, silver, misty white — like moonlight on water'
  }
  if (text.match(/wood|나무|Wood|growth|성장/i)) {
    return 'soft mint green, blush pink, cream, warm gold — like spring morning'
  }
  if (text.match(/metal|쇠|Metal|crystal/i)) {
    return 'icy silver, pearl white, soft lilac, crystalline blue — like winter starlight'
  }
  if (text.match(/earth|흙|Earth|stable/i)) {
    return 'warm peach, golden honey, soft brown, cream — like a cozy autumn afternoon'
  }
  // 궁합/아이돌 기본
  return 'soft pink, dreamy lavender, warm gold, pearl white — romantic and ethereal'
}

export async function POST(request: Request) {
  try {
    // 1. 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const { sajuResult, mode, language } = await request.json()
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

    // 4. DALL-E 3 이미지 생성
    const prompt = buildImagePrompt(sajuResult, mode)

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      // 크레딧 복구
      await supabase
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id)
      return NextResponse.json({ error: '이미지 생성에 실패했어요.' }, { status: 500 })
    }

    return NextResponse.json({
      imageUrl,
      remainingCredits: profile.credits - IMAGE_CREDIT_COST,
    })

  } catch (error: unknown) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: '이미지 생성 중 오류가 발생했어요.' }, { status: 500 })
  }
}
