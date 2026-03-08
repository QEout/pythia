/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#06060a', card: '#0c0c12', elevated: '#12121a', hover: '#18182a' },
        border: { DEFAULT: '#1e1e2e', bright: '#2a2a3e' },
        accent: { DEFAULT: '#8b5cf6', light: '#a78bfa', dim: '#6d28d9' },
        neon: {
          cyan: '#06d6a0',
          blue: '#118ab2',
          red: '#ef476f',
          yellow: '#ffd166',
          green: '#22c55e',
          purple: '#8b5cf6',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.35s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'count': 'countUp 0.8s ease-out',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(139, 92, 246, 0.05)' },
          to: { boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='%23111' stroke-width='0.5'/%3E%3C/svg%3E")`,
      },
    },
  },
  plugins: [],
}
