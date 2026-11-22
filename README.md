# Tokenomics

**A cost-aware proxy for coding agents: it understands prompt caching, never breaks tool calls, and decides on price on every turn of the conversation.**

Tokenomics is a transparent proxy that sits between a coding agent and the LLM. It plugs in without changes to the agent: Claude Code connects through the `ANTHROPIC_BASE_URL` environment variable, and tools like opencode, Cline and aider through an OpenAI-compatible API.

On every turn (one user message and one model response) the proxy makes two decisions:

1. **Which model is the cheapest one that can still handle this request.**
2. **Does the model need the whole accumulated context, or can it be trimmed.**

Both decisions are applied in-flight, without breaking tool-call state and without destroying the provider's prompt cache.

The typical case: a 150k-token session where the user types something short like "are you stuck?", "what's the status?" or "rename this variable". That turn shouldn't cost as much as a top-tier model reading the full context.

## Hard invariants

These rules can never be broken:

- **Tool-state fidelity.** If a tool-call loop is open (the last response has `stop_reason: tool_use` with unanswered blocks), the request is passed through unchanged. Context can be trimmed or the model switched only on a clean turn boundary, and every `tool_use_id` must have a matching `tool_result`.
- **Cache awareness.** Naively stripping the start of the conversation destroys the prompt cache, and cache reads cost about 0.1x the normal token price. So trivial turns are handled through a side channel, without touching the canonical cached conversation.
- **No tool-call tampering.** Executable tool-call content is never modified. It is forwarded verbatim.

## What's in the repo

| Path | What it is |
| --- | --- |
| `scan/` | `tokenomics-scan`: a one-command tool that reads your **local** Claude Code logs and prints your real usage profile (turns, context size, default model, actual spend) and an estimate of possible savings. Nothing is uploaded. |
| `web/` | Frontend monorepo (pnpm workspace): a marketing site on Astro and a dashboard SPA on React + Vite, with shared packages (design tokens, UI kit, i18n, API client). See `web/README.md`. |

## Running

```bash
# Usage scan (Node 22+)
node scan/tokenomics-scan.mjs

# Frontend
cd web
pnpm install
pnpm build
```

## Status

Early stage. The scan tool and the frontend scaffold are in place; the proxy itself (planned in Rust: tokio + axum/tower on the hot path, SQLite/DuckDB for local storage) is next. The first step is a diagnostic pass-through proxy that measures, on real Claude Code sessions, how many turns don't need context and how much traffic comes from background agents and subagents.
