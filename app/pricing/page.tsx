'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../policy.module.css'

type Lang = 'Korean' | 'English' | 'Japanese' | 'Thai' | 'Spanish' | 'Portuguese' | 'Chinese'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'Korean', label: '한국어' },
  { code: 'English', label: 'English' },
  { code: 'Japanese', label: '日本語' },
  { code: 'Thai', label: 'ภาษาไทย' },
  { code: 'Spanish', label: 'Español' },
  { code: 'Portuguese', label: 'Português' },
  { code: 'Chinese', label: '中文' },
]

const T: Record<Lang, {
  back: string
  title: string
  subtitle: string
  howItWorks: string
  readingType: string
  creditCost: string
  personal: string
  compatibility: string
  idol: string
  packages: string
  tryIt: string
  popular: string
  powerUser: string
  getStarted: string
  secure: string
  faq: string
  q1: string; a1: string
  q2: string; a2: string
  q3: string; a3: string
  refundLink: string
  ctaTitle: string
  ctaText: string
  ctaBtn: string
}> = {
  Korean: {
    back: '← 홈으로',
    title: '가격 안내',
    subtitle: '구독 없음 · 필요한 만큼만 충전하세요',
    howItWorks: '크레딧 사용법',
    readingType: '운세 종류',
    creditCost: '크레딧',
    personal: '개인 사주',
    compatibility: '궁합',
    idol: '아이돌 궁합',
    packages: '크레딧 패키지',
    tryIt: '체험용',
    popular: '인기 ✦',
    powerUser: '파워유저',
    getStarted: '시작하기',
    secure: 'Paddle로 안전하게 결제 · 한국 카드 사용 가능',
    faq: '자주 묻는 질문',
    q1: '크레딧은 만료되나요?',
    a1: '아니요, 크레딧은 만료되지 않습니다. 구매 후 언제든지 사용하실 수 있습니다.',
    q2: '어떤 결제 수단을 사용할 수 있나요?',
    a2: '신용카드, 체크카드 등 대부분의 국내외 카드를 지원합니다. 한국 카드도 사용 가능합니다.',
    q3: '환불이 가능한가요?',
    a3: '미사용 크레딧에 한해 구매 후 14일 이내 환불이 가능합니다.',
    refundLink: '환불 정책 자세히 보기 →',
    ctaTitle: '지금 바로 시작하세요',
    ctaText: '무료 회원가입 후 크레딧을 충전하고 나의 운명을 알아보세요.',
    ctaBtn: '무료로 시작하기',
  },
  English: {
    back: '← Back to Home',
    title: 'Pricing',
    subtitle: 'No subscription · Pay only for what you need',
    howItWorks: 'How Credits Work',
    readingType: 'Reading Type',
    creditCost: 'Credits',
    personal: 'Personal Reading',
    compatibility: 'Compatibility',
    idol: 'K-Celeb Match',
    packages: 'Credit Packages',
    tryIt: 'Try it out',
    popular: 'Most Popular ✦',
    powerUser: 'Power User',
    getStarted: 'Get Started',
    secure: 'Secure payments by Paddle · All major cards accepted',
    faq: 'Frequently Asked Questions',
    q1: 'Do credits expire?',
    a1: 'No, credits never expire. Use them whenever you like.',
    q2: 'What payment methods are accepted?',
    a2: 'All major credit and debit cards are accepted via Paddle, our secure payment processor.',
    q3: 'Can I get a refund?',
    a3: 'Unused credits can be refunded within 14 days of purchase.',
    refundLink: 'View Refund Policy →',
    ctaTitle: 'Start Your Journey',
    ctaText: 'Sign up for free and add credits to unlock your destiny readings.',
    ctaBtn: 'Get Started Free',
  },
  Japanese: {
    back: '← ホームへ',
    title: '料金案内',
    subtitle: 'サブスク不要 · 必要な分だけ購入',
    howItWorks: 'クレジットの使い方',
    readingType: '占いの種類',
    creditCost: 'クレジット',
    personal: '個人の四柱推命',
    compatibility: '相性占い',
    idol: 'K-アイドル相性',
    packages: 'クレジットパッケージ',
    tryIt: 'お試し',
    popular: '人気 ✦',
    powerUser: 'ヘビーユーザー',
    getStarted: '始める',
    secure: 'Paddleによる安全な決済 · 主要カード対応',
    faq: 'よくある質問',
    q1: 'クレジットに有効期限はありますか？',
    a1: 'いいえ、クレジットに有効期限はありません。いつでもご利用いただけます。',
    q2: '対応している支払い方法は？',
    a2: 'Paddleを通じて主要なクレジットカード・デビットカードに対応しています。',
    q3: '返金はできますか？',
    a3: '未使用のクレジットは購入後14日以内であれば返金いたします。',
    refundLink: '返金ポリシーを見る →',
    ctaTitle: '今すぐ始めましょう',
    ctaText: '無料登録してクレジットを追加し、運命を占ってみましょう。',
    ctaBtn: '無料で始める',
  },
  Thai: {
    back: '← กลับหน้าหลัก',
    title: 'ราคา',
    subtitle: 'ไม่มีสมาชิกรายเดือน · จ่ายตามที่ใช้จริง',
    howItWorks: 'วิธีใช้เครดิต',
    readingType: 'ประเภทการดู',
    creditCost: 'เครดิต',
    personal: 'ดูดวงส่วนตัว',
    compatibility: 'ดูความเข้ากัน',
    idol: 'จับคู่ K-ดาว',
    packages: 'แพ็กเกจเครดิต',
    tryIt: 'ทดลองใช้',
    popular: 'ยอดนิยม ✦',
    powerUser: 'ผู้ใช้หนัก',
    getStarted: 'เริ่มต้น',
    secure: 'ชำระเงินปลอดภัยผ่าน Paddle · รับบัตรหลักทุกประเภท',
    faq: 'คำถามที่พบบ่อย',
    q1: 'เครดิตหมดอายุหรือไม่?',
    a1: 'ไม่มีวันหมดอายุ สามารถใช้ได้ตลอดเวลา',
    q2: 'รับชำระผ่านช่องทางไหนบ้าง?',
    a2: 'รับบัตรเครดิตและบัตรเดบิตหลักทุกประเภทผ่าน Paddle',
    q3: 'ขอคืนเงินได้หรือไม่?',
    a3: 'เครดิตที่ยังไม่ได้ใช้สามารถขอคืนเงินได้ภายใน 14 วันหลังซื้อ',
    refundLink: 'ดูนโยบายการคืนเงิน →',
    ctaTitle: 'เริ่มต้นเดินทาง',
    ctaText: 'สมัครฟรีและเติมเครดิตเพื่อค้นพบชะตาชีวิตของคุณ',
    ctaBtn: 'เริ่มใช้งานฟรี',
  },
  Spanish: {
    back: '← Volver al inicio',
    title: 'Precios',
    subtitle: 'Sin suscripción · Paga solo lo que necesitas',
    howItWorks: 'Cómo funcionan los créditos',
    readingType: 'Tipo de lectura',
    creditCost: 'Créditos',
    personal: 'Lectura personal',
    compatibility: 'Compatibilidad',
    idol: 'Compatibilidad K-Celeb',
    packages: 'Paquetes de créditos',
    tryIt: 'Para probar',
    popular: 'Más popular ✦',
    powerUser: 'Usuario avanzado',
    getStarted: 'Comenzar',
    secure: 'Pagos seguros por Paddle · Se aceptan las principales tarjetas',
    faq: 'Preguntas frecuentes',
    q1: '¿Los créditos caducan?',
    a1: 'No, los créditos no caducan nunca. Úsalos cuando quieras.',
    q2: '¿Qué métodos de pago se aceptan?',
    a2: 'Se aceptan las principales tarjetas de crédito y débito a través de Paddle.',
    q3: '¿Puedo obtener un reembolso?',
    a3: 'Los créditos no utilizados pueden reembolsarse en los 14 días posteriores a la compra.',
    refundLink: 'Ver política de reembolso →',
    ctaTitle: 'Comienza tu viaje',
    ctaText: 'Regístrate gratis y añade créditos para descubrir tu destino.',
    ctaBtn: 'Comenzar gratis',
  },
  Portuguese: {
    back: '← Voltar ao início',
    title: 'Preços',
    subtitle: 'Sem assinatura · Pague apenas o que precisar',
    howItWorks: 'Como os créditos funcionam',
    readingType: 'Tipo de leitura',
    creditCost: 'Créditos',
    personal: 'Leitura pessoal',
    compatibility: 'Compatibilidade',
    idol: 'Match com K-Celeb',
    packages: 'Pacotes de créditos',
    tryIt: 'Para experimentar',
    popular: 'Mais popular ✦',
    powerUser: 'Usuário avançado',
    getStarted: 'Começar',
    secure: 'Pagamentos seguros pelo Paddle · Principais cartões aceitos',
    faq: 'Perguntas frequentes',
    q1: 'Os créditos expiram?',
    a1: 'Não, os créditos nunca expiram. Use quando quiser.',
    q2: 'Quais métodos de pagamento são aceitos?',
    a2: 'Os principais cartões de crédito e débito são aceitos através do Paddle.',
    q3: 'Posso obter reembolso?',
    a3: 'Créditos não utilizados podem ser reembolsados em até 14 dias após a compra.',
    refundLink: 'Ver política de reembolso →',
    ctaTitle: 'Comece sua jornada',
    ctaText: 'Cadastre-se gratuitamente e adicione créditos para descobrir seu destino.',
    ctaBtn: 'Começar grátis',
  },
  Chinese: {
    back: '← 返回首页',
    title: '价格说明',
    subtitle: '无需订阅 · 按需购买',
    howItWorks: '积分使用方法',
    readingType: '占卜类型',
    creditCost: '积分',
    personal: '个人四柱命理',
    compatibility: '合八字',
    idol: 'K-明星配对',
    packages: '积分套餐',
    tryIt: '体验装',
    popular: '最受欢迎 ✦',
    powerUser: '重度用户',
    getStarted: '立即开始',
    secure: '由 Paddle 提供安全支付 · 支持主流信用卡',
    faq: '常见问题',
    q1: '积分会过期吗？',
    a1: '不会，积分永久有效，随时可用。',
    q2: '支持哪些支付方式？',
    a2: '通过 Paddle 支持所有主流信用卡和借记卡。',
    q3: '可以退款吗？',
    a3: '购买后 14 天内未使用的积分可申请退款。',
    refundLink: '查看退款政策 →',
    ctaTitle: '立即开启命运之旅',
    ctaText: '免费注册，购买积分，探索您的命运。',
    ctaBtn: '免费开始',
  },
}

const BROWSER_LANG_MAP: Record<string, Lang> = {
  ko: 'Korean', en: 'English', ja: 'Japanese',
  th: 'Thai', es: 'Spanish', pt: 'Portuguese', zh: 'Chinese',
}

const PACKAGES = [
  { credits: 5, price: '$1.99', noteKey: 'tryIt' as const, popular: false },
  { credits: 20, price: '$5.99', noteKey: 'popular' as const, popular: true },
  { credits: 50, price: '$12.99', noteKey: 'powerUser' as const, popular: false },
]

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('English')

  useEffect(() => {
    const bl = navigator.language.split('-')[0]
    setLang(BROWSER_LANG_MAP[bl] ?? 'English')
  }, [])

  const t = T[lang]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/login" className={styles.logoWrap}>
          <span className={styles.logo}>운명</span>
          <span className={styles.logoSub}>UNMYEONG</span>
        </a>
        <div className={styles.langBar}>
          {LANGS.map(l => (
            <button
              key={l.code}
              className={`${styles.langBtn} ${lang === l.code ? styles.langBtnActive : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.content}>
        <a href="/login" className={styles.backBtn}>{t.back}</a>

        <h1 className={styles.pageTitle}>{t.title}</h1>
        <p className={styles.pageSubtitle}>{t.subtitle}</p>

        {/* How credits work */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.howItWorks}</h2>
          <table className={styles.readingTable}>
            <tbody>
              <tr>
                <td>{t.personal}</td>
                <td>1 {t.creditCost}</td>
              </tr>
              <tr>
                <td>{t.compatibility}</td>
                <td>2 {t.creditCost}</td>
              </tr>
              <tr>
                <td>{t.idol}</td>
                <td>3 {t.creditCost}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Packages */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.packages}</h2>
          <div className={styles.packages}>
            {PACKAGES.map(pkg => (
              <div
                key={pkg.credits}
                className={`${styles.packageCard} ${pkg.popular ? styles.packageCardPopular : ''}`}
              >
                {pkg.popular && (
                  <span className={styles.popularBadge}>{t.popular}</span>
                )}
                <div className={styles.packageCredits}>{pkg.credits}</div>
                <div className={styles.packageLabel}>{t.creditCost}</div>
                <div className={styles.packagePrice}>{pkg.price}</div>
                <div className={styles.packageNote}>{t[pkg.noteKey]}</div>
                <a href="/login" className={styles.packageBtn}>{t.getStarted}</a>
              </div>
            ))}
          </div>
          <p className={styles.secureNote}>{t.secure}</p>
        </div>

        {/* FAQ */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.faq}</h2>
          <div className={styles.faqItem}>
            <p className={styles.faqQ}>{t.q1}</p>
            <p className={styles.faqA}>{t.a1}</p>
          </div>
          <div className={styles.faqItem}>
            <p className={styles.faqQ}>{t.q2}</p>
            <p className={styles.faqA}>{t.a2}</p>
          </div>
          <div className={styles.faqItem}>
            <p className={styles.faqQ}>{t.q3}</p>
            <p className={styles.faqA}>
              {t.a3}{' '}
              <a href="/refund" className={styles.link}>{t.refundLink}</a>
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className={styles.ctaSection}>
          <p className={styles.ctaTitle}>{t.ctaTitle}</p>
          <p className={styles.ctaText}>{t.ctaText}</p>
          <a href="/login" className={styles.ctaBtn}>{t.ctaBtn}</a>
        </div>
      </div>

      <footer className={styles.footer}>
        <a href="/terms">{lang === 'Korean' ? '서비스 약관' : lang === 'Japanese' ? '利用規約' : lang === 'Chinese' ? '服务条款' : lang === 'Thai' ? 'ข้อกำหนดการใช้งาน' : lang === 'Spanish' ? 'Términos de servicio' : lang === 'Portuguese' ? 'Termos de serviço' : 'Terms of Service'}</a>
        <a href="/privacy">{lang === 'Korean' ? '개인정보 처리방침' : lang === 'Japanese' ? 'プライバシーポリシー' : lang === 'Chinese' ? '隐私政策' : lang === 'Thai' ? 'นโยบายความเป็นส่วนตัว' : lang === 'Spanish' ? 'Política de privacidad' : lang === 'Portuguese' ? 'Política de privacidade' : 'Privacy Policy'}</a>
        <a href="/refund">{lang === 'Korean' ? '환불 정책' : lang === 'Japanese' ? '返金ポリシー' : lang === 'Chinese' ? '退款政策' : lang === 'Thai' ? 'นโยบายการคืนเงิน' : lang === 'Spanish' ? 'Política de reembolso' : lang === 'Portuguese' ? 'Política de reembolso' : 'Refund Policy'}</a>
        <span>© 2025 Unmyeong</span>
      </footer>
    </div>
  )
}
