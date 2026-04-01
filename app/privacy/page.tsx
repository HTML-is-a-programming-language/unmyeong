'use client'

import { useState, useEffect } from 'react'
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

const BROWSER_LANG_MAP: Record<string, Lang> = {
  ko: 'Korean', en: 'English', ja: 'Japanese',
  th: 'Thai', es: 'Spanish', pt: 'Portuguese', zh: 'Chinese',
}

type Section = { title: string; body: string[] }

type PrivacyContent = {
  back: string
  title: string
  updated: string
  intro: string
  sections: Section[]
}

const T: Record<Lang, PrivacyContent> = {
  Korean: {
    back: '← 홈으로',
    title: '개인정보 처리방침',
    updated: '최종 수정: 2025년 1월 1일',
    intro: '운명(Unmyeong)은 이용자의 개인정보를 소중히 여기며, 본 방침을 통해 수집·이용·보호 방법을 투명하게 안내합니다.',
    sections: [
      {
        title: '1. 수집하는 정보',
        body: [
          '계정 정보: Google OAuth 로그인 시 이름, 이메일 주소, 프로필 사진(Google에서 제공).',
          '사용 정보: 입력한 생년월일, 닉네임, 성별, 태어난 시각 및 지역(선택 사항), 운세 종류 선택 내역.',
          '결제 정보: 크레딧 구매 내역. 카드 정보는 결제 대행사 Paddle이 직접 처리하며, 당사는 카드 정보를 저장하지 않습니다.',
          '기술 정보: 서비스 개선을 위한 기본적인 접속 로그 및 오류 정보.',
        ],
      },
      {
        title: '2. 정보 이용 목적',
        body: [
          '서비스 제공: 사주 분석 결과 생성, AI 이미지 생성, 공유 카드 생성.',
          '계정 관리: 로그인 인증, 크레딧 잔액 관리.',
          '서비스 개선: 오류 수정 및 기능 개선.',
          '마케팅 목적으로 이용자 정보를 제3자에게 판매하지 않습니다.',
        ],
      },
      {
        title: '3. 제3자 서비스',
        body: [
          'Supabase: 사용자 인증 및 데이터베이스 관리. (supabase.com)',
          'Paddle: 결제 처리. 결제 정보는 Paddle의 개인정보 처리방침에 따라 관리됩니다. (paddle.com)',
          'Google: OAuth 로그인 제공. (google.com)',
          'Anthropic (Claude AI): 사주 분석 텍스트 생성. 입력 데이터는 분석 목적으로만 전송됩니다.',
          'OpenAI (DALL-E): AI 이미지 생성. (선택 사항)',
        ],
      },
      {
        title: '4. 데이터 보관',
        body: [
          '계정 삭제를 요청하실 경우 관련 개인정보는 법적 보관 의무가 없는 한 30일 이내에 삭제됩니다.',
          '사주 분석 결과는 계정에 연결되어 보관되며, 계정 삭제 시 함께 삭제됩니다.',
        ],
      },
      {
        title: '5. 이용자의 권리',
        body: [
          '이용자는 언제든지 자신의 개인정보에 대한 열람, 수정, 삭제를 요청할 수 있습니다.',
          '계정 삭제는 서비스 내 기능 또는 공식 채널을 통해 요청하실 수 있습니다.',
          '개인정보 관련 문의는 서비스 내 피드백 기능을 이용해 주세요.',
        ],
      },
      {
        title: '6. 쿠키 및 추적',
        body: [
          '서비스는 로그인 세션 유지를 위해 필수 쿠키를 사용합니다.',
          '광고 목적의 추적 쿠키는 사용하지 않습니다.',
        ],
      },
      {
        title: '7. 방침 변경',
        body: [
          '본 방침은 변경될 수 있으며, 중요한 변경 사항은 서비스 내 공지 또는 이메일로 안내됩니다.',
        ],
      },
    ],
  },

  English: {
    back: '← Back to Home',
    title: 'Privacy Policy',
    updated: 'Last updated: January 1, 2025',
    intro: 'Unmyeong is committed to protecting your privacy. This policy explains what information we collect, how we use it, and how we keep it safe.',
    sections: [
      {
        title: '1. Information We Collect',
        body: [
          'Account information: Your name, email address, and profile photo provided via Google OAuth login.',
          'Reading information: Birth date, nickname, gender, birth time and place (optional), and reading type selections you provide.',
          'Payment information: Credit purchase history. Card details are handled directly by Paddle — we never store your payment card information.',
          'Technical data: Basic access logs and error information for service improvement.',
        ],
      },
      {
        title: '2. How We Use Your Information',
        body: [
          'To provide the service: generating Saju readings, AI imagery, and share cards.',
          'Account management: authentication and credit balance tracking.',
          'Service improvement: fixing bugs and improving features.',
          'We do not sell your personal information to third parties for marketing purposes.',
        ],
      },
      {
        title: '3. Third-Party Services',
        body: [
          'Supabase: User authentication and database. (supabase.com)',
          'Paddle: Payment processing. Payment data is governed by Paddle\'s privacy policy. (paddle.com)',
          'Google: OAuth login provider. (google.com)',
          'Anthropic (Claude AI): Saju reading text generation. Input data is sent solely for analysis.',
          'OpenAI (DALL-E): Optional AI image generation.',
        ],
      },
      {
        title: '4. Data Retention',
        body: [
          'If you request account deletion, your personal data will be deleted within 30 days, unless retention is required by law.',
          'Saju reading results are stored with your account and deleted upon account deletion.',
        ],
      },
      {
        title: '5. Your Rights',
        body: [
          'You may request access to, correction of, or deletion of your personal data at any time.',
          'Account deletion can be requested through the app or via our official channels.',
          'For privacy inquiries, please use the feedback feature within the app.',
        ],
      },
      {
        title: '6. Cookies',
        body: [
          'We use essential cookies to maintain your login session.',
          'We do not use tracking or advertising cookies.',
        ],
      },
      {
        title: '7. Changes to This Policy',
        body: [
          'We may update this policy at any time. Material changes will be communicated via in-app notice or email.',
        ],
      },
    ],
  },

  Japanese: {
    back: '← ホームへ',
    title: 'プライバシーポリシー',
    updated: '最終更新：2025年1月1日',
    intro: '運命（Unmyeong）はお客様のプライバシーを大切にしています。本ポリシーでは、収集する情報、その利用方法、および保護方法についてご説明します。',
    sections: [
      {
        title: '1. 収集する情報',
        body: [
          'アカウント情報：Google OAuthログイン時に提供されるお名前、メールアドレス、プロフィール写真。',
          '鑑定情報：生年月日、ニックネーム、性別、出生時刻・場所（任意）、占い種別の選択内容。',
          '決済情報：クレジット購入履歴。カード情報はPaddleが直接処理し、当社は保存しません。',
          '技術データ：サービス改善のための基本的なアクセスログおよびエラー情報。',
        ],
      },
      {
        title: '2. 情報の利用目的',
        body: [
          'サービス提供：四柱推命鑑定、AIイメージ、シェアカードの生成。',
          'アカウント管理：認証とクレジット残高の管理。',
          'サービス改善：バグ修正と機能向上。',
          'マーケティング目的でお客様の個人情報を第三者に販売することはありません。',
        ],
      },
      {
        title: '3. 第三者サービス',
        body: [
          'Supabase：ユーザー認証とデータベース管理。(supabase.com)',
          'Paddle：決済処理。決済データはPaddleのプライバシーポリシーに従って管理されます。(paddle.com)',
          'Google：OAuthログインプロバイダー。(google.com)',
          'Anthropic（Claude AI）：四柱推命テキスト生成。入力データは分析目的のみに送信されます。',
          'OpenAI（DALL-E）：オプションのAI画像生成。',
        ],
      },
      {
        title: '4. データの保管',
        body: [
          'アカウント削除をご要望の場合、法的保管義務がない限り、30日以内に個人データを削除します。',
          '鑑定結果はアカウントに紐付けて保管され、アカウント削除時に一緒に削除されます。',
        ],
      },
      {
        title: '5. お客様の権利',
        body: [
          'いつでも個人データへのアクセス、修正、または削除を請求できます。',
          'アカウントの削除はアプリ内機能または公式チャンネルよりご依頼ください。',
          'プライバシーに関するお問い合わせはアプリ内のフィードバック機能をご利用ください。',
        ],
      },
      {
        title: '6. Cookie',
        body: [
          'ログインセッション維持のために必須Cookieを使用しています。',
          'トラッキングや広告目的のCookieは使用していません。',
        ],
      },
      {
        title: '7. ポリシーの変更',
        body: [
          '本ポリシーはいつでも更新される可能性があります。重要な変更はアプリ内通知またはメールでお知らせします。',
        ],
      },
    ],
  },

  Thai: {
    back: '← กลับหน้าหลัก',
    title: 'นโยบายความเป็นส่วนตัว',
    updated: 'อัปเดตล่าสุด: 1 มกราคม 2025',
    intro: 'Unmyeong ให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายข้อมูลที่เราเก็บรวบรวม วิธีใช้งาน และวิธีปกป้องข้อมูลนั้น',
    sections: [
      {
        title: '1. ข้อมูลที่เราเก็บรวบรวม',
        body: [
          'ข้อมูลบัญชี: ชื่อ ที่อยู่อีเมล และรูปโปรไฟล์ที่ได้รับจากการเข้าสู่ระบบ Google OAuth',
          'ข้อมูลการดูดวง: วันเกิด ชื่อเล่น เพศ เวลาและสถานที่เกิด (ไม่บังคับ) และประเภทการดูที่เลือก',
          'ข้อมูลการชำระเงิน: ประวัติการซื้อเครดิต ข้อมูลบัตรได้รับการจัดการโดย Paddle โดยตรง เราไม่เก็บข้อมูลบัตรชำระเงิน',
          'ข้อมูลทางเทคนิค: บันทึกการเข้าถึงพื้นฐานและข้อมูลข้อผิดพลาดเพื่อปรับปรุงบริการ',
        ],
      },
      {
        title: '2. วิธีที่เราใช้ข้อมูลของคุณ',
        body: [
          'เพื่อให้บริการ: สร้างผลการดูดวง Saju ภาพ AI และการ์ดแชร์',
          'การจัดการบัญชี: การยืนยันตัวตนและติดตามยอดเครดิต',
          'การปรับปรุงบริการ: แก้ไขข้อบกพร่องและพัฒนาฟีเจอร์',
          'เราไม่ขายข้อมูลส่วนบุคคลของคุณให้บุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาด',
        ],
      },
      {
        title: '3. บริการของบุคคลที่สาม',
        body: [
          'Supabase: การยืนยันตัวตนผู้ใช้และฐานข้อมูล (supabase.com)',
          'Paddle: การประมวลผลการชำระเงิน ข้อมูลการชำระเงินอยู่ภายใต้นโยบายความเป็นส่วนตัวของ Paddle (paddle.com)',
          'Google: ผู้ให้บริการเข้าสู่ระบบ OAuth (google.com)',
          'Anthropic (Claude AI): การสร้างข้อความการดูดวง Saju ข้อมูลอินพุตถูกส่งเพื่อวัตถุประสงค์การวิเคราะห์เท่านั้น',
          'OpenAI (DALL-E): การสร้างภาพ AI (ไม่บังคับ)',
        ],
      },
      {
        title: '4. การเก็บรักษาข้อมูล',
        body: [
          'หากคุณร้องขอการลบบัญชี ข้อมูลส่วนบุคคลของคุณจะถูกลบภายใน 30 วัน เว้นแต่กฎหมายกำหนดให้เก็บรักษา',
          'ผลการดูดวงถูกเก็บไว้กับบัญชีของคุณและจะถูกลบเมื่อลบบัญชี',
        ],
      },
      {
        title: '5. สิทธิ์ของคุณ',
        body: [
          'คุณสามารถร้องขอการเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณได้ตลอดเวลา',
          'การลบบัญชีสามารถร้องขอได้ผ่านแอปหรือช่องทางทางการของเรา',
          'สำหรับคำถามด้านความเป็นส่วนตัว กรุณาใช้ฟีเจอร์ feedback ในแอป',
        ],
      },
      {
        title: '6. คุกกี้',
        body: [
          'เราใช้คุกกี้ที่จำเป็นเพื่อรักษาเซสชันการเข้าสู่ระบบของคุณ',
          'เราไม่ใช้คุกกี้ติดตามหรือโฆษณา',
        ],
      },
      {
        title: '7. การเปลี่ยนแปลงนโยบาย',
        body: [
          'เราอาจอัปเดตนโยบายนี้ได้ตลอดเวลา การเปลี่ยนแปลงสำคัญจะแจ้งผ่านการแจ้งเตือนในแอปหรืออีเมล',
        ],
      },
    ],
  },

  Spanish: {
    back: '← Volver al inicio',
    title: 'Política de Privacidad',
    updated: 'Última actualización: 1 de enero de 2025',
    intro: 'Unmyeong se compromete a proteger tu privacidad. Esta política explica qué información recopilamos, cómo la usamos y cómo la protegemos.',
    sections: [
      {
        title: '1. Información que recopilamos',
        body: [
          'Información de cuenta: Tu nombre, dirección de correo electrónico y foto de perfil proporcionados a través del inicio de sesión con Google OAuth.',
          'Información de lecturas: Fecha de nacimiento, apodo, género, hora y lugar de nacimiento (opcional), y tipo de lectura seleccionado.',
          'Información de pago: Historial de compras de créditos. Los datos de tarjeta son gestionados directamente por Paddle — nunca almacenamos tu información de pago.',
          'Datos técnicos: Registros de acceso básicos e información de errores para mejorar el servicio.',
        ],
      },
      {
        title: '2. Cómo utilizamos tu información',
        body: [
          'Para proveer el servicio: generar lecturas Saju, imágenes de IA y tarjetas de compartición.',
          'Gestión de cuenta: autenticación y seguimiento del saldo de créditos.',
          'Mejora del servicio: corrección de errores y mejora de funciones.',
          'No vendemos tu información personal a terceros con fines de marketing.',
        ],
      },
      {
        title: '3. Servicios de terceros',
        body: [
          'Supabase: Autenticación de usuarios y base de datos. (supabase.com)',
          'Paddle: Procesamiento de pagos. Los datos de pago se rigen por la política de privacidad de Paddle. (paddle.com)',
          'Google: Proveedor de inicio de sesión OAuth. (google.com)',
          'Anthropic (Claude AI): Generación de texto de lectura Saju. Los datos de entrada se envían únicamente con fines de análisis.',
          'OpenAI (DALL-E): Generación opcional de imágenes de IA.',
        ],
      },
      {
        title: '4. Retención de datos',
        body: [
          'Si solicitas la eliminación de tu cuenta, tus datos personales serán eliminados en un plazo de 30 días, salvo que la ley exija su conservación.',
          'Los resultados de lecturas se almacenan vinculados a tu cuenta y se eliminan al borrar la cuenta.',
        ],
      },
      {
        title: '5. Tus derechos',
        body: [
          'Puedes solicitar el acceso, corrección o eliminación de tus datos personales en cualquier momento.',
          'La eliminación de cuenta puede solicitarse a través de la aplicación o por nuestros canales oficiales.',
          'Para consultas sobre privacidad, utiliza la función de feedback en la aplicación.',
        ],
      },
      {
        title: '6. Cookies',
        body: [
          'Usamos cookies esenciales para mantener tu sesión de inicio de sesión.',
          'No utilizamos cookies de seguimiento ni publicitarias.',
        ],
      },
      {
        title: '7. Cambios en esta política',
        body: [
          'Podemos actualizar esta política en cualquier momento. Los cambios importantes se comunicarán mediante avisos en la app o por correo electrónico.',
        ],
      },
    ],
  },

  Portuguese: {
    back: '← Voltar ao início',
    title: 'Política de Privacidade',
    updated: 'Última atualização: 1 de janeiro de 2025',
    intro: 'O Unmyeong está comprometido em proteger sua privacidade. Esta política explica quais informações coletamos, como as usamos e como as protegemos.',
    sections: [
      {
        title: '1. Informações que coletamos',
        body: [
          'Informações de conta: Seu nome, endereço de e-mail e foto de perfil fornecidos via login com Google OAuth.',
          'Informações de leitura: Data de nascimento, apelido, gênero, horário e local de nascimento (opcional) e tipo de leitura selecionado.',
          'Informações de pagamento: Histórico de compras de créditos. Os dados do cartão são gerenciados diretamente pelo Paddle — nunca armazenamos suas informações de pagamento.',
          'Dados técnicos: Logs básicos de acesso e informações de erros para melhoria do serviço.',
        ],
      },
      {
        title: '2. Como usamos suas informações',
        body: [
          'Para fornecer o serviço: gerar leituras Saju, imagens de IA e cartões de compartilhamento.',
          'Gerenciamento de conta: autenticação e acompanhamento do saldo de créditos.',
          'Melhoria do serviço: correção de bugs e melhoria de recursos.',
          'Não vendemos suas informações pessoais a terceiros para fins de marketing.',
        ],
      },
      {
        title: '3. Serviços de terceiros',
        body: [
          'Supabase: Autenticação de usuários e banco de dados. (supabase.com)',
          'Paddle: Processamento de pagamentos. Os dados de pagamento são regidos pela política de privacidade do Paddle. (paddle.com)',
          'Google: Provedor de login OAuth. (google.com)',
          'Anthropic (Claude AI): Geração de texto de leitura Saju. Os dados de entrada são enviados apenas para fins de análise.',
          'OpenAI (DALL-E): Geração opcional de imagens de IA.',
        ],
      },
      {
        title: '4. Retenção de dados',
        body: [
          'Se você solicitar a exclusão da conta, seus dados pessoais serão deletados em até 30 dias, salvo obrigação legal de retenção.',
          'Os resultados de leituras são armazenados vinculados à sua conta e excluídos ao deletar a conta.',
        ],
      },
      {
        title: '5. Seus direitos',
        body: [
          'Você pode solicitar acesso, correção ou exclusão de seus dados pessoais a qualquer momento.',
          'A exclusão de conta pode ser solicitada pelo aplicativo ou pelos nossos canais oficiais.',
          'Para consultas sobre privacidade, use o recurso de feedback no aplicativo.',
        ],
      },
      {
        title: '6. Cookies',
        body: [
          'Usamos cookies essenciais para manter sua sessão de login.',
          'Não usamos cookies de rastreamento ou publicidade.',
        ],
      },
      {
        title: '7. Alterações nesta política',
        body: [
          'Podemos atualizar esta política a qualquer momento. Alterações relevantes serão comunicadas por avisos no app ou por e-mail.',
        ],
      },
    ],
  },

  Chinese: {
    back: '← 返回首页',
    title: '隐私政策',
    updated: '最后更新：2025年1月1日',
    intro: 'Unmyeong 致力于保护您的隐私。本政策说明我们收集哪些信息、如何使用以及如何保护这些信息。',
    sections: [
      {
        title: '1. 我们收集的信息',
        body: [
          '账户信息：通过 Google OAuth 登录时提供的姓名、电子邮件地址和头像。',
          '解读信息：您提供的出生日期、昵称、性别、出生时间和地点（可选）以及所选解读类型。',
          '支付信息：积分购买记录。卡片信息由 Paddle 直接处理——我们从不存储您的支付卡信息。',
          '技术数据：用于改进服务的基本访问日志和错误信息。',
        ],
      },
      {
        title: '2. 我们如何使用您的信息',
        body: [
          '提供服务：生成四柱八字解读、AI 图像和分享卡。',
          '账户管理：身份验证和积分余额跟踪。',
          '服务改进：修复错误和改进功能。',
          '我们不会将您的个人信息出售给第三方用于营销目的。',
        ],
      },
      {
        title: '3. 第三方服务',
        body: [
          'Supabase：用户身份验证和数据库。(supabase.com)',
          'Paddle：支付处理。支付数据受 Paddle 隐私政策约束。(paddle.com)',
          'Google：OAuth 登录提供商。(google.com)',
          'Anthropic（Claude AI）：四柱八字解读文本生成。输入数据仅用于分析目的。',
          'OpenAI（DALL-E）：可选的 AI 图像生成。',
        ],
      },
      {
        title: '4. 数据保留',
        body: [
          '如您请求删除账户，除法律要求保留外，您的个人数据将在 30 天内删除。',
          '解读结果与您的账户关联存储，账户删除时一并删除。',
        ],
      },
      {
        title: '5. 您的权利',
        body: [
          '您可以随时请求访问、更正或删除您的个人数据。',
          '账户删除可通过应用内功能或我们的官方渠道申请。',
          '如有隐私相关问题，请使用应用内的反馈功能。',
        ],
      },
      {
        title: '6. Cookie',
        body: [
          '我们使用必要的 Cookie 来维护您的登录会话。',
          '我们不使用跟踪或广告 Cookie。',
        ],
      },
      {
        title: '7. 政策变更',
        body: [
          '我们可能随时更新本政策。重大变更将通过应用内通知或电子邮件告知。',
        ],
      },
    ],
  },
}

export default function PrivacyPage() {
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
        <p className={styles.lastUpdated}>{t.updated}</p>
        <p className={styles.text}>{t.intro}</p>

        {t.sections.map(section => (
          <div key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {section.body.map((para, i) => (
              <p key={i} className={styles.text}>{para}</p>
            ))}
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <a href="/pricing">{lang === 'Korean' ? '가격 안내' : lang === 'Japanese' ? '料金案内' : lang === 'Chinese' ? '价格说明' : lang === 'Thai' ? 'ราคา' : lang === 'Spanish' ? 'Precios' : lang === 'Portuguese' ? 'Preços' : 'Pricing'}</a>
        <a href="/terms">{lang === 'Korean' ? '서비스 약관' : lang === 'Japanese' ? '利用規約' : lang === 'Chinese' ? '服务条款' : lang === 'Thai' ? 'ข้อกำหนดการใช้งาน' : lang === 'Spanish' ? 'Términos' : lang === 'Portuguese' ? 'Termos' : 'Terms of Service'}</a>
        <a href="/refund">{lang === 'Korean' ? '환불 정책' : lang === 'Japanese' ? '返金ポリシー' : lang === 'Chinese' ? '退款政策' : lang === 'Thai' ? 'นโยบายการคืนเงิน' : lang === 'Spanish' ? 'Reembolso' : lang === 'Portuguese' ? 'Reembolso' : 'Refund Policy'}</a>
        <span>© 2025 Unmyeong</span>
      </footer>
    </div>
  )
}
