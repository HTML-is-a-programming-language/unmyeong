'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

// Paddle은 웹에서만 로드 (네이티브 앱에서는 RevenueCat 사용)
export default function ConditionalPaddleProvider() {
  const [isWeb, setIsWeb] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setIsWeb(true)
    }
  }, [])

  if (!isWeb) return null

  // 웹에서만 Paddle 스크립트 로드
  return <PaddleLoader />
}

function PaddleLoader() {
  useEffect(() => {
    // 동적으로 Paddle 초기화
    import('@paddle/paddle-js').then(({ initializePaddle }) => {
      initializePaddle({
        environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production') || 'sandbox',
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      })
    })
  }, [])

  return null
}
