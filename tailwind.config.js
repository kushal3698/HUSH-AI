/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hush: {
          bg: '#080c18',
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
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
