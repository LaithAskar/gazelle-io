import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          500: "#2f6df6",
          600: "#1f5ae0",
          700: "#1948b4",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
