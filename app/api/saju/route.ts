import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { ReadingRequest } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── 사주 계산 (서버에서만 실행 — 클라이언트 노출 없음) ──────────────
const HS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const EB = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const EL = ['Wood','Wood','Fire','Fire','Earth','Earth','Metal','Metal','Water','Water']
const PO = ['Yang','Yin','Yang','Yin','Yang','Yin','Yang','Yin','Yang','Yin']

function calcSaju(dateStr: string) {
  const d = new Date(dateStr)
  const year = d.getFullYear(), month = d.getMonth() + 1
  const yi = ((year - 4) % 10 + 10) % 10
  const yb = ((year - 4) % 12 + 12) % 12
  const mb = (year - 1900) * 12 + month
  const mi = ((mb % 10) + 10) % 10
  const db = Math.floor((d.getTime() - new Date(1900, 0, 1).getTime()) / 86400000) + 1
  const di = ((db % 10) + 10) % 10
  return {
    year:  { stem: HS[yi], branch: EB[yb], element: EL[yi], polarity: PO[yi] },
    month: { stem: HS[mi], branch: EB[(month + 1) % 12], element: EL[mi] },
    day:   { stem: HS[di], branch: EB[((db % 12) + 12) % 12], element: EL[di] },
  }
}

function sajuDesc(s: ReturnType<typeof calcSaju>) {
  return `Year: ${s.year.stem}${s.year.branch}(${s.year.element} ${s.year.polarity}), Month: ${s.month.stem}${s.month.branch}(${s.month.element}), Day: ${s.day.stem}${s.day.branch}(${s.day.element})`
}

// ── 프롬프트 (서버에서만 존재) ────────────────────────────────────
const FORMAT_GUIDES: Record<string, string> = {
  personality: `✦ 타고난 본성 (Day Master 오행 기반 2–3문장)\n✦ 핵심 기질 (강점 3가지, 각 1문장씩)\n✦ 숨겨진 내면 (겉으로 잘 드러나지 않는 내면 1단락)\n✦ 타인이 보는 나 (사회적 페르소나 1단락)\n✦ 성장 방향 (잠재력을 꽃피우기 위해 받아들여야 할 것 1문장)`,
  career:      `✦ 천직 (사주에 맞는 일의 방향 2문장)\n✦ 어울리는 분야 (구체적 직업 3가지, 각 근거 1문장)\n✦ 전성기 시기 (어느 나이대에 커리어가 가장 빛나는지)\n✦ 장애물 (직업적 마찰을 만드는 기운 패턴 1단락)\n✦ 성공 공식 (핵심 조언 1문장)`,
  wealth:      `✦ 재물 기운 (재성이 강한지 약한지, 2문장)\n✦ 돈이 오는 방식 (노력·운·파트너십 등 구체적인 경로)\n✦ 재물 누수 패턴 (돈을 잃게 만드는 2가지 패턴)\n✦ 풍요로운 시기 (언제 재물운이 가장 좋은지)\n✦ 재물 조언 (별에서 보내는 구체적인 조언 1문장)`,
  love:        `✦ 사랑의 방식 (어떻게 사랑하고 무엇을 원하는지 2문장)\n✦ 끌리는 타입 (사주가 끌어당기는 상대의 유형)\n✦ 연인으로서의 강점 (파트너에게 줄 수 있는 가장 큰 선물)\n✦ 연애의 과제 (관계를 흔드는 반복 패턴)\n✦ 운명의 사랑 (별이 쓴 연애 이야기 마지막 줄, 시적으로)`,
  marriage:    `✦ 배우자 기운 (배우자성이 얼마나 뚜렷한지)\n✦ 이상적인 파트너 (가장 잘 맞는 상대의 특성 3가지)\n✦ 결혼 시기 (결혼에 유리한 시기)\n✦ 배우자로서의 모습 (강점과 보완할 점)\n✦ 결혼 운명 (마무리 한 문장)`,
  health:      `✦ 전체 기운 (오행 균형으로 본 체질 개요)\n✦ 건강한 부분 (차트가 보호하는 장기·신체 부위)\n✦ 주의할 부분 (약한 오행과 관련 건강 포인트)\n✦ 건강 습관 추천 (오행에 맞는 구체적인 생활 습관 2가지)\n✦ 활력 메시지 (건강에 대한 격려 한 문장)`,
  family:      `✦ 가정 기운 (조상·가족 기운 총평)\n✦ 부모와의 관계 (년주·월주로 본 부모 관계)\n✦ 가족 내 역할 (가정에서 맡게 되는 자연스러운 위치)\n✦ 가정의 과제 (반복되는 가족 역학 패턴)\n✦ 나만의 집 (어떤 가정을 꾸리게 될지 한 문장)`,
  children:    `✦ 자녀 기운 (자녀성의 존재와 강도)\n✦ 자녀와의 관계 (어떤 유대를 나누게 될지)\n✦ 자녀 시기 (자녀와 연결되기 좋은 시기)\n✦ 부모로서의 스타일 (사주가 만드는 양육 방식)\n✦ 다음 세대에게 남기는 것 (물려줄 유산 한 문장)`,
  mentor:      `✦ 귀인 기운 (귀인성이 차트에 얼마나 있는지)\n✦ 나를 돕는 사람 (가장 큰 조력자가 될 유형)\n✦ 도움이 오는 방식 (어떤 상황에서 귀인이 나타나는지)\n✦ 나도 누군가의 귀인 (내가 타인에게 빛이 되는 방식)\n✦ 가장 강한 지원 (운명에서 가장 큰 버팀목 한 문장)`,
  destiny:     `✦ 인생 테마 (차트에 새겨진 영혼의 사명)\n✦ 전반기 (1–30세: 핵심 테마와 배움)\n✦ 중반기 (31–60세: 전성기 에너지와 변화)\n✦ 후반기 (61세~: 지혜의 시기와 유산)\n✦ 영혼의 운명 (가장 깊은 진실을 담은 시적인 한 문장)`,
}

function buildPersonalPrompt(req: ReadingRequest) {
  const s = calcSaju(req.person1.birthDate)
  const cat = req.category!
  const guide = FORMAT_GUIDES[cat]
  return `당신은 30년 경력의 한국 사주팔자 명리학 대가입니다.

의뢰인 정보:
- 생년월일: ${req.person1.birthDate} (${req.person1.calendar === 'solar' ? '양력' : '음력'})
- 출생 시간: ${req.person1.birthTime}
- 성별: ${req.person1.gender === 'male' ? '남' : req.person1.gender === 'female' ? '여' : '기타'}
- 출생지: ${req.person1.birthPlace || '미기재'}
- 사주 기둥: ${sajuDesc(s)}

요청 운세: ${cat}

지시 사항:
1. 반드시 ${req.language}로 작성하세요
2. 제공된 실제 사주 데이터를 근거로 구체적이고 개인화된 해석을 하세요
3. 범용적인 내용이 아닌, 이 사람만의 고유한 기운을 짚어주세요
4. 따뜻하고 통찰력 있는 어조를 유지하세요
5. # 마크다운 헤더를 절대 사용하지 말고, ✦ 기호를 사용하세요

아래 형식을 정확히 따르세요:
${guide}

총 분량: 300–380자(어절 기준). 과도한 수식어 없이 간결하고 깊이 있게 작성하세요.`
}

function buildCompatPrompt(req: ReadingRequest) {
  const s1 = calcSaju(req.person1.birthDate)
  const s2 = calcSaju(req.person2!.birthDate)
  return `당신은 국제 K-문화 팬들에게 사랑받는 한국 사주 궁합 대가입니다.

1번: 생일 ${req.person1.birthDate}, 시간 ${req.person1.birthTime}, 성별 ${req.person1.gender}
사주: ${sajuDesc(s1)}

2번: 생일 ${req.person2!.birthDate}, 시간 ${req.person2!.birthTime}, 성별 ${req.person2!.gender}
사주: ${sajuDesc(s2)}

${req.language}로 작성하세요. 아래 형식을 정확히 따르세요:

✦ 인연 점수 — [X/100] — 한 줄 총평
✦ 오행 조화 — 두 사람의 오행이 어떻게 맞닿는지 (흐름인가 긴장인가)
✦ 감정적 유대 — 서로를 얼마나 깊이 이해하는지
✦ 함께할 때 강점 — 이 조합이 빛나는 이유
✦ 갈등 포인트 — 반복될 수 있는 마찰 패턴
✦ 최종 결론 — 이 인연을 마무리하는 시적인 한 문장

실제 사주 데이터에 근거하세요. 따뜻하되 솔직하게. 300–380자. # 마크다운 사용 금지.`
}

function buildIdolPrompt(req: ReadingRequest) {
  const s1 = calcSaju(req.person1.birthDate)
  const celeb = req.celebrity!
  const s2 = calcSaju(celeb.birth)
  return `당신은 전 세계 K-팝·K-드라마 팬들에게 사랑받는 한국 사주 궁합 대가입니다. 설레고 감동적인 셀럽 궁합 리딩을 전문으로 합니다.

팬:
- 생일: ${req.person1.birthDate}, 시간: ${req.person1.birthTime}, 성별: ${req.person1.gender}
- 사주: ${sajuDesc(s1)}

셀럽 (${celeb.name} / ${celeb.group}):
- 생일: ${celeb.birth}, 성별: ${celeb.gender}
- 사주: ${sajuDesc(s2)}

${req.language}로 작성하세요. 아래 형식을 정확히 따르세요:

✦ 운명 점수 — [X/100] — 극적으로 공개하며 한 줄 훅
✦ 첫 만남의 에너지 — 처음 마주쳤을 때 서로가 느낄 것
✦ 오행 케미 — 두 차트 사이의 우주적 에너지 (구체적 오행 언급)
✦ ${celeb.name}이(가) 당신에게 반할 이유 — 팬의 사주에서 찾은 2–3가지 매력
✦ 두 사람의 역학 — 누가 리드하고, 누가 부드럽게 감싸는지
✦ 전생의 인연 — 이 세상 이전에 두 사람은 무엇이었는지 생생한 한 문장
✦ 별의 메시지 — 우주가 보내는 마지막 시적인 한 마디

감성적이고 영화 같은 K-드라마 분위기로. 실제 사주 데이터 기반. 350–420자. # 마크다운 사용 금지.`
}

// ── API 핸들러 ────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
    }

    const body: ReadingRequest = await request.json()

    // 2. 크레딧 확인 및 차감 (서버에서만 처리 — 클라이언트 조작 불가)
    const costMap = { personal: 1, compatibility: 2, idol: 3 }
    const cost = costMap[body.mode]

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없어요.' }, { status: 400 })
    }

    if (profile.credits < cost) {
      return NextResponse.json({ error: '크레딧이 부족해요.' }, { status: 402 })
    }

    // 3. 크레딧 차감
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - cost })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: '크레딧 처리 중 오류가 발생했어요.' }, { status: 500 })
    }

    // 4. 프롬프트 생성 및 Claude 호출
    let prompt = ''
    if (body.mode === 'personal')        prompt = buildPersonalPrompt(body)
    else if (body.mode === 'compatibility') prompt = buildCompatPrompt(body)
    else if (body.mode === 'idol')       prompt = buildIdolPrompt(body)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const reading = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({
      reading,
      remainingCredits: profile.credits - cost,
    })

  } catch (error) {
    console.error('Saju API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했어요. 다시 시도해주세요.' }, { status: 500 })
  }
}
