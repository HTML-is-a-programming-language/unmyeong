'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from './success.module.css'

export default function SuccessPage() {
  const router = useRouter()
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      setCredits(profile?.credits ?? 0)
    }

    load()
  }, [router])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>✦</div>
        <h1 className={styles.title}>결제 완료</h1>
        <p className={styles.sub}>Payment successful</p>

        <div className={styles.creditBox}>
          <div className={styles.creditLabel}>현재 잔여 크레딧</div>
          <div className={styles.creditNum}>
            {credits === null ? '...' : credits}
          </div>
          <div className={styles.creditNote}>credits</div>
        </div>

        <Link href="/dashboard" className={styles.btnHome}>
          운명 보러 가기 →
        </Link>
      </div>
    </div>
  )
}
