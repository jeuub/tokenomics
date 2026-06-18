import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";

const RAIL = [
  { key: "connect", label: "connect", to: "/connect" },
  { key: "overview", label: "overview", to: "/" },
  { key: "turns", label: "turns", to: "/turns" },
  { key: "providers", label: "providers", to: "/providers" },
  { key: "settings", label: "settings", to: "/settings" },
] as const;

export interface AppShellProps {
  /** which rail item is active */
  active: (typeof RAIL)[number]["key"];
  /** breadcrumb tail (after "home ▸ ") */
  crumb: ReactNode;
  /** left side of the scope strip (defaults to "● routing on") */
  stripLeft?: ReactNode;
  /** right side of the scope strip (selectors / actions) */
  stripRight?: ReactNode;
  /** override main max-width (px) */
  mainMax?: number;
  children: ReactNode;
}

/**
 * The persistent paper-terminal chrome every authenticated route renders inside:
 * top nav (wordmark + mode pill + breadcrumb + account menu), the scope strip,
 * the left section-rail, and the dark bottom status bar with a live clock.
 */
export function AppShell({
  active,
  crumb,
  stripLeft,
  stripRight,
  mainMax,
  children,
}: AppShellProps) {
  const [acctOpen, setAcctOpen] = useState(false);
  const [clock, setClock] = useState("—");
  const acctRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = (): void => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const iv = setInterval(tick, 1000);
    const onDoc = (e: MouseEvent): void => {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => {
      clearInterval(iv);
      document.removeEventListener("click", onDoc);
    };
  }, []);

  return (
    <div className="app">
      <a href="#main" className="skiplink">
        skip to content
      </a>

      <nav className="nav">
        <div className="nav-in">
          <div className="nav-l">
            <span className="wordmark">tokenomics</span>
            <span className="at">@web</span>
            <span className="pill">[ cloud ]</span>
          </div>
          <div className="crumb">
            home ▸ <b>{crumb}</b>
          </div>
          <div className="nav-r">
            <a className="btn" href="/docs">
              [ docs ▸ ]
            </a>
            <div className={acctOpen ? "acct open" : "acct"} ref={acctRef}>
              <button
                type="button"
                className="btn"
                aria-expanded={acctOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setAcctOpen((o) => !o);
                }}
              >
                account ▾
              </button>
              {acctOpen && (
                <div className="acctmenu">
                  <div className="row">
                    signed in <b>d•••@acme.dev</b>
                  </div>
                  <div className="row">
                    plan <b>pay-as-you-go</b>
                  </div>
                  <div className="acts">
                    <Link className="btn sm" to="/settings">
                      [ tokens ]
                    </Link>
                    <Link className="btn sm" to="/settings">
                      [ billing ]
                    </Link>
                  </div>
                  <div className="acts">
                    <Link className="btn sm" to="/login">
                      [ sign out ▸ ]
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="strip">
        <div className="strip-in">
          <span>
            {stripLeft ?? (
              <span className="chip">
                <span className="dot g" /> routing on
              </span>
            )}
          </span>
          <span style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {stripRight}
          </span>
        </div>
      </div>

      <div className="layout">
        <nav className="rail">
          {RAIL.map((r) => (
            <Link key={r.key} to={r.to} className={active === r.key ? "active" : undefined}>
              {active === r.key ? `[ ${r.label} ]` : r.label}
            </Link>
          ))}
        </nav>
        <main className="main" id="main" style={mainMax ? { maxWidth: mainMax } : undefined}>
          {children}
        </main>
      </div>

      <div className="sb">
        <span style={{ display: "flex", gap: 16 }}>
          <span className="chip">
            <span className="dot g" /> gateway · gw.tokenomics.dev
          </span>
        </span>
        <span>TLS 1.3 · {clock}</span>
      </div>
    </div>
  );
}
