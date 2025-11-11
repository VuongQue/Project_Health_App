/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        que: {
          primary: "#2563eb",
          surface: "#f9fafb",
          dark: "#111827",
          danger: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
