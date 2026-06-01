import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#1D9E75',
          'teal-light': '#E8F7F2',
          'teal-dark': '#167A5A',
          purple: '#7F77DD',
          'purple-light': '#EFEEFC',
          amber: '#EF9F27',
          'amber-light': '#FEF4E3',
        },
        surface: {
          DEFAULT: '#F8F7F4',
          subtle: '#F1EFE8',
        },
        border: {
          DEFAULT: '#E2E0D8',
          strong: '#D3D1C7',
        },
        text: {
          primary: '#1A1A18',
          secondary: '#5F5E5A',
          muted: '#888780',
        },
        status: {
          success: '#1D9E75',
          warning: '#EF9F27',
          error: '#E24B4A',
          'error-light': '#FDEAEA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '22px'],
        md: ['15px', '22px'],
        lg: ['16px', '24px'],
        xl: ['18px', '26px'],
        '2xl': ['20px', '28px'],
        '3xl': ['24px', '32px'],
        '4xl': ['30px', '36px'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10)',
        focus: '0 0 0 3px rgba(29,158,117,0.2)',
      },
      animation: {
        cursor: 'cursor-blink 1s step-end infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
