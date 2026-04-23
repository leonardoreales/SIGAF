import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mi: {
          950: '#050015',
          900: '#0B022C',
          850: '#0D0432',
          800: '#100538',
          750: '#14073F',
          700: '#1A0D4A',
          650: '#1F1255',
          600: '#231558',
          500: '#2E1E6E',
          400: '#4A3A8C',
          300: '#6E60B8',
          200: '#9B90D8',
          100: '#CCC8EF',
          50:  '#EEECFA',
        },
        gold: {
          DEFAULT: '#F5C842',
          300: '#FFD566',
          400: '#F5C842',
          500: '#DBA830',
          600: '#B8880A',
        },
      },
      fontFamily: {
        syne: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
