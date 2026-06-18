# tokenomics/web — фронтенд-монорепо

Две поверхности из одной кодовой базы (см. [../docs/frontend-stack-and-structure.md](../docs/frontend-stack-and-structure.md)):

- **`apps/marketing`** — маркетинг-лендинг на **Astro 6** (статика, React-острова). `[v0]`
- **`apps/dashboard`** — дашборд-SPA на **React 19 + Vite 7** → собирается в статику, потом вшивается в
  self-host Rust-бинарь (rust-embed + SPA-fallback) и теми же ассетами едет в облако. `[v1, пока заглушка]`

Общий код вынесен в пакеты, чтобы UI-кит и движки были одни на обе поверхности:

| Пакет | Что |
|---|---|
| `packages/design-tokens` | один `@theme`-файл токенов (терминальная моно-эстетика), общий для обоих приложений |
| `packages/ui` | `@tokenomics/ui` — React-кит (Button, AsciiDivider, uPlot-адаптер, BYOK-форма на RHF+Zod) |
| `packages/engine-ascii` | framework-agnostic OGL/WebGL ASCII-халфтон (класс `init/destroy/update`) |
| `packages/engine-motion` | framework-agnostic Lenis + GSAP ScrollTrigger, с уважением к `prefers-reduced-motion` |
| `packages/i18n` | RU(дефолт)/EN каталоги сообщений + компиляция Paraglide JS 2 |
| `packages/api-client` | типизованный fetch-клиент (Anthropic-совместимый `/v1/messages` + dashboard REST) |

## Toolchain

- **Node ≥ 22.12** — этого требует Astro 6. В репо лежит `.nvmrc` (`22`): `nvm use`.
- **pnpm 10** — через corepack: `corepack enable`. Версия закреплена в `package.json` (`packageManager`).

Почему Vite **7**, а не 8, и почему Tailwind через **PostCSS**, а не Vite-плагин — в
[doc §9 «Реальность сборки»](../docs/frontend-stack-and-structure.md#9-реальность-сборки-где-скаффолд-отличается-от-целевого-стека).

## Команды (из `web/`)

```bash
corepack enable          # один раз: активирует pnpm 10
pnpm install             # поставить зависимости (esbuild/sharp собираются по onlyBuiltDependencies)

pnpm dev                 # оба приложения в watch-режиме
pnpm --filter @tokenomics/marketing dev    # только маркетинг (http://localhost:4321)
pnpm --filter @tokenomics/dashboard dev     # только дашборд

pnpm build               # топологическая сборка всего (i18n compile -> приложения)
pnpm lint                # biome check (формат + линт)
pnpm typecheck           # tsc --noEmit по пакетам
pnpm test                # vitest
pnpm test:e2e            # playwright (нужен `pnpm exec playwright install` в CI)
```

Сборка выдаёт: `apps/marketing/dist` (статический сайт + sitemap), `apps/dashboard/dist`
(SPA-ассеты под встраивание в Rust-бинарь).

## Заметки

- `packages/i18n` компилирует Paraglide в `src/paraglide/` (генерится, в `.gitignore`); запускается
  автоматически перед сборкой приложений через `pnpm -r build`.
- `apps/dashboard/src/routeTree.gen.ts` генерит плагин TanStack Router на dev/build — он в `.gitignore`,
  на чистом чекауте пересоздаётся при `vite build`.
- Внутренние пакеты экспортируют TS-исходники (без шага сборки) — бандлеры приложений транспилируют их сами.
