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

type RefundContent = {
  back: string
  title: string
  updated: string
  intro: string
  sections: Section[]
}

const T: Record<Lang, RefundContent> = {
  Korean: {
    back: '← 홈으로',
    title: '환불 정책',
    updated: '최종 수정: 2025년 1월 1일',
    intro: '운명(Unmyeong)의 환불 정책을 안내합니다. 결제 전 반드시 본 정책을 확인해 주세요.',
    sections: [
      {
        title: '1. 크레딧 구매에 대하여',
        body: [
          '크레딧은 사주 운세 읽기를 이용하기 위한 선불 결제 수단입니다.',
          '크레딧은 만료되지 않으며 계정 간 양도가 불가합니다.',
          '구매한 크레딧은 결제 후 즉시 계정에 반영됩니다.',
        ],
      },
      {
        title: '2. 환불 자격',
        body: [
          '미사용 크레딧에 한해 구매일로부터 14일 이내에 환불을 신청하실 수 있습니다.',
          '이미 사용된 크레딧은 환불 대상에서 제외됩니다.',
          '예를 들어, 20 크레딧을 구매하여 5 크레딧을 사용하셨다면, 남은 15 크레딧에 대한 비례 환불을 요청하실 수 있습니다.',
          '다음의 경우 환불이 거절될 수 있습니다: 구매 후 14일이 경과한 경우, 약관 위반이 확인된 경우, 동일한 구매 건에 대해 이전에 환불이 처리된 경우.',
        ],
      },
      {
        title: '3. 환불 신청 방법',
        body: [
          '환불을 원하시면 앱 내 피드백 기능 또는 공식 채널을 통해 다음 정보와 함께 문의해 주세요:',
          '· 가입 이메일 주소',
          '· 구매 날짜 및 패키지명',
          '· 환불 사유',
          '영업일 기준 3~5일 이내에 검토 후 답변드립니다.',
        ],
      },
      {
        title: '4. 환불 처리',
        body: [
          '환불 승인 시 결제에 사용한 원래 수단으로 환불됩니다.',
          '환불 처리 후 계정에서 해당 크레딧이 차감됩니다.',
          '결제 대행사(Paddle) 및 카드사 정책에 따라 실제 환불 반영까지 5~10 영업일이 소요될 수 있습니다.',
        ],
      },
      {
        title: '5. 문의',
        body: [
          '환불 정책 관련 문의사항은 앱 내 피드백 기능 또는 공식 채널을 이용해 주세요.',
        ],
      },
    ],
  },

  English: {
    back: '← Back to Home',
    title: 'Refund Policy',
    updated: 'Last updated: January 1, 2025',
    intro: 'Please read our Refund Policy before making a purchase. We want to make sure you are fully informed before buying credits.',
    sections: [
      {
        title: '1. About Credit Purchases',
        body: [
          'Credits are a prepaid currency used to access Saju fate readings on Unmyeong.',
          'Credits do not expire and are non-transferable between accounts.',
          'Purchased credits are applied to your account immediately upon successful payment.',
        ],
      },
      {
        title: '2. Refund Eligibility',
        body: [
          'You may request a refund for unused credits within 14 days of purchase.',
          'Credits that have already been used to generate readings are non-refundable.',
          'For example, if you purchased 20 credits and used 5, you may request a proportional refund for the remaining 15 credits.',
          'Refunds may be denied if: the 14-day window has passed, a Terms of Service violation is detected, or a refund for the same purchase has already been processed.',
        ],
      },
      {
        title: '3. How to Request a Refund',
        body: [
          'To request a refund, please contact us through the feedback feature in the app or via our official channels with the following information:',
          '· Your account email address',
          '· Purchase date and package name',
          '· Reason for refund',
          'We will review your request and respond within 3–5 business days.',
        ],
      },
      {
        title: '4. Refund Processing',
        body: [
          'Approved refunds will be issued to the original payment method used at purchase.',
          'The refunded credits will be deducted from your account upon approval.',
          'Depending on your bank and Paddle\'s processing timeline, refunds may take 5–10 business days to appear on your statement.',
        ],
      },
      {
        title: '5. Contact',
        body: [
          'For questions about this policy, please reach us through the in-app feedback feature or our official channels.',
        ],
      },
    ],
  },

  Japanese: {
    back: '← ホームへ',
    title: '返金ポリシー',
    updated: '最終更新：2025年1月1日',
    intro: 'ご購入前に、返金ポリシーをご確認ください。クレジットご購入に際して、十分にご理解いただくことを目的としています。',
    sections: [
      {
        title: '1. クレジット購入について',
        body: [
          'クレジットは、運命（Unmyeong）の四柱推命鑑定を利用するための前払い通貨です。',
          'クレジットに有効期限はなく、アカウント間の譲渡はできません。',
          'ご購入後、クレジットは即座にアカウントに反映されます。',
        ],
      },
      {
        title: '2. 返金の対象',
        body: [
          '未使用のクレジットに限り、購入日から14日以内に返金をご請求いただけます。',
          '既に使用されたクレジットは返金対象外です。',
          '例えば、20クレジットを購入して5クレジットを使用した場合、残りの15クレジット分の比例返金をご請求いただけます。',
          '次の場合、返金が却下される場合があります：購入から14日が経過した場合、利用規約違反が確認された場合、同一購入に対する返金がすでに処理された場合。',
        ],
      },
      {
        title: '3. 返金の申請方法',
        body: [
          '返金をご希望の場合は、アプリ内のフィードバック機能または公式チャンネルより、以下の情報をお添えの上ご連絡ください：',
          '· アカウントのメールアドレス',
          '· 購入日とパッケージ名',
          '· 返金理由',
          '3〜5営業日以内に確認の上、ご返信いたします。',
        ],
      },
      {
        title: '4. 返金処理',
        body: [
          '返金が承認された場合、ご購入時にお使いいただいた元の支払い方法に返金されます。',
          '返金承認後、該当クレジットはアカウントから差し引かれます。',
          'Paddleおよびカード会社の処理スケジュールにより、明細への反映まで5〜10営業日かかる場合があります。',
        ],
      },
      {
        title: '5. お問い合わせ',
        body: [
          '本ポリシーに関するご質問は、アプリ内のフィードバック機能または公式チャンネルよりお問い合わせください。',
        ],
      },
    ],
  },

  Thai: {
    back: '← กลับหน้าหลัก',
    title: 'นโยบายการคืนเงิน',
    updated: 'อัปเดตล่าสุด: 1 มกราคม 2025',
    intro: 'กรุณาอ่านนโยบายการคืนเงินก่อนทำการซื้อ เราต้องการให้คุณทราบข้อมูลครบถ้วนก่อนซื้อเครดิต',
    sections: [
      {
        title: '1. เกี่ยวกับการซื้อเครดิต',
        body: [
          'เครดิตเป็นสกุลเงินชำระล่วงหน้าสำหรับใช้บริการดูดวง Saju บน Unmyeong',
          'เครดิตไม่มีวันหมดอายุและไม่สามารถโอนระหว่างบัญชีได้',
          'เครดิตที่ซื้อจะเข้าบัญชีทันทีหลังชำระเงินสำเร็จ',
        ],
      },
      {
        title: '2. สิทธิ์ในการขอคืนเงิน',
        body: [
          'คุณสามารถขอคืนเงินสำหรับเครดิตที่ยังไม่ได้ใช้ภายใน 14 วันหลังซื้อ',
          'เครดิตที่ใช้ไปแล้วไม่สามารถขอคืนเงินได้',
          'ตัวอย่างเช่น หากซื้อ 20 เครดิตและใช้ไป 5 เครดิต คุณสามารถขอคืนเงินตามสัดส่วนสำหรับ 15 เครดิตที่เหลือ',
          'การขอคืนเงินอาจถูกปฏิเสธหาก: เกิน 14 วันหลังซื้อ ตรวจพบการละเมิดข้อกำหนด หรือมีการคืนเงินสำหรับการซื้อเดียวกันแล้ว',
        ],
      },
      {
        title: '3. วิธีขอคืนเงิน',
        body: [
          'หากต้องการขอคืนเงิน กรุณาติดต่อเราผ่านฟีเจอร์ feedback ในแอปหรือช่องทางทางการพร้อมข้อมูลต่อไปนี้:',
          '· อีเมลบัญชีของคุณ',
          '· วันที่ซื้อและชื่อแพ็กเกจ',
          '· เหตุผลในการขอคืนเงิน',
          'เราจะตรวจสอบคำร้องและตอบกลับภายใน 3-5 วันทำการ',
        ],
      },
      {
        title: '4. การประมวลผลการคืนเงิน',
        body: [
          'การคืนเงินที่ได้รับอนุมัติจะโอนกลับไปยังวิธีการชำระเงินเดิมที่ใช้ซื้อ',
          'เครดิตที่คืนเงินจะถูกหักออกจากบัญชีของคุณเมื่อได้รับอนุมัติ',
          'ขึ้นอยู่กับธนาคารและกำหนดการประมวลผลของ Paddle การคืนเงินอาจใช้เวลา 5-10 วันทำการ',
        ],
      },
      {
        title: '5. ติดต่อเรา',
        body: [
          'หากมีคำถามเกี่ยวกับนโยบายนี้ กรุณาติดต่อเราผ่านฟีเจอร์ feedback ในแอปหรือช่องทางทางการของเรา',
        ],
      },
    ],
  },

  Spanish: {
    back: '← Volver al inicio',
    title: 'Política de Reembolso',
    updated: 'Última actualización: 1 de enero de 2025',
    intro: 'Por favor, lee nuestra Política de Reembolso antes de realizar una compra. Queremos que estés completamente informado antes de comprar créditos.',
    sections: [
      {
        title: '1. Sobre la compra de créditos',
        body: [
          'Los créditos son una moneda de prepago utilizada para acceder a las lecturas de destino Saju en Unmyeong.',
          'Los créditos no caducan y no son transferibles entre cuentas.',
          'Los créditos comprados se aplican a tu cuenta inmediatamente tras el pago exitoso.',
        ],
      },
      {
        title: '2. Elegibilidad para reembolso',
        body: [
          'Puedes solicitar el reembolso de créditos no utilizados dentro de los 14 días posteriores a la compra.',
          'Los créditos ya utilizados para generar lecturas no son reembolsables.',
          'Por ejemplo, si compraste 20 créditos y usaste 5, puedes solicitar un reembolso proporcional de los 15 restantes.',
          'Los reembolsos pueden denegarse si: han pasado los 14 días, se detecta una violación de los Términos de servicio, o ya se procesó un reembolso para la misma compra.',
        ],
      },
      {
        title: '3. Cómo solicitar un reembolso',
        body: [
          'Para solicitar un reembolso, contáctanos a través de la función de feedback en la app o por nuestros canales oficiales con la siguiente información:',
          '· Correo electrónico de tu cuenta',
          '· Fecha de compra y nombre del paquete',
          '· Motivo del reembolso',
          'Revisaremos tu solicitud y responderemos en un plazo de 3 a 5 días hábiles.',
        ],
      },
      {
        title: '4. Procesamiento del reembolso',
        body: [
          'Los reembolsos aprobados se emitirán al método de pago original utilizado en la compra.',
          'Los créditos reembolsados serán deducidos de tu cuenta tras la aprobación.',
          'Dependiendo de tu banco y del calendario de procesamiento de Paddle, los reembolsos pueden tardar entre 5 y 10 días hábiles.',
        ],
      },
      {
        title: '5. Contacto',
        body: [
          'Para preguntas sobre esta política, contáctanos a través de la función de feedback en la app o de nuestros canales oficiales.',
        ],
      },
    ],
  },

  Portuguese: {
    back: '← Voltar ao início',
    title: 'Política de Reembolso',
    updated: 'Última atualização: 1 de janeiro de 2025',
    intro: 'Por favor, leia nossa Política de Reembolso antes de realizar uma compra. Queremos que você esteja totalmente informado antes de comprar créditos.',
    sections: [
      {
        title: '1. Sobre a compra de créditos',
        body: [
          'Créditos são uma moeda pré-paga usada para acessar as leituras de destino Saju no Unmyeong.',
          'Os créditos não expiram e não são transferíveis entre contas.',
          'Os créditos comprados são aplicados à sua conta imediatamente após o pagamento bem-sucedido.',
        ],
      },
      {
        title: '2. Elegibilidade para reembolso',
        body: [
          'Você pode solicitar reembolso de créditos não utilizados dentro de 14 dias após a compra.',
          'Créditos já utilizados para gerar leituras não são reembolsáveis.',
          'Por exemplo, se você comprou 20 créditos e usou 5, pode solicitar reembolso proporcional pelos 15 restantes.',
          'Os reembolsos podem ser negados se: o prazo de 14 dias expirou, uma violação dos Termos de Serviço foi detectada, ou um reembolso para a mesma compra já foi processado.',
        ],
      },
      {
        title: '3. Como solicitar reembolso',
        body: [
          'Para solicitar reembolso, entre em contato pelo recurso de feedback no app ou pelos nossos canais oficiais com as seguintes informações:',
          '· E-mail da sua conta',
          '· Data da compra e nome do pacote',
          '· Motivo do reembolso',
          'Analisaremos sua solicitação e responderemos em até 3–5 dias úteis.',
        ],
      },
      {
        title: '4. Processamento do reembolso',
        body: [
          'Reembolsos aprovados serão emitidos para o método de pagamento original usado na compra.',
          'Os créditos reembolsados serão deduzidos da sua conta após a aprovação.',
          'Dependendo do seu banco e do prazo de processamento do Paddle, os reembolsos podem levar de 5 a 10 dias úteis para aparecer no extrato.',
        ],
      },
      {
        title: '5. Contato',
        body: [
          'Para dúvidas sobre esta política, entre em contato pelo recurso de feedback no app ou pelos nossos canais oficiais.',
        ],
      },
    ],
  },

  Chinese: {
    back: '← 返回首页',
    title: '退款政策',
    updated: '最后更新：2025年1月1日',
    intro: '请在购买前阅读我们的退款政策。我们希望您在购买积分前充分了解相关信息。',
    sections: [
      {
        title: '1. 关于积分购买',
        body: [
          '积分是用于访问 Unmyeong 四柱八字命运解读服务的预付货币。',
          '积分永不过期，不可在账户间转让。',
          '购买的积分在成功付款后立即存入您的账户。',
        ],
      },
      {
        title: '2. 退款资格',
        body: [
          '您可以在购买后 14 天内申请未使用积分的退款。',
          '已用于生成解读的积分不予退款。',
          '例如，如果您购买了 20 个积分并使用了 5 个，您可以申请剩余 15 个积分的按比例退款。',
          '以下情况可能拒绝退款：已超过 14 天期限、检测到违反服务条款、同一购买的退款已被处理。',
        ],
      },
      {
        title: '3. 如何申请退款',
        body: [
          '如需申请退款，请通过应用内反馈功能或我们的官方渠道联系我们，并提供以下信息：',
          '· 您的账户电子邮件地址',
          '· 购买日期和套餐名称',
          '· 退款原因',
          '我们将在 3-5 个工作日内审核您的申请并回复。',
        ],
      },
      {
        title: '4. 退款处理',
        body: [
          '批准的退款将退回购买时使用的原始付款方式。',
          '退款批准后，相应积分将从您的账户中扣除。',
          '根据您的银行和 Paddle 的处理时间，退款可能需要 5-10 个工作日才能显示在账单中。',
        ],
      },
      {
        title: '5. 联系方式',
        body: [
          '如有关于本政策的问题，请通过应用内反馈功能或我们的官方渠道联系我们。',
        ],
      },
    ],
  },
}

export default function RefundPage() {
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
        <a href="/privacy">{lang === 'Korean' ? '개인정보 처리방침' : lang === 'Japanese' ? 'プライバシーポリシー' : lang === 'Chinese' ? '隐私政策' : lang === 'Thai' ? 'นโยบายความเป็นส่วนตัว' : lang === 'Spanish' ? 'Privacidad' : lang === 'Portuguese' ? 'Privacidade' : 'Privacy Policy'}</a>
        <span>© 2025 Unmyeong</span>
      </footer>
    </div>
  )
}
