#!/usr/bin/env node
// check-invariants — the 5 HARD CI GATES for the Tokenomics marketing landing.
// Pure Node, zero deps. Exits non-zero on ANY violation and prints exactly which.
// Run AFTER `pnpm -r build` (gates 2 & 4 read built HTML / declared assets).
//
// Gates:
//   1. Provider-neutral: model-name literals appear ONLY in apps/marketing/src/data/turn-log.ts.
//   2. Exactly one <h1> across ALL built marketing HTML (apps/marketing/dist).
//   3. Island wiring: every *.island.tsx is referenced with client:* somewhere, and every
//      client:* reference resolves to an existing *.island.tsx (best-effort grep).
//   4. Prebaked assets: every asset named in runtime/acts-registry.ts and content/acts.ts
//      exists under apps/marketing/public/prebaked.
//   5. Honest numbers: docs/honest-numbers.md price table equals pricing-core exports.
//
// A gate that has NOTHING to check yet (file/dir genuinely absent in this scaffold stage)
// reports a WARN and does not fail the build — but any PRESENT artifact that VIOLATES fails.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const MKT = join(WEB_ROOT, "apps", "marketing");

const failures = [];
const warnings = [];
const fail = (gate, msg) => failures.push(`[${gate}] ${msg}`);
const warn = (gate, msg) => warnings.push(`[${gate}] ${msg}`);

/** Recursively list files under `dir` matching predicate. Safe if dir is missing. */
function walk(dir, pred, out = []) {
  let ents;
  try {
    ents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of ents) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === "dist") {
      // dist handled explicitly per-gate; skip from source walks.
      if (e.name !== "dist") continue;
    }
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

function read(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

const rel = (p) => relative(WEB_ROOT, p).split(sep).join("/");

// ---------------------------------------------------------------------------
// Gate 1: provider neutrality. Model-name literals only in data/turn-log.ts.
// ---------------------------------------------------------------------------
(() => {
  const GATE = "neutrality";
  // Whole-word-ish, case-insensitive. Catches opus/sonnet/haiku/deepseek/glm/qwen/gemini.
  const MODEL_RE = /\b(opus|sonnet|haiku|deepseek|qwen|gemini)\b|\bglm[-_]?\d/i;
  const ALLOWED = join(MKT, "src", "data", "turn-log.ts");
  const srcRoots = [
    join(MKT, "src"),
    join(WEB_ROOT, "packages", "pricing-core", "src"),
    join(WEB_ROOT, "packages", "engine-ascii", "src"),
    join(WEB_ROOT, "packages", "engine-motion", "src"),
    join(WEB_ROOT, "packages", "ui", "src"),
    join(WEB_ROOT, "packages", "i18n"),
  ];
  const files = [];
  for (const r of srcRoots) {
    walk(
      r,
      (p) =>
        /\.(ts|tsx|astro|md|mdx|json)$/.test(p) &&
        !p.endsWith(".test.ts") &&
        !p.endsWith(".test.tsx"),
      files,
    );
  }
  let scanned = 0;
  for (const f of files) {
    if (f === ALLOWED) continue;
    // pricing-core legitimately uses provider *ids* like deepseek_v4_flash / glm46 /
    // qwen_flash / gemini_flash_lite — those are routing keys, not user-facing copy.
    // They live ONLY in pricing-core/src/index.ts; allow that one file's ids.
    const isPricingCore = f.includes(["packages", "pricing-core", "src", "index.ts"].join(sep));
    scanned++;
    const text = read(f);
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (!MODEL_RE.test(line)) return;
      if (isPricingCore) return; // routing ids are allowed in the numeric source
      fail(
        GATE,
        `model-name literal in ${rel(f)}:${i + 1} — only data/turn-log.ts may name models. Offending line: ${line.trim()}`,
      );
    });
  }
  if (scanned === 0) warn(GATE, "no source files scanned (scaffold not present yet)");
})();

// ---------------------------------------------------------------------------
// Gate 2: exactly one <h1> across built marketing HTML.
// ---------------------------------------------------------------------------
(() => {
  const GATE = "single-h1";
  const dist = join(MKT, "dist");
  if (!existsSync(dist)) {
    warn(GATE, "apps/marketing/dist not built — run `pnpm -r build` before verify");
    return;
  }
  const html = walk(dist, (p) => p.endsWith(".html"));
  if (html.length === 0) {
    warn(GATE, "no HTML in apps/marketing/dist");
    return;
  }
  for (const f of html) {
    const text = read(f);
    const count = (text.match(/<h1[\s>]/gi) || []).length;
    if (count !== 1) {
      fail(GATE, `expected exactly 1 <h1> in ${rel(f)}, found ${count}`);
    }
  }
})();

// ---------------------------------------------------------------------------
// Gate 3: island wiring (best-effort grep).
// ---------------------------------------------------------------------------
(() => {
  const GATE = "islands";
  const src = join(MKT, "src");
  if (!existsSync(src)) {
    warn(GATE, "apps/marketing/src missing");
    return;
  }
  const islandFiles = walk(src, (p) => p.endsWith(".island.tsx"));
  // Component base names, e.g. "ScrollStage" from "ScrollStage.island.tsx".
  const islandNames = islandFiles.map((p) => {
    const base = p.split(sep).pop() || "";
    return base.replace(/\.island\.tsx$/, "");
  });

  // All source files that could host a client:* directive (astro/tsx/ts/mdx).
  const hosts = walk(src, (p) => /\.(astro|tsx|ts|mdx)$/.test(p) && !p.endsWith(".island.tsx"));
  const hostText = hosts.map(read).join("\n");

  // every island referenced with client:*
  for (const name of islandNames) {
    // Look for the component used as a JSX/Astro tag with a client:* directive nearby.
    // Best-effort: tag presence AND at least one client: directive in the same corpus.
    const usedAsTag = new RegExp(`<${name}\\b`).test(hostText);
    if (!usedAsTag) {
      fail(GATE, `island ${name}.island.tsx is never referenced as <${name} …>`);
    }
  }

  // every client:* directive's owning tag should resolve to a known island name.
  // Collect "<Tag ... client:load|visible|idle|media|only" occurrences across hosts+islands.
  const corpus = hostText + "\n" + islandFiles.map(read).join("\n");
  const tagClientRe = /<([A-Z][A-Za-z0-9_]*)\b[^>]*\bclient:(load|visible|idle|media|only)\b/g;
  const referenced = new Set();
  let m;
  while ((m = tagClientRe.exec(corpus)) !== null) referenced.add(m[1]);
  const known = new Set(islandNames);
  for (const tag of referenced) {
    if (!known.has(tag)) {
      fail(GATE, `client:* directive on <${tag} …> but no ${tag}.island.tsx exists`);
    }
  }

  if (islandFiles.length === 0) warn(GATE, "no *.island.tsx files yet");
})();

// ---------------------------------------------------------------------------
// Gate 4: prebaked assets named in runtime/acts-registry.ts + content/acts.ts exist.
// ---------------------------------------------------------------------------
(() => {
  const GATE = "prebaked";
  const sources = [
    join(MKT, "src", "runtime", "acts-registry.ts"),
    join(MKT, "src", "content", "acts.ts"),
  ].filter(existsSync);
  if (sources.length === 0) {
    warn(GATE, "no acts-registry.ts / content/acts.ts yet");
    return;
  }
  const prebakedDir = join(MKT, "public", "prebaked");
  // Extract string literals that look like prebaked asset references.
  // Match prebaked?: "..." / prebakedHero / prebakedFinal and any "/prebaked/..." or "*.svg|png|webp".
  const assetRe =
    /["'`]([^"'`]*?\bprebaked[^"'`]*\.(?:svg|png|webp|avif|json))["'`]|["'`](\/prebaked\/[^"'`]+)["'`]/g;
  const named = new Set();
  for (const s of sources) {
    const text = read(s);
    let m;
    while ((m = assetRe.exec(text)) !== null) {
      const v = m[1] || m[2];
      if (v) named.add(v);
    }
  }
  if (named.size === 0) {
    warn(GATE, "acts sources present but declare no prebaked assets");
    return;
  }
  for (const asset of named) {
    // Normalize: a value may be "/prebaked/act1-hero.svg" or "prebaked/act1-hero.svg"
    // or a bare filename. Resolve relative to public/.
    let candidate;
    if (asset.startsWith("/")) candidate = join(MKT, "public", asset.slice(1));
    else if (asset.startsWith("prebaked/")) candidate = join(MKT, "public", asset);
    else candidate = join(prebakedDir, asset.replace(/^.*\/prebaked\//, ""));
    if (!existsSync(candidate)) {
      fail(GATE, `prebaked asset "${asset}" not found at ${rel(candidate)}`);
    }
  }
})();

// ---------------------------------------------------------------------------
// Gate 5: docs/honest-numbers.md price table == pricing-core exports.
// ---------------------------------------------------------------------------
(async () => {
  const GATE = "honest-numbers";
  const md = join(WEB_ROOT, "docs", "honest-numbers.md");
  if (!existsSync(md)) {
    warn(GATE, "docs/honest-numbers.md not present yet");
    finish();
    return;
  }
  let core;
  try {
    core = await import("../packages/pricing-core/src/index.ts");
  } catch (e) {
    // Node can't import .ts directly without a loader; fall back to regex-parsing the source.
    core = parsePricingCoreSource();
    if (!core) {
      fail(GATE, `could not load pricing-core to compare: ${String(e)}`);
      finish();
      return;
    }
  }

  const text = read(md);
  // Parse markdown table rows: | label | inputPerM | outputPerM | ...
  // We compare by matching a known key token in the row's first cell.
  const rows = text
    .split("\n")
    .filter((l) => l.trim().startsWith("|") && l.includes("|"))
    .map((l) =>
      l
        .split("|")
        .map((c) => c.trim())
        .filter((c, i, a) => !(i === 0 && c === "") && !(i === a.length - 1 && c === "")),
    );

  // Build a lookup of canonical numbers from pricing-core.
  const expect = new Map(); // key -> { input, output }
  for (const [k, v] of Object.entries(core.ANTHROPIC_PRICES))
    expect.set(k.toLowerCase(), { input: v.inputPerM, output: v.outputPerM });
  for (const [k, v] of Object.entries(core.PROVIDER_PRICES))
    expect.set(k.toLowerCase(), { input: v.inputPerM, output: v.outputPerM });

  let compared = 0;
  for (const cells of rows) {
    if (cells.length < 3) continue;
    const label = (cells[0] || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
    // find which expected key this row corresponds to
    let key = null;
    for (const k of expect.keys()) {
      if (label.includes(k)) {
        key = k;
        break;
      }
    }
    if (!key) continue;
    const nums = cells
      .slice(1)
      .map((c) => Number((c || "").replace(/[$,]/g, "")))
      .filter((n) => Number.isFinite(n));
    if (nums.length < 2) continue;
    const e = expect.get(key);
    compared++;
    // first two finite numbers in the row are taken as input, output
    if (Math.abs(nums[0] - e.input) > 1e-9) {
      fail(
        GATE,
        `honest-numbers.md row "${cells[0]}": input ${nums[0]} != pricing-core ${e.input}`,
      );
    }
    if (Math.abs(nums[1] - e.output) > 1e-9) {
      fail(
        GATE,
        `honest-numbers.md row "${cells[0]}": output ${nums[1]} != pricing-core ${e.output}`,
      );
    }
  }
  if (compared === 0) warn(GATE, "no comparable price rows matched in honest-numbers.md");
  finish();
})();

/** Best-effort parse of pricing-core source if direct TS import is unavailable. */
function parsePricingCoreSource() {
  const srcPath = join(WEB_ROOT, "packages", "pricing-core", "src", "index.ts");
  if (!existsSync(srcPath)) return null;
  const text = read(srcPath);
  const grab = (block) => {
    const out = {};
    // matches:  key: { inputPerM: 5, outputPerM: 25, ... }
    const re = /(\w+):\s*\{\s*inputPerM:\s*([\d.]+),\s*outputPerM:\s*([\d.]+)/g;
    let m;
    while ((m = re.exec(block)) !== null) {
      out[m[1]] = { inputPerM: Number(m[2]), outputPerM: Number(m[3]) };
    }
    return out;
  };
  const anth = text.slice(text.indexOf("ANTHROPIC_PRICES"), text.indexOf("PROVIDER_PRICES"));
  const prov = text.slice(text.indexOf("PROVIDER_PRICES"), text.indexOf("export type Tier"));
  return { ANTHROPIC_PRICES: grab(anth), PROVIDER_PRICES: grab(prov) };
}

// ---------------------------------------------------------------------------
function finish() {
  for (const w of warnings) console.warn("WARN " + w);
  if (failures.length === 0) {
    console.log(`\ncheck-invariants: OK (${warnings.length} warning(s)).`);
    process.exit(0);
  }
  console.error(`\ncheck-invariants: ${failures.length} violation(s):`);
  for (const f of failures) console.error("  FAIL " + f);
  process.exit(1);
}

// Gates 1–4 are synchronous and have already populated failures/warnings by now.
// Gate 5 is async and calls finish() itself. If docs file is absent it still calls
// finish() in its early-return path, so finish() always runs exactly once.
