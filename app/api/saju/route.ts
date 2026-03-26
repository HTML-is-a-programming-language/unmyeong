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

// ── 언어별 사주 입문 설명 ──────────────────────────────────────────
function getSajuIntro(language: string): string {
  const intros: Record<string, string> = {
    Korean: `사주(四柱)는 태어난 연·월·일·시의 네 기둥으로 운명을 읽는 한국의 전통 운명학입니다. 각 기둥은 천간(하늘의 기운)과 지지(땅의 기운)로 이루어지며, 木(나무)·火(불)·土(흙)·金(쇠)·水(물)의 오행이 서로 상생·상극하며 삶의 흐름을 만듭니다.`,
    English: `Saju (사주) is Korea's ancient system of destiny reading, using the Four Pillars of your birth — year, month, day, and hour. Each pillar combines Heavenly Stems (cosmic energy) and Earthly Branches (earthly energy), forming a unique energy map of your life through five elements: Wood, Fire, Earth, Metal, and Water.`,
    Japanese: `사주(四柱)は、生まれた年・月・日・時の四つの柱で運命を読む韓国の伝統占術です。各柱は天干（天の気）と地支（地の気）で構成され、木・火・土・金・水の五行が互いに影響し合いながら人生の流れを作ります。`,
    Thai: `ซาจู (사주) คือศาสตร์โบราณของเกาหลีในการอ่านชะตากรรมจากสี่เสาหลักแห่งการเกิด ได้แก่ ปี เดือน วัน และเวลา แต่ละเสาประกอบด้วยพลังสวรรค์และพลังโลก ผ่านธาตุทั้งห้า ได้แก่ ไม้ ไฟ ดิน โลหะ และน้ำ`,
    Spanish: `Saju (사주) es el antiguo sistema coreano de lectura del destino usando los Cuatro Pilares de tu nacimiento: año, mes, día y hora. Cada pilar combina energías celestiales y terrestres a través de cinco elementos: Madera, Fuego, Tierra, Metal y Agua.`,
    Portuguese: `Saju (사주) é o antigo sistema coreano de leitura do destino usando os Quatro Pilares do nascimento: ano, mês, dia e hora. Cada pilar combina energias celestiais e terrestres através de cinco elementos: Madeira, Fogo, Terra, Metal e Água.`,
    Chinese: `사주（四柱）是韩国传统命理学，通过出生年、月、日、时四柱来解读命运。每柱由天干（天之气）和地支（地之气）组成，木、火、土、金、水五行相生相克，构成人生的运势流动。`,
  }
  return intros[language] || intros['English']
}

// ── 오행 자연어 설명 ───────────────────────────────────────────────
function elementDescription(element: string, language: string): string {
  const desc: Record<string, Record<string, string>> = {
    Wood:   { Korean:'木(나무) — 성장·창의·도전의 기운', English:'Wood — growth, creativity, ambition', Japanese:'木 — 成長・創造・挑戦のエネルギー', Thai:'ธาตุไม้ — การเติบโต ความคิดสร้างสรรค์', Spanish:'Madera — crecimiento, creatividad, ambición', Portuguese:'Madeira — crescimento, criatividade, ambição', Chinese:'木 — 生长、创造力、进取心' },
    Fire:   { Korean:'火(불) — 열정·표현·빠른 직관의 기운', English:'Fire — passion, expression, quick intuition', Japanese:'火 — 情熱・表現・直感のエネルギー', Thai:'ธาตุไฟ — ความหลงใหล การแสดงออก', Spanish:'Fuego — pasión, expresión, intuición', Portuguese:'Fogo — paixão, expressão, intuição', Chinese:'火 — 热情、表达力、直觉' },
    Earth:  { Korean:'土(흙) — 안정·신뢰·포용의 기운', English:'Earth — stability, trustworthiness, nurturing', Japanese:'土 — 安定・信頼・包容のエネルギー', Thai:'ธาตุดิน — ความมั่นคง ความน่าเชื่อถือ', Spanish:'Tierra — estabilidad, confiabilidad, cuidado', Portuguese:'Terra — estabilidade, confiabilidade, cuidado', Chinese:'土 — 稳定、信任、包容' },
    Metal:  { Korean:'金(쇠) — 결단·원칙·집중의 기운', English:'Metal — decisiveness, principles, focus', Japanese:'金 — 決断・原則・集中のエネルギー', Thai:'ธาตุโลหะ — การตัดสินใจ หลักการ', Spanish:'Metal — decisión, principios, enfoque', Portuguese:'Metal — decisão, princípios, foco', Chinese:'金 — 决断、原则、专注' },
    Water:  { Korean:'水(물) — 지혜·유연·깊은 통찰의 기운', English:'Water — wisdom, flexibility, deep insight', Japanese:'水 — 知恵・柔軟性・洞察のエネルギー', Thai:'ธาตุน้ำ — ปัญญา ความยืดหยุ่น', Spanish:'Agua — sabiduría, flexibilidad, perspicacia', Portuguese:'Água — sabedoria, flexibilidade, perspicácia', Chinese:'水 — 智慧、灵活性、深刻洞察' },
  }
  return desc[element]?.[language] || desc[element]?.['English'] || element
}

// ── 카테고리별 출력 포맷 ───────────────────────────────────────────
const FORMAT_GUIDES: Record<string, string> = {
  personality: `
✦ 나의 사주 핵심 — 일주(日柱)의 오행이 무엇인지 자연에 빗댄 이미지로 설명 (예: "당신의 일주는 큰 강물처럼..."). 사주를 처음 접하는 사람도 바로 이해할 수 있게 쉽게 쓸 것
✦ 타고난 성격 — 이 오행을 가진 사람이 실제로 어떤 성향인지 구체적 예시와 함께 설명. 강점 2가지, 그림자(단점) 1가지 솔직하게
✦ 남들이 보는 나 vs 진짜 나 — 겉으로 드러나는 모습과 내면의 실제 모습이 어떻게 다른지. 공감이 가게 구체적으로
✦ 이 성격의 숨겨진 재능 — 이 기질이 있는 사람만이 갖는 특별한 능력이나 매력
✦ 성장 조언 — 이 성격이 더 빛나기 위해 실생활에서 실천할 수 있는 구체적인 한 가지`,

  career: `
✦ 당신에게 맞는 일이란 — 이 사주를 가진 사람이 어떤 환경에서 일할 때 가장 빛나는지 구체적으로
✦ 어울리는 직업 3가지 — 각 직업을 추천하는 이유를 사주 오행과 연결해서 쉽게 설명
✦ 커리어 전성기 — 몇 살 전후가 가장 두각을 나타내는 시기이며 그 이유는 무엇인지
✦ 일하다 자주 겪는 어려움 — 이 사주를 가진 사람이 직장이나 사업에서 반복적으로 맞닥뜨리는 패턴과 극복법
✦ 성공을 위한 핵심 열쇠 — 이 사람이 반드시 기억해야 할 단 하나의 직업적 조언`,

  wealth: `
✦ 이 사주의 재물 기운 — 재물성(財星)이 강한지 약한지, 부자 체질인지 아닌지를 쉬운 말로
✦ 돈이 들어오는 통로 — 노력형인지, 운이 따르는 형인지, 사람을 통하는 형인지 구체적 경로
✦ 돈이 새는 패턴 — 이 사주를 가진 사람이 돈을 잃거나 낭비하는 반복 패턴 2가지
✦ 재물운이 피는 시기 — 언제 돈이 모이기 시작하는지, 어느 나이대가 재정적으로 가장 풍요로운지
✦ 부를 키우는 실천 조언 — 지금 당장 실천할 수 있는 재물운 강화법 한 가지`,

  love: `
✦ 이 사주의 사랑 방식 — 연애할 때 어떻게 감정을 표현하고 무엇을 중요하게 여기는지 솔직하게
✦ 끌리는 이상형 — 오행상 잘 맞는 상대의 성격과 에너지. 왜 그런 사람에게 끌리는지 이유 포함
✦ 연인으로서의 매력 — 이 사람이 연애할 때 상대에게 주는 가장 큰 선물과 매력
✦ 연애에서 반복되는 상처 — 사주에서 보이는 연애 패턴의 아킬레스건. 공감이 가게 구체적으로
✦ 운명의 인연을 만나는 법 — 이 사람에게 진짜 사랑이 찾아오는 시기와 상황`,

  marriage: `
✦ 결혼 체질인가? — 이 사주에서 배우자성(배우자 기운)이 얼마나 강한지, 결혼과 궁합이 좋은 사주인지
✦ 이상적인 배우자 상 — 오행으로 본 가장 잘 맞는 파트너의 구체적인 성격 특성 3가지
✦ 결혼하기 좋은 시기 — 몇 살 전후가 결혼에 유리하고 그 이유는 무엇인지
✦ 결혼 생활에서의 모습 — 배우자로서의 강점과 파트너가 힘들어할 수 있는 부분 솔직하게
✦ 행복한 결혼을 위한 조언 — 이 사주를 가진 사람이 결혼 생활에서 반드시 기억해야 할 것`,

  health: `
✦ 타고난 체질 — 오행 균형으로 본 기본 체질. 강한 기운과 약한 기운이 신체에 어떻게 나타나는지
✦ 건강한 부분 — 이 사주가 자연스럽게 보호하는 장기나 신체 부위
✦ 주의해야 할 건강 포인트 — 약한 오행과 연결된 신체 부위나 질환 경향. 예방법 포함
✦ 건강을 지키는 생활 습관 — 이 오행에 맞는 식습관, 운동법, 생활 리듬 2가지 구체적으로
✦ 활력을 높이는 한 가지 — 지금 당장 실천할 수 있는 가장 효과적인 건강 관리법`,

  family: `
✦ 가족 기운의 전반적인 흐름 — 이 사주에서 가족·조상의 기운이 어떻게 흐르는지 전체적으로
✦ 부모와의 관계 — 년주(年柱)와 월주(月柱)로 읽는 부모님과의 인연과 관계 패턴
✦ 가족 안에서의 역할 — 이 사람이 자연스럽게 맡게 되는 가족 내 포지션과 역할
✦ 가족 관계에서 반복되는 패턴 — 가정에서 자주 겪는 갈등이나 역학 관계
✦ 따뜻한 가정을 만드는 법 — 이 사주를 가진 사람이 행복한 가정을 꾸리기 위한 실천 조언`,

  children: `
✦ 자녀 기운 — 이 사주에서 자녀성(子女星)이 어떻게 나타나는지. 자녀와의 인연이 강한지
✦ 자녀와의 관계 — 어떤 부모-자녀 관계를 맺게 될지, 어떤 유대감을 나누는지
✦ 자녀를 갖기 좋은 시기 — 자녀와 인연이 깊어지는 나이대나 시기
✦ 부모로서의 스타일 — 이 사주를 가진 사람이 자연스럽게 보이는 양육 방식의 강점과 보완점
✦ 자녀에게 물려주는 것 — 이 사람이 다음 세대에게 남기는 가장 소중한 유산`,

  mentor: `
✦ 귀인(貴人) 기운 — 이 사주에 귀인(나를 도와주는 고마운 사람) 기운이 얼마나 있는지
✦ 나를 도와주는 사람의 유형 — 어떤 성격이나 직업을 가진 사람이 나의 귀인이 될 가능성이 높은지
✦ 귀인을 만나는 시기와 상황 — 어떤 시기에, 어떤 상황에서 조력자가 나타나는지
✦ 나도 누군가의 귀인 — 내가 자연스럽게 다른 사람에게 도움을 주는 방식과 역할
✦ 좋은 인연을 만드는 법 — 이 사주를 가진 사람이 귀인을 더 많이 만나기 위한 실천 조언`,

  destiny: `
✦ 이 삶의 큰 테마 — 이 사주 전체를 관통하는 인생의 핵심 주제를 한 문장으로. 왜 그런지 설명
✦ 인생 전반기 (1–30세) — 이 시기의 주요 에너지와 배워야 할 핵심 교훈
✦ 인생 중반기 (31–60세) — 전성기는 언제이고, 어떤 변화와 도전이 기다리는지
✦ 인생 후반기 (61세~) — 노년의 기운과 남기게 될 유산
✦ 이 영혼이 이 세상에 온 이유 — 가장 깊은 운명의 메시지를 시적이고 감동적으로`,
}

function buildPersonalPrompt(req: ReadingRequest) {
  const s = calcSaju(req.person1.birthDate)
  const cat = req.category!
  const guide = FORMAT_GUIDES[cat]
  const lang = req.language
  const dayElement = elementDescription(s.day.element, lang)
  const yearElement = elementDescription(s.year.element, lang)

  return `You are a world-renowned Korean Saju (사주팔자) master with 30 years of experience, beloved for making ancient Korean fortune-telling deeply understandable to people of all backgrounds worldwide.

PERSON'S INFORMATION:
- Birth: ${req.person1.birthDate} (${req.person1.calendar === 'solar' ? 'Solar' : 'Lunar'} calendar)
- Birth time: ${req.person1.birthTime}
- Gender: ${req.person1.gender}
- Birth place: ${req.person1.birthPlace || 'not specified'}
- Four Pillars: ${sajuDesc(s)}
- Day Master element: ${dayElement}
- Year element: ${yearElement}

READING TYPE: ${cat}
OUTPUT LANGUAGE: ${lang}

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. Write ENTIRELY in ${lang}. Every single word must be in ${lang}.
2. ALWAYS start with a 2-sentence introduction explaining what Saju is and what this reading means, in simple terms: "${getSajuIntro(lang)}"
3. When mentioning any Saju term (천간, 지지, 오행, Day Master, etc.), ALWAYS explain it in plain everyday language immediately after. Example: "Your Day Master is Wood (木) — think of yourself as a tall tree: ambitious, always reaching upward, deeply rooted."
4. Use VIVID natural metaphors and real-life examples. Not "your Wood element is strong" but "you are like a great forest — people feel sheltered around you, and you grow best when given room to expand."
5. Make it feel like a trusted friend who happens to know ancient wisdom is speaking directly to this person.
6. Be SPECIFIC to this person's actual Saju data — reference their specific elements and pillars.
7. Each section should be 3-5 sentences minimum. No bullet points within sections.
8. Do NOT use # markdown headers. Use ✦ symbol only.
9. End with a warm, personal closing message directly to the reader.

FOLLOW THIS EXACT FORMAT:
${guide}

TOTAL LENGTH: 500-650 words. Rich, detailed, and personal — not a generic horoscope.`
}

function buildCompatPrompt(req: ReadingRequest) {
  const s1 = calcSaju(req.person1.birthDate)
  const s2 = calcSaju(req.person2!.birthDate)
  const lang = req.language

  return `You are a world-renowned Korean Saju compatibility (궁합) master, beloved for making ancient Korean wisdom accessible to everyone worldwide.

PERSON 1: Born ${req.person1.birthDate}, Time: ${req.person1.birthTime}, Gender: ${req.person1.gender}
Saju: ${sajuDesc(s1)} — Day Master: ${elementDescription(s1.day.element, lang)}

PERSON 2: Born ${req.person2!.birthDate}, Time: ${req.person2!.birthTime}, Gender: ${req.person2!.gender}
Saju: ${sajuDesc(s2)} — Day Master: ${elementDescription(s2.day.element, lang)}

OUTPUT LANGUAGE: ${lang}

CRITICAL INSTRUCTIONS:
1. Write ENTIRELY in ${lang}.
2. Start by briefly explaining what Saju compatibility (궁합) means in 1-2 sentences in plain language.
3. Explain each person's core energy using natural metaphors BEFORE analyzing the match.
4. When elements interact, explain it like this: "Wood feeds Fire — one person naturally energizes the other" or "Water controls Fire — there's tension, but also magnetic attraction."
5. Be honest but warm. Every couple has strengths AND challenges.
6. Each section must be 3-5 sentences. Rich and personal.
7. Do NOT use # markdown. Use ✦ only.

FOLLOW THIS EXACT FORMAT:

✦ Compatibility Score — [X/100] with a one-line dramatic verdict. Briefly explain why this score.
✦ Your Two Energies — Describe each person's core Saju energy using vivid metaphors. How do these two energies look when they meet?
✦ Elemental Chemistry — How do their elements interact? Use nature metaphors (fire and wood, water and earth, etc.) to explain the dynamic in a way anyone can understand.
✦ Emotional Connection — How deeply do they understand each other's hearts? What makes them feel truly seen by the other?
✦ What Makes This Pair Powerful — The unique strengths of this combination. What can they achieve together that neither could alone?
✦ The Challenge to Navigate — The recurring friction point. Honest but compassionate. Include a practical tip.
✦ The Verdict — A poetic, cinematic final sentence that captures the essence of this pair's story.

Length: 500-600 words. No # markdown.`
}

function buildIdolPrompt(req: ReadingRequest) {
  const s1 = calcSaju(req.person1.birthDate)
  const celeb = req.celebrity!
  const s2 = calcSaju(celeb.birth)
  const lang = req.language

  return `You are a beloved Korean Saju master who creates magical, heartfelt K-celeb compatibility readings for devoted international fans. You make ancient Korean wisdom feel exciting, personal, and deeply meaningful.

THE FAN:
- Born: ${req.person1.birthDate}, Time: ${req.person1.birthTime}, Gender: ${req.person1.gender}
- Saju: ${sajuDesc(s1)} — Core energy: ${elementDescription(s1.day.element, lang)}

THE CELEBRITY: ${celeb.name} (${celeb.group})
- Born: ${celeb.birth}, Gender: ${celeb.gender}
- Saju: ${sajuDesc(s2)} — Core energy: ${elementDescription(s2.day.element, lang)}

OUTPUT LANGUAGE: ${lang}

CRITICAL INSTRUCTIONS:
1. Write ENTIRELY in ${lang}.
2. Open with 1 sentence explaining what this K-celeb Saju reading reveals.
3. Describe BOTH people's energies using vivid metaphors before analyzing compatibility.
4. Make it feel cinematic and emotional — like the best K-drama scene.
5. Ground every insight in actual Saju data. No generic statements.
6. Each section 3-5 sentences. Rich, personal, emotional.
7. Do NOT use # markdown. Use ✦ only.

FOLLOW THIS EXACT FORMAT:

✦ Fate Score — [X/100] — Reveal it dramatically with a breathtaking one-line hook that makes the fan's heart race.
✦ Your Two Worlds — Paint a vivid picture of both energy types. What is the fan like? What is ${celeb.name} like? Use nature and K-drama metaphors.
✦ The Cosmic Chemistry — How do their Saju elements interact? Explain the elemental dynamic in beautiful, accessible language. Does fire meet wind? Does ocean meet shore?
✦ Why ${celeb.name} Would Fall For You — Based purely on the fan's Saju, describe 2-3 specific qualities that would genuinely captivate ${celeb.name}. Make it feel real and personal.
✦ Your Dynamic Together — Who leads? Who softens? How does power and affection flow between these two energies? Paint the scene.
✦ A Past Life Connection — In another time, another world — what were these two souls to each other? One vivid, cinematic sentence.
✦ Message from the Universe — The final word, written as if the cosmos itself is speaking directly to the fan. Poetic, beautiful, and unforgettable.

Length: 550-700 words. Make it emotional, cinematic, K-drama worthy. No # markdown.`
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
      max_tokens: 2000,
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