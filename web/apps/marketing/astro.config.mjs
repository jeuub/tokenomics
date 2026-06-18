// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
// Astro 6: `output` defaults to 'static', so it is intentionally omitted.
// Tailwind v4 is wired via PostCSS (postcss.config.mjs -> @tailwindcss/postcss),
// not the Vite plugin: @tailwindcss/vite 4.3.1 crashes on Vite 8's Rolldown
// resolver, and the PostCSS plugin is bundler-agnostic.
export default defineConfig({
  site: "https://tokenomics.example.com",
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: "ru",
        locales: {
          ru: "ru-RU",
          en: "en-US",
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: "ru",
    locales: ["ru", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
