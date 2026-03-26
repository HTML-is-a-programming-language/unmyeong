import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const IMAGE_CREDIT_COST = 2

function hasKeyword(text: string, regex: RegExp): boolean {
    return regex.test(text)
}

function getModeSubject(mode: string): string {
    if (mode === 'personal') {
        return 'a stylish foreign Gen Z woman who loves K-fashion and K-pop culture'
    }

    if (mode === 'compatibility') {
        return 'a stylish foreign Gen Z woman and a K-pop idol-inspired male figure'
    }

    if (mode === 'idol') {
        return 'a stylish foreign Gen Z woman and a charismatic K-pop idol-inspired male figure in a romantic two-shot'
    }

    return 'a stylish foreign Gen Z woman'
}

function getSceneDescription(sajuResult: string, mode: string): string {
    const text = sajuResult || ''

    const hasFate = hasKeyword(text, /운명|destiny|fate|별|star|constellation/i)
    const hasLove = hasKeyword(text, /연애|romance|love|heart|끌림|attraction/i)
    const hasStable = hasKeyword(text, /안정|stable|trust|balance|earth|토|土/i)
    const hasPassion = hasKeyword(text, /열정|passion|fire|불|火/i)
    const hasWater = hasKeyword(text, /물|수|水|water|ocean|flow|moonlight/i)

    if (mode === 'personal') {
        if (hasFate) {
            return 'a cinematic solo portrait on a Seoul rooftop at blue hour, with subtle city lights and a dreamy destiny aura'
        }

        if (hasWater) {
            return 'a soft luxury portrait near a moonlit window with sheer curtains, misty reflections, and elegant Seoul night ambience'
        }

        if (hasStable) {
            return 'a polished lifestyle fashion portrait on a calm Seoul cafe street, warm sunlight, refined urban romance mood'
        }

        return 'a premium editorial portrait in Seoul with soft city lights, fashionable styling, and romantic K-drama atmosphere'
    }

    if (hasLove && hasPassion) {
        return 'a romantic Seoul night street scene after light rain, glowing reflections on the road, intimate chemistry, and cinematic tension'
    }

    if (hasFate) {
        return 'a rooftop romance scene in Seoul at night, subtle starlight, city skyline, and a destined connection atmosphere'
    }

    if (hasStable) {
        return 'a warm and elegant date scene on a peaceful Seoul cafe street with soft natural light and emotionally secure chemistry'
    }

    if (hasWater) {
        return 'a dreamy moonlit urban scene with reflective light, airy fabric, and soft emotional closeness'
    }

    return 'a cinematic urban romance scene in Seoul with soft neon lights, premium fashion mood, and emotionally flattering composition'
}

function extractRelationshipMood(text: string, mode: string): string {
    const moods: string[] = []

    if (mode === 'personal') {
        moods.push('beautiful, aspirational, confident, feminine, magnetic')
    } else {
        moods.push('romantic, emotionally flattering, visually magnetic')
    }

    if (hasKeyword(text, /운명|destiny|fate|별|star/i)) {
        moods.push('destined', 'lingering', 'meant-to-be')
    }

    if (hasKeyword(text, /연애|romance|love|heart|호감|attraction/i)) {
        moods.push('soft eye contact', 'intimate chemistry', 'warm affection')
    }

    if (hasKeyword(text, /열정|passion|불|火|strong/i)) {
        moods.push('intense', 'passionate', 'high romantic tension')
    }

    if (hasKeyword(text, /안정|trust|stable|earth|토|土/i)) {
        moods.push('safe', 'gentle', 'emotionally secure')
    }

    if (hasKeyword(text, /갈등|conflict|distance|엇갈림/i)) {
        moods.push('bittersweet', 'push-pull tension', 'emotional depth')
    }

    return moods.join(', ')
}

function extractVisualSymbols(text: string, mode: string): string {
    const symbols: string[] = []

    if (hasKeyword(text, /wood|나무|목|木|forest|tree|growth/i)) {
        symbols.push('soft spring leaves', 'cherry blossom petals', 'fresh green accents')
    }

    if (hasKeyword(text, /fire|불|화|火|passion|sunset/i)) {
        symbols.push('warm sunset glow', 'golden light particles', 'coral and amber highlights')
    }

    if (hasKeyword(text, /earth|흙|토|土|stable|grounded/i)) {
        symbols.push('warm beige stone textures', 'golden sunlight', 'soft earthy elegance')
    }

    if (hasKeyword(text, /metal|쇠|금|金|crystal|sharp/i)) {
        symbols.push('silver sparkle', 'crystal accents', 'pearl-white highlights')
    }

    if (hasKeyword(text, /water|물|수|水|ocean|flow|moonlight/i)) {
        symbols.push('moonlit reflections', 'misty blue atmosphere', 'soft flowing fabric')
    }

    if (hasKeyword(text, /운명|destiny|fate|별|star|constellation/i)) {
        symbols.push('a subtle red-gold destiny thread', 'tiny constellations', 'gentle celestial glow')
    }

    if (hasKeyword(text, /연애|romance|love|heart|crush/i)) {
        symbols.push('soft blush lighting', 'rose-petal accents', 'romantic bokeh')
    }

    if (mode !== 'personal') {
        symbols.push('tasteful two-person framing', 'close but elegant body language')
    }

    if (symbols.length === 0) {
        symbols.push('soft light particles', 'elegant city lights', 'subtle romantic glow')
    }

    return symbols.join(', ')
}

function extractFashionBeautyDirection(mode: string, text: string): string {
    const items: string[] = [
        'trendy K-fashion styling',
        'glossy healthy hair',
        'luminous skin',
        'natural but elevated makeup',
        'premium editorial beauty direction'
    ]

    if (mode === 'personal') {
        items.push('a feminine and aspirational fashion campaign feel')
    } else {
        items.push('a luxurious K-drama romance still feeling')
    }

    if (hasKeyword(text, /fire|불|화|火|passion/i)) {
        items.push('sleek silhouettes', 'warmer makeup accents')
    }

    if (hasKeyword(text, /water|물|수|水|moonlight/i)) {
        items.push('soft satin fabric', 'cool-toned shimmer')
    }

    if (hasKeyword(text, /wood|나무|목|木|growth/i)) {
        items.push('fresh spring styling', 'light airy layers')
    }

    if (hasKeyword(text, /metal|쇠|금|金|crystal/i)) {
        items.push('clean accessories', 'refined luxury details')
    }

    return items.join(', ')
}

function extractShotDirection(mode: string, text: string): string {
    const directions: string[] = [
        'cinematic composition',
        'clear face details',
        'expressive eyes',
        'natural hands',
        'balanced flattering framing'
    ]

    if (mode === 'personal') {
        directions.push('solo portrait focus', 'heroine energy', 'save-worthy wallpaper composition')
    } else {
        directions.push('romantic two-shot framing', 'tasteful closeness', 'strong visual chemistry')
    }

    if (hasKeyword(text, /갈등|conflict|distance|엇갈림/i)) {
        directions.push('slight tension in posture', 'warm and cool contrast')
    } else {
        directions.push('soft body language', 'emotionally inviting composition')
    }

    return directions.join(', ')
}

function extractColorPalette(text: string): string {
    if (hasKeyword(text, /fire|불|화|火|passion|열정/i)) {
        return 'warm rose gold, coral, amber, cream white, sunset peach'
    }

    if (hasKeyword(text, /water|물|수|水|moonlight|flow/i)) {
        return 'soft blue, silver, misty lavender, pearl white, moonlit grey'
    }

    if (hasKeyword(text, /wood|나무|목|木|growth|성장/i)) {
        return 'soft mint, blush pink, cream, spring green, warm gold'
    }

    if (hasKeyword(text, /metal|쇠|금|金|crystal/i)) {
        return 'icy silver, pearl white, cool lilac, crystalline blue'
    }

    if (hasKeyword(text, /earth|흙|토|土|stable|안정/i)) {
        return 'warm beige, honey gold, soft brown, cream, muted peach'
    }

    return 'soft pink, dreamy lavender, warm gold, pearl white'
}

// 사주 결과 → 이미지 프롬프트 변환
function buildImagePrompt(sajuResult: string, mode: string): string {
    const subject = getModeSubject(mode)
    const scene = getSceneDescription(sajuResult, mode)
    const mood = extractRelationshipMood(sajuResult, mode)
    const symbols = extractVisualSymbols(sajuResult, mode)
    const fashionBeauty = extractFashionBeautyDirection(mode, sajuResult)
    const shotDirection = extractShotDirection(mode, sajuResult)
    const colorPalette = extractColorPalette(sajuResult)

    const promptLines: string[] = [
        'Create a premium, save-worthy AI image for global Gen Z women who love K-pop, Korean romance fantasy, and Seoul fashion culture.',
        '',
        `Main subjects: ${subject}.`,
        `Scene: ${scene}.`,
        `Mood and chemistry: ${mood}.`,
        `Visual symbolism inspired by the saju reading: ${symbols}.`,
        `Fashion and beauty direction: ${fashionBeauty}.`,
        `Shot direction: ${shotDirection}.`,
        `Color palette: ${colorPalette}.`,
        '',
        'Art direction:',
        '- cinematic fashion editorial',
        '- luxury K-drama still feeling',
        '- romantic, trendy, modern, emotionally flattering',
        '- stylish but natural proportions',
        '- glossy hair, luminous skin, flattering light on the face',
        '- subtle symbolic effects only, with the people staying as the clear focus',
        '- aspirational and addictive visual mood, like something a user would save to wallpaper or Instagram story immediately',
        '',
        'Character rules:',
        '- the woman should clearly feel like a fashionable foreign Gen Z K-pop fan, not a Korean woman unless explicitly requested',
        '- for duo images, the male figure should feel K-pop idol-inspired with charismatic stage presence and refined visuals, but not an exact copy of any real celebrity',
        '- keep the romance tasteful, elegant, youthful, and emotionally immersive',
        '',
        'Avoid:',
        '- childish anime or chibi look',
        '- overly busy flowers or cosmic effects covering faces',
        '- awkward hands, extra fingers, blurry faces, stiff poses',
        '- text, letters, logos, watermark'
    ]

    return promptLines.join('\n')
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
        }

        const { sajuResult, mode, language: _language } = await request.json()

        if (!sajuResult) {
            return NextResponse.json({ error: '사주 결과가 없어요.' }, { status: 400 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single()

        if (!profile || profile.credits < IMAGE_CREDIT_COST) {
            return NextResponse.json(
                { error: `크레딧이 부족해요. AI 이미지는 ${IMAGE_CREDIT_COST}크레딧이 필요해요.` },
                { status: 402 }
            )
        }

        await supabase
            .from('profiles')
            .update({ credits: profile.credits - IMAGE_CREDIT_COST })
            .eq('id', user.id)

        const prompt = buildImagePrompt(sajuResult, mode)

        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            style: 'vivid'
        })

        const imageUrl = response.data?.[0]?.url

        if (!imageUrl) {
            await supabase
                .from('profiles')
                .update({ credits: profile.credits })
                .eq('id', user.id)

            return NextResponse.json({ error: '이미지 생성에 실패했어요.' }, { status: 500 })
        }

        return NextResponse.json({
            imageUrl,
            remainingCredits: profile.credits - IMAGE_CREDIT_COST
        })
    } catch (error: unknown) {
        console.error('Image generation error:', error)
        return NextResponse.json({ error: '이미지 생성 중 오류가 발생했어요.' }, { status: 500 })
    }
}