/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        hush: {
          bg: '#060913',
          card: '#0f172a',
          surface: '#151d36',
          border: '#232f55',
          accent: '#8b5cf6',
          secondary: '#6366f1',
          cyan: '#06b6d4',
          muted: '#94a3b8'
        }
      },
      animation: {
        'radar-ping': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-fade-in': 'toastFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        toastFadeIn: {
          from: { opacity: '0', transform: 'translate(-50%, -8px)' },
          to: { opacity: '1', transform: 'translate(-50%, 0)' },
        }
      }
    },
  },
  plugins: [],
}
