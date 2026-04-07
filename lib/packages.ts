// 클라이언트/서버 모두 사용 가능 — Node.js 모듈 없음

export const CREDIT_PACKAGES = [
  {
    id: 'credits_5',
    credits: 5,
    price: 2.99,
    label: '5 Credits',
    note: 'Try it out',
    priceEnvKey: 'PADDLE_PRICE_5_CREDITS',
    rcIdentifier: 'credits_5',
    rcEntitlement: 'credits_5_access',
  },
  {
    id: 'credits_20',
    credits: 20,
    price: 7.99,
    label: '20 Credits',
    note: 'Best value ✦',
    priceEnvKey: 'PADDLE_PRICE_20_CREDITS',
    rcIdentifier: 'credits_20',
    rcEntitlement: 'credits_20_access',
  },
  {
    id: 'credits_50',
    credits: 60,
    price: 17.99,
    label: '60 Credits',
    note: 'Power user',
    priceEnvKey: 'PADDLE_PRICE_50_CREDITS',
    rcIdentifier: 'credits_50',
    rcEntitlement: 'credits_50_access',
  },
] as const

export type PackageId = typeof CREDIT_PACKAGES[number]['id']