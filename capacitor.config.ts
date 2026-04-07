import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.unmyeong.app',
  appName: '운명 Unmyeong',
  webDir: 'out',
  server: {
    // 개발 중에는 웹 서버를 직접 가리킬 수 있음 (배포 시엔 이 줄 삭제)
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
}

export default config
