import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";

export const Route = createFileRoute("/providers")({ component: Providers });

function Providers() {
  return (
    <AppShell active="providers" crumb="providers">
      <h1 className="t">providers ~</h1>
      <p className="sub"># bring your keys. set who can run your turns. set the rules.</p>
      <div className="win">
        <div className="win-bar">
          <span className="win-title">
            <span className="win-dots">
              <i />
              <i />
              <i />
            </span>{" "}
            providers.sh
          </span>
          <span className="chip">
            <span className="dot a" /> porting from design
          </span>
        </div>
        <div className="win-body cmt">
          # BYOK keys · routing pool · policy (effort / sensitivity / pinned) · dry-run preview —
          being ported from the design comp next.{" "}
          <Link to="/" style={{ color: "var(--accent)" }}>
            ← overview
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
