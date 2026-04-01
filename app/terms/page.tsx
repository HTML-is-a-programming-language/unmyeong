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

type TermsContent = {
  back: string
  title: string
  updated: string
  intro: string
  sections: Section[]
}

const T: Record<Lang, TermsContent> = {
  Korean: {
    back: '← 홈으로',
    title: '서비스 약관',
    updated: '최종 수정: 2025년 1월 1일',
    intro: '운명(Unmyeong) 서비스를 이용하시기 전에 본 약관을 주의 깊게 읽어주세요. 본 서비스를 이용함으로써 이 약관에 동의하는 것으로 간주됩니다.',
    sections: [
      {
        title: '1. 서비스 개요',
        body: [
          '운명(Unmyeong)은 한국 전통 사주팔자(四柱八字) 기반의 AI 운세 서비스를 제공합니다.',
          '서비스는 Google 계정 로그인을 통해 이용할 수 있으며, 사주 분석 결과는 참고용으로만 제공됩니다. 실제 의학적, 법적, 재정적 조언을 대체하지 않습니다.',
        ],
      },
      {
        title: '2. 계정 및 이용 자격',
        body: [
          '본 서비스는 만 13세 이상 사용자를 대상으로 합니다.',
          '계정의 보안은 이용자 본인이 책임지며, 제3자와 계정을 공유해서는 안 됩니다.',
          '허위 정보를 사용한 계정 생성, 자동화 프로그램(봇)을 이용한 서비스 남용, 다른 이용자에게 해를 끼치는 행위는 금지됩니다.',
        ],
      },
      {
        title: '3. 크레딧 및 결제',
        body: [
          '서비스 이용을 위해 크레딧을 구매해야 합니다. 결제는 Paddle을 통해 안전하게 처리됩니다.',
          '크레딧은 만료되지 않으며, 구매한 크레딧은 환불 정책에 따라 처리됩니다.',
          '결제 오류, 사기 등 비정상적인 거래가 확인된 경우 계정 이용이 제한될 수 있습니다.',
        ],
      },
      {
        title: '4. 지식재산권',
        body: [
          '본 서비스의 모든 콘텐츠(로고, 텍스트, 디자인, AI 생성 이미지 등)는 운명의 지식재산입니다.',
          'AI가 생성한 개인 사주 결과물은 이용자가 개인적 용도로 사용하고 공유할 수 있습니다.',
          '운명의 사전 서면 동의 없이 서비스 콘텐츠를 상업적으로 이용하는 것은 금지됩니다.',
        ],
      },
      {
        title: '5. 면책 조항',
        body: [
          '사주 분석 결과는 오락 및 자기 성찰 목적으로 제공되며, 미래를 정확히 예측하지 않습니다.',
          '운명은 서비스 이용으로 인한 직간접적 손해에 대해 법이 허용하는 최대한도 내에서 책임을 제한합니다.',
          '서비스는 "있는 그대로" 제공되며, 특정 목적에의 적합성을 보장하지 않습니다.',
        ],
      },
      {
        title: '6. 약관 변경',
        body: [
          '운명은 언제든지 본 약관을 변경할 수 있으며, 중요한 변경 사항은 서비스 내 공지 또는 이메일을 통해 안내합니다.',
          '변경 후 서비스 계속 이용 시 변경된 약관에 동의한 것으로 간주됩니다.',
        ],
      },
      {
        title: '7. 문의',
        body: [
          '약관 관련 문의사항은 서비스 내 피드백 기능 또는 공식 채널을 통해 연락해 주세요.',
        ],
      },
    ],
  },

  English: {
    back: '← Back to Home',
    title: 'Terms of Service',
    updated: 'Last updated: January 1, 2025',
    intro: 'Please read these Terms of Service carefully before using Unmyeong. By accessing or using our service, you agree to be bound by these terms.',
    sections: [
      {
        title: '1. Description of Service',
        body: [
          'Unmyeong provides an AI-powered Korean Saju (四柱八字) fate reading service. Readings are generated using artificial intelligence and are provided for entertainment and self-reflection purposes only.',
          'Our service is accessible via Google OAuth login. Saju readings do not constitute medical, legal, financial, or professional advice of any kind.',
        ],
      },
      {
        title: '2. Eligibility and Account',
        body: [
          'You must be at least 13 years of age to use this service.',
          'You are responsible for maintaining the security of your account. Do not share your account with others.',
          'You agree not to create accounts using false information, use automated tools to abuse the service, or engage in any activity that harms other users or the platform.',
        ],
      },
      {
        title: '3. Credits and Payments',
        body: [
          'Access to readings requires purchasing credits. All payments are processed securely through Paddle, our payment processor.',
          'Credits do not expire and are non-transferable between accounts.',
          'We reserve the right to suspend accounts in cases of fraudulent transactions or payment disputes.',
        ],
      },
      {
        title: '4. Intellectual Property',
        body: [
          'All content on this service — including logos, designs, AI-generated imagery, and text — is the intellectual property of Unmyeong.',
          'AI-generated personal reading results may be shared by you for personal, non-commercial use.',
          'Commercial use of any service content without prior written permission is prohibited.',
        ],
      },
      {
        title: '5. Disclaimer of Warranties',
        body: [
          'Saju readings are provided for entertainment purposes and do not accurately predict the future. Results should not be relied upon for making important life decisions.',
          'The service is provided "as is" without warranties of any kind, express or implied.',
          'To the maximum extent permitted by law, Unmyeong limits its liability for any direct or indirect damages arising from use of the service.',
        ],
      },
      {
        title: '6. Changes to Terms',
        body: [
          'We may update these Terms at any time. Material changes will be communicated via in-app notice or email.',
          'Continued use of the service after changes constitutes acceptance of the updated Terms.',
        ],
      },
      {
        title: '7. Contact',
        body: [
          'For questions about these Terms, please reach out through the feedback feature within the app or through our official channels.',
        ],
      },
    ],
  },

  Japanese: {
    back: '← ホームへ',
    title: '利用規約',
    updated: '最終更新：2025年1月1日',
    intro: '運命（Unmyeong）をご利用の前に、この利用規約をよくお読みください。本サービスをご利用いただくことで、本規約に同意したものとみなされます。',
    sections: [
      {
        title: '1. サービスの概要',
        body: [
          '運命（Unmyeong）は、韓国伝統の四柱推命（사주팔자）に基づいたAI運勢鑑定サービスを提供します。',
          '鑑定結果はエンターテインメントおよび自己啓発を目的として提供され、医療・法律・財務・その他の専門的なアドバイスの代替とはなりません。',
        ],
      },
      {
        title: '2. 利用資格とアカウント',
        body: [
          '本サービスは13歳以上の方を対象としています。',
          'アカウントのセキュリティはご自身で管理してください。アカウントの第三者との共有は禁止です。',
          '虚偽情報によるアカウント作成、自動ツールによるサービスの濫用、他のユーザーへの損害を与える行為は禁止されています。',
        ],
      },
      {
        title: '3. クレジットと支払い',
        body: [
          '鑑定を利用するにはクレジットの購入が必要です。決済はPaddleを通じて安全に処理されます。',
          'クレジットに有効期限はなく、アカウント間の譲渡もできません。',
          '不正取引や支払いの異議申し立てがあった場合、アカウントを停止することがあります。',
        ],
      },
      {
        title: '4. 知的財産権',
        body: [
          'ロゴ・デザイン・AIが生成した画像・テキストを含む本サービスのすべてのコンテンツは、運命の知的財産です。',
          'AIが生成した個人鑑定結果は、個人的・非商業的な用途で共有できます。',
          '事前の書面による許可なく、サービスコンテンツを商業利用することは禁止されています。',
        ],
      },
      {
        title: '5. 免責事項',
        body: [
          '四柱推命の鑑定結果はエンターテインメント目的であり、将来を正確に予測するものではありません。重要な人生の決断にご利用にならないようお願いします。',
          'サービスは「現状のまま」提供され、明示・黙示を問わずいかなる保証も行いません。',
          '法律上許容される最大限において、当社はサービス利用に起因する直接・間接的な損害についての責任を制限します。',
        ],
      },
      {
        title: '6. 規約の変更',
        body: [
          '当社はいつでも本規約を変更することができます。重要な変更はアプリ内通知またはメールでお知らせします。',
          '変更後もサービスをご利用いただくことで、変更後の規約に同意したとみなされます。',
        ],
      },
      {
        title: '7. お問い合わせ',
        body: [
          '本規約に関するご質問は、アプリ内のフィードバック機能または公式チャンネルよりお問い合わせください。',
        ],
      },
    ],
  },

  Thai: {
    back: '← กลับหน้าหลัก',
    title: 'ข้อกำหนดการใช้งาน',
    updated: 'อัปเดตล่าสุด: 1 มกราคม 2025',
    intro: 'กรุณาอ่านข้อกำหนดการใช้งานเหล่านี้อย่างละเอียดก่อนใช้บริการ Unmyeong การเข้าถึงหรือใช้บริการของเราถือว่าคุณยอมรับข้อกำหนดเหล่านี้',
    sections: [
      {
        title: '1. คำอธิบายบริการ',
        body: [
          'Unmyeong ให้บริการดูดวงโชคชะตาแบบ Saju (四柱八字) ของเกาหลีด้วย AI สำหรับความบันเทิงและการพัฒนาตนเอง',
          'ผลการดูดวงไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย การเงิน หรือวิชาชีพแต่อย่างใด',
        ],
      },
      {
        title: '2. คุณสมบัติและบัญชีผู้ใช้',
        body: [
          'คุณต้องมีอายุอย่างน้อย 13 ปีจึงจะใช้บริการได้',
          'คุณต้องรับผิดชอบด้านความปลอดภัยของบัญชี ห้ามแบ่งปันบัญชีกับผู้อื่น',
          'ห้ามสร้างบัญชีด้วยข้อมูลเท็จ ใช้เครื่องมืออัตโนมัติในทางที่ผิด หรือกระทำการที่เป็นอันตรายต่อผู้ใช้อื่น',
        ],
      },
      {
        title: '3. เครดิตและการชำระเงิน',
        body: [
          'การเข้าถึงบริการดูดวงต้องซื้อเครดิต การชำระเงินดำเนินการผ่าน Paddle อย่างปลอดภัย',
          'เครดิตไม่มีวันหมดอายุและไม่สามารถโอนระหว่างบัญชีได้',
          'เราขอสงวนสิทธิ์ระงับบัญชีในกรณีธุรกรรมที่ฉ้อโกงหรือข้อพิพาทการชำระเงิน',
        ],
      },
      {
        title: '4. ทรัพย์สินทางปัญญา',
        body: [
          'เนื้อหาทั้งหมดในบริการ รวมถึงโลโก้ การออกแบบ ภาพที่สร้างโดย AI และข้อความ เป็นทรัพย์สินทางปัญญาของ Unmyeong',
          'ผลการดูดวงส่วนตัวที่ AI สร้างขึ้นสามารถแชร์ได้สำหรับการใช้งานส่วนตัวที่ไม่ใช่เชิงพาณิชย์',
          'ห้ามใช้เนื้อหาบริการเพื่อวัตถุประสงค์เชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร',
        ],
      },
      {
        title: '5. การปฏิเสธการรับประกัน',
        body: [
          'ผลการดูดวง Saju มีไว้เพื่อความบันเทิงและไม่ได้ทำนายอนาคตอย่างแม่นยำ',
          'บริการนี้ให้บริการ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ',
          'Unmyeong จำกัดความรับผิดสำหรับความเสียหายใดๆ ที่เกิดจากการใช้บริการในขอบเขตที่กฎหมายอนุญาต',
        ],
      },
      {
        title: '6. การเปลี่ยนแปลงข้อกำหนด',
        body: [
          'เราอาจอัปเดตข้อกำหนดเหล่านี้ได้ตลอดเวลา การเปลี่ยนแปลงสำคัญจะแจ้งผ่านการแจ้งเตือนในแอปหรืออีเมล',
          'การใช้บริการต่อเนื่องหลังการเปลี่ยนแปลงถือเป็นการยอมรับข้อกำหนดที่อัปเดต',
        ],
      },
      {
        title: '7. ติดต่อเรา',
        body: [
          'สำหรับคำถามเกี่ยวกับข้อกำหนดเหล่านี้ กรุณาติดต่อผ่านฟีเจอร์ feedback ในแอปหรือช่องทางทางการของเรา',
        ],
      },
    ],
  },

  Spanish: {
    back: '← Volver al inicio',
    title: 'Términos de servicio',
    updated: 'Última actualización: 1 de enero de 2025',
    intro: 'Por favor, lee estos Términos de Servicio cuidadosamente antes de usar Unmyeong. Al acceder o usar nuestro servicio, aceptas quedar vinculado por estos términos.',
    sections: [
      {
        title: '1. Descripción del servicio',
        body: [
          'Unmyeong ofrece un servicio de lectura del destino basado en el Saju coreano (四柱八字) impulsado por inteligencia artificial, con fines de entretenimiento y reflexión personal.',
          'Las lecturas no constituyen asesoramiento médico, legal, financiero ni profesional de ningún tipo.',
        ],
      },
      {
        title: '2. Elegibilidad y cuenta',
        body: [
          'Debes tener al menos 13 años para usar este servicio.',
          'Eres responsable de mantener la seguridad de tu cuenta. No compartas tu cuenta con terceros.',
          'Queda prohibido crear cuentas con información falsa, usar herramientas automatizadas para abusar del servicio o realizar actividades que perjudiquen a otros usuarios.',
        ],
      },
      {
        title: '3. Créditos y pagos',
        body: [
          'El acceso a las lecturas requiere la compra de créditos. Todos los pagos se procesan de forma segura a través de Paddle.',
          'Los créditos no caducan y no son transferibles entre cuentas.',
          'Nos reservamos el derecho de suspender cuentas en casos de transacciones fraudulentas o disputas de pago.',
        ],
      },
      {
        title: '4. Propiedad intelectual',
        body: [
          'Todo el contenido del servicio — incluyendo logos, diseños, imágenes generadas por IA y textos — es propiedad intelectual de Unmyeong.',
          'Los resultados de lecturas personales generados por IA pueden ser compartidos para uso personal y no comercial.',
          'Queda prohibido el uso comercial de cualquier contenido del servicio sin permiso previo por escrito.',
        ],
      },
      {
        title: '5. Limitación de responsabilidad',
        body: [
          'Las lecturas Saju se proporcionan con fines de entretenimiento y no predicen el futuro con exactitud. No deben usarse para tomar decisiones importantes.',
          'El servicio se proporciona "tal cual", sin garantías de ningún tipo.',
          'En la máxima medida permitida por la ley, Unmyeong limita su responsabilidad por daños derivados del uso del servicio.',
        ],
      },
      {
        title: '6. Cambios en los términos',
        body: [
          'Podemos actualizar estos Términos en cualquier momento. Los cambios importantes se comunicarán mediante avisos en la aplicación o por correo electrónico.',
          'El uso continuado del servicio tras los cambios implica la aceptación de los Términos actualizados.',
        ],
      },
      {
        title: '7. Contacto',
        body: [
          'Para preguntas sobre estos Términos, contáctanos a través de la función de feedback de la aplicación o de nuestros canales oficiales.',
        ],
      },
    ],
  },

  Portuguese: {
    back: '← Voltar ao início',
    title: 'Termos de Serviço',
    updated: 'Última atualização: 1 de janeiro de 2025',
    intro: 'Por favor, leia estes Termos de Serviço com atenção antes de usar o Unmyeong. Ao acessar ou usar nosso serviço, você concorda em se vincular a estes termos.',
    sections: [
      {
        title: '1. Descrição do serviço',
        body: [
          'O Unmyeong fornece um serviço de leitura do destino baseado no Saju coreano (四柱八字) com inteligência artificial, para fins de entretenimento e reflexão pessoal.',
          'As leituras não constituem aconselhamento médico, jurídico, financeiro ou profissional de qualquer natureza.',
        ],
      },
      {
        title: '2. Elegibilidade e conta',
        body: [
          'Você deve ter pelo menos 13 anos para usar este serviço.',
          'Você é responsável por manter a segurança da sua conta. Não compartilhe sua conta com terceiros.',
          'É proibido criar contas com informações falsas, usar ferramentas automatizadas para abusar do serviço ou realizar atividades que prejudiquem outros usuários.',
        ],
      },
      {
        title: '3. Créditos e pagamentos',
        body: [
          'O acesso às leituras requer a compra de créditos. Todos os pagamentos são processados com segurança pelo Paddle.',
          'Os créditos não expiram e não são transferíveis entre contas.',
          'Reservamo-nos o direito de suspender contas em casos de transações fraudulentas ou disputas de pagamento.',
        ],
      },
      {
        title: '4. Propriedade intelectual',
        body: [
          'Todo o conteúdo do serviço — incluindo logos, designs, imagens geradas por IA e textos — é propriedade intelectual do Unmyeong.',
          'Os resultados de leituras pessoais gerados por IA podem ser compartilhados para uso pessoal e não comercial.',
          'É proibido o uso comercial de qualquer conteúdo do serviço sem permissão prévia por escrito.',
        ],
      },
      {
        title: '5. Limitação de responsabilidade',
        body: [
          'As leituras Saju são fornecidas para fins de entretenimento e não preveem o futuro com precisão. Não devem ser usadas para tomar decisões importantes.',
          'O serviço é fornecido "como está", sem garantias de qualquer tipo.',
          'Na máxima extensão permitida por lei, o Unmyeong limita sua responsabilidade por danos decorrentes do uso do serviço.',
        ],
      },
      {
        title: '6. Alterações nos termos',
        body: [
          'Podemos atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por avisos no aplicativo ou por e-mail.',
          'O uso continuado do serviço após as alterações implica aceitação dos Termos atualizados.',
        ],
      },
      {
        title: '7. Contato',
        body: [
          'Para dúvidas sobre estes Termos, entre em contato pelo recurso de feedback no aplicativo ou pelos nossos canais oficiais.',
        ],
      },
    ],
  },

  Chinese: {
    back: '← 返回首页',
    title: '服务条款',
    updated: '最后更新：2025年1月1日',
    intro: '请在使用 Unmyeong 之前仔细阅读本服务条款。访问或使用我们的服务即表示您同意受这些条款的约束。',
    sections: [
      {
        title: '1. 服务描述',
        body: [
          'Unmyeong 提供基于韩国传统四柱八字（사주팔자）的 AI 命运解读服务，仅供娱乐和个人反思之用。',
          '解读结果不构成任何医疗、法律、财务或专业建议。',
        ],
      },
      {
        title: '2. 使用资格与账户',
        body: [
          '您须年满13岁方可使用本服务。',
          '您须自行负责账户的安全。请勿与他人共享账户。',
          '禁止使用虚假信息注册账户、使用自动化工具滥用服务，或从事任何损害其他用户或平台的活动。',
        ],
      },
      {
        title: '3. 积分与付款',
        body: [
          '使用解读服务需购买积分。所有付款均通过 Paddle 安全处理。',
          '积分永不过期，不可在账户间转让。',
          '如发生欺诈性交易或付款争议，我们保留暂停账户的权利。',
        ],
      },
      {
        title: '4. 知识产权',
        body: [
          '服务上的所有内容——包括标志、设计、AI 生成图像和文本——均为 Unmyeong 的知识产权。',
          'AI 生成的个人解读结果可用于个人非商业用途分享。',
          '未经事先书面许可，禁止将任何服务内容用于商业目的。',
        ],
      },
      {
        title: '5. 免责声明',
        body: [
          '四柱八字解读仅供娱乐之用，无法准确预测未来，不应用于重大人生决策。',
          '服务按"现状"提供，不作任何明示或暗示的保证。',
          '在法律允许的最大范围内，Unmyeong 对因使用服务而造成的任何直接或间接损害限制其责任。',
        ],
      },
      {
        title: '6. 条款变更',
        body: [
          '我们可能随时更新这些条款。重大变更将通过应用内通知或电子邮件告知。',
          '变更后继续使用服务即表示接受更新后的条款。',
        ],
      },
      {
        title: '7. 联系方式',
        body: [
          '如有关于本条款的疑问，请通过应用内反馈功能或我们的官方渠道联系我们。',
        ],
      },
    ],
  },
}

export default function TermsPage() {
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
        <a href="/privacy">{lang === 'Korean' ? '개인정보 처리방침' : lang === 'Japanese' ? 'プライバシーポリシー' : lang === 'Chinese' ? '隐私政策' : lang === 'Thai' ? 'นโยบายความเป็นส่วนตัว' : lang === 'Spanish' ? 'Privacidad' : lang === 'Portuguese' ? 'Privacidade' : 'Privacy Policy'}</a>
        <a href="/refund">{lang === 'Korean' ? '환불 정책' : lang === 'Japanese' ? '返金ポリシー' : lang === 'Chinese' ? '退款政策' : lang === 'Thai' ? 'นโยบายการคืนเงิน' : lang === 'Spanish' ? 'Reembolso' : lang === 'Portuguese' ? 'Reembolso' : 'Refund Policy'}</a>
        <span>© 2025 Unmyeong</span>
      </footer>
    </div>
  )
}
