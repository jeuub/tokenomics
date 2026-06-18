import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "../components/AppShell";

export const Route = createFileRoute("/turns/$turn")({ component: TurnDetail });

function Bar({ children, chip }: { children: ReactNode; chip: ReactNode }) {
  return (
    <div className="win-bar">
      <span className="win-title">
        <span className="win-dots">
          <i />
          <i />
          <i />
        </span>{" "}
        {children}
      </span>
      {chip}
    </div>
  );
}

const CANDIDATES = [
  {
    model: "glm-4.6",
    provider: "z.ai",
    fit: "✓ sufficient",
    est: "$0.0026",
    verdict: "chosen ✓",
    cls: "chosen",
  },
  {
    model: "deepseek-v4-flash",
    provider: "deepseek",
    fit: "~ borderline",
    est: "$0.0011",
    verdict: "skipped — fit margin too thin",
    cls: "verdict-skip",
  },
  {
    model: "haiku-4.5",
    provider: "anthropic",
    fit: "~ borderline",
    est: "$0.0034",
    verdict: "skipped — pricier, same fit",
    cls: "verdict-skip",
  },
  {
    model: "sonnet-4.6",
    provider: "anthropic",
    fit: "✓ over-spec",
    est: "$0.0270",
    verdict: "skipped — overkill for this class",
    cls: "verdict-skip",
  },
  {
    model: "gemini-2.5-flash-lite",
    provider: "google",
    fit: "✗ tool-use weak",
    est: "$0.0003",
    verdict: "blocked — fails tool reliability bar",
    cls: "block",
  },
];

function TurnDetail() {
  const { turn } = Route.useParams();
  return (
    <AppShell active="turns" crumb={<>turns ▸ turn {turn}</>} mainMax={920}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <Link className="btn sm" to="/turns">
          [ ◂ ledger ]
        </Link>
        <span className="cmt" style={{ fontSize: 11 }}>
          turn {turn} of session #a1f
        </span>
      </div>
      <h1 className="t">turn {turn}</h1>
      <p className="sub">
        # exactly what happened on this turn — what we considered, what we picked, and why.
      </p>

      <div className="win">
        <Bar
          chip={
            <span className="chip">
              <span className="dot g" /> routed · −68%
            </span>
          }
        >
          turn-{turn}.sh
        </Bar>

        <div className="blk">
          <h3>header</h3>
          <div className="kv">
            <span className="k">turn</span>
            <span>{turn} · session #a1f</span>
            <span className="k">time</span>
            <span>10:39:48 · 1,284ms</span>
            <span className="k">outcome</span>
            <span className="chosen">routed → glm-4.6 · accepted</span>
          </div>
        </div>

        <div className="blk">
          <h3>request</h3>
          <div className="kv">
            <span className="k">context</span>
            <span>11,240 tok (warm cache: 8.9k read)</span>
            <span className="k">tools offered</span>
            <span>edit · bash · read · grep</span>
            <span className="k">stream</span>
            <span>SSE · thinking off</span>
          </div>
        </div>

        <div className="blk">
          <h3>classification</h3>
          <div className="kv">
            <span className="k">class</span>
            <span>code · medium</span>
            <span className="k">signals</span>
            <span>multi-file edit · no architecture decision · bounded scope</span>
          </div>
        </div>

        <div className="blk">
          <h3>candidates considered</h3>
          <table>
            <thead>
              <tr>
                <th scope="col">model</th>
                <th scope="col">provider</th>
                <th scope="col">fit</th>
                <th scope="col">est $</th>
                <th scope="col">verdict</th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((c) => (
                <tr key={c.model}>
                  <td>{c.model}</td>
                  <td>{c.provider}</td>
                  <td>{c.fit}</td>
                  <td>{c.est}</td>
                  <td className={c.cls}>{c.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="foot">
            # we show what we did <b>not</b> pick, and why. provider order is alphabetical; none is
            preferred.
          </div>
        </div>

        <div className="blk">
          <h3>decision</h3>
          <div className="kv">
            <span className="k">picked</span>
            <span className="chosen">glm-4.6</span>
            <span className="k">reason</span>
            <span>cheapest candidate that clears the medium-code fit bar with margin</span>
            <span className="k">baseline</span>
            <span>opus-4.8 @ warm cache-read</span>
          </div>
        </div>

        <div className="blk">
          <h3>integrity</h3>
          <ul className="check">
            <li>tool schemas passed byte-for-byte</li>
            <li>tool-call / result pairing intact</li>
            <li>SSE stream preserved end-to-end</li>
            <li>thinking blocks not required</li>
          </ul>
        </div>

        <div className="blk">
          <h3>savings</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
            <div className="big" style={{ color: "var(--accent)" }}>
              −68%
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", paddingBottom: 8 }}>
              $0.0026 routed vs $0.0082 on opus-4.8
              <br />= −$0.0056 this turn
            </div>
          </div>
          <div className="foot">
            ◦ baseline = your default opus-4.8 priced at warm cache-read; assumes equal acceptance
            (output was accepted). savings are measured, not promised.
          </div>
        </div>

        <div className="blk">
          <h3>actions</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn sm">
              [ pin model for this kind ]
            </button>
            <button type="button" className="btn sm">
              [ !keep this session ]
            </button>
            <button type="button" className="btn sm">
              [ copy /explain ]
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
