import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";

export const Route = createFileRoute("/")({ component: Overview });

const COST_CURVE = `$   ┤                                   ╭──── default
3.7k┤                          ╭────────╯
    ┤                 ╭────────╯
2.0k┤        ╭────────╯········· routed
    ┤╭───────╯·········
0.0 ┤╯·········
    └──┬───┬───┬───┬───┬───┬───▶ 30d
       5   10  15  20  25  30`;

const TIERS = `trivial     [██████████░░░░░░░░░░] 31%  free/light
routine     [████████████████░░░░] 44%  third-party
medium      [███████░░░░░░░░░░░░░░] 17%  mid
reasoning   [██░░░░░░░░░░░░░░░░░░░]  6%  kept/needed
architecture[▏░░░░░░░░░░░░░░░░░░░░]  2%  kept/!keep`;

const OVER_TIME = `$/day
120┤                                      ░▓░
   ┤                              ░▒▓███▓▒░
 80┤                      ░▒▓█████████████
   ┤              ░▒▓██████████████████████   ░ confidence band
 40┤      ░▒▓████████████████████████████████  (widens when N/day is low)
   ┤░▒▓████████████████████████████████████
  0┼────┬─────┬─────┬─────┬─────┬─────┬─────▶
   d1   d5    d10   d15   d20   d25   d30`;

function Bar({ children }: { children: string }) {
  return (
    <span className="win-title">
      <span className="win-dots">
        <i />
        <i />
        <i />
      </span>{" "}
      {children}
    </span>
  );
}

const RECENT = [
  { t: 248, model: "deepseek-v4-flash", cls: "routine", tok: "3.0k", vs: "−81%", neg: true },
  {
    t: 247,
    model: "gemini-2.5-flash-lite (free)",
    cls: "trivial",
    tok: "0.6k",
    vs: "−100%",
    neg: true,
  },
  { t: 246, model: "glm-4.6", cls: "medium", tok: "4.4k", vs: "−39%", neg: true },
  { t: 245, model: "sonnet-4.6", cls: "reasoning", tok: "8.8k", vs: "kept (needed)", neg: false },
  { t: 244, model: "opus-4.8", cls: "architecture", tok: "7.4k", vs: "kept (!keep)", neg: false },
];

function Overview() {
  const stripRight = (
    <>
      baseline ~{" "}
      <select className="inl" aria-label="baseline" defaultValue="opus-4.8">
        <option>opus-4.8</option>
        <option>sonnet-4.6</option>
      </select>{" "}
      <select className="inl" aria-label="period" defaultValue="last 30d">
        <option>last 30d</option>
        <option>last 7d</option>
        <option>all time</option>
      </select>{" "}
      <button type="button" className="btn sm">
        [ recompute ▸ ]
      </button>
    </>
  );

  return (
    <AppShell active="overview" crumb="overview" mainMax={1080} stripRight={stripRight}>
      <h1 className="t">overview</h1>
      <p className="sub">
        # the source of truth. these numbers reconcile exactly with /turns and your agent
        statusline.
      </p>

      <div className="row3">
        <div className="win savings">
          <div className="win-bar">
            <Bar>savings.sh</Bar>
            <span className="chip">
              <span className="dot g" /> ✓ measured
            </span>
          </div>
          <div className="win-body">
            <div className="cmt" style={{ fontSize: 11 }}>
              saved vs baseline · last 30d
            </div>
            <div className="big">
              $2,108
              <span className="mark" style={{ fontSize: 18 }}>
                {" "}
                ◦
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              range ≈$1,940–$2,280 · −57% of baseline
            </div>
            <div className="promise">savings are measured, not promised.</div>
            <div className="foot">
              ◦ measured on N=9,412 turns · baseline opus-4.8 @ warm cache-read price · ±8% (high
              confidence)
            </div>
          </div>
        </div>
        <div className="win metric">
          <div className="win-bar">
            <Bar>routed.sh</Bar>
            <span className="chip">
              <span className="dot g" /> live
            </span>
          </div>
          <div className="win-body">
            <div className="cmt" style={{ fontSize: 11 }}>
              turns routed / total
            </div>
            <div className="big">
              8,704<span style={{ fontSize: 16, color: "var(--faint)" }}> / 9,412</span>
            </div>
            <pre className="bar" style={{ marginTop: 10, color: "var(--accent)" }}>
              [███████████████████░░] 92%
            </pre>
            <div className="foot">708 turns kept on your model (no gain / needed / !keep)</div>
          </div>
        </div>
        <div className="win metric">
          <div className="win-bar">
            <Bar>spend.sh</Bar>
            <span className="chip">
              <span className="dot g" /> ✓ measured
            </span>
          </div>
          <div className="win-body">
            <div className="cmt" style={{ fontSize: 11 }}>
              actual vs same turns on baseline
            </div>
            <div className="big" style={{ fontSize: 30 }}>
              $1,602<span style={{ fontSize: 14, color: "var(--faint)" }}> / $3,710</span>
            </div>
            <pre className="bar" style={{ marginTop: 10, color: "var(--ink)" }}>
              {"actual  [████████░░░░░░░░░░░░░░]\nbaseline[██████████████████████]"}
            </pre>
            <div className="foot">◦ 0% markup — provider tokens billed to your keys directly</div>
          </div>
        </div>
      </div>

      <div className="row2">
        <div className="win">
          <div className="win-bar">
            <Bar>cost-curve.sh</Bar>
            <span className="cmt">cumulative · gap = savings</span>
          </div>
          <div className="win-body">
            <pre>{COST_CURVE}</pre>
            <div className="foot">
              solid = your baseline cumulative · dotted = routed actual · the gap is what you kept.
            </div>
          </div>
        </div>
        <div className="win">
          <div className="win-bar">
            <Bar>tiers.sh</Bar>
            <span className="cmt">turns by tier</span>
          </div>
          <div className="win-body">
            <pre>{TIERS}</pre>
            <div className="foot">
              routine &amp; trivial dominate — that's where the savings live. hard turns stay on
              your model.
            </div>
          </div>
        </div>
      </div>

      <div className="win">
        <div className="win-bar">
          <Bar>savings-over-time.sh</Bar>
          <span className="cmt">with confidence band</span>
        </div>
        <div className="win-body">
          <pre>{OVER_TIME}</pre>
          <div className="foot">
            ◦ band reflects sample size per day — early days are wider because fewer turns were
            measured.
          </div>
        </div>
      </div>

      <div className="win">
        <div className="win-bar">
          <Bar>recent.sh</Bar>
          <span className="chip">
            <span className="dot g" /> live
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">turn</th>
              <th scope="col">model</th>
              <th scope="col">class</th>
              <th scope="col">tokens</th>
              <th scope="col" style={{ textAlign: "right" }}>
                vs default
              </th>
            </tr>
          </thead>
          <tbody>
            {RECENT.map((r) => (
              <tr key={r.t}>
                <td>{r.t}</td>
                <td>{r.model}</td>
                <td className="cmt">{r.cls}</td>
                <td className="cmt">{r.tok}</td>
                <td style={{ textAlign: "right" }} className={r.neg ? "neg" : "kept"}>
                  {r.vs}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "9px 10px", borderTop: "1px solid #e9e7e0" }}>
          <Link className="btn sm" to="/turns">
            [ open full ledger ▸ ]
          </Link>
        </div>
      </div>

      <div className="win alt">
        <div className="win-bar">
          <Bar>how these numbers are derived</Bar>
        </div>
        <div
          className="win-body"
          style={{ fontSize: 11.5, lineHeight: 1.8, color: "var(--muted)" }}
        >
          <div>
            · <b>baseline</b> = the model your agent would have used without us (opus-4.8), priced
            at <b>warm cache-read</b> rates — never the inflated cold price.
          </div>
          <div>
            · <b>savings</b> = baseline cost of each turn − actual routed cost, summed. kept turns
            contribute <b>$0.00</b>, never negative.
          </div>
          <div>
            · <b>confidence</b> rises with N; below ~500 turns we label it low and widen the range.
          </div>
          <div>
            · same turns, same acceptance — we only count a turn as routed if the cheaper model's
            output was accepted.
          </div>
          <div style={{ color: "var(--ink)", marginTop: 4 }}>
            savings are measured, not promised.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
