/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        /* Deep navy substrate — the app chrome */
        ink: {
          950: '#070b14',
          900: '#0a1020',
          850: '#0e1526',
          800: '#121b30',
          750: '#17223c',
          700: '#1d2a48',
          600: '#26365a',
          500: '#33456e',
        },
        /* Primary accent — water */
        water: {
          light: '#7dd3fc',
          DEFAULT: '#38bdf8',
          dark: '#0284c7',
          deep: '#075985',
        },
        /* Semantic */
        good: '#34d399',
        warn: '#fbbf24',
        bad: '#f87171',
        gold: '#fcd34d',
        terrain: {
          rural: '#8fbc5a',
          suburban: '#e3d18a',
          urban: '#9ca3af',
          railway: '#a1785a',
          forest: '#4a8b4a',
          river: '#4a7fd4',
          heritage: '#d4af5a',
        },
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(56,189,248,0.4), 0 0 24px -4px rgba(56,189,248,0.45)',
        'glow-good': '0 0 0 1px rgba(52,211,153,0.4), 0 0 20px -4px rgba(52,211,153,0.4)',
        'glow-bad': '0 0 0 1px rgba(248,113,113,0.4), 0 0 20px -4px rgba(248,113,113,0.4)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(24px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(3%, -4%, 0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 220ms cubic-bezier(0.16,1,0.3,1)',
        'fade-up': 'fade-up 260ms cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fade-in 200ms ease-out',
        shimmer: 'shimmer 2.2s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.24,0,0.38,1) infinite',
        drift: 'drift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
