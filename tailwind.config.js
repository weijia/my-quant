/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4ecdc4',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        dark: {
          900: '#1a1a2e',
          800: '#16213e',
          700: '#0f3460',
          600: '#1a1a2e'
        }
      }
    },
  },
  plugins: [],
}
