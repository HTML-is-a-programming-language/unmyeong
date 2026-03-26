import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const IMAGE_CREDIT_COST = 2

// 사주 결과 → DALL-E 프롬프트 변환
function buildImagePrompt(sajuResult: string, mode: string, language: string): string {
  // 결과에서 핵심 키워드 추출 (첫 200자)
  const excerpt = sajuResult.slice(0, 400).replace(/✦[^\n]*/g, '').trim()

  // 모드별 스타일 방향
  const styleMap: Record<string, string> = {
    personal: 'a mystical portrait representing the person\'s destiny and inner nature',
    compatibility: 'two complementary energies meeting, representing the harmony between two souls',
    idol: 'a dreamy, cinematic K-drama inspired scene representing a fateful encounter between two people',
  }
  const style = styleMap[mode] || styleMap['personal']

  return `Create ${style}.

The reading essence: "${excerpt.slice(0, 200)}"

Style requirements:
- Traditional Korean ink painting (수묵화) meets modern celestial art
- Dark, atmospheric background with soft gold and purple cosmic elements
- Flowing brushstrokes, wisps of cosmic energy, symbolic natural elements (mountains, water, stars, moon)
- Elements that match the energy: ${extractEnergyKeywords(sajuResult)}
- Cinematic, ethereal, beautiful — suitable for sharing on social media
- No text, no words, no letters in the image
- Vertical/portrait orientation preferred
- Ultra high quality, detailed, atmospheric

Color palette: deep midnight blues, warm golds, soft purples, gentle whites — like a night sky painting`
}

function extractEnergyKeywords(text: string): string {
  const keywords: string[] = []
  if (text.match(/wood|나무|木/i)) keywords.push('tall trees, forest, growing bamboo')
  if (text.match(/fire|불|火/i)) keywords.push('gentle flames, warm light, phoenix')
  if (text.match(/earth|흙|土/i)) keywords.push('mountains, ancient stones, golden fields')
  if (text.match(/metal|쇠|金/i)) keywords.push('silver moonlight, crystal, gleaming sword')
  if (text.match(/water|물|水/i)) keywords.push('flowing river, ocean waves, rain')
  if (text.match(/mountain|산/i)) keywords.push('majestic peaks, mist')
  if (text.match(/star|별|fate|운명/i)) keywords.push('stars, constellation, cosmic threads')
  if (text.match(/dragon|용/i)) keywords.push('celestial dragon')
  if (keywords.length === 0) keywords.push('cosmic energy, celestial light, flowing silk')
  return keywords.join(', ')
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
    const prompt = buildImagePrompt(sajuResult, mode, language)

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
