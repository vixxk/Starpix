/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        night: {
          950: "#0D0A07",
          900: "#140F0B",
          850: "#1A140F",
          800: "#221A14",
          750: "#2B2119",
          700: "#36291F",
          600: "#4A392C",
          500: "#5E4A3B",
          400: "#856C5A",
          300: "#AD9380",
          200: "#D4C2B4",
          100: "#EFE5DC",
          50: "#FAF5F0",
        },
        glow: {
          600: "#EA580C",
          500: "#F97316",
          400: "#FB923C",
          300: "#FDBA74",
          200: "#FED7AA",
        },
      },
      boxShadow: {
        'glow': '0 0 0 1px rgba(249,115,22,0.25), 0 8px 30px -6px rgba(249,115,22,0.3)',
        'panel': '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 30px -12px rgba(0,0,0,0.6)',
        'ring-card': '0 0 0 1px rgba(212,194,180,0.08) inset',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}