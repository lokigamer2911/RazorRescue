/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          0: '#06070a',
          1: '#0c0d12',
          2: '#12131a',
          3: '#181a24',
          4: '#1e2030',
          5: '#252838',
        },
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
          glow: 'rgba(99,102,241,0.15)',
        },
        emerald: { DEFAULT: '#10b981', glow: 'rgba(16,185,129,0.15)' },
        amber: { DEFAULT: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
        rose: { DEFAULT: '#f43f5e', glow: 'rgba(244,63,94,0.15)' },
        violet: { DEFAULT: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 50%, rgba(16,185,129,0.1) 100%)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16,1,0.3,1)',
        'slide-in': 'slide-in 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fade-in 0.5s ease',
        'count-up': 'count-up 1.2s cubic-bezier(0.16,1,0.3,1)',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.25)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow': '0 0 30px rgba(99,102,241,0.15)',
        'glow-lg': '0 0 60px rgba(99,102,241,0.2)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};
