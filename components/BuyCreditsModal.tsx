'use client'

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { CREDIT_PACKAGES } from '@/lib/packages'
import type { PackageId } from '@/lib/packages'
import styles from './BuyCreditsModal.module.css'

interface Props {
  onClose: () => void
  onSuccess?: (credits: number) => void
}

export default function BuyCreditsModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState<PackageId | null>(null)
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
  }, [])

  async function handleBuy(packageId: PackageId) {
    setLoading(packageId)
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) { setLoading(null); return }

    try {
      if (isNative) {
        await handleNativePurchase(pkg)
      } else {
        await handleWebPurchase(packageId)
      }
    } catch (e: unknown) {
      // 사용자가 직접 취소한 경우 알림 생략
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('cancel') && !msg.includes('Cancel')) {
        alert('결제 중 오류가 발생했어요. 다시 시도해주세요.')
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleNativePurchase(pkg: typeof CREDIT_PACKAGES[number]) {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor')

    const platform = Capacitor.getPlatform()
    const apiKey = platform === 'ios'
      ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY!
      : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY!

    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
    await Purchases.configure({ apiKey })

    // 현재 유저 ID를 RevenueCat에 연결 (Supabase user ID)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await Purchases.logIn({ appUserID: user.id })
    }

    // offerings 조회 — 올바른 타입 구조: { current, all }
    const offeringsResult = await Purchases.getOfferings()
    const current = offeringsResult.current
    if (!current) {
      alert('상품 정보를 불러올 수 없어요. 잠시 후 다시 시도해주세요.')
      return
    }

    // availablePackages에서 identifier로 매칭
    const rcPackage = current.availablePackages.find(
      (p) => p.identifier === pkg.rcIdentifier
    )
    if (!rcPackage) {
      alert('해당 상품을 찾을 수 없어요.')
      return
    }

    // 결제 진행
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage })

    // entitlement 확인 후 서버에 크레딧 지급 요청
    const entitlement = customerInfo.entitlements.active[pkg.rcEntitlement]
    if (entitlement) {
      await grantCreditsAfterPurchase(pkg.credits, pkg.id)
      onSuccess?.(pkg.credits)
      onClose()
    }
  }

  async function handleWebPurchase(packageId: PackageId) {
    const { getPaddleInstance } = await import('@paddle/paddle-js')

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId }),
    })
    const data = await res.json()

    if (data.transactionId) {
      const paddle = getPaddleInstance()
      if (!paddle) {
        alert('결제 모듈을 불러오지 못했어요. 새로고침 후 시도해주세요.')
        return
      }
      onClose()
      paddle.Checkout.open({ transactionId: data.transactionId })
    } else {
      alert(data.error || '오류가 발생했어요.')
    }
  }

  async function grantCreditsAfterPurchase(credits: number, packageId: string) {
    const res = await fetch('/api/credits/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credits, packageId }),
    })
    if (!res.ok) {
      console.error('Credit grant failed:', await res.text())
    }
  }

  const platform = isNative ? Capacitor.getPlatform() : null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>✦ 크레딧 충전</div>
          <div className={styles.sub}>
            {isNative ? '앱 내 결제 · 구독 없음' : '일회 결제 · 구독 없음 · 전 세계 결제 가능'}
          </div>
        </div>

        <div className={styles.packages}>
          {CREDIT_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              className={`${styles.pkg} ${pkg.id === 'credits_20' ? styles.pkgFeatured : ''}`}
              onClick={() => handleBuy(pkg.id)}
              disabled={loading !== null}
            >
              {pkg.id === 'credits_20' && (
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
          🔒 {platform === 'ios'
            ? 'Apple In-App Purchase로 안전하게 결제'
            : platform === 'android'
              ? 'Google Play로 안전하게 결제'
              : 'Paddle로 안전하게 결제 · 한국 카드 사용 가능'}
        </div>

        <button className={styles.btnClose} onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
