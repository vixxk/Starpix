/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        display: ['Anton', '"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        night: {
          950: "#0D0A07",
          900: "#14100B",
          850: "#1A150F",
          800: "#221B13",
          750: "#2B2218",
          700: "#362B1E",
          600: "#4A3C2B",
          500: "#5E4E39",
          400: "#856F57",
          300: "#AD9679",
          200: "#D4C2A8",
          100: "#EFE5D8",
          50: "#FAF5EE",
        },
        // Brand orange — kept for back-compat with existing pages
        glow: {
          700: "#B93A08",
          600: "#D8430B",
          500: "#F05A0C",
          400: "#F8761F",
          300: "#FCA14F",
          200: "#FEC388",
        },
        // Flat brand orange (brutalist primary)
        flame: {
          700: "#B93A08",
          600: "#D8430B",
          500: "#F05A0C",
          400: "#F8761F",
          300: "#FCA14F",
          200: "#FEC388",
        },
        // Warm bone paper
        paper: {
          50: "#F5F1E8",
          100: "#EBE4D6",
          200: "#DED3BF",
          300: "#C9BAA0",
          400: "#AFA086",
          500: "#95866C",
        },
        // Near-black ink
        ink: {
          DEFAULT: "#17120C",
          soft: "#40382E",
          mute: "#6F6354",
          faint: "#A29683",
        },
      },
      boxShadow: {
        // Signature: hard offset "stamped" shadows — no blur
        'hard': '4px 4px 0 0 #17120C',
        'hard-sm': '2px 2px 0 0 #17120C',
        'hard-lg': '6px 6px 0 0 #17120C',
        'hard-flame': '4px 4px 0 0 #F05A0C',
        'hard-white': '4px 4px 0 0 #F5F1E8',
      },
      borderRadius: {
        'xl': '2px',
        '2xl': '2px',
        '3xl': '2px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out both',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
