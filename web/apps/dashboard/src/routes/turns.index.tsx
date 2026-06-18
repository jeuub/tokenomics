import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";

export const Route = createFileRoute("/turns/")({ component: Turns });

interface Row {
  t: number;
  time: string;
  sess: string;
  model: string;
  cls: string;
  tok: string;
  cost: string;
  vs: string;
  kind: "neg" | "kept" | "esc" | "fb";
  micro?: string;
  action: "open" | "keep" | "unpin";
}

const ROWS: Row[] = [
  {
    t: 248,
    time: "10:42:07",
    sess: "#a1f",
    model: "deepseek-v4-flash",
    cls: "routine",
    tok: "3.0k",
    cost: "$0.0009",
    vs: "−81%",
    kind: "neg",
    micro: "▁▁▂",
    action: "open",
  },
  {
    t: 247,
    time: "10:41:55",
    sess: "#a1f",
    model: "gemini-2.5-flash-lite",
    cls: "trivial",
    tok: "0.6k",
    cost: "$0.0000",
    vs: "−100%",
    kind: "neg",
    micro: "▁",
    action: "open",
  },
  {
    t: 246,
    time: "10:41:39",
    sess: "#a1f",
    model: "glm-4.6",
    cls: "medium",
    tok: "4.4k",
    cost: "$0.0026",
    vs: "−39%",
    kind: "neg",
    micro: "▃▃▅",
    action: "open",
  },
  {
    t: 245,
    time: "10:40:12",
    sess: "#a1f",
    model: "sonnet-4.6",
    cls: "reasoning",
    tok: "8.8k",
    cost: "$0.0270",
    vs: "kept (needed)",
    kind: "kept",
    action: "keep",
  },
  {
    t: 244,
    time: "10:39:48",
    sess: "#a1f",
    model: "opus-4.8",
    cls: "architecture",
    tok: "7.4k",
    cost: "$0.0540",
    vs: "kept (!keep)",
    kind: "kept",
    action: "unpin",
  },
  {
    t: 243,
    time: "10:38:20",
    sess: "#9c2",
    model: "sonnet-4.6",
    cls: "reasoning",
    tok: "9.1k",
    cost: "$0.0281",
    vs: "escalated ▲",
    kind: "esc",
    action: "open",
  },
  {
    t: 242,
    time: "10:37:09",
    sess: "#9c2",
    model: "deepseek-v4-flash",
    cls: "routine",
    tok: "2.6k",
    cost: "$0.0008",
    vs: "−83%",
    kind: "neg",
    micro: "▁▂▂",
    action: "open",
  },
  {
    t: 241,
    time: "10:36:55",
    sess: "#9c2",
    model: "glm-4.6",
    cls: "medium",
    tok: "5.0k",
    cost: "$0.0031",
    vs: "fallback !",
    kind: "fb",
    action: "open",
  },
];

function Turns() {
  return (
    <AppShell
      active="turns"
      crumb="turns"
      mainMax={1120}
      stripRight={
        <span style={{ color: "var(--faint)" }}>
          # costs here are the real number — your agent's /cost over-reports on routed turns.
        </span>
      }
    >
      <h1 className="t">turns</h1>
      <p className="sub">
        # every turn your agent made, what we routed it to, and what it cost. j/k to move · enter to
        open · / to filter.
      </p>

      <div className="win">
        <div className="win-bar">
          <span className="win-title">
            <span className="win-dots">
              <i />
              <i />
              <i />
            </span>{" "}
            turns.sh
          </span>
          <span className="chip">
            <span className="dot g" /> live · streaming
          </span>
        </div>
        <div className="filterbar">
          <select className="f" aria-label="provider" defaultValue="provider · all">
            <option>provider · all</option>
            <option>anthropic</option>
            <option>deepseek</option>
            <option>gemini</option>
            <option>glm</option>
            <option>qwen</option>
          </select>
          <select className="f" aria-label="class" defaultValue="class · all">
            <option>class · all</option>
            <option>trivial</option>
            <option>routine</option>
            <option>medium</option>
            <option>reasoning</option>
            <option>architecture</option>
          </select>
          <select className="f" aria-label="routed vs kept" defaultValue="routed + kept">
            <option>routed + kept</option>
            <option>routed only</option>
            <option>kept only</option>
          </select>
          <select className="f" aria-label="time" defaultValue="last 24h">
            <option>last 24h</option>
            <option>last 7d</option>
            <option>last 30d</option>
          </select>
          <input className="f" placeholder="filter ~ session, model…" aria-label="filter" />
          <button type="button" className="btn sm">
            [ reset ]
          </button>
          <span style={{ marginLeft: "auto" }} className="chip">
            <span className="dot g" /> 12 turns/min
          </span>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th scope="col">turn ▾</th>
                <th scope="col">time</th>
                <th scope="col">session</th>
                <th scope="col">model</th>
                <th scope="col">class</th>
                <th scope="col">tokens</th>
                <th scope="col" aria-sort="descending">
                  cost <span className="ar">▾</span>
                </th>
                <th scope="col">vs default</th>
                <th scope="col" style={{ textAlign: "right" }} />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.t} className={i === 0 ? "flashrow" : undefined}>
                  <td>{r.t}</td>
                  <td className="cmt">{r.time}</td>
                  <td className="cmt">{r.sess}</td>
                  <td>{r.model}</td>
                  <td className="cmt">{r.cls}</td>
                  <td className="cmt">{r.tok}</td>
                  <td>{r.cost}</td>
                  <td className={r.kind}>
                    {r.vs}
                    {r.micro && <span className="microbar">{r.micro}</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.action === "open" ? (
                      <Link className="btn sm" to="/turns/$turn" params={{ turn: String(r.t) }}>
                        open
                      </Link>
                    ) : (
                      <button type="button" className="btn sm">
                        [ {r.action} ]
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="legend">
          <span className="neg">−NN%</span> routed cheaper ·{" "}
          <span className="kept">kept (no gain to move)</span> /{" "}
          <span className="kept">kept (needed)</span> / <span className="kept">kept (!keep)</span>{" "}
          left on your model at $0.00 · <span className="esc">escalated ▲</span> safeguard, not a
          downgrade · <span className="fb">fallback !</span> provider error, not a savings decision
          <br /># your agent's /cost over-reports on routed turns — this is the real number.
        </div>
      </div>
    </AppShell>
  );
}
