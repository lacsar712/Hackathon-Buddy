/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'hb-bg': '#0a0a10',
        'hb-card': '#12121e',
        'hb-border': '#1d1d35',
        'hb-primary': '#6366f1', // Indigo
        'hb-secondary': '#a855f7', // Purple
        'hb-accent': '#22d3ee', // Cyan
        'hb-success': '#10b981', // Emerald
      },
      backgroundImage: {
        'modern-gradient': 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        'dark-gradient': 'linear-gradient(180deg, #12121e 0%, #0a0a10 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-accent': '0 0 20px rgba(34, 211, 238, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
