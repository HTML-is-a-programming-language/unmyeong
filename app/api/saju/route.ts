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
[섹션 1] 나의 사주 핵심
일주(日柱)의 오행이 무엇인지 자연에 빗댄 이미지로 설명. 사주를 처음 접하는 사람도 바로 이해할 수 있게 쉽고 생생하게. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 타고난 성격
이 오행을 가진 사람이 실제로 어떤 성향인지 구체적 예시와 함께. 강점 2가지, 그림자(단점) 1가지 솔직하게. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 남들이 보는 나 vs 진짜 나
겉으로 드러나는 모습과 내면의 실제 모습이 어떻게 다른지. 공감이 가게 구체적으로. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 이 성격의 숨겨진 재능
이 기질이 있는 사람만이 갖는 특별한 능력이나 매력. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 성장 조언
이 성격이 더 빛나기 위해 실생활에서 실천할 수 있는 구체적인 한 가지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  career: `
[섹션 1] 당신에게 맞는 일이란
이 사주를 가진 사람이 어떤 환경에서 일할 때 가장 빛나는지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 어울리는 직업들
각 직업을 추천하는 이유를 사주 오행과 연결해서 쉽게. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 커리어 전성기
몇 살 전후가 가장 두각을 나타내는 시기이며 그 이유는. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 일하다 자주 겪는 어려움
이 사주를 가진 사람이 반복적으로 맞닥뜨리는 패턴과 극복법. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 성공을 위한 핵심 열쇠
반드시 기억해야 할 단 하나의 직업적 조언. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  wealth: `
[섹션 1] 이 사주의 재물 기운
재물성이 강한지 약한지, 부자 체질인지 아닌지를 쉬운 말로. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 돈이 들어오는 통로
노력형인지, 운이 따르는 형인지, 사람을 통하는 형인지 구체적 경로. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 돈이 새는 패턴
돈을 잃거나 낭비하는 반복 패턴 2가지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 재물운이 피는 시기
언제 돈이 모이기 시작하는지, 어느 나이대가 가장 풍요로운지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 부를 키우는 실천 조언
지금 당장 실천할 수 있는 재물운 강화법 한 가지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  love: `
[섹션 1] 이 사주의 사랑 방식
연애할 때 어떻게 감정을 표현하고 무엇을 중요하게 여기는지 솔직하게. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 끌리는 이상형
오행상 잘 맞는 상대의 성격과 에너지. 왜 그런 사람에게 끌리는지 이유 포함. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 연인으로서의 매력
연애할 때 상대에게 주는 가장 큰 선물과 매력. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 연애에서 반복되는 상처
사주에서 보이는 연애 패턴의 아킬레스건. 공감이 가게 구체적으로. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 운명의 인연을 만나는 법
진짜 사랑이 찾아오는 시기와 상황. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  marriage: `
[섹션 1] 결혼 체질인가?
배우자성이 얼마나 강한지, 결혼과 궁합이 좋은 사주인지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 이상적인 배우자 상
오행으로 본 가장 잘 맞는 파트너의 구체적인 성격 특성. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 결혼하기 좋은 시기
몇 살 전후가 결혼에 유리하고 그 이유는. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 결혼 생활에서의 모습
배우자로서의 강점과 파트너가 힘들어할 수 있는 부분 솔직하게. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 행복한 결혼을 위한 조언
결혼 생활에서 반드시 기억해야 할 것. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  health: `
[섹션 1] 타고난 체질
오행 균형으로 본 기본 체질. 강한 기운과 약한 기운이 신체에 어떻게 나타나는지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 건강한 부분
이 사주가 자연스럽게 보호하는 장기나 신체 부위. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 주의해야 할 건강 포인트
약한 오행과 연결된 신체 부위나 질환 경향. 예방법 포함. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 건강을 지키는 생활 습관
이 오행에 맞는 식습관, 운동법, 생활 리듬 2가지 구체적으로. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 활력을 높이는 한 가지
지금 당장 실천할 수 있는 가장 효과적인 건강 관리법. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  family: `
[섹션 1] 가족 기운의 전반적인 흐름
이 사주에서 가족·조상의 기운이 어떻게 흐르는지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 부모와의 관계
년주와 월주로 읽는 부모님과의 인연과 관계 패턴. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 가족 안에서의 역할
자연스럽게 맡게 되는 가족 내 포지션과 역할. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 가족 관계에서 반복되는 패턴
가정에서 자주 겪는 갈등이나 역학 관계. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 따뜻한 가정을 만드는 법
행복한 가정을 꾸리기 위한 실천 조언. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  children: `
[섹션 1] 자녀 기운
자녀성이 어떻게 나타나는지. 자녀와의 인연이 강한지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 자녀와의 관계
어떤 부모-자녀 관계를 맺게 될지, 어떤 유대감을 나누는지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 자녀를 갖기 좋은 시기
자녀와 인연이 깊어지는 나이대나 시기. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 부모로서의 스타일
자연스럽게 보이는 양육 방식의 강점과 보완점. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 자녀에게 물려주는 것
다음 세대에게 남기는 가장 소중한 유산. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  mentor: `
[섹션 1] 귀인 기운
이 사주에 귀인 기운이 얼마나 있는지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 나를 도와주는 사람의 유형
어떤 성격이나 직업을 가진 사람이 귀인이 될 가능성이 높은지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 귀인을 만나는 시기와 상황
어떤 시기에, 어떤 상황에서 조력자가 나타나는지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 나도 누군가의 귀인
내가 자연스럽게 다른 사람에게 도움을 주는 방식과 역할. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 좋은 인연을 만드는 법
귀인을 더 많이 만나기 위한 실천 조언. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,

  destiny: `
[섹션 1] 이 삶의 큰 테마
사주 전체를 관통하는 인생의 핵심 주제. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 2] 인생 전반기 (1–30세)
이 시기의 주요 에너지와 배워야 할 핵심 교훈. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 3] 인생 중반기 (31–60세)
전성기는 언제이고, 어떤 변화와 도전이 기다리는지. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 4] 인생 후반기 (61세~)
노년의 기운과 남기게 될 유산. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.

[섹션 5] 이 영혼이 이 세상에 온 이유
가장 깊은 운명의 메시지를 시적이고 감동적으로. 섹션 제목은 이 내용을 담은 창의적이고 짧은 시적 표현으로 직접 만들어주세요.`,
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

CRITICAL FORMATTING RULES — THESE ARE ABSOLUTE:
- NEVER use any markdown: no **, no *, no #, no ___, no ~~, no backticks, no [links]
- Section titles are plain text on their own line — NO symbols before or after them
- After each section title, write flowing paragraphs. NO bullet points. NO dashes. NO numbered lists.
- The section title style: a short, poetic, evocative phrase that captures the essence (e.g. "불꽃처럼 살아있는 당신의 내면") followed by a blank line, then the paragraph content.
- ABSOLUTELY NO Chinese characters or Hanja (한자) in the output. No 日柱, 年柱, 月柱, 甲, 乙, 戊午, 丁卯, 木, 火, 土, 金, 水, 財星, 官星, 印星 etc. Translate EVERYTHING into plain Korean words. Use "태어난 날의 기운" not "日柱", "나무 기운" not "木" or "木(나무)", "불 기운" not "火", "쇠 기운" not "金", "물 기운" not "水", "흙 기운" not "土".

WRITING STYLE:
1. Write ENTIRELY in ${lang}. Every single word must be in ${lang}.
2. NEVER use academic or mystical jargon without immediately translating it into everyday life. Instead of "your Wood element is dominant" say "you're the type who always has ten new ideas before breakfast." Instead of "Metal controls Wood in your chart" say "you sometimes hold yourself to impossible standards, which is both your superpower and your kryptonite."
3. Use REAL LIFE comparisons: everyday situations, relatable moments. Make the person go "omg that's SO me."
4. Write like the world's most insightful friend — warm, direct, a little poetic, occasionally funny.
5. Be SPECIFIC to this person's actual Saju data — explain WHY in human terms, not astrological terms.
6. Each section: 3–5 sentences of flowing, conversational prose. No lists.
7. Include at least one line per section so specific the reader will screenshot it.
8. End with a warm, personal closing message.
9. BE HONEST. If this person's chart has genuine weaknesses or blind spots — say so clearly and compassionately. Balance every difficult truth with a path forward.

FOLLOW THIS EXACT FORMAT (section titles are plain text, content is flowing paragraphs):
${guide}

TOTAL LENGTH: 500–650 words. Rich, detailed, and personal — not a generic horoscope.`
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

CRITICAL FORMATTING RULES — ABSOLUTE:
- NEVER use any markdown: no **, no *, no #, no ___, no ~~
- Section titles are plain text on their own line — NO symbols before or after them
- After each section title, write flowing paragraphs. NO bullet points. NO dashes. NO numbered lists.
- Section title style: a short, poetic Korean phrase on its own line, followed by a blank line, then the paragraph content.
- ABSOLUTELY NO Chinese characters or Hanja in the output. No 日柱, 甲, 戊午, 木, 火, 土, 金, 水 etc. Use plain Korean words only.

WRITING STYLE:
1. Write ENTIRELY in ${lang}.
2. NO jargon — translate everything into plain everyday language.
3. Write like the world's most insightful friend — warm, direct, honest, occasionally funny.
4. Make each section feel so specific the reader screenshots it.
5. Each section 3–5 sentences of flowing prose. No lists, no bullet points.
6. BE HONEST. If the elements clash, say so clearly. A real score with honest insight beats a false high score.

FOLLOW THIS EXACT FORMAT — each section title is a short, evocative Korean phrase you create yourself, followed by flowing paragraphs:

궁합 점수
[점수/100] — 이 두 사람의 관계를 한 문장으로 극적으로 선언하세요. 왜 이 점수인지 감각적으로 설명하세요.

장점
다음 4가지를 자연스럽게 녹여 하나의 흐르는 단락으로 써주세요: 성향상 잘 맞는 부분, 서로에게 편안함을 주는 부분, 연애할 때 자연스럽게 좋은 흐름이 나는 부분, 장기적으로 강점이 되는 부분.

단점
다음 4가지를 자연스럽게 녹여 하나의 흐르는 단락으로 써주세요: 충돌이 반복될 수 있는 포인트, 감정 표현 방식의 차이, 연락·애정·생활 방식의 차이, 자존심·집착·회피 등 문제 패턴. 솔직하고 구체적으로.

개선 포인트
다음 4가지를 자연스럽게 녹여 하나의 흐르는 단락으로 써주세요: 서로 어떤 방식으로 말해야 덜 부딪히는지, 싸웠을 때 누가 먼저 어떤 태도를 취하면 좋은지, 관계 유지에 필요한 규칙, 상대가 원하는 사랑 표현 방식.

장기 관계
다음 4가지를 자연스럽게 녹여 하나의 흐르는 단락으로 써주세요: 결혼·동거 시 현실 궁합, 경제관념 차이, 가족관계나 책임감, 미래 방향성 일치 여부.

전생
두 사람이 전생에서 어떤 관계로 시작했는지, 어떻게 살았는지, 어떻게 끝났는지를 3~4문장으로 영화처럼 생생하게 묘사하세요. 그 전생의 감정이 이번 생에 어떻게 이어지는지도 포함하세요.

운명의 한 마디
이 두 사람의 이야기를 담은 시적이고 영화적인 마지막 한 문장.

Length: 600–700 words.`
}

function buildIdolPrompt(req: ReadingRequest) {
  const s1 = calcSaju(req.person1.birthDate)
  const celeb = req.celebrity!
  const s2 = calcSaju(celeb.birth)
  const lang = req.language

  const isKorean = /BTS|BLACKPINK|aespa|TWICE|EXO|Stray Kids|SEVENTEEN|ENHYPEN|ATEEZ|TXT|ILLIT|BABYMONSTER|LE SSERAFIM|IVE|Solo \/ /i.test(celeb.group)
  const dramaRef = isKorean
    ? `K-drama/K-pop fan life. Instead of "your Earth element nourishes Metal" say "you're exactly the kind of grounding, genuine person ${celeb.name} would find refreshing in a world full of performance."`
    : `fan's real life. Instead of "your Earth element nourishes Metal" say "you're exactly the kind of grounding, genuine person ${celeb.name} would find refreshing in a world full of performance."`
  const cinematicRef = isKorean
    ? `like you're narrating the meet-cute scene of a K-drama`
    : `like you're narrating a cinematic, emotional movie scene`

  return `You are a beloved Korean Saju master who creates magical, heartfelt celebrity compatibility readings for devoted fans worldwide. You make ancient Korean wisdom feel exciting, personal, and deeply meaningful.

THE FAN:
- Born: ${req.person1.birthDate}, Time: ${req.person1.birthTime}, Gender: ${req.person1.gender}
- Saju: ${sajuDesc(s1)} — Core energy: ${elementDescription(s1.day.element, lang)}

THE CELEBRITY: ${celeb.name} (${celeb.group})
- Born: ${celeb.birth}, Gender: ${celeb.gender}
- Saju: ${sajuDesc(s2)} — Core energy: ${elementDescription(s2.day.element, lang)}

OUTPUT LANGUAGE: ${lang}

CRITICAL FORMATTING RULES — ABSOLUTE:
- NEVER use any markdown: no **, no *, no #, no ___, no ~~
- Section titles are plain text on their own line — NO symbols before or after them
- After each section title, write flowing paragraphs. NO bullet points. NO dashes. NO numbered lists.
- Section title style: a short, emotionally evocative Korean phrase on its own line, followed by a blank line, then the paragraph content.
- ABSOLUTELY NO Chinese characters or Hanja in the output. Use plain Korean words only.

WRITING STYLE:
1. Write ENTIRELY in ${lang}.
2. NO astrology jargon — everything must translate to ${dramaRef}
3. Make it cinematic and emotional — ${cinematicRef}.
4. Every section should have at least one line the fan will IMMEDIATELY screenshot.
5. Each section 3–5 sentences. Emotional, personal, specific. Flowing prose only.
6. BE HONEST about the fate score — a real score with honest insight beats a false perfect score. Even hard pairings have their magic — find it.

FOLLOW THIS EXACT FORMAT — each section title is a short, evocative Korean phrase you create yourself, followed by flowing paragraphs:

운명 점수
[점수/100] — 이 운명을 한 문장으로 극적으로 선언하세요. 팬의 심장이 두근거리게 만드세요.

장점
다음 4가지를 자연스럽게 녹여 하나의 흐르는 단락으로 써주세요: 두 사람의 성향상 잘 맞는 부분, 서로에게 편안함을 주는 부분, 함께할 때 자연스럽게 좋은 흐름이 나는 부분, 장기적으로 강점이 되는 부분. ${celeb.name}과 함께하는 장면처럼 감성적으로.

단점
다음 4가지를 자연스럽게 녹여 하나의 흐르는 단락으로 써주세요: 충돌이 반복될 수 있는 포인트, 감정 표현 방식의 차이, 연락·애정·생활 방식의 차이, 자존심·집착·회피 등 문제 패턴. 솔직하게, 하지만 따뜻하게.

개선 포인트
다음 4가지를 자연스럽게 녹여 하나의 흐르는 단락으로 써주세요: 서로 어떤 방식으로 말해야 덜 부딪히는지, 싸웠을 때 누가 먼저 어떤 태도를 취하면 좋은지, 관계 유지에 필요한 것, ${celeb.name}이 원하는 사랑 표현 방식.

장기 관계
다음 4가지를 자연스럽게 녹여 하나의 흐르는 단락으로 써주세요: 함께 살 때의 현실 궁합, 경제관념 차이, 가족관계나 책임감, 미래 방향성 일치 여부. 현실적이면서도 로맨틱하게.

전생
두 사람이 전생에서 어떤 관계로 시작했는지, 어떻게 살았는지, 어떻게 끝났는지를 3~4문장으로 영화처럼 생생하게 묘사하세요. 그 전생의 감정이 이번 생에 어떻게 이어지는지도 포함하세요. 팬이 읽고 눈물이 날 만큼 아름답고 구체적으로.

우주가 당신에게 전하는 말
마치 우주가 직접 팬에게 말을 건네는 것처럼 — 시적이고 아름답고 잊을 수 없는 마지막 메시지.

Length: 650–750 words. Emotional, cinematic, unforgettable.`
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
    const baseCostMap = { personal: 1, compatibility: 2, idol: 3 }
    const multiCount = (body.mode === 'personal' && body.categories && body.categories.length > 1)
      ? body.categories.length
      : 1
    const cost = baseCostMap[body.mode] * multiCount

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
    let reading = ''

    if (body.mode === 'personal' && body.categories && body.categories.length > 1) {
      // 다중 카테고리: 순서대로 호출 후 결합
      const readings: string[] = []
      for (const cat of body.categories) {
        const catBody = { ...body, category: cat }
        const catPrompt = buildPersonalPrompt(catBody)
        const catResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{ role: 'user', content: catPrompt }],
        })
        readings.push(catResponse.content[0].type === 'text' ? catResponse.content[0].text : '')
      }
      reading = readings.join('\n\n─────────────────────────\n\n')
    } else {
      let prompt = ''
      if (body.mode === 'personal')           prompt = buildPersonalPrompt(body)
      else if (body.mode === 'compatibility') prompt = buildCompatPrompt(body)
      else if (body.mode === 'idol')          prompt = buildIdolPrompt(body)

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      })
      reading = response.content[0].type === 'text' ? response.content[0].text : ''
    }

    return NextResponse.json({
      reading,
      remainingCredits: profile.credits - cost,
    })

  } catch (error) {
    console.error('Saju API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했어요. 다시 시도해주세요.' }, { status: 500 })
  }
}
