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
  'TWICE': [
    { id:50, name:'Nayeon',    group:'TWICE', birth:'1995-09-22', gender:'female', sign:'♍ Virgo' },
    { id:51, name:'Momo',      group:'TWICE', birth:'1996-11-09', gender:'female', sign:'♏ Scorpio' },
    { id:52, name:'Sana',      group:'TWICE', birth:'1996-12-29', gender:'female', sign:'♑ Capricorn' },
    { id:53, name:'Jihyo',     group:'TWICE', birth:'1997-02-01', gender:'female', sign:'♒ Aquarius' },
    { id:54, name:'Tzuyu',     group:'TWICE', birth:'1999-06-14', gender:'female', sign:'♊ Gemini' },
  ],
  'NewJeans': [
    { id:80, name:'Minji',    group:'NewJeans', birth:'2004-05-07', gender:'female', sign:'♉ Taurus' },
    { id:81, name:'Hanni',    group:'NewJeans', birth:'2004-10-06', gender:'female', sign:'♎ Libra' },
    { id:82, name:'Danielle', group:'NewJeans', birth:'2005-04-11', gender:'female', sign:'♈ Aries' },
    { id:83, name:'Haerin',   group:'NewJeans', birth:'2006-05-15', gender:'female', sign:'♉ Taurus' },
    { id:84, name:'Hyein',    group:'NewJeans', birth:'2008-04-21', gender:'female', sign:'♈ Aries' },
  ],
  'Stray Kids': [
    { id:70, name:'Bang Chan', group:'Stray Kids', birth:'1997-10-03', gender:'male', sign:'♎ Libra' },
    { id:71, name:'Lee Know',  group:'Stray Kids', birth:'1998-10-25', gender:'male', sign:'♏ Scorpio' },
    { id:72, name:'Changbin',  group:'Stray Kids', birth:'1999-08-11', gender:'male', sign:'♌ Leo' },
    { id:73, name:'Hyunjin',   group:'Stray Kids', birth:'2000-03-20', gender:'male', sign:'♓ Pisces' },
    { id:74, name:'Felix',     group:'Stray Kids', birth:'2000-09-15', gender:'male', sign:'♍ Virgo' },
    { id:75, name:'I.N',       group:'Stray Kids', birth:'2001-02-08', gender:'male', sign:'♒ Aquarius' },
  ],
}

const SOLO_SINGERS: Celebrity[] = [
  { id:100, name:'IU',       group:'Solo Singer',   birth:'1993-05-16', gender:'female', sign:'♉ Taurus' },
  { id:101, name:'Taeyeon',  group:'Solo / SNSD',   birth:'1989-03-09', gender:'female', sign:'♓ Pisces' },
  { id:102, name:'G-Dragon', group:'Solo / BIGBANG',birth:'1988-08-18', gender:'male',   sign:'♌ Leo' },
  { id:103, name:'Zico',     group:'Solo / Block B',birth:'1992-09-14', gender:'male',   sign:'♍ Virgo' },
  { id:104, name:'Heize',    group:'Solo Singer',   birth:'1991-08-19', gender:'female', sign:'♌ Leo' },
  { id:105, name:'Dean',     group:'Solo Singer',   birth:'1992-11-10', gender:'male',   sign:'♏ Scorpio' },
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
  const [readingCat, setReadingCat]     = useState<ReadingCategory | null>(null)

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
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage]   = useState<string | null>(null)

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

  const costMap: Record<ReadingMode, number> = { personal: 1, compatibility: 2, idol: 3 }

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
        body: JSON.stringify({ sajuResult: result, mode, language: lang }),
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

  // ── 제출 ────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const cost = costMap[mode]
    if (credits < cost) {
      setShowBuyModal(true)
      return
    }
    if (!date1) { showToast(t(lang, 'enterBirth')); return }
    if (mode === 'personal' && !readingCat) { showToast(t(lang, 'selectReading')); return }
    if (mode === 'compatibility' && !date2) { showToast(t(lang, 'enterPartnerBirth')); return }
    if (mode === 'idol') {
      if (showCustom && (!customName || !customBirth)) { showToast(t(lang, 'enterCelebInfo')); return }
      if (!showCustom && !selectedIdol) { showToast(t(lang, 'selectCeleb')); return }
    }

    setLoading(true)
    setResult(null)
    setGeneratedImage(null)

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
        ...(mode === 'personal' && { category: readingCat }),
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
        ? t(lang, readingCat ?? '')
        : mode === 'compatibility' ? t(lang, 'compatibility') : t(lang, 'idol')
      setResultTitle(catLabel)

    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : '오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [mode, lang, credits, date1, date2, calendar1, calendar2, time1, time2, gender1, gender2, place1, readingCat, selectedIdol, showCustom, customName, customBirth, customGender, customGroup])

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

          {/* Personal: category */}
          {mode === 'personal' && (
            <>
              <div className={styles.sectionTitle} style={{marginTop:'1.2rem'}}>{t(lang,'readingType')}</div>
              <div className={styles.catGrid}>
                {READING_CATEGORY_IDS.map(id => (
                  <button
                    key={id}
                    className={`${styles.catBtn} ${readingCat===id ? styles.catBtnActive : ''}`}
                    onClick={() => setReadingCat(id as ReadingCategory)}
                  >
                    <span className={styles.catKr}>{t(lang, id)}</span>
                    {lang === 'Korean' ? null : <span className={styles.catEn}>{t('Korean', id)}</span>}
                  </button>
                ))}
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
                    <div className={styles.field}><label>{t(lang,'celebName')}</label><input type="text" placeholder={t(lang,'celebNamePlaceholder')} value={customName} onChange={e=>setCustomName(e.target.value)}/></div>
                    <div className={styles.field}><label>{t(lang,'celebBirth')}</label><input type="date" value={customBirth} onChange={e=>setCustomBirth(e.target.value)}/></div>
                    <div className={styles.field}><label>{t(lang,'celebGender')}</label>
                      <select value={customGender} onChange={e=>setCustomGender(e.target.value)}>
                        <option value="male">{t(lang,'male')}</option>
                        <option value="female">{t(lang,'female')}</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.field} style={{marginTop:'0.6rem'}}><label>{t(lang,'celebGroup')}</label><input type="text" placeholder={t(lang,'celebGroupPlaceholder')} value={customGroup} onChange={e=>setCustomGroup(e.target.value)}/></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Submit */}
        <button className={styles.btnSubmit} onClick={handleSubmit} disabled={loading}>
          {loading ? t(lang,'reading') : `${t(lang,'submit')} · ${costMap[mode]} ${t(lang,'creditUnit')}`}
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
                disabled={generatingImage}
              >
                {generatingImage ? t(lang,'aiImageLoading') : `${t(lang,'aiImageBtn')} · 3 credits`}
              </button>
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
