/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화 비활성화
  images: { unoptimized: true },
  // 소스맵 비활성화
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
