import type { Config } from "tailwindcss";

function themeColor(name: string) {
  return `rgb(var(--c-${name}) / <alpha-value>)`;
}

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: themeColor("ink"),
        surface: themeColor("surface"),
        raised: themeColor("raised"),
        border: themeColor("border"),
        gold: {
          DEFAULT: themeColor("gold"),
          soft: themeColor("gold-soft"),
          dim: themeColor("gold-dim"),
        },
        bone: themeColor("bone"),
        muted: themeColor("muted"),
      },
      fontFamily: {
        display: "var(--font-display)",
        serifDisplay: "var(--font-serif-display)",
        body: "var(--font-body)",
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      letterSpacing: {
        widest2: "0.28em",
      },
    },
  },
  plugins: [],
} satisfies Config;
