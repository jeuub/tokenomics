#!/usr/bin/env node
// tokenomics-scan — читает ЛОКАЛЬНЫЕ логи Claude Code (и opencode), считает реальный
// профиль использования и оценку экономии Tokenomics. НИЧЕГО не загружает в сеть —
// весь расчёт на твоей машине. Запуск: `node tokenomics-scan.mjs` (в будущем `npx tokenomics-scan`).
//
// Что считает за последние N дней (по умолчанию 30):
//   • ходов (assistant-ответов), средний контекст/ход, дефолт-модель
//   • реальный расход $ — из твоих токенов по прайс-листам провайдеров (это факт, не оценка)
//   • оценку экономии с Tokenomics — выводимую из ТВОЕГО профиля (иллюстративно, допущения печатаются)
//
// Privacy: открываются только метаданные usage и имя модели; тексты переписок не читаются и не передаются.

import { readdirSync, statSync, readFileSync, existsSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

const DAYS = Number(process.argv.find(a => a.startsWith("--days="))?.split("=")[1] ?? 30);
const cutoff = Date.now() - DAYS * 864e5;
const H = homedir();

// ----- прайс-лист $/1M токенов: [input_miss, cache_read, cache_write_5m, output] (verified mid-2026)
const PRICES = {
  opus:    [5, 0.5, 6.25, 25],
  sonnet:  [3, 0.3, 3.75, 15],
  haiku:   [1, 0.1, 1.25, 5],
};
const CHEAP = { // провайдеры-таргеты для увода: [input, output] $/1M
  free: [0, 0], deepseek_flash: [0.14, 0.28], glm46: [0.6, 2.2],
};
const keyOf = m => /opus/i.test(m) ? "opus" : /sonnet/i.test(m) ? "sonnet" : /haiku/i.test(m) ? "haiku" : "opus";

function walk(dir, out = []) {
  let ents; try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

async function scanClaudeCode() {
  const root = join(H, ".claude", "projects");
  if (!existsSync(root)) return null;
  const files = walk(root);
  let turns = 0, ctx = 0, outTok = 0, spend = 0;
  const models = new Map();
  for (const f of files) {
    const rl = createInterface({ input: createReadStream(f), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line) continue;
      let x; try { x = JSON.parse(line); } catch { continue; }
      if (x.type !== "assistant") continue;
      const u = x.message?.usage; if (!u) continue;
      if (x.timestamp) { const t = Date.parse(x.timestamp); if (t && t < cutoff) continue; }
      const it = u.input_tokens || 0, cr = u.cache_read_input_tokens || 0,
            cw = u.cache_creation_input_tokens || 0, ot = u.output_tokens || 0;
      const mk = keyOf(x.message?.model || "opus"), [pin, pread, pwrite, pout] = PRICES[mk];
      turns++; ctx += it + cr + cw; outTok += ot;
      spend += (it * pin + cr * pread + cw * pwrite + ot * pout) / 1e6;
      const name = x.message?.model || "unknown"; models.set(name, (models.get(name) || 0) + 1);
    }
  }
  return { turns, ctx, outTok, spend, models };
}

// оценка экономии: иллюстративный mix задач × cheapest-sufficient; ход уводим только если дешевле
function estimate(defaultKey, avgCtx) {
  const [, dRead, , dOut] = PRICES[defaultKey];
  const tiers = [ // [доля, output, routedTarget|null(kept)]
    [0.25, 150, "free"],
    [0.35, 350, "deepseek_flash"],
    [0.25, 600, "glm46"],
    [0.15, 900, null],
  ];
  let base = 0, routed = 0;
  for (const [share, O, tgt] of tiers) {
    const b = avgCtx * dRead / 1e6 + O * dOut / 1e6;           // baseline: default, тёплый кэш
    let r;
    if (tgt === null) r = b;                                    // hard → kept на твоей модели
    else if (tgt === "free") r = 0;                             // trivial → free (side-channel)
    else { const [cin, cout] = CHEAP[tgt]; r = avgCtx * cin / 1e6 + O * cout / 1e6; }
    r = Math.min(r, b);                                         // НИКОГДА дороже дефолта → оставляем
    base += share * b; routed += share * r;
  }
  return base > 0 ? (base - routed) / base : 0;                 // blended savings %
}

const f = n => n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + n.toFixed(0);
const k = n => (n / 1000).toFixed(0) + "k";

const cc = await scanClaudeCode();
console.log("\n  tokenomics-scan · последние " + DAYS + " дней · всё локально, ничего не загружается\n");
if (!cc || cc.turns === 0) {
  console.log("  Логи Claude Code не найдены в ~/.claude/projects (или пусто за период).");
  console.log("  Если используешь opencode — данные в ~/.local/share/opencode (поддержка скоро).\n");
  process.exit(0);
}
const def = [...cc.models.entries()].sort((a, b) => b[1] - a[1])[0][0];
const avgCtx = cc.ctx / cc.turns;

// ---- режим оплаты: подписка (фикс) vs API-ключ (по токенам). БЕЗ обращения к Keychain. ----
const apiEnv = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
let subType = null, hasCred = false;
try {
  const cf = join(H, ".claude", ".credentials.json");
  if (existsSync(cf)) { hasCred = true; const c = JSON.parse(readFileSync(cf, "utf8")); subType = c.claudeAiOauth?.subscriptionType || c.subscriptionType || null; }
} catch {}
let mode;
if (process.argv.includes("--api")) mode = "api";
else if (process.argv.includes("--subscription")) mode = "sub";
else if (apiEnv) mode = "api";
else if (subType) mode = "sub";
else if (hasCred) mode = "api";
else mode = "sub"; // дефолт на macOS (подписочный OAuth в Keychain) — честнее НЕ обещать экономию

console.log("  ТВОЙ ПРОФИЛЬ (факт из логов)");
console.log("    ходов/период        " + cc.turns.toLocaleString());
console.log("    средний контекст/ход ~" + k(avgCtx) + " токенов");
console.log("    дефолт-модель        " + def + "  (" + Math.round(cc.models.get(def) * 100 / cc.turns) + "% ходов)");
console.log("");

if (mode === "api") {
  const sv = estimate(keyOf(def), avgCtx);
  console.log("    режим оплаты         API-ключ (по токенам)");
  console.log("    реальный расход      ≈ " + f(cc.spend) + "  (твои токены × прайс-листы)");
  console.log("");
  console.log("  ОЦЕНКА С TOKENOMICS (иллюстративно, на твоём профиле)");
  console.log("    смешанная экономия   ≈ " + Math.round(sv * 100) + "%");
  console.log("    было → стало         " + f(cc.spend) + " → " + f(cc.spend * (1 - sv)) + "  ·  экономия ≈ " + f(cc.spend * sv) + "/период");
  console.log("");
  console.log("  Допущения: типовое распределение задач, cheapest-sufficient среди провайдеров; ход уводим");
  console.log("  только когда он реально дешевле — иначе остаётся на твоей модели (НИКОГДА не дороже дефолта).");
  console.log("  free/сторонние имеют лимиты и условия по данным; кросс-провайдер ограничен политикой данных.");
  console.log("  Реальное число замеряется на трафике после подключения. Ничего не покинуло твою машину.\n");
} else {
  console.log("    режим оплаты         ФИКС-ПЛАН (подписка Pro/Max" + (subType ? " · " + subType : "") + ")");
  console.log("    использование $      ≈ " + f(cc.spend) + " по API-прайсу — это СУБСИДИЯ твоего плана,");
  console.log("                         а НЕ то, что ты платишь (ты платишь фикс, напр. $200/мес за Max).");
  console.log("");
  console.log("  ⚑ TOKENOMICS ТЕБЕ НЕ ПОМОЖЕТ — честно.");
  console.log("  Мы работаем только в режиме API-ключа и не можем перебить фикс-подписку: переход на");
  console.log("  «API + мы» вышел бы ДОРОЖЕ твоего фикса — плоский тариф уже дешевле любого metered-арбитража.");
  console.log("");
  console.log("  Кому это помогает: тем, кто УЖЕ платит по токенам — API-ключ / Bedrock / Vertex, команды,");
  console.log("  или объём сверх лимитов плана. Если ты на самом деле платишь по токенам — запусти с флагом --api.\n");
}
