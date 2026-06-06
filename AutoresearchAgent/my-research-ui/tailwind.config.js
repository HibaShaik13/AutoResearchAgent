/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#0f172a',
        card: '#1e293b',
        cyan: { accent: '#00f5ff' },
        purple: { accent: '#bf5fff' },
        pink: { accent: '#ff2d8d' },
      },
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        body: ['Exo 2', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(0, 245, 255, 0.15)',
        'neon-purple': '0 0 20px rgba(191, 95, 255, 0.15)',
      },
    },
  },
  plugins: [],
};
