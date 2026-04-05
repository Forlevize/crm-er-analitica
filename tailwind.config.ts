import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marine: "var(--color-marine)",
        veoliaRed: "var(--color-red)",
        turquoise: "var(--color-turquoise)",
        appBg: "var(--color-background)",
        appBgStrong: "var(--color-background-strong)",
        cardBg: "var(--color-card)",
        cardBgMuted: "var(--color-card-muted)",
        textPrimary: "var(--color-text)",
        textSecondary: "var(--color-text-secondary)",
        borderSoft: "var(--color-border)",
        ringSoft: "var(--color-ring)",
        status: {
          vencido: "var(--status-vencido)",
          critico: "var(--status-critico)",
          alerta: "var(--status-alerta)",
          calibrado: "var(--status-calibrado)",
          agendado: "var(--status-agendado)",
          descontinuado: "var(--status-descontinuado)",
        },
      },
      fontFamily: {
        sans: ["Arial", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 46px rgba(0, 0, 0, 0.05)",
        float: "0 28px 64px rgba(0, 0, 0, 0.08)",
        insetSoft: "inset 0 1px 0 rgba(255,255,255,0.65)",
      },
    },
  },
  plugins: [],
};

export default config;
