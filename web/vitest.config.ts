import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: { label: "ui", color: "magenta" },
          root: "./packages/ui",
          environment: "jsdom",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        test: {
          name: { label: "node", color: "green" },
          environment: "node",
          include: ["packages/!(ui)/**/*.{test,spec}.ts", "apps/**/*.{test,spec}.ts"],
        },
      },
    ],
  },
});
