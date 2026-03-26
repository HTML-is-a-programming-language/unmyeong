'use client'

import { useRef, useState } from 'react'

interface Props {
  result: string
  title: string
  mode: 'personal' | 'compatibility' | 'idol'
  celebName?: string
  userName?: string
  language: string
}

const MODE_LABELS: Record<string, Record<string, string>> = {
  personal:      { Korean:'개인 사주', English:'Personal Reading', Japanese:'個人鑑定', Thai:'ดูดวงส่วนตัว', Spanish:'Lectura Personal', Portuguese:'Leitura Pessoal', Chinese:'个人命理' },
  compatibility: { Korean:'궁합', English:'Compatibility', Japanese:'相性占い', Thai:'ความเข้ากัน', Spanish:'Compatibilidad', Portuguese:'Compatibilidade', Chinese:'合婚' },
  idol:          { Korean:'K-셀럽 궁합', English:'K-Celeb Match', Japanese:'K-セレブ相性', Thai:'K-Celeb Match', Spanish:'Match K-Celeb', Portuguese:'Match K-Celeb', Chinese:'K星缘分' },
}

function extractScore(text: string): string | null {
  const match = text.match(/(\d{1,3})\s*\/\s*100/)
  return match ? match[1] : null
}

function extractHighlights(text: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = []

  // ✦ 로 시작하는 각 섹션을 정규식으로 추출
  const sectionPattern = /✦\s*([^\n]+)\n([\s\S]*?)(?=✦|$)/g
  let match

  while ((match = sectionPattern.exec(text)) !== null) {
    const titleLine = match[1].trim()
    const bodyRaw = match[2].trim()

    // 제목에서 점수 부분 제거 (Fate Score — 81/100 — ... 형태)
    const title = titleLine.split('—')[0].trim()

    // 본문이 비어있으면 제목 줄에 — 뒤 내용을 본문으로
    const titleParts = titleLine.split('—')
    const inlineBody = titleParts.length >= 3 ? titleParts.slice(2).join('—').trim() : ''
    const body = bodyRaw || inlineBody

    if (title && body) {
      sections.push({ title, body })
    }
  }

  // 아이돌 궁합은 3~4번째 섹션이 가장 감동적 (Why X would fall, Dynamic)
  // 그 외는 2~3번째
  if (sections.length >= 4) {
    return [sections[3], sections[4] ?? sections[2]].filter(s => s && s.body.length > 10).slice(0, 2)
  }
  if (sections.length >= 2) {
    return sections.slice(1, 3).filter(s => s.body.length > 10)
  }
  return sections.slice(0, 2)
}

function extractVerdict(text: string): string {
  const quoted = text.match(/"([^"]{20,120})"/)?.[1]
  if (quoted) return `"${quoted}"`
  const scoreLine = text.split('\n').find(l => l.includes('Fate Score') || l.includes('운명 점수') || l.includes('Score'))
  if (scoreLine) {
    const parts = scoreLine.split('—')
    if (parts.length >= 3) return parts.slice(2).join('—').trim().slice(0, 100)
  }
  return ''
}

export default function ShareCard({ result, title, mode, celebName, userName, language }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const modeLabel = MODE_LABELS[mode]?.[language] || MODE_LABELS[mode]?.['English'] || mode
  const score = extractScore(result)
  const highlights = extractHighlights(result)
  const verdict = extractVerdict(result)
  const person1Name = userName || 'You'
  const person2Name = celebName || ''

  async function saveImage() {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0d0d1a',
      })
      const link = document.createElement('a')
      link.download = `unmyeong-${mode}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error(e)
      alert('이미지 저장 중 오류가 났어요.')
    } finally {
      setSaving(false)
    }
  }

  async function shareNative() {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { quality:1, pixelRatio:2, backgroundColor:'#0d0d1a' })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'unmyeong.png', { type:'image/png' })
      if (navigator.share && navigator.canShare({ files:[file] })) {
        await navigator.share({
          files: [file],
          title: '운명 · Unmyeong',
          text: celebName
            ? `My Korean Saju fate score with ${celebName}! Get yours → unmyeong-tau.vercel.app`
            : 'My Korean Saju reading! Get yours → unmyeong-tau.vercel.app',
        })
      } else {
        await saveImage()
      }
    } catch { await saveImage() }
    finally { setSaving(false) }
  }

  function shareTwitter() {
    const text = celebName
      ? `✦ My Korean Saju fate score with ${celebName}: ${score}/100\n\n${verdict ? verdict + '\n\n' : ''}Get yours → unmyeong-tau.vercel.app\n#Saju #KoreanFortune #Kpop #${celebName.replace(/[\s.]/g,'')}`
      : `✦ My Korean Saju ${modeLabel} reading\n\nGet yours → unmyeong-tau.vercel.app\n#Saju #KoreanFortune #Unmyeong`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div style={{ marginTop:'1.5rem' }}>
      <div ref={cardRef} style={{ background:'#0d0d1a', borderRadius:'18px', padding:'1.8rem 1.6rem 1.4rem', position:'relative', overflow:'hidden', fontFamily:"'Noto Serif KR','Noto Sans',Georgia,serif", boxShadow:'0 0 0 1.5px #8b4fa8, 0 0 0 3px #c9943a' }}>

        <div style={{ position:'absolute', top:'-50px', right:'-50px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(138,79,168,0.1)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(201,148,58,0.07)', pointerEvents:'none' }} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.2rem' }}>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:'1.1rem', fontWeight:300, color:'#c9943a', letterSpacing:'0.25em' }}>운명</div>
          <div style={{ fontSize:'0.62rem', background:'rgba(138,79,168,0.2)', border:'1px solid rgba(138,79,168,0.45)', color:'#c4a0e8', padding:'3px 10px', borderRadius:'20px', letterSpacing:'0.1em' }}>{modeLabel}</div>
        </div>

        {(mode === 'idol' || mode === 'compatibility') && person2Name && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.9rem', marginBottom:'1rem' }}>
            <div style={{ background:'rgba(201,148,58,0.1)', border:'1px solid rgba(201,148,58,0.28)', borderRadius:'30px', padding:'0.4rem 1.1rem', textAlign:'center' }}>
              <div style={{ fontSize:'0.58rem', color:'rgba(201,148,58,0.55)', letterSpacing:'0.15em', marginBottom:'2px' }}>YOU</div>
              <div style={{ fontSize:'0.9rem', color:'#f5efe6', fontWeight:500 }}>{person1Name}</div>
            </div>
            <div style={{ fontSize:'1.2rem', color:'#d4537e' }}>♡</div>
            <div style={{ background:'rgba(201,148,58,0.1)', border:'1px solid rgba(201,148,58,0.28)', borderRadius:'30px', padding:'0.4rem 1.1rem', textAlign:'center' }}>
              <div style={{ fontSize:'0.58rem', color:'rgba(201,148,58,0.55)', letterSpacing:'0.15em', marginBottom:'2px' }}>K-CELEB</div>
              <div style={{ fontSize:'0.9rem', color:'#f5efe6', fontWeight:500 }}>{person2Name}</div>
            </div>
          </div>
        )}

        {score && (
          <div style={{ textAlign:'center', marginBottom:'1rem' }}>
            <div style={{ fontFamily:"'Cinzel',Georgia,serif", fontSize:'3.2rem', color:'#c9943a', lineHeight:1, fontWeight:600 }}>{score}</div>
            <div style={{ fontSize:'0.65rem', color:'rgba(201,148,58,0.45)', letterSpacing:'0.2em', marginTop:'2px' }}>/ 100 · FATE SCORE</div>
          </div>
        )}

        {verdict && (
          <div style={{ textAlign:'center', fontSize:'0.78rem', color:'rgba(245,239,230,0.7)', fontStyle:'italic', lineHeight:1.65, marginBottom:'1.1rem', padding:'0 0.3rem' }}>
            {verdict}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1rem' }}>
          <div style={{ flex:1, height:'1px', background:'rgba(201,148,58,0.18)' }} />
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:'0.65rem', color:'rgba(201,148,58,0.35)', letterSpacing:'0.3em' }}>天 地 人 命</div>
          <div style={{ flex:1, height:'1px', background:'rgba(201,148,58,0.18)' }} />
        </div>

        {highlights.length > 0 ? highlights.map((h, i) => (
          <div key={i} style={{ background:'rgba(138,79,168,0.08)', border:'1px solid rgba(138,79,168,0.18)', borderRadius:'10px', padding:'0.85rem 1rem', marginBottom: i < highlights.length-1 ? '0.7rem' : '1rem' }}>
            <div style={{ fontSize:'0.6rem', color:'#c4a0e8', letterSpacing:'0.15em', marginBottom:'0.35rem' }}>✦ {h.title}</div>
            <div style={{ fontSize:'0.78rem', color:'rgba(245,239,230,0.85)', lineHeight:1.7 }}>
              {h.body.length > 200 ? h.body.slice(0, 200) + '...' : h.body}
            </div>
          </div>
        )) : (
          // 파싱 실패 시 결과 앞부분 직접 표시
          <div style={{ background:'rgba(138,79,168,0.08)', border:'1px solid rgba(138,79,168,0.18)', borderRadius:'10px', padding:'0.85rem 1rem', marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.78rem', color:'rgba(245,239,230,0.85)', lineHeight:1.7 }}>
              {result.slice(0, 300).replace(/✦/g, '').trim()}{result.length > 300 ? '...' : ''}
            </div>
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'0.8rem', borderTop:'1px solid rgba(201,148,58,0.12)' }}>
          <div style={{ fontSize:'0.58rem', color:'rgba(201,148,58,0.38)', letterSpacing:'0.15em' }}>unmyeong-tau.vercel.app</div>
          <div style={{ fontSize:'0.58rem', color:'rgba(138,79,168,0.45)', letterSpacing:'0.08em' }}>#Saju #KoreanFortune #Kpop</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:'0.6rem', marginTop:'0.9rem', flexWrap:'wrap' }}>
        <button onClick={saveImage} disabled={saving} style={{ flex:1, minWidth:'100px', padding:'0.65rem 0.8rem', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', border:'1px solid #1a0a00', background:'#1a0a00', color:'#f5efe6', fontFamily:'inherit', opacity:saving?0.5:1 }}>
          {saving ? '저장 중...' : '이미지 저장'}
        </button>
        <button onClick={shareTwitter} style={{ flex:1, minWidth:'100px', padding:'0.65rem 0.8rem', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', border:'1px solid #1da1f2', background:'transparent', color:'#1da1f2', fontFamily:'inherit' }}>
          X 공유
        </button>
        <button onClick={shareNative} disabled={saving} style={{ flex:1, minWidth:'100px', padding:'0.65rem 0.8rem', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', border:'1px solid #c9943a', background:'transparent', color:'#c9943a', fontFamily:'inherit', opacity:saving?0.5:1 }}>
          공유하기
        </button>
      </div>
    </div>
  )
}
