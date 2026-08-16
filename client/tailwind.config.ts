import type { Config } from "tailwindcss";

export default {
  darkMode: "selector",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
} satisfies Config;
