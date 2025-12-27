/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'digital': ['"Digital-7"', 'sans-serif'],
      },
      colors: {
        'led-red': '#ff0000',
        'led-green': '#00ff00',
        'dark-bg': '#0a0a0a',
        'panel-bg': '#1a1a1a',
      },
      boxShadow: {
        'neon-red': '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
        'neon-green': '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00',
        'neon-blue': '0 0 10px #00aaff, 0 0 20px #00aaff, 0 0 30px #00aaff',
        'inset-panel': 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}

