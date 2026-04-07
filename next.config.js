/** @type {import('next').NextConfig} */
const nextConfig = {
  // Capacitor 앱용 정적 빌드
  output: 'export',
  // 이미지 최적화 비활성화 (정적 빌드에서 필요)
  images: { unoptimized: true },
  // 소스맵 비활성화
  productionBrowserSourceMaps: false,
  // trailing slash (정적 파일 서빙용)
  trailingSlash: true,
}

module.exports = nextConfig
