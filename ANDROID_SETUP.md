# 운명 Unmyeong — Android 출시 가이드

## 준비물
- Android Studio (https://developer.android.com/studio)
- Google Play Console 계정 ($25 일회성)
- RevenueCat 계정 (무료, revenuecat.com)
- .env 파일 세팅 완료

---

## 1단계 — 환경변수 설정

`.env.example`을 복사해서 `.env.local` 만들기:
```
cp .env.example .env.local
```

RevenueCat Android Key 발급:
1. revenuecat.com → 프로젝트 생성
2. Apps → Add App → Google Play
3. Public API Key 복사 → `NEXT_PUBLIC_REVENUECAT_ANDROID_KEY`에 붙여넣기

---

## 2단계 — RevenueCat 상품 등록

RevenueCat 대시보드에서:
1. Products 메뉴 → Add Product
   - `credits_5` / $1.99
   - `credits_20` / $5.99
   - `credits_50` / $12.99

2. Offerings → Default Offering에 위 상품 추가
   - Package identifier: `credits_5`, `credits_20`, `credits_50`

3. Entitlements 생성:
   - `credits_5_access`
   - `credits_20_access`
   - `credits_50_access`

---

## 3단계 — 빌드

```bash
# 웹 빌드 + Android 동기화 (한 번에)
npm run sync
```

---

## 4단계 — Android Studio에서 APK 생성

1. Android Studio 실행
2. File → Open → `unmyeong/android` 폴더 선택
3. Gradle sync 완료 기다리기
4. Build → Generate Signed Bundle/APK
   - Android App Bundle 선택 (권장)
   - 키스토어 생성 (처음이면) 또는 기존 키스토어 선택
   - Release 빌드 선택
5. `.aab` 파일 생성 완료

---

## 5단계 — Google Play Console에서 출시

1. play.google.com/console → 앱 만들기
2. 앱 이름: `운명 Unmyeong`
3. 패키지명: `com.unmyeong.app`
4. 내부 테스트 → `.aab` 업로드
5. 스토어 등록정보 작성:
   - **카테고리**: Entertainment (오락)
   - **설명**: AI 기반 개인화 사주 분석 앱
6. 프로덕션 출시

---

## 6단계 — 앱 내 결제 설정

Google Play Console:
1. 수익 창출 → 인앱 상품
2. 관리형 제품 추가:
   - `credits_5` / $1.99
   - `credits_20` / $5.99
   - `credits_50` / $12.99
3. RevenueCat 대시보드에서 Google Play와 연동

---

## 개발 중 테스트

Android 기기 연결 후:
```bash
npx cap run android
```

에뮬레이터:
```bash
npx cap open android
# Android Studio에서 Run 버튼
```

---

## 주의사항

- 인앱결제는 실제 기기 + 구글 계정이 필요 (에뮬레이터 불가)
- 테스트 계정은 Google Play Console → 라이선스 테스터에 등록
- RevenueCat sandbox 환경으로 테스트 가능
