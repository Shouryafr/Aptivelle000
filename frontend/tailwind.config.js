/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1E3D',
          light: '#1E3A5F',
        },
        gold: {
          DEFAULT: '#E8B84B',
          soft: '#FBF5E9',
        },
        ink: '#3A2A05',
        mist: '#A9B2C8',
        offwhite: '#F5F5F5',
        bluetint: '#DBEAFE',
        slatebody: '#475569',
        slatemuted: '#94A3B8',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        borderc: '#E2E8F0',
        pagebg: '#F8FAFC',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 30 61 / 0.04), 0 4px 16px -4px rgb(15 30 61 / 0.08)',
        cardhover: '0 4px 12px -2px rgb(15 30 61 / 0.10), 0 12px 28px -8px rgb(15 30 61 / 0.14)',
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};