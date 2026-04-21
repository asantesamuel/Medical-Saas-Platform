/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc8fb",
          400: "#36aaf6",
          500: "#0c90e7",
          600: "#0072c4",
          700: "#015b9f",
          800: "#064e83",
          900: "#0b436d",
        },
        danger: {
          50:  "#fff1f2",
          500: "#ef4444",
          700: "#b91c1c",
        },
        warning: {
          50:  "#fffbeb",
          500: "#f59e0b",
          700: "#b45309",
        },
        success: {
          50:  "#f0fdf4",
          500: "#22c55e",
          700: "#15803d",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
