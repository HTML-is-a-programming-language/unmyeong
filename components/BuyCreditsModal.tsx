'use client'

import { useState } from 'react'
import { CREDIT_PACKAGES } from '@/lib/packages'
import type { PackageId } from '@/lib/packages'
import styles from './BuyCreditsModal.module.css'

interface Props {
  onClose: () => void
}

export default function BuyCreditsModal({ onClose }: Props) {
  const [loading, setLoading] = useState<PackageId | null>(null)

  async function handleBuy(packageId: PackageId) {
    setLoading(packageId)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()

      if (data.checkoutUrl) {
        // Paddle 결제 페이지로 이동
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error || '오류가 발생했어요.')
        setLoading(null)
      }
    } catch {
      alert('오류가 발생했어요. 다시 시도해주세요.')
      setLoading(null)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>✦ 크레딧 충전</div>
          <div className={styles.sub}>일회 결제 · 구독 없음 · 전 세계 결제 가능</div>
        </div>

        <div className={styles.packages}>
          {CREDIT_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              className={`${styles.pkg} ${pkg.id === 'credits_15' ? styles.pkgFeatured : ''}`}
              onClick={() => handleBuy(pkg.id)}
              disabled={loading !== null}
            >
              {pkg.id === 'credits_15' && (
                <span className={styles.badge}>인기</span>
              )}
              <div className={styles.pkgLeft}>
                <div className={styles.pkgName}>{pkg.label}</div>
                <div className={styles.pkgNote}>{pkg.note}</div>
              </div>
              <div className={styles.pkgRight}>
                <div className={styles.pkgPrice}>${pkg.price}</div>
                <div className={styles.pkgPer}>
                  ${(pkg.price / pkg.credits).toFixed(2)}/credit
                </div>
              </div>
              {loading === pkg.id && (
                <span className={styles.spinner}>...</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.secure}>
          🔒 Paddle로 안전하게 결제 · 한국 카드 사용 가능
        </div>

        <button className={styles.btnClose} onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
