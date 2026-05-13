/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#edfafa",
          100: "#d5f4f4",
          200: "#afe8e8",
          300: "#7dd4d5",
          400: "#43b8bd",
          500: "#209ca5",
          600: "#087e8b",
          700: "#0a6571",
          800: "#0d515b",
          900: "#0e444d",
        },
        danger: {
          50:  "#fff1f2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        warning: {
          50:  "#fffbeb",
          500: "#f59e0b",
          700: "#b45309",
        },
        success: {
          50:  "#ecfdf5",
          400: "#34d399",
          500: "#10b981",
          700: "#047857",
        },
        ink: {
          900: "#102027",
          800: "#1a3038",
          700: "#28444d",
        },
        dangerOld: {
          50:  "#fff1f2",
          500: "#ef4444",
          700: "#b91c1c",
        },
      },
      fontFamily: {
        sans: ["Inter", "DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 24px 60px -32px rgba(8, 126, 139, 0.55)",
      },
    },
  },
  plugins: [],
};
