/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0A2A5E",
          "navy-deep": "#001040",
          blue: "#1565E0",
          azure: "#2E9BFF",
          ink: "#0A1F3C",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F3F6FB",
        },
      },
    },
  },
  plugins: [],
};
