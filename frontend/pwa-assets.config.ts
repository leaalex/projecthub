import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

const whiteBg = { background: '#ffffff', fit: 'contain' as const }

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: {
      ...minimal2023Preset.transparent,
      padding: 0.05,
      resizeOptions: whiteBg,
    },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.2,
      resizeOptions: whiteBg,
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.2,
      resizeOptions: whiteBg,
    },
  },
  images: ['public/logo.svg'],
})
