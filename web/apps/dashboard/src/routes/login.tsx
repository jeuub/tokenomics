import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <div
      className="app"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center" }}>
          <span className="wordmark" style={{ fontSize: 24 }}>
            tokenomics
          </span>
          <span className="at"> @web</span>
        </div>
        <div className="win" style={{ marginTop: 18 }}>
          <div className="win-bar">
            <span className="win-title">
              <span className="win-dots">
                <i />
                <i />
                <i />
              </span>{" "}
              auth.sh
            </span>
            <span className="chip">
              <span className="dot g" /> encrypted session
            </span>
          </div>
          <div className="win-body cmt" style={{ lineHeight: 1.8 }}>
            # sign-in &amp; token provisioning is being ported from the Login design comp. API-key
            mode · BYOK · keys encrypted · no training on your data.
            <div style={{ marginTop: 14 }}>
              <Link className="btn solid" to="/">
                [ open dashboard ▸ ]
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
