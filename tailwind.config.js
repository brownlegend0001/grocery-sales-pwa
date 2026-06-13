/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1120',
        panel: '#0f172a',
        card: '#172033',
        line: '#2a3650',
        accent: '#34d399',
        accent2: '#38bdf8',
        accent3: '#a78bfa',
        warn: '#fbbf24',
        danger: '#fb7185'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)'
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 10px 30px -14px rgba(0,0,0,0.7)',
        glow: '0 10px 40px -10px rgba(52,211,153,0.45)',
        'glow-sm': '0 6px 20px -8px rgba(52,211,153,0.5)'
      },
      backgroundImage: {
        'brand': 'linear-gradient(135deg,#34d399 0%,#10b981 100%)',
        'sheen': 'linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))'
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } }
      },
      animation: {
        rise: 'rise .3s ease both'
      }
    }
  },
  plugins: []
}
