import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#1f2933',
        panel: '#f7f3eb',
        moss: '#64715c',
        coral: '#cf6f5b',
        river: '#2e6f7f',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(31, 41, 51, 0.12)',
      },
      fontFamily: {
        sans: ['Avenir Next', 'Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
