# 운명 (Unmyeong) — 설치 가이드

## 1단계: 기본 세팅 (로그인 + 사주 기능)

### 준비물
- Node.js 18+
- Supabase 계정
- Anthropic API 키

### 설치
```bash
npm install
cp .env.local.example .env.local
# .env.local에 Supabase URL, anon key, Anthropic API 키 입력
```

### Supabase 설정
1. supabase-setup.sql → Supabase SQL Editor에서 실행
2. Authentication > Providers > Google 활성화

### 실행
```bash
npm run dev
# http://localhost:3000
```

---

## 2단계: Paddle 결제 연동

### Paddle 계정 만들기
1. https://vendors.paddle.com 접속 → 회원가입
2. 한국 거주자도 가입 가능 (Business location: 본인 거주 국가 선택)

### API 키 복사
Paddle 대시보드 → Developer Tools → Authentication
- API key → PADDLE_API_KEY
- Client-side token → NEXT_PUBLIC_PADDLE_CLIENT_TOKEN

### 상품 3개 만들기
Paddle 대시보드 → Catalog → Products → New product

| 상품명      | 가격    | 환경변수                   |
|------------|--------|--------------------------|
| 5 Credits  | $2.99  | PADDLE_PRICE_5_CREDITS   |
| 15 Credits | $6.99  | PADDLE_PRICE_15_CREDITS  |
| 40 Credits | $14.99 | PADDLE_PRICE_40_CREDITS  |

각 상품 만들 때 Price ID (pri_...) 복사해서 .env.local에 입력

### 웹훅 설정
Paddle 대시보드 → Notifications → New notification

- URL: https://your-domain.com/api/paddle/webhook
  (로컬 테스트: ngrok 또는 Paddle의 sandbox 사용)
- Events: transaction.completed 선택
- Secret key 복사 → PADDLE_WEBHOOK_SECRET

### 로컬 웹훅 테스트 (ngrok 사용)
```bash
# ngrok 설치 후
ngrok http 3000
# 출력된 https://xxxx.ngrok.io/api/paddle/webhook 를 Paddle 웹훅 URL로 등록
```

### Supabase 테이블 추가
supabase-step2.sql → Supabase SQL Editor에서 실행

### 패키지 설치
```bash
npm install
# paddle-node-sdk가 package.json에 이미 포함되어 있어요
```

---

## 배포 (Vercel)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정
vercel env add ANTHROPIC_API_KEY
vercel env add PADDLE_API_KEY
# ... 나머지 환경변수들도 동일하게
```

배포 후 .env.local의 NEXT_PUBLIC_APP_URL을 실제 도메인으로 변경하고,
Paddle 웹훅 URL도 실제 도메인으로 업데이트하세요.

---

## 프로젝트 구조

```
unmyeong/
├── app/
│   ├── api/
│   │   ├── saju/route.ts          ← 사주 계산 + Claude 호출 (서버 전용)
│   │   ├── checkout/route.ts      ← Paddle 결제 세션 생성
│   │   └── paddle/webhook/route.ts ← 결제 완료 후 크레딧 추가
│   ├── auth/callback/             ← 로그인 콜백
│   ├── credits/success/           ← 결제 완료 페이지
│   ├── dashboard/                 ← 메인 앱
│   └── login/                     ← 로그인 페이지
├── components/
│   └── BuyCreditsModal.tsx        ← 충전 모달
├── lib/
│   ├── supabase/                  ← DB 클라이언트
│   └── paddle.ts                  ← Paddle 클라이언트
├── types/index.ts
└── middleware.ts                  ← 인증 라우팅
```
