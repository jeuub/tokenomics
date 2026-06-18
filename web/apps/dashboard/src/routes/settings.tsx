import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  return (
    <AppShell active="settings" crumb="settings">
      <h1 className="t">settings</h1>
      <p className="sub">
        # account · tokens · provider keys · billing · data &amp; privacy · deployment · danger
        zone.
      </p>
      <div className="win">
        <div className="win-bar">
          <span className="win-title">
            <span className="win-dots">
              <i />
              <i />
              <i />
            </span>{" "}
            settings.sh
          </span>
          <span className="chip">
            <span className="dot a" /> porting from design
          </span>
        </div>
        <div className="win-body cmt">
          # the settings sub-pages (account/team · tokens · providers · billing · privacy ·
          deployment · danger) are being ported from the design comp next.{" "}
          <Link to="/" style={{ color: "var(--accent)" }}>
            ← overview
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
