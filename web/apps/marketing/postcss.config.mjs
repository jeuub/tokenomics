// Tailwind v4 via PostCSS (bundler-agnostic — avoids the @tailwindcss/vite
// Rolldown incompatibility on Vite 8). Astro picks this up through Vite.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
