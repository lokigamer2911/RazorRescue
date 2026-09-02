/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        navy: {
          900: '#04060e',
          800: '#080c1a',
          700: '#0c1225',
          600: '#111a33',
          500: '#162040',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          glow: 'rgba(6,182,212,0.15)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          400: '#fbbf24',
          500: '#f59e0b',
          glow: 'rgba(245,158,11,0.15)',
        },
        rose: {
          DEFAULT: '#f43f5e',
          400: '#fb7185',
          500: '#f43f5e',
          glow: 'rgba(244,63,94,0.15)',
        },
        emerald: {
          DEFAULT: '#10b981',
          400: '#34d399',
          500: '#10b981',
          glow: 'rgba(16,185,129,0.15)',
        },
        violet: {
          DEFAULT: '#8b5cf6',
          400: '#a78bfa',
          glow: 'rgba(139,92,246,0.15)',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 30px rgba(6,182,212,0.15)',
        'glow-cyan-lg': '0 0 60px rgba(6,182,212,0.2)',
        'glow-green': '0 0 30px rgba(16,185,129,0.15)',
        'glow-rose': '0 0 30px rgba(244,63,94,0.15)',
        'inner-top': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};
