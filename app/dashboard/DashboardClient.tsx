'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ReadingMode, ReadingCategory, Celebrity } from '@/types'
import styles from './dashboard.module.css'
import BuyCreditsModal from '@/components/BuyCreditsModal'
import ShareCard from '@/components/ShareCard'
import { t } from '@/lib/i18n'

// ── 상수 데이터 ──────────────────────────────────────────────────

const READING_CATEGORY_IDS = [
  'personality', 'career', 'wealth', 'love', 'marriage',
  'health', 'family', 'children', 'mentor', 'destiny'
] as const

const LANGUAGES = [
  { code: 'Korean',     flag: '🇰🇷', label: '한국어' },
  { code: 'English',    flag: '🇺🇸', label: 'English' },
  { code: 'Japanese',   flag: '🇯🇵', label: '日本語' },
  { code: 'Thai',       flag: '🇹🇭', label: 'ภาษาไทย' },
  { code: 'Spanish',    flag: '🇪🇸', label: 'Español' },
  { code: 'Portuguese', flag: '🇧🇷', label: 'Português' },
  { code: 'Chinese',    flag: '🇨🇳', label: '中文' },
]

const GROUPS: Record<string, Celebrity[]> = {
  'BTS': [
    { id:1,  name:'RM',        group:'BTS', birth:'1994-09-12', gender:'male', sign:'♍ Virgo' },
    { id:2,  name:'Jin',       group:'BTS', birth:'1992-12-04', gender:'male', sign:'♐ Sagittarius' },
    { id:3,  name:'Suga',      group:'BTS', birth:'1993-03-09', gender:'male', sign:'♓ Pisces' },
    { id:4,  name:'J-Hope',    group:'BTS', birth:'1994-02-18', gender:'male', sign:'♒ Aquarius' },
    { id:5,  name:'Jimin',     group:'BTS', birth:'1995-10-13', gender:'male', sign:'♎ Libra' },
    { id:6,  name:'V',         group:'BTS', birth:'1995-12-30', gender:'male', sign:'♑ Capricorn' },
    { id:7,  name:'Jungkook',  group:'BTS', birth:'1997-09-01', gender:'male', sign:'♍ Virgo' },
  ],
  'BLACKPINK': [
    { id:10, name:'Jisoo',  group:'BLACKPINK', birth:'1995-01-03', gender:'female', sign:'♑ Capricorn' },
    { id:11, name:'Jennie', group:'BLACKPINK', birth:'1996-01-16', gender:'female', sign:'♑ Capricorn' },
    { id:12, name:'Rosé',   group:'BLACKPINK', birth:'1997-02-11', gender:'female', sign:'♒ Aquarius' },
    { id:13, name:'Lisa',   group:'BLACKPINK', birth:'1997-03-27', gender:'female', sign:'♈ Aries' },
  ],
  'aespa': [
    { id:20, name:'Karina',   group:'aespa', birth:'2000-04-11', gender:'female', sign:'♈ Aries' },
    { id:21, name:'Giselle',  group:'aespa', birth:'2000-10-30', gender:'female', sign:'♏ Scorpio' },
    { id:22, name:'Winter',   group:'aespa', birth:'2001-01-01', gender:'female', sign:'♑ Capricorn' },
    { id:23, name:'Ningning', group:'aespa', birth:'2002-10-23', gender:'female', sign:'♎ Libra' },
  ],
  'ILLIT': [
    { id:85, name:'Yunah',  group:'ILLIT', birth:'2004-01-15', gender:'female', sign:'♑ Capricorn' },
    { id:86, name:'Minju',  group:'ILLIT', birth:'2004-11-30', gender:'female', sign:'♐ Sagittarius' },
    { id:87, name:'Moka',   group:'ILLIT', birth:'2003-12-10', gender:'female', sign:'♐ Sagittarius' },
    { id:88, name:'Wonhee', group:'ILLIT', birth:'2006-03-21', gender:'female', sign:'♈ Aries' },
    { id:89, name:'Iroha',  group:'ILLIT', birth:'2005-12-07', gender:'female', sign:'♐ Sagittarius' },
  ],
  'BABYMONSTER': [
    { id:90, name:'Ruka',     group:'BABYMONSTER', birth:'2002-03-20', gender:'female', sign:'♓ Pisces' },
    { id:91, name:'Pharita',  group:'BABYMONSTER', birth:'2004-07-19', gender:'female', sign:'♋ Cancer' },
    { id:92, name:'Asa',      group:'BABYMONSTER', birth:'2006-04-17', gender:'female', sign:'♈ Aries' },
    { id:93, name:'Ahyeon',   group:'BABYMONSTER', birth:'2007-04-11', gender:'female', sign:'♈ Aries' },
    { id:94, name:'Rami',     group:'BABYMONSTER', birth:'2007-07-10', gender:'female', sign:'♋ Cancer' },
    { id:95, name:'Rora',     group:'BABYMONSTER', birth:'2008-12-03', gender:'female', sign:'♐ Sagittarius' },
    { id:96, name:'Chiquita', group:'BABYMONSTER', birth:'2009-02-14', gender:'female', sign:'♒ Aquarius' },
  ],
  'LE SSERAFIM': [
    { id:97,  name:'Chaewon', group:'LE SSERAFIM', birth:'2000-08-01', gender:'female', sign:'♌ Leo' },
    { id:98,  name:'Sakura',  group:'LE SSERAFIM', birth:'1998-03-19', gender:'female', sign:'♓ Pisces' },
    { id:99,  name:'Yunjin',  group:'LE SSERAFIM', birth:'2001-10-08', gender:'female', sign:'♎ Libra' },
    { id:110, name:'Kazuha',  group:'LE SSERAFIM', birth:'2003-08-09', gender:'female', sign:'♌ Leo' },
    { id:111, name:'Eunchae', group:'LE SSERAFIM', birth:'2006-11-10', gender:'female', sign:'♏ Scorpio' },
  ],
  'IVE': [
    { id:112, name:'Yujin',   group:'IVE', birth:'2003-09-01', gender:'female', sign:'♍ Virgo' },
    { id:113, name:'Gaeul',   group:'IVE', birth:'2002-09-24', gender:'female', sign:'♎ Libra' },
    { id:114, name:'Rei',     group:'IVE', birth:'2004-02-03', gender:'female', sign:'♒ Aquarius' },
    { id:115, name:'Wonyoung',group:'IVE', birth:'2004-08-31', gender:'female', sign:'♍ Virgo' },
    { id:116, name:'Liz',     group:'IVE', birth:'2004-11-21', gender:'female', sign:'♏ Scorpio' },
    { id:117, name:'Leeseo',  group:'IVE', birth:'2007-02-21', gender:'female', sign:'♓ Pisces' },
  ],
  'SEVENTEEN': [
    { id:30, name:'S.Coups',  group:'SEVENTEEN', birth:'1995-08-08', gender:'male', sign:'♌ Leo' },
    { id:31, name:'Jeonghan', group:'SEVENTEEN', birth:'1995-10-04', gender:'male', sign:'♎ Libra' },
    { id:32, name:'Joshua',   group:'SEVENTEEN', birth:'1995-12-30', gender:'male', sign:'♑ Capricorn' },
    { id:33, name:'Wonwoo',   group:'SEVENTEEN', birth:'1996-07-17', gender:'male', sign:'♋ Cancer' },
    { id:34, name:'Woozi',    group:'SEVENTEEN', birth:'1996-11-22', gender:'male', sign:'♐ Sagittarius' },
    { id:35, name:'Mingyu',   group:'SEVENTEEN', birth:'1997-04-06', gender:'male', sign:'♈ Aries' },
    { id:36, name:'Vernon',   group:'SEVENTEEN', birth:'1998-02-18', gender:'male', sign:'♒ Aquarius' },
    { id:37, name:'Dino',     group:'SEVENTEEN', birth:'1999-02-11', gender:'male', sign:'♒ Aquarius' },
  ],
  'ENHYPEN': [
    { id:118, name:'Jungwon', group:'ENHYPEN', birth:'2004-02-09', gender:'male', sign:'♒ Aquarius' },
    { id:119, name:'Heeseung',group:'ENHYPEN', birth:'2001-10-15', gender:'male', sign:'♎ Libra' },
    { id:120, name:'Jay',     group:'ENHYPEN', birth:'2002-04-20', gender:'male', sign:'♈ Aries' },
    { id:121, name:'Jake',    group:'ENHYPEN', birth:'2002-11-15', gender:'male', sign:'♏ Scorpio' },
    { id:122, name:'Sunghoon',group:'ENHYPEN', birth:'2002-12-08', gender:'male', sign:'♐ Sagittarius' },
    { id:123, name:'Sunoo',   group:'ENHYPEN', birth:'2003-06-24', gender:'male', sign:'♋ Cancer' },
    { id:124, name:'Ni-ki',   group:'ENHYPEN', birth:'2005-12-09', gender:'male', sign:'♐ Sagittarius' },
  ],
  'ATEEZ': [
    { id:125, name:'Hongjoong',group:'ATEEZ', birth:'1998-11-07', gender:'male', sign:'♏ Scorpio' },
    { id:126, name:'Seonghwa', group:'ATEEZ', birth:'1998-04-03', gender:'male', sign:'♈ Aries' },
    { id:127, name:'Yunho',    group:'ATEEZ', birth:'1999-03-23', gender:'male', sign:'♈ Aries' },
    { id:128, name:'Yeosang',  group:'ATEEZ', birth:'1999-06-15', gender:'male', sign:'♊ Gemini' },
    { id:129, name:'San',      group:'ATEEZ', birth:'1999-07-10', gender:'male', sign:'♋ Cancer' },
    { id:130, name:'Mingi',    group:'ATEEZ', birth:'1999-08-09', gender:'male', sign:'♌ Leo' },
    { id:131, name:'Wooyoung', group:'ATEEZ', birth:'1999-11-26', gender:'male', sign:'♐ Sagittarius' },
    { id:132, name:'Jongho',   group:'ATEEZ', birth:'2000-10-12', gender:'male', sign:'♎ Libra' },
  ],
  'TXT': [
    { id:133, name:'Yeonjun', group:'TXT', birth:'1999-09-13', gender:'male', sign:'♍ Virgo' },
    { id:134, name:'Soobin',  group:'TXT', birth:'2000-12-05', gender:'male', sign:'♐ Sagittarius' },
    { id:135, name:'Beomgyu',group:'TXT', birth:'2001-03-13', gender:'male', sign:'♓ Pisces' },
    { id:136, name:'Taehyun', group:'TXT', birth:'2002-02-05', gender:'male', sign:'♒ Aquarius' },
    { id:137, name:'Huening Kai', group:'TXT', birth:'2002-08-14', gender:'male', sign:'♌ Leo' },
  ],
  'TWICE': [
    { id:50, name:'Nayeon',    group:'TWICE', birth:'1995-09-22', gender:'female', sign:'♍ Virgo' },
    { id:51, name:'Momo',      group:'TWICE', birth:'1996-11-09', gender:'female', sign:'♏ Scorpio' },
    { id:52, name:'Sana',      group:'TWICE', birth:'1996-12-29', gender:'female', sign:'♑ Capricorn' },
    { id:53, name:'Jihyo',     group:'TWICE', birth:'1997-02-01', gender:'female', sign:'♒ Aquarius' },
    { id:54, name:'Tzuyu',     group:'TWICE', birth:'1999-06-14', gender:'female', sign:'♊ Gemini' },
  ],
  'Stray Kids': [
    { id:70, name:'Bang Chan', group:'Stray Kids', birth:'1997-10-03', gender:'male', sign:'♎ Libra' },
    { id:71, name:'Lee Know',  group:'Stray Kids', birth:'1998-10-25', gender:'male', sign:'♏ Scorpio' },
    { id:72, name:'Changbin',  group:'Stray Kids', birth:'1999-08-11', gender:'male', sign:'♌ Leo' },
    { id:73, name:'Hyunjin',   group:'Stray Kids', birth:'2000-03-20', gender:'male', sign:'♓ Pisces' },
    { id:74, name:'Felix',     group:'Stray Kids', birth:'2000-09-15', gender:'male', sign:'♍ Virgo' },
    { id:75, name:'I.N',       group:'Stray Kids', birth:'2001-02-08', gender:'male', sign:'♒ Aquarius' },
  ],
  'EXO': [
    { id:60, name:'Suho',   group:'EXO', birth:'1991-05-22', gender:'male', sign:'♊ Gemini' },
    { id:61, name:'Baekhyun',group:'EXO',birth:'1992-05-06', gender:'male', sign:'♉ Taurus' },
    { id:62, name:'Chanyeol',group:'EXO',birth:'1992-11-27', gender:'male', sign:'♐ Sagittarius' },
    { id:63, name:'D.O',    group:'EXO', birth:'1993-01-12', gender:'male', sign:'♑ Capricorn' },
    { id:64, name:'Kai',    group:'EXO', birth:'1994-01-14', gender:'male', sign:'♑ Capricorn' },
    { id:65, name:'Sehun',  group:'EXO', birth:'1994-04-12', gender:'male', sign:'♈ Aries' },
  ],
}

const SOLO_SINGERS: Celebrity[] = [
  { id:100, name:'IU',        group:'Solo Singer',    birth:'1993-05-16', gender:'female', sign:'♉ Taurus' },
  { id:101, name:'Taeyeon',   group:'Solo / SNSD',    birth:'1989-03-09', gender:'female', sign:'♓ Pisces' },
  { id:102, name:'G-Dragon',  group:'Solo / BIGBANG', birth:'1988-08-18', gender:'male',   sign:'♌ Leo' },
  { id:103, name:'Zico',      group:'Solo / Block B', birth:'1992-09-14', gender:'male',   sign:'♍ Virgo' },
  { id:104, name:'Taemin',    group:'Solo / SHINee',  birth:'1993-07-18', gender:'male',   sign:'♋ Cancer' },
  { id:105, name:'Kai',       group:'Solo / EXO',     birth:'1994-01-14', gender:'male',   sign:'♑ Capricorn' },
  { id:106, name:'Baekhyun',  group:'Solo / EXO',     birth:'1992-05-06', gender:'male',   sign:'♉ Taurus' },
  { id:107, name:'Chanyeol',  group:'Solo / EXO',     birth:'1992-11-27', gender:'male',   sign:'♐ Sagittarius' },
  { id:108, name:'Jisoo',     group:'Solo / BLACKPINK',birth:'1995-01-03',gender:'female', sign:'♑ Capricorn' },
  { id:109, name:'Jennie',    group:'Solo / BLACKPINK',birth:'1996-01-16',gender:'female', sign:'♑ Capricorn' },
]

const ACTORS: Celebrity[] = [
  { id:200, name:'Park Seo-jun',   group:'Actor',   birth:'1988-12-16', gender:'male',   sign:'♐ Sagittarius' },
  { id:201, name:'Song Joong-ki',  group:'Actor',   birth:'1985-09-19', gender:'male',   sign:'♍ Virgo' },
  { id:202, name:'Hyun Bin',       group:'Actor',   birth:'1982-09-25', gender:'male',   sign:'♍ Virgo' },
  { id:203, name:'Lee Min-ho',     group:'Actor',   birth:'1987-06-22', gender:'male',   sign:'♊ Gemini' },
  { id:204, name:'Gong Yoo',       group:'Actor',   birth:'1979-07-10', gender:'male',   sign:'♋ Cancer' },
  { id:205, name:'Cha Eun-woo',    group:'Actor/ASTRO', birth:'1997-03-30', gender:'male', sign:'♈ Aries' },
  { id:206, name:'Song Kang',      group:'Actor',   birth:'1994-04-23', gender:'male',   sign:'♉ Taurus' },
  { id:208, name:'Son Ye-jin',     group:'Actress', birth:'1982-01-11', gender:'female', sign:'♑ Capricorn' },
  { id:209, name:'Jun Ji-hyun',    group:'Actress', birth:'1981-10-30', gender:'female', sign:'♏ Scorpio' },
  { id:210, name:'Kim Go-eun',     group:'Actress', birth:'1991-07-02', gender:'female', sign:'♋ Cancer' },
  { id:211, name:'Han So-hee',     group:'Actress', birth:'1994-11-18', gender:'female', sign:'♏ Scorpio' },
  { id:212, name:'Shin Min-a',     group:'Actress', birth:'1984-04-05', gender:'female', sign:'♈ Aries' },
]

const BIRTH_TIMES = [
  { value:'unknown',       label:'Unknown 모름' },
  { value:'子 (11pm–1am)', label:'子시 (11pm–1am)' },
  { value:'丑 (1am–3am)',  label:'丑시 (1am–3am)' },
  { value:'寅 (3am–5am)',  label:'寅시 (3am–5am)' },
  { value:'卯 (5am–7am)',  label:'卯시 (5am–7am)' },
  { value:'辰 (7am–9am)',  label:'辰시 (7am–9am)' },
  { value:'巳 (9am–11am)', label:'巳시 (9am–11am)' },
  { value:'午 (11am–1pm)', label:'午시 (11am–1pm)' },
  { value:'未 (1pm–3pm)',  label:'未시 (1pm–3pm)' },
  { value:'申 (3pm–5pm)',  label:'申시 (3pm–5pm)' },
  { value:'酉 (5pm–7pm)',  label:'酉시 (5pm–7pm)' },
  { value:'戌 (7pm–9pm)',  label:'戌시 (7pm–9pm)' },
  { value:'亥 (9pm–11pm)', label:'亥시 (9pm–11pm)' },
]

// ── 컴포넌트 ──────────────────────────────────────────────────────

interface Props {
  user: { id: string; email: string }
  initialCredits: number
}

export default function DashboardClient({ user, initialCredits }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // ── 상태 ────────────────────────────────────────
  const [credits, setCredits]           = useState(initialCredits)
  const [mode, setMode]                 = useState<ReadingMode>('personal')
  const [lang, setLang]                 = useState('Korean')
  const [readingCats, setReadingCats]   = useState<ReadingCategory[]>([])

  // Person 1
  const [date1, setDate1]               = useState('')
  const [calendar1, setCalendar1]       = useState<'solar'|'lunar'>('solar')
  const [time1, setTime1]               = useState('unknown')
  const [gender1, setGender1]           = useState('female')
  const [place1, setPlace1]             = useState('')
  const [nickname, setNickname]         = useState('')

  // Person 2
  const [date2, setDate2]               = useState('')
  const [calendar2, setCalendar2]       = useState<'solar'|'lunar'>('solar')
  const [time2, setTime2]               = useState('unknown')
  const [gender2, setGender2]           = useState('male')

  // Idol drill-down
  const [celebCat, setCelebCat]         = useState<'singer'|'actor'>('singer')
  const [singerType, setSingerType]     = useState<'group'|'solo'>('group')
  const [selectedGroup, setSelectedGroup] = useState<string>('BTS')
  const [selectedIdol, setSelectedIdol] = useState<Celebrity | null>(null)
  const [showCustom, setShowCustom]     = useState(false)
  const [customName, setCustomName]     = useState('')
  const [customBirth, setCustomBirth]   = useState('')
  const [customGender, setCustomGender] = useState('male')
  const [customGroup, setCustomGroup]   = useState('')

  // Result
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState<string | null>(null)
  const [resultTitle, setResultTitle]   = useState('')
  const [toast, setToast]               = useState('')
  const [showBuyModal, setShowBuyModal] = useState(false)

  // AI 이미지
  const [generatingImage, setGeneratingImage]     = useState(false)
  const [generatedImage, setGeneratedImage]       = useState<string | null>(null)
  const [generatingBaby, setGeneratingBaby]       = useState(false)
  const [generatedBabyImage, setGeneratedBabyImage] = useState<string | null>(null)

  // 2세 이미지용 얼굴 사진 업로드
  const [face1File, setFace1File]   = useState<File | null>(null)
  const [face2File, setFace2File]   = useState<File | null>(null)
  const [face1Preview, setFace1Preview] = useState<string | null>(null)
  const [face2Preview, setFace2Preview] = useState<string | null>(null)

  function handleFaceUpload(slot: 1 | 2, file: File | null) {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (slot === 1) { setFace1File(file); setFace1Preview(url) }
    else            { setFace2File(file); setFace2Preview(url) }
  }

  // ── 헬퍼 ────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getCurrentIdolList(): Celebrity[] {
    if (celebCat === 'actor') return ACTORS
    if (singerType === 'solo') return SOLO_SINGERS
    return GROUPS[selectedGroup] ?? []
  }

  const baseCostMap: Record<ReadingMode, number> = { personal: 1, compatibility: 2, idol: 3 }
  const personalCost = mode === 'personal' ? Math.max(1, readingCats.length) : baseCostMap[mode]
  const costMap: Record<ReadingMode, number> = { ...baseCostMap, personal: personalCost }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleGenerateImage() {
    if (!result) return
    if (credits < 3) { setShowBuyModal(true); return }

    setGeneratingImage(true)
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sajuResult: result,
          mode,
          language: lang,
          gender: gender1,
          category: mode === 'personal' ? readingCats[0] : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했어요.')
      setGeneratedImage(data.imageUrl)
      setCredits(data.remainingCredits)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '이미지 생성 중 오류가 발생했어요.')
    } finally {
      setGeneratingImage(false)
    }
  }

  async function handleGenerateBabyImage() {
    if (!result || !face1File || !face2File) return
    if (credits < 3) { setShowBuyModal(true); return }

    setGeneratingBaby(true)
    try {
      const formData = new FormData()
      formData.append('sajuResult', result)
      formData.append('mode', 'baby')
      formData.append('language', lang)
      formData.append('face1', face1File)
      formData.append('face2', face2File)

      const res = await fetch('/api/generate-baby-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했어요.')
      setGeneratedBabyImage(data.imageUrl)
      setCredits(data.remainingCredits)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '이미지 생성 중 오류가 발생했어요.')
    } finally {
      setGeneratingBaby(false)
    }
  }

  // ── 제출 ────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const cost = costMap[mode]
    if (credits < cost) {
      setShowBuyModal(true)
      return
    }
    if (!date1) { showToast(t(lang, 'enterBirth')); return }
    if (mode === 'personal' && readingCats.length === 0) { showToast(t(lang, 'selectReading')); return }
    if (mode === 'compatibility' && !date2) { showToast(t(lang, 'enterPartnerBirth')); return }
    if (mode === 'idol') {
      if (showCustom && (!customName || !customBirth)) { showToast(t(lang, 'enterCelebInfo')); return }
      if (!showCustom && !selectedIdol) { showToast(t(lang, 'selectCeleb')); return }
    }

    // 개인 사주: 이미 결과가 있으면 재소비 확인
    if (mode === 'personal' && result) {
      const confirmed = window.confirm(
        lang === 'Korean'
          ? `이미 결과가 있어요. 다시 보기하면 ${cost} 크레딧이 추가로 소비됩니다. 계속할까요?`
          : `You already have a result. Viewing again will cost ${cost} more credit${cost > 1 ? 's' : ''}. Continue?`
      )
      if (!confirmed) return
    }

    // 다중 카테고리 선택 시 확인
    if (mode === 'personal' && readingCats.length > 1) {
      const catNames = readingCats.map(c => t(lang, c)).join(', ')
      const confirmed = window.confirm(
        lang === 'Korean'
          ? `${catNames} — ${readingCats.length}가지 항목을 보면 ${cost} 크레딧이 소비됩니다. 계속할까요?`
          : `${catNames} — ${readingCats.length} readings will cost ${cost} credits. Continue?`
      )
      if (!confirmed) return
    }

    setLoading(true)
    setResult(null)
    setGeneratedImage(null)
    setGeneratedBabyImage(null)

    try {
      const body = {
        mode,
        language: lang,
        person1: { birthDate: date1, calendar: calendar1, birthTime: time1, gender: gender1, birthPlace: place1 },
        ...(mode === 'compatibility' && {
          person2: { birthDate: date2, calendar: calendar2, birthTime: time2, gender: gender2 },
        }),
        ...(mode === 'idol' && {
          celebrity: showCustom
            ? { name: customName, group: customGroup || 'Korean celebrity', birth: customBirth, gender: customGender }
            : { name: selectedIdol!.name, group: selectedIdol!.group, birth: selectedIdol!.birth, gender: selectedIdol!.gender },
        }),
        ...(mode === 'personal' && readingCats.length === 1 && { category: readingCats[0] }),
        ...(mode === 'personal' && readingCats.length > 1  && { categories: readingCats }),
      }

      const res = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했어요.')

      setCredits(data.remainingCredits)
      setResult(data.reading)

      const catLabel = mode === 'personal'
        ? readingCats.map(c => t(lang, c)).join(' · ')
        : mode === 'compatibility' ? t(lang, 'compatibility') : t(lang, 'idol')
      setResultTitle(catLabel)

    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [mode, lang, credits, date1, date2, calendar1, calendar2, time1, time2, gender1, gender2, place1, readingCats, selectedIdol, showCustom, customName, customBirth, customGender, customGroup, result])

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result).then(() => showToast(t(lang, 'copied')))
    }
  }

  // ── 렌더 ────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoGroup}>
            <span className={styles.logo}>운명</span>
            <span className={styles.logoSub}>UNMYEONG</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.creditsChip}>
              <span className={styles.creditNum}>{credits}</span>
              <span className={styles.creditLabel}>{t(lang,'credits')}</span>
            </div>
            <button className={styles.btnBuy} onClick={() => setShowBuyModal(true)}>{t(lang,'charge')}</button>
            <button className={styles.btnSignOut} onClick={handleSignOut}>{t(lang,'logout')}</button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        {/* Mode tabs */}
        <div className={styles.modeTabs}>
          {(['personal','compatibility','idol'] as ReadingMode[]).map(m => (
            <button
              key={m}
              className={`${styles.modeTab} ${mode === m ? styles.modeTabActive : ''}`}
              onClick={() => { setMode(m); setResult(null) }}
            >
              <span className={styles.modeKr}>{t(lang, m)}</span>
              <span className={styles.modeCost}>{costMap[m]} credit{costMap[m] > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>

        {/* Language */}
        <div className={styles.langRow}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`${styles.langBtn} ${lang === l.code ? styles.langBtnActive : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className={styles.formCard}>
          {/* Person 1 */}
          <div className={styles.sectionTitle}>{t(lang,'myInfo')}</div>
          <div className={styles.grid2} style={{marginBottom:'0.75rem'}}>
            <div className={styles.field}>
              <label>{t(lang,'nickname')}</label>
              <input
                type="text"
                placeholder={t(lang,'nicknamePlaceholder')}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className={styles.field}>
              <label>{t(lang,'gender')}</label>
              <select value={gender1} onChange={e=>setGender1(e.target.value)}>
                <option value="female">{t(lang,'female')}</option>
                <option value="male">{t(lang,'male')}</option>
                <option value="nonbinary">{t(lang,'nonbinary')}</option>
              </select>
            </div>
          </div>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label>{t(lang,'birthDate')}</label>
              <input type="date" value={date1} onChange={e => setDate1(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>{t(lang,'solar')} / {t(lang,'lunar')}</label>
              <div className={styles.toggle}>
                <button className={`${styles.togBtn} ${calendar1==='solar'?styles.togActive:''}`} onClick={()=>setCalendar1('solar')}>{t(lang,'solar')}</button>
                <button className={`${styles.togBtn} ${calendar1==='lunar'?styles.togActive:''}`} onClick={()=>setCalendar1('lunar')}>{t(lang,'lunar')}</button>
              </div>
            </div>
            <div className={styles.field}>
              <label>{t(lang,'birthTime')}</label>
              <select value={time1} onChange={e=>setTime1(e.target.value)}>
                <option value="unknown">{t(lang,'unknown')}</option>
                {BIRTH_TIMES.slice(1).map(bt=><option key={bt.value} value={bt.value}>{bt.label}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>{t(lang,'birthPlace')}</label>
            <input type="text" placeholder={t(lang,'birthPlacePlaceholder')} value={place1} onChange={e=>setPlace1(e.target.value)} />
          </div>

          {/* Personal: category — 최대 3개 다중선택 */}
          {mode === 'personal' && (
            <>
              <div className={styles.sectionTitle} style={{marginTop:'1.2rem'}}>
                {t(lang,'readingType')}
                <span style={{ marginLeft:'0.5rem', fontSize:'0.72rem', color:'var(--muted)', fontWeight:400 }}>
                  {lang === 'Korean'
                    ? `최대 3개 선택 가능 · 선택한 항목 수만큼 크레딧 소비 (현재 ${readingCats.length}개 선택 = ${Math.max(1, readingCats.length)} credit${readingCats.length > 1 ? 's' : ''})`
                    : `Up to 3 · ${Math.max(1, readingCats.length)} credit${readingCats.length > 1 ? 's' : ''} (${readingCats.length} selected)`}
                </span>
              </div>
              <div className={styles.catGrid}>
                {READING_CATEGORY_IDS.map(id => {
                  const selected = readingCats.includes(id as ReadingCategory)
                  const maxed = !selected && readingCats.length >= 3
                  return (
                    <button
                      key={id}
                      className={`${styles.catBtn} ${selected ? styles.catBtnActive : ''}`}
                      style={maxed ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                      disabled={maxed}
                      onClick={() => {
                        if (selected) {
                          setReadingCats(prev => prev.filter(c => c !== id))
                        } else if (readingCats.length < 3) {
                          setReadingCats(prev => [...prev, id as ReadingCategory])
                        }
                      }}
                    >
                      {selected && <span style={{ marginRight:'0.3rem', fontSize:'0.7rem' }}>✦</span>}
                      <span className={styles.catKr}>{t(lang, id)}</span>
                      {lang === 'Korean' ? null : <span className={styles.catEn}>{t('Korean', id)}</span>}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Compatibility: person 2 */}
          {mode === 'compatibility' && (
            <>
              <div className={styles.sectionTitle} style={{marginTop:'1.2rem'}}>{t(lang,'partnerInfo')}</div>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <label>{t(lang,'birthDate')}</label>
                  <input type="date" value={date2} onChange={e=>setDate2(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>{t(lang,'solar')} / {t(lang,'lunar')}</label>
                  <div className={styles.toggle}>
                    <button className={`${styles.togBtn} ${calendar2==='solar'?styles.togActive:''}`} onClick={()=>setCalendar2('solar')}>{t(lang,'solar')}</button>
                    <button className={`${styles.togBtn} ${calendar2==='lunar'?styles.togActive:''}`} onClick={()=>setCalendar2('lunar')}>{t(lang,'lunar')}</button>
                  </div>
                </div>
                <div className={styles.field}>
                  <label>{t(lang,'birthTime')}</label>
                  <select value={time2} onChange={e=>setTime2(e.target.value)}>
                    <option value="unknown">{t(lang,'unknown')}</option>
                    {BIRTH_TIMES.slice(1).map(bt=><option key={bt.value} value={bt.value}>{bt.label}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.field} style={{maxWidth:'200px'}}>
                <label>{t(lang,'gender')}</label>
                <select value={gender2} onChange={e=>setGender2(e.target.value)}>
                  <option value="male">{t(lang,'male')}</option>
                  <option value="female">{t(lang,'female')}</option>
                  <option value="nonbinary">{t(lang,'nonbinary')}</option>
                </select>
              </div>
            </>
          )}

          {/* Idol drill-down */}
          {mode === 'idol' && (
            <>
              <div className={styles.sectionTitle} style={{marginTop:'1.2rem'}}>{t(lang,'celebSelect')}</div>
              <div className={styles.drillRow}>
                <button className={`${styles.drillBtn} ${celebCat==='singer'?styles.drillActive:''}`} onClick={()=>{ setCelebCat('singer'); setSelectedIdol(null) }}>{t(lang,'singer')}</button>
                <button className={`${styles.drillBtn} ${celebCat==='actor'?styles.drillActive:''}`} onClick={()=>{ setCelebCat('actor'); setSelectedIdol(null) }}>{t(lang,'actor')}</button>
              </div>
              {celebCat==='singer' && (
                <div className={styles.drillRow}>
                  <button className={`${styles.drillBtn} ${singerType==='group'?styles.drillActive:''}`} onClick={()=>{ setSingerType('group'); setSelectedIdol(null) }}>{t(lang,'group')}</button>
                  <button className={`${styles.drillBtn} ${singerType==='solo'?styles.drillActive:''}`} onClick={()=>{ setSingerType('solo'); setSelectedIdol(null) }}>{t(lang,'solo')}</button>
                </div>
              )}
              {celebCat==='singer' && singerType==='group' && (
                <div className={styles.drillRow}>
                  {Object.keys(GROUPS).map(g => (
                    <button key={g} className={`${styles.drillBtn} ${selectedGroup===g?styles.drillActive:''}`} onClick={()=>{ setSelectedGroup(g); setSelectedIdol(null) }}>{g}</button>
                  ))}
                </div>
              )}
              <div className={styles.idolGrid}>
                {getCurrentIdolList().map(idol => (
                  <div
                    key={idol.id}
                    className={`${styles.idolCard} ${selectedIdol?.id===idol.id && !showCustom ? styles.idolSelected : ''}`}
                    onClick={() => { setSelectedIdol(idol); setShowCustom(false) }}
                  >
                    <div className={styles.idolName}>{idol.name}</div>
                    <div className={styles.idolGroup}>{idol.group}</div>
                    <div className={styles.idolSign}>{idol.sign}</div>
                  </div>
                ))}
              </div>
              <button className={styles.customToggle} onClick={()=>{ setShowCustom(v=>!v); setSelectedIdol(null) }}>
                {showCustom ? t(lang,'nocelebClose') : t(lang,'noceleb')}
              </button>
              {showCustom && (
                <div className={styles.customBox}>
                  <div className={styles.grid3}>
                    <div className={styles.field}><label>{t(lang,'celebName')}</label><input type="text" placeholder={lang === 'Korean' ? '예: Taylor Swift, 뷔, Ariana Grande' : 'e.g. Taylor Swift, V, Ariana Grande'} value={customName} onChange={e=>setCustomName(e.target.value)}/></div>
                    <div className={styles.field}><label>{t(lang,'celebBirth')}</label><input type="date" value={customBirth} onChange={e=>setCustomBirth(e.target.value)}/></div>
                    <div className={styles.field}><label>{t(lang,'celebGender')}</label>
                      <select value={customGender} onChange={e=>setCustomGender(e.target.value)}>
                        <option value="male">{t(lang,'male')}</option>
                        <option value="female">{t(lang,'female')}</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.field} style={{marginTop:'0.6rem'}}><label>{t(lang,'celebGroup')}</label><input type="text" placeholder={lang === 'Korean' ? '예: Solo Artist, The 1975, NewJeans (선택)' : 'e.g. Solo Artist, The 1975, NewJeans (optional)'} value={customGroup} onChange={e=>setCustomGroup(e.target.value)}/></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Submit */}
        <button className={styles.btnSubmit} onClick={handleSubmit} disabled={loading}>
          {loading
            ? t(lang,'reading')
            : `${t(lang,'submit')} · ${costMap[mode]} ${t(lang,'creditUnit')}${costMap[mode] > 1 ? 's' : ''}`}
        </button>

        {/* Loading */}
        {loading && (
          <div className={styles.loading}>
            <div className={styles.loadingChars}>天 地 人 命</div>
            <div className={styles.loadingText}>{t(lang,'reading')}</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <div className={styles.resultTitle}>{resultTitle} {t(lang,'resultTitle')}</div>
                <div className={styles.resultEmail}>{user.email}</div>
              </div>
              <div className={styles.resultBody}>{result}</div>
            </div>

            {/* AI 이미지 생성 버튼 */}
            {!generatedImage && (
              <button
                className={styles.btnSubmit}
                style={{ marginTop:'0.75rem', background: generatingImage ? '#555' : '#3C3489' }}
                onClick={handleGenerateImage}
                disabled={generatingImage || generatingBaby}
              >
                {generatingImage ? t(lang,'aiImageLoading') : `${t(lang,'aiImageBtn')} · 3 credits`}
              </button>
            )}

            {/* 2세 이미지 섹션 — 궁합/아이돌 전용 */}
            {(mode === 'compatibility' || mode === 'idol') && (
              <div className={styles.resultCard} style={{ marginTop:'0.75rem', padding:'1rem' }}>
                <div className={styles.sectionTitle} style={{ marginBottom:'0.75rem' }}>
                  {lang === 'Korean' ? '✦ 우리의 운명적 2세 — 얼굴 사진으로 예측' : '✦ Our Destined Child — Face Photo Prediction'}
                </div>
                <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:'0.9rem' }}>
                  {lang === 'Korean'
                    ? '두 사람의 얼굴 사진을 업로드하면 사주를 바탕으로 예상 2세 이미지를 생성합니다 · 3 credits'
                    : 'Upload two face photos to generate a predicted future child based on your Saju · 3 credits'}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.9rem' }}>
                  {/* 사진 1 */}
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:'0.4rem' }}>
                      {lang === 'Korean' ? '내 사진' : 'My Photo'}
                    </label>
                    <label style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      border:'1px dashed var(--border)', borderRadius:'8px', cursor:'pointer',
                      height:'120px', overflow:'hidden', background:'var(--paper)',
                    }}>
                      {face1Preview
                        ? <img src={face1Preview} alt="face 1" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ color:'var(--muted)', fontSize:'0.8rem', textAlign:'center', padding:'0.5rem' }}>
                            {lang === 'Korean' ? '클릭하여 업로드' : 'Click to upload'}
                          </span>}
                      <input type="file" accept="image/*" style={{ display:'none' }}
                        onChange={e => handleFaceUpload(1, e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                  {/* 사진 2 */}
                  <div>
                    <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:'0.4rem' }}>
                      {lang === 'Korean' ? (mode === 'compatibility' ? '상대방 사진' : '셀럽 사진') : (mode === 'compatibility' ? 'Partner Photo' : 'Celeb Photo')}
                    </label>
                    <label style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      border:'1px dashed var(--border)', borderRadius:'8px', cursor:'pointer',
                      height:'120px', overflow:'hidden', background:'var(--paper)',
                    }}>
                      {face2Preview
                        ? <img src={face2Preview} alt="face 2" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ color:'var(--muted)', fontSize:'0.8rem', textAlign:'center', padding:'0.5rem' }}>
                            {lang === 'Korean' ? '클릭하여 업로드' : 'Click to upload'}
                          </span>}
                      <input type="file" accept="image/*" style={{ display:'none' }}
                        onChange={e => handleFaceUpload(2, e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                </div>
                {!generatedBabyImage && (
                  <button
                    className={styles.btnSubmit}
                    style={{ width:'100%', background: generatingBaby ? '#555' : '#5C3D8F' }}
                    onClick={handleGenerateBabyImage}
                    disabled={generatingImage || generatingBaby || !face1File || !face2File}
                  >
                    {generatingBaby
                      ? (lang === 'Korean' ? '2세 이미지 만드는 중...' : 'Generating...')
                      : (!face1File || !face2File)
                        ? (lang === 'Korean' ? '사진 2장을 먼저 업로드해주세요' : 'Upload both photos first')
                        : (lang === 'Korean' ? '✦ 2세 이미지 생성 · 3 credits' : '✦ Generate Baby Image · 3 credits')}
                  </button>
                )}
                {generatedBabyImage && (
                  <div style={{ marginTop:'0.75rem', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--border)' }}>
                    <img src={generatedBabyImage} alt="baby prediction" style={{ width:'100%', display:'block' }} />
                    <div style={{ padding:'0.8rem', display:'flex', gap:'0.6rem', justifyContent:'flex-end' }}>
                      <button className={styles.btnCopy} onClick={() => {
                        const a = document.createElement('a')
                        a.href = generatedBabyImage
                        a.download = `unmyeong-baby-${Date.now()}.png`
                        a.target = '_blank'
                        a.click()
                      }}>{t(lang,'saveImage')}</button>
                      <button className={styles.btnTwitter} onClick={() => {
                        const text = lang === 'Korean'
                          ? `✦ 우리의 운명적 2세\n\nunmyeong-tau.vercel.app\n#사주 #궁합 #AIArt #Unmyeong`
                          : `✦ Our Destined Child by Korean Saju\n\nunmyeong-tau.vercel.app\n#Saju #Compatibility #AIArt #Unmyeong`
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                      }}>{t(lang,'shareX')}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 생성된 AI 이미지 */}
            {generatedImage && (
              <div className={styles.resultCard} style={{ marginTop:'0.75rem', overflow:'hidden' }}>
                <div className={styles.resultHeader}>
                  <div className={styles.resultTitle}>{t(lang,'aiImageTitle')}</div>
                </div>
                <div style={{ position:'relative' }}>
                  <img
                    src={generatedImage}
                    alt="AI generated saju art"
                    style={{ width:'100%', display:'block' }}
                  />
                  <div style={{ padding:'0.8rem 1rem', display:'flex', gap:'0.6rem', justifyContent:'flex-end', borderTop:'1px solid var(--border)' }}>
                    <button
                      className={styles.btnCopy}
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = generatedImage
                        a.download = `unmyeong-art-${Date.now()}.png`
                        a.target = '_blank'
                        a.click()
                      }}
                    >
                      {t(lang,'saveImage')}
                    </button>
                    <button
                      className={styles.btnTwitter}
                      onClick={() => {
                        const text = `✦ ${t(lang,'aiImageTitle')}\n\nunmyeong-tau.vercel.app\n#Saju #KoreanFortune #AIArt #Unmyeong`
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                      }}
                    >
                      {t(lang,'shareX')}
                    </button>
                  </div>
                </div>
              </div>
            )}


            <ShareCard
              result={result}
              title={resultTitle}
              mode={mode}
              celebName={mode === 'idol' ? (selectedIdol?.name || customName) : undefined}
              userName={nickname || user.email.split('@')[0]}
              language={lang}
            />
          </>
        )}
      </div>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* 크레딧 충전 모달 */}
      {showBuyModal && (
        <BuyCreditsModal onClose={() => setShowBuyModal(false)} />
      )}
    </div>
  )
}
