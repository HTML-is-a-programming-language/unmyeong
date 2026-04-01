'use client'

import { useEffect } from 'react'
import { initializePaddle } from '@paddle/paddle-js'

export default function PaddleProvider() {
  useEffect(() => {
    initializePaddle({
      environment: 'production',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    })
  }, [])

  return null
}
