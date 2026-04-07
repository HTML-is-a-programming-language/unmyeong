// 클라이언트/서버 모두 사용 가능 — Node.js 모듈 없음

export const CREDIT_PACKAGES = [
  {
    id: 'credits_5',
    credits: 5,
    price: 1.99,
    label: '5 Credits',
    note: 'Try it out',
    priceEnvKey: 'PADDLE_PRICE_5_CREDITS',
    // RevenueCat 인앱결제용 식별자
    rcIdentifier: 'credits_5',          // RevenueCat Offering의 Package identifier
    rcEntitlement: 'credits_5_access',  // RevenueCat Entitlement identifier
  },
  {
    id: 'credits_20',
    credits: 20,
    price: 5.99,
    label: '20 Credits',
    note: 'Best value ✦',
    priceEnvKey: 'PADDLE_PRICE_20_CREDITS',
    rcIdentifier: 'credits_20',
    rcEntitlement: 'credits_20_access',
  },
  {
    id: 'credits_50',
    credits: 50,
    price: 12.99,
    label: '50 Credits',
    note: 'Power user',
    priceEnvKey: 'PADDLE_PRICE_50_CREDITS',
    rcIdentifier: 'credits_50',
    rcEntitlement: 'credits_50_access',
  },
] as const

export type PackageId = typeof CREDIT_PACKAGES[number]['id']
