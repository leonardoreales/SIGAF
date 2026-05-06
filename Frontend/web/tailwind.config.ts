import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mi: {
          950: '#000000',
          900: '#0A0A0B',
          850: '#111113',
          800: '#18181B',
          750: '#1E1E21',
          700: '#27272A',
          650: '#2E2E32',
          600: '#3F3F46',
          500: '#52525B',
          400: '#A1A1AA',
          300: '#D4D4D8',
          200: '#E4E4E7',
          100: '#F4F4F5',
          50:  '#FAFAFA',
        },
        navy: {
          DEFAULT: '#0D1B4A',
          deep:    '#060E28',
          mid:     '#162050',
          light:   '#1E2D6B',
        },
        gold: {
          DEFAULT: '#F5C842',
          300: '#FFD566',
          400: '#F5C842',
          500: '#DBA830',
          600: '#B87B20',
          700: '#C8922A',
        },
      },
      fontFamily: {
        syne: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card':               '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
        'card-hover':         '0 4px 8px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.07)',
        'card-dark':          '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.4)',
        'card-dark-hover':    '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 36px rgba(0,0,0,0.5)',
        'gold-glow':          '0 0 24px rgba(245,200,66,0.25)',
        'gold-glow-sm':       '0 0 10px rgba(245,200,66,0.35)',
      },
      keyframes: {
        'card-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.99)' },
          to:   { opacity: '1', transform: 'translateY(0)   scale(1)'    },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.5' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'glow-gold': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7', filter: 'brightness(1.2)' },
        },
      },
      animation: {
        'card-in':    'card-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up':    'fade-up 0.25s ease both',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s linear infinite',
        'slide-left': 'slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in':   'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-gold':  'glow-gold 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
