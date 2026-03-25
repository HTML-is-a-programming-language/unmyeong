export const CREDIT_PACKAGES = [
  { id: 'credits_5',  credits: 5,  price: 2.99,  label: '5 Credits',  note: '~1–2 readings',     priceEnvKey: 'PADDLE_PRICE_5_CREDITS' },
  { id: 'credits_15', credits: 15, price: 6.99,  label: '15 Credits', note: 'Best value ✦',      priceEnvKey: 'PADDLE_PRICE_15_CREDITS' },
  { id: 'credits_40', credits: 40, price: 14.99, label: '40 Credits', note: 'Share with friends', priceEnvKey: 'PADDLE_PRICE_40_CREDITS' },
] as const

export type PackageId = typeof CREDIT_PACKAGES[number]['id']