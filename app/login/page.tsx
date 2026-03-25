'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function signInWithGoogle() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  async function signInWithApple() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>운명</div>
        <div className={styles.logoEn}>UNMYEONG</div>
        <p className={styles.tagline}>
          Discover your destiny through the ancient art of Korean Saju
        </p>

        <div className={styles.divider} />

        <div className={styles.buttons}>
          <button
            className={styles.btnGoogle}
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? 'Loading...' : 'Continue with Google'}
          </button>

          <button
            className={styles.btnApple}
            onClick={signInWithApple}
            disabled={loading}
          >
            <svg width="17" height="20" viewBox="0 0 17 20" fill="currentColor">
              <path d="M13.634 10.633c-.02-2.12 1.73-3.146 1.81-3.196-.987-1.444-2.52-1.641-3.067-1.662-1.304-.133-2.554.775-3.215.775-.661 0-1.677-.756-2.759-.736-1.415.02-2.72.826-3.447 2.1-1.474 2.558-.376 6.343 1.06 8.415.703 1.016 1.542 2.155 2.643 2.114 1.061-.041 1.463-.682 2.745-.682 1.283 0 1.643.682 2.765.661 1.142-.02 1.864-1.036 2.563-2.054a9.866 9.866 0 001.162-2.373c-.028-.013-2.233-.856-2.254-3.362zM11.53 3.89c.576-.704.966-1.676.858-2.652-.831.034-1.844.556-2.44 1.24-.532.617-.999 1.614-.875 2.563.927.071 1.874-.47 2.457-1.151z"/>
            </svg>
            {loading ? 'Loading...' : 'Continue with Apple'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✦</span>
            <span>Personal Saju reading — 1 credit</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✦</span>
            <span>Compatibility reading — 2 credits</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✦</span>
            <span>K-celeb match — 3 credits</span>
          </div>
        </div>
      </div>
    </div>
  )
}
