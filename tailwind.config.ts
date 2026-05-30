import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'trading-dark': '#0f172a',
        'trading-slate': '#1e293b',
        'trading-accent': '#0ea5e9',
      },
    },
  },
  plugins: [],
}

export default config
