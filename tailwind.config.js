/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // ★ 여기가 핵심! ts, tsx가 포함되어야 합니다.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}