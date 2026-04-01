import type { Metadata } from 'next'
import './globals.css'
import PaddleProvider from '@/components/PaddleProvider'

export const metadata: Metadata = {
  title: '운명 · Unmyeong — Korean Fate Reading',
  description: 'Discover your destiny through the ancient art of Korean Saju (사주팔자)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&family=Cinzel:wght@400;600&family=Noto+Sans:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PaddleProvider />
        {children}
      </body>
    </html>
  )
}
