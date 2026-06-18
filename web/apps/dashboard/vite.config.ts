import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
// Tailwind v4 is wired via PostCSS (postcss.config.mjs -> @tailwindcss/postcss),
// kept consistent with the marketing app and bundler-agnostic.
export default defineConfig({
  base: "/",
  plugins: [
    // tanstackRouter MUST be listed before @vitejs/plugin-react
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  build: {
    outDir: "dist",
  },
});
