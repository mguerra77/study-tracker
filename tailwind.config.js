/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#e7e2d6",
        muted: "#a7ada6",
        panel: "#171a18",
        rail: "#111311",
        line: "#2b302c",
        moss: "#8fae88",
        rust: "#d59a6f",
        sky: "#87a9c8",
        plum: "#b79ac8"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(0,0,0,0.18)"
      }
    },
  },
  plugins: [],
};
