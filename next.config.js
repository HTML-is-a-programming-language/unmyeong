/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 시 자동 난독화 + 압축 (기본 활성화)
  // 소스맵 비활성화 — 프로덕션에서 원본 코드 노출 방지
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
