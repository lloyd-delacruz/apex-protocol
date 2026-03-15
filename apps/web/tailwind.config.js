/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#12121A',
        'surface-elevated': '#1A1A26',
        accent: '#00C2FF',
        'accent-secondary': '#7B61FF',
        'text-primary': '#F0F0F5',
        'text-muted': '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        modal: '12px',
      },
      boxShadow: {
        'accent-sm': '0 0 12px rgba(0, 194, 255, 0.15)',
        'accent-md': '0 0 24px rgba(0, 194, 255, 0.2)',
        'surface': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #00C2FF 0%, #7B61FF 100%)',
        'gradient-surface': 'linear-gradient(180deg, #1A1A26 0%, #12121A 100%)',
      },
      animation: {
        'pulse-accent': 'pulse-accent 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-accent': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
