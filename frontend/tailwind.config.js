/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: '#071218',
        'slate-panel': '#111d25',
        'cyan-accent': '#ff9a5c',
        'sky-accent': '#ffd36f',
        'amber-accent': '#ffbf7a',
      },
    },
  },
  plugins: [],
}
