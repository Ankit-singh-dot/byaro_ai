import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top Nav */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        borderBottom: "1px solid var(--border-primary)",
        background: "var(--bg-secondary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>◆</span>
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>AstroVault</span>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a href="#architecture" style={{ fontSize: "13px", color: "var(--text-secondary)", textDecoration: "none" }}>Architecture</a>
          <a href="#engine" style={{ fontSize: "13px", color: "var(--text-secondary)", textDecoration: "none" }}>Threat Engine</a>
          <a href="#audit" style={{ fontSize: "13px", color: "var(--text-secondary)", textDecoration: "none" }}>Audit Ledger</a>
          
          <div style={{ borderLeft: "1px solid var(--border-primary)", height: "24px", margin: "0 8px" }}></div>
          
          {!userId ? (
            <SignInButton mode="modal">
              <button className="btn btn-primary" style={{ padding: "8px 16px" }}>Sign In</button>
            </SignInButton>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link href="/dashboard" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                Dashboard
              </Link>
              <UserButton />
            </div>
          )}
        </div>
      </nav>

      <main style={{ flex: 1, overflowY: "auto" }}>
        {/* Hero Section */}
        <section style={{
          padding: "120px 32px 100px",
          textAlign: "center",
          maxWidth: "900px",
          margin: "0 auto",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 12px",
            borderRadius: "100px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginBottom: "32px",
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-green)", display: "inline-block", boxShadow: "0 0 6px var(--accent-green)" }}></span>
            Platform is live and operational
          </div>
          <h1 style={{
            fontSize: "56px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            marginBottom: "24px",
            color: "#fff",
          }}>
            Enterprise-Grade AI Safety Validation
          </h1>
          <p style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "48px",
            maxWidth: "700px",
            margin: "0 auto 48px",
          }}>
            A highly secure adversarial testing infrastructure featuring Red-Team isolation, Gemini-powered semantic threat detection, and immutable cryptographic audit logging.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            {!userId ? (
              <SignInButton mode="modal">
                <button className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "15px" }}>
                  Authenticate to Access
                </button>
              </SignInButton>
            ) : (
              <Link href="/dashboard" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "15px", textDecoration: "none" }}>
                Enter Mission Control
              </Link>
            )}
            <a href="#architecture" className="btn btn-secondary" style={{ padding: "14px 28px", fontSize: "15px", textDecoration: "none" }}>
              Explore Architecture
            </a>
          </div>
        </section>

        {/* Deep Dive: Threat Engine & ML Models */}
        <section id="engine" style={{
          padding: "100px 32px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-primary)",
        }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
            <div>
              <div style={{ color: "var(--accent-blue)", fontWeight: 600, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                Semantic Analysis Layer
              </div>
              <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "24px", letterSpacing: "-0.02em" }}>
                Powered by Gemini 2.5 Flash
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6, marginBottom: "16px" }}>
                Traditional security firewalls rely on brittle regex patterns to block malicious inputs. AstroVault replaces regex with a state-of-the-art Large Language Model (Gemini 2.5 Flash) acting as a dedicated <strong>Threat Classifier</strong>.
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6 }}>
                By evaluating the <em>semantic intent</em> of every prompt, our ML layer detects zero-day prompt injections, role-play jailbreaks, and advanced social engineering attacks dynamically, returning deterministic JSON threat scores in milliseconds.
              </p>
            </div>
            <div style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-secondary)",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-primary)", padding: "16px", borderRadius: "6px", border: "1px solid var(--border-primary)" }}>
                <div style={{ color: "var(--text-muted)", marginBottom: "12px" }}>// Gemini ML Classifier Response</div>
                <div><span style={{ color: "var(--accent-cyan)" }}>"threat_score"</span>: <span style={{ color: "var(--accent-red)" }}>96</span>,</div>
                <div><span style={{ color: "var(--accent-cyan)" }}>"label"</span>: <span style={{ color: "var(--accent-green)" }}>"LABEL_1"</span>,</div>
                <div><span style={{ color: "var(--accent-cyan)" }}>"confidence"</span>: <span style={{ color: "var(--accent-amber)" }}>0.9998</span>,</div>
                <div><span style={{ color: "var(--accent-cyan)" }}>"category"</span>: <span style={{ color: "var(--accent-green)" }}>"PROMPT_INJECTION"</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Flow Section */}
        <section id="architecture" style={{
          padding: "100px 32px",
          borderTop: "1px solid var(--border-primary)",
        }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
              <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "16px", letterSpacing: "-0.02em" }}>Zero-Trust Validation Flow</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
                A completely isolated, multi-container architecture ensuring that attacking services can never bypass the central inspection gateway.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Step 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--accent-red)", marginBottom: "8px" }}>1. Red Team Assault</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Adversarial inputs are launched from an isolated Docker network. Direct communication to the target LLM is physically impossible.
                  </p>
                </div>
                <div style={{ padding: "24px", background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", borderRadius: "8px", borderLeft: "4px solid var(--accent-red)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>POST /api/gateway/submit</div>
                  <div style={{ marginTop: "12px", fontSize: "13px" }}>"Ignore all prior instructions..."</div>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
                <div style={{ padding: "24px", background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", borderRadius: "8px", borderRight: "4px solid var(--accent-cyan)", textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>Network Interception</div>
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>Traffic routed to Threat Engine</div>
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--accent-cyan)", marginBottom: "8px" }}>2. API Gateway Interception</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    The Node.js central gateway intercepts the payload, enforces rate limits, and routes the text to the ML sidecar for validation.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--accent-blue)", marginBottom: "8px" }}>3. LLM Target & Canary Tokens</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    If deemed safe, the prompt reaches the LLM Proxy. The target model generates a response, and the system scans for hidden <strong>Canary Tokens</strong> to detect data exfiltration.
                  </p>
                </div>
                <div style={{ padding: "24px", background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", borderRadius: "8px", borderLeft: "4px solid var(--accent-blue)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>Data Exfiltration Check</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-green)" }}>PASSED</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>No embedded secrets detected.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive: Immutable Audit Ledger */}
        <section id="audit" style={{
          padding: "100px 32px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-primary)",
          borderBottom: "1px solid var(--border-primary)",
        }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
            <div style={{ order: 2 }}>
              <div style={{ color: "var(--accent-amber)", fontWeight: 600, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                Forensic Traceability
              </div>
              <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "24px", letterSpacing: "-0.02em" }}>
                Immutable Audit & Search Ledger
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6, marginBottom: "16px" }}>
                Every action taken in the AstroVault system—from prompt submission to ML scoring and final LLM execution—is logged to an append-only cryptographic ledger.
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6 }}>
                Each log entry is hashed using <strong>SHA-256</strong> and chained to the previous entry. If an attacker breaches the system and attempts to alter a log, the cryptographic chain breaks instantly. Security engineers can use the Dashboard to perform ultra-fast heuristic searches across thousands of chained logs to trace the exact origin of a breach.
              </p>
            </div>
            <div style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-secondary)",
              borderRadius: "12px",
              padding: "32px",
              order: 1,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-primary)", padding: "16px", borderRadius: "6px", border: "1px solid var(--border-primary)" }}>
                <div style={{ color: "var(--text-muted)", marginBottom: "8px" }}>// Block #1408</div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>Prev: <span style={{ color: "var(--text-muted)" }}>a8b4e72c...</span></div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>Hash: <span style={{ color: "var(--accent-amber)" }}>d3f0981a...</span></div>
                
                <div style={{ color: "var(--text-muted)", marginBottom: "8px", marginTop: "16px" }}>// Block #1409</div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>Prev: <span style={{ color: "var(--accent-amber)" }}>d3f0981a...</span></div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>Hash: <span style={{ color: "var(--accent-amber)" }}>f89c1b22...</span></div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer style={{
        padding: "24px 32px",
        background: "var(--bg-primary)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "var(--text-muted)",
        fontSize: "12px"
      }}>
        <div>© 2026 AstroVault Security. All rights reserved.</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <span>SOC 2 Compliant Infrastructure</span>
        </div>
      </footer>
    </div>
  );
}
