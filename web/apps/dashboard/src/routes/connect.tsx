import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";

export const Route = createFileRoute("/connect")({ component: Connect });

function Connect() {
  return (
    <AppShell active="connect" crumb="connect">
      <h1 className="t">connect your agent</h1>
      <p className="sub">
        # point your agent at the gateway · add provider keys · catch the first request.
      </p>
      <div className="win">
        <div className="win-bar">
          <span className="win-title">
            <span className="win-dots">
              <i />
              <i />
              <i />
            </span>{" "}
            connect.sh
          </span>
          <span className="chip">
            <span className="dot a" /> porting from design
          </span>
        </div>
        <div className="win-body cmt">
          # the full 3-step connect flow (env vars · BYOK keys · catch first request) is being
          ported from the design comp next.{" "}
          <Link to="/" style={{ color: "var(--accent)" }}>
            ← overview
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
