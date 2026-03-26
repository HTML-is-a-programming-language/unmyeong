'use client'

import { useRef, useState } from 'react'
import styles from './ShareCard.module.css'

interface Props {
  result: string
  title: string
  mode: 'personal' | 'compatibility' | 'idol'
  celebName?: string
  language: string
}

const MODE_LABELS: Record<string, Record<string, string>> = {
  personal:      { Korean:'개인 사주', English:'Personal Reading', Japanese:'個人鑑定', Thai:'ดูดวงส่วนตัว', Spanish:'Lectura Personal', Portuguese:'Leitura Pessoal', Chinese:'个人命理' },
  compatibility: { Korean:'궁합', English:'Compatibility', Japanese:'相性占い', Thai:'ความเข้ากัน', Spanish:'Compatibilidad', Portuguese:'Compatibilidade', Chinese:'合婚' },
  idol:          { Korean:'아이돌 궁합', English:'K-Celeb Match', Japanese:'K-セレブ相性', Thai:'K-Celeb Match', Spanish:'Match K-Celeb', Portuguese:'Match K-Celeb', Chinese:'K星缘分' },
}

const TAGLINES: Record<string, string> = {
  Korean: '한국 전통 사주팔자',
  English: 'Korean Fate Reading',
  Japanese: '韓国伝統四柱推命',
  Thai: 'โหราศาสตร์เกาหลี',
  Spanish: 'Lectura del Destino Coreano',
  Portuguese: 'Leitura do Destino Coreano',
  Chinese: '韩国传统四柱命理',
}

// 결과 텍스트에서 첫 번째 섹션만 추출 (카드용 미리보기)
function extractPreview(text: string): string {
  const lines = text.split('\n').filter(l => l.trim())
  // ✦ 섹션 2개만 추출
  const sections = lines.filter(l => l.startsWith('✦')).slice(0, 2)
  if (sections.length > 0) return sections.join('\n\n')
  // 없으면 앞 200자
  return text.slice(0, 200) + '...'
}

export default function ShareCard({ result, title, mode, celebName, language }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)

  const modeLabel = MODE_LABELS[mode]?.[language] || MODE_LABELS[mode]?.['English'] || mode
  const tagline = TAGLINES[language] || TAGLINES['English']
  const preview = extractPreview(result)

  async function downloadImage() {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2, // 고해상도
        backgroundColor: '#1a0a00',
      })
      const link = document.createElement('a')
      link.download = `unmyeong-${mode}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Image save error:', e)
      alert('이미지 저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  async function shareToTwitter() {
    setSharing(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current!, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#1a0a00',
      })

      // 이미지를 클립보드에 복사 후 트위터로
      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])

      const tweetText = mode === 'idol'
        ? `✦ My Korean Saju match with ${celebName} — ${title}\n\nGet your reading at unmyeong-tau.vercel.app\n\n#Saju #KoreanFortune #Kpop #${celebName?.replace(/\s/g, '')}`
        : `✦ My Korean Saju ${modeLabel} reading\n\nGet yours at unmyeong-tau.vercel.app\n\n#Saju #KoreanFortune #Unmyeong #운명`

      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
        '_blank'
      )
    } catch {
      // 클립보드 실패해도 트위터는 열기
      const tweetText = mode === 'idol'
        ? `✦ My Korean Saju match with ${celebName} — ${title}\n\nGet your reading at unmyeong-tau.vercel.app\n\n#Saju #KoreanFortune #Kpop`
        : `✦ My Korean Saju reading\n\nGet yours at unmyeong-tau.vercel.app\n\n#Saju #KoreanFortune #Unmyeong`
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
        '_blank'
      )
    } finally {
      setSharing(false)
    }
  }

  async function shareNative() {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#1a0a00',
      })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'unmyeong.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '운명 · Unmyeong',
          text: mode === 'idol'
            ? `My Korean Saju match with ${celebName}! Get yours at unmyeong-tau.vercel.app`
            : 'My Korean Saju reading! Get yours at unmyeong-tau.vercel.app',
        })
      } else {
        // 네이티브 공유 불가 시 다운로드로 폴백
        await downloadImage()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* 실제 이미지로 변환될 카드 */}
      <div ref={cardRef} className={styles.card}>
        {/* 상단 헤더 */}
        <div className={styles.cardHeader}>
          <div className={styles.cardLogo}>운명</div>
          <div className={styles.cardLogoEn}>UNMYEONG</div>
          <div className={styles.cardTagline}>{tagline}</div>
        </div>

        {/* 타이틀 배지 */}
        <div className={styles.cardBadge}>{modeLabel}</div>
        {celebName && (
          <div className={styles.cardCeleb}>✦ {title} ✦</div>
        )}

        {/* 결과 미리보기 */}
        <div className={styles.cardContent}>
          {preview}
        </div>

        {/* 장식 구분선 */}
        <div className={styles.cardDivider}>
          <span>天</span><span>地</span><span>人</span><span>命</span>
        </div>

        {/* 하단 URL */}
        <div className={styles.cardFooter}>
          unmyeong-tau.vercel.app
        </div>
      </div>

      {/* 공유 버튼들 */}
      <div className={styles.actions}>
        <button
          className={styles.btnSave}
          onClick={downloadImage}
          disabled={saving}
        >
          {saving ? '저장 중...' : '이미지 저장'}
        </button>
        <button
          className={styles.btnTwitter}
          onClick={shareToTwitter}
          disabled={sharing}
        >
          {sharing ? '공유 중...' : 'X (트위터) 공유'}
        </button>
        <button
          className={styles.btnShare}
          onClick={shareNative}
          disabled={saving}
        >
          공유하기
        </button>
      </div>
    </div>
  )
}
