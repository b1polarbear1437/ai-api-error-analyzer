import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are an expert API error analyst and debugging specialist. Your job is to analyze API error messages and logs, then provide a clear, structured breakdown that any developer (junior or senior) can understand and act on.

When given an API error or log, always respond with a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "errorType": "Short name for the error type (e.g., '401 Unauthorized', 'Rate Limit Exceeded', 'DNS Timeout')",
  "severity": "critical | high | medium | low",
  "shortExplanation": "1-2 sentence plain-English explanation of what went wrong and why it matters",
  "possibleCauses": [
    "Cause 1 - be specific and actionable",
    "Cause 2",
    "Cause 3"
  ],
  "troubleshootingSteps": [
    "Step 1 - numbered, actionable instruction",
    "Step 2",
    "Step 3",
    "Step 4"
  ],
  "exampleFix": "A short code snippet or curl command illustrating the fix. Use plain text, not markdown."
}

Be concise but thorough. Focus on practical, immediately actionable advice. Speak to developers directly.`;

const ErrorBadge = ({ severity }) => {
  const config = {
    critical: { bg: "#ff2d55", label: "CRITICAL" },
    high: { bg: "#ff6b00", label: "HIGH" },
    medium: { bg: "#f5c400", label: "MEDIUM" },
    low: { bg: "#00c896", label: "LOW" },
  };
  const c = config[severity] || config.medium;
  return (
    <span style={{
      background: c.bg,
      color: severity === "medium" ? "#000" : "#fff",
      fontSize: "10px",
      fontWeight: 800,
      letterSpacing: "0.12em",
      padding: "3px 8px",
      borderRadius: "3px",
      fontFamily: "'Space Mono', monospace",
    }}>{c.label}</span>
  );
};

const EXAMPLES = [
  {
    label: "401 Unauthorized",
    value: `HTTP/1.1 401 Unauthorized\nContent-Type: application/json\n\n{"error": "invalid_token", "error_description": "The access token expired", "status": 401}`
  },
  {
    label: "429 Rate Limit",
    value: `429 Too Many Requests\nX-RateLimit-Limit: 100\nX-RateLimit-Remaining: 0\nX-RateLimit-Reset: 1711900800\nRetry-After: 60\n\n{"message": "API rate limit exceeded for IP 203.0.113.42. Please wait before retrying."}`
  },
  {
    label: "500 Server Error",
    value: `[ERROR] 2024-03-25T14:22:01Z POST /api/v2/checkout HTTP/1.1 500\nInternal Server Error: NullPointerException at PaymentService.java:142\njava.lang.NullPointerException: Cannot invoke method charge() on null object\n  at com.example.PaymentService.processPayment(PaymentService.java:142)\n  at com.example.CheckoutController.checkout(CheckoutController.java:89)`
  },
  {
    label: "CORS / 403 Forbidden",
    value: `Access to fetch at 'https://api.example.com/data' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.\nHTTP Status: 403 Forbidden`
  },
  {
    label: "Connection Timeout",
    value: `Error: connect ETIMEDOUT 52.86.11.194:443\n  at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1148:16)\nRequest URL: https://payments.api.io/v3/transactions\nTimeout after: 30000ms\ncurl: (28) Operation timed out after 30001 milliseconds with 0 bytes received`
  }
];

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (result) {
      setAnimIn(false);
      setTimeout(() => setAnimIn(true), 50);
    }
  }, [result]);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
 const response = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Analyze this API error or log:\n\n${input}` }]
  })
});

if (!response.ok) {
  const errorText = await response.text();
  console.error("Anthropic API error:", errorText);
  throw new Error(errorText);
}

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      let parsed;

try {
  parsed = JSON.parse(cleaned);
} catch (err) {
  console.error("JSON parsing failed:", cleaned);
  setError("AI returned invalid JSON. Try again.");
  return;
}
      setResult(parsed);
    } catch (e) {
      setError("Failed to analyze. Make sure you pasted a valid error message or log.");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (ex) => {
    setInput(ex.value);
    setResult(null);
    setError("");
    textareaRef.current?.focus();
  };

  const copyResult = () => {
    if (!result) return;
    const text = `ERROR TYPE: ${result.errorType}\nSEVERITY: ${result.severity?.toUpperCase()}\n\nSHORT EXPLANATION\n${result.shortExplanation}\n\nPOSSIBLE CAUSES\n${result.possibleCauses?.map((c,i)=>`${i+1}. ${c}`).join("\n")}\n\nRECOMMENDED TROUBLESHOOTING STEPS\n${result.troubleshootingSteps?.map((s,i)=>`${i+1}. ${s}`).join("\n")}${result.exampleFix ? `\n\nEXAMPLE FIX\n${result.exampleFix}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#e8e4d9",
      padding: "0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #ff6b00; color: #000; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        textarea { resize: none; }
        .analyze-btn {
          background: #ff6b00;
          color: #000;
          border: none;
          padding: 14px 36px;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.1em;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.15s ease;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .analyze-btn:hover:not(:disabled) { background: #ff9a40; transform: translateY(-1px); }
        .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .example-btn {
          background: transparent;
          border: 1px solid #2a2a35;
          color: #888;
          padding: 6px 14px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 2px;
        }
        .example-btn:hover { border-color: #ff6b00; color: #ff6b00; }
        .result-card {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .result-card.in { opacity: 1; transform: translateY(0); }
        .copy-btn {
          background: transparent;
          border: 1px solid #2a2a35;
          color: #666;
          padding: 6px 14px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.08em;
        }
        .copy-btn:hover { border-color: #555; color: #aaa; }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .section-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #ff6b00;
          text-transform: uppercase;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, #2a2a35, transparent);
        }
      `}</style>

      {/* Header */}
      {/* Header */}
        <div style={{
          borderBottom: "1px solid #1a1a22",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0a0a0f",
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",  // ← ADD THIS
        }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "22px",
            letterSpacing: "0.06em",
            color: "#fff",
          }}>API ERROR ANALYZER</span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            color: "#ff6b00",
            letterSpacing: "0.15em",
            background: "rgba(255,107,0,0.1)",
            border: "1px solid rgba(255,107,0,0.3)",
            padding: "2px 8px",
          }}>AI-POWERED</span>
        </div>
        <div style={{ fontFamily: "'DM Mono'", fontSize: "10px", color: "#444", letterSpacing: "0.1em" }}>
          PASTE → ANALYZE → FIX
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px 80px", width: "100%" }}>

        {/* Hero */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(42px, 8vw, 88px)",
            lineHeight: 0.92,
            letterSpacing: "0.02em",
            color: "#fff",
            marginBottom: "16px",
          }}>
            DECODE ANY<br />
            <span style={{ color: "#ff6b00" }}>API ERROR</span><br />
            INSTANTLY
          </h1>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "13px",
            color: "#666",
            maxWidth: "520px",
            lineHeight: 1.7,
            letterSpacing: "0.03em",
          }}>
            Paste an HTTP error, stack trace, or API log. Get a plain-English breakdown with root causes and step-by-step fixes — no guessing required.
          </p>
        </div>

        {/* Example Pills */}
        <div style={{ marginBottom: "20px" }}>
          <div className="section-label" style={{ marginBottom: "12px" }}>Load an example</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {EXAMPLES.map((ex) => (
              <button key={ex.label} className="example-btn" onClick={() => loadExample(ex)}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div style={{
          border: "1px solid #2a2a35",
          background: "#0d0d14",
          marginBottom: "20px",
          position: "relative",
          transition: "border-color 0.2s",
        }}>
          <div style={{
            borderBottom: "1px solid #1a1a22",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff2d55", display: "block" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f5c400", display: "block" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00c896", display: "block" }} />
            <span style={{ fontFamily: "'DM Mono'", fontSize: "10px", color: "#444", marginLeft: "8px", letterSpacing: "0.1em" }}>
              error.log
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"Paste your API error, HTTP response, or stack trace here...\n\nExample:\n  HTTP 401 Unauthorized\n  {\"error\": \"token_expired\", \"message\": \"JWT has expired\"}"}
            rows={10}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#c8f0a0",
              fontFamily: "'DM Mono', monospace",
              fontSize: "13px",
              lineHeight: "1.8",
              padding: "20px",
              letterSpacing: "0.02em",
            }}
            onKeyDown={e => { if (e.ctrlKey && e.key === "Enter") analyze(); }}
          />
          <div style={{
            padding: "12px 20px",
            borderTop: "1px solid #1a1a22",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontFamily: "'DM Mono'", fontSize: "10px", color: "#333", letterSpacing: "0.08em" }}>
              {input.length > 0 ? `${input.length} chars` : "Ctrl+Enter to analyze"}
            </span>
            <button
              className="analyze-btn"
              onClick={analyze}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <span className="pulse">ANALYZING...</span>
              ) : "→ ANALYZE ERROR"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            border: "1px solid rgba(255,45,85,0.4)",
            background: "rgba(255,45,85,0.08)",
            padding: "14px 20px",
            fontFamily: "'DM Mono'",
            fontSize: "12px",
            color: "#ff6b8a",
            marginBottom: "24px",
            letterSpacing: "0.04em",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ marginTop: "32px" }}>
            {[180, 120, 200].map((h, i) => (
              <div key={i} style={{
                height: `${h}px`,
                background: "linear-gradient(90deg, #111 25%, #1a1a22 50%, #111 75%)",
                backgroundSize: "200% 100%",
                animation: `shimmer 1.5s infinite ${i * 0.2}s`,
                marginBottom: "16px",
                borderRadius: "2px",
              }} />
            ))}
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`result-card ${animIn ? "in" : ""}`} style={{ marginTop: "32px" }}>

            {/* Error Type Header */}
            <div style={{
              background: "#0d0d14",
              border: "1px solid #2a2a35",
              borderBottom: "none",
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "12px",
            }}>
              <div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: "10px", color: "#444", letterSpacing: "0.2em", marginBottom: "8px" }}>
                  ERROR IDENTIFIED
                </div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(24px, 4vw, 38px)",
                  letterSpacing: "0.04em",
                  color: "#fff",
                  lineHeight: 1,
                }}>
                  {result.errorType}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <ErrorBadge severity={result.severity} />
                <button className="copy-btn" onClick={copyResult}>
                  {copied ? "✓ COPIED" : "COPY REPORT"}
                </button>
              </div>
            </div>

            {/* Short Explanation */}
            <div style={{
              background: "rgba(255,107,0,0.07)",
              border: "1px solid rgba(255,107,0,0.25)",
              borderBottom: "none",
              padding: "20px 28px",
            }}>
              <div className="section-label">Short Explanation</div>
              <p style={{
                fontFamily: "'DM Mono'",
                fontSize: "14px",
                color: "#e8e4d9",
                lineHeight: 1.75,
                letterSpacing: "0.02em",
              }}>{result.shortExplanation}</p>
            </div>

            {/* Two Column: Causes + Steps */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              border: "1px solid #2a2a35",
              borderBottom: "none",
            }}>
              {/* Causes */}
              <div style={{
                background: "#0d0d14",
                padding: "24px 28px",
                borderRight: "1px solid #2a2a35",
              }}>
                <div className="section-label">Possible Causes</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {result.possibleCauses?.map((cause, i) => (
                    <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{
                        fontFamily: "'Space Mono'",
                        fontSize: "10px",
                        color: "#ff6b00",
                        minWidth: "18px",
                        marginTop: "2px",
                        fontWeight: 700,
                      }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ fontFamily: "'DM Mono'", fontSize: "12px", color: "#c8c4b8", lineHeight: 1.65 }}>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div style={{ background: "#0a0a0f", padding: "24px 28px" }}>
                <div className="section-label">Troubleshooting Steps</div>
                <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {result.troubleshootingSteps?.map((step, i) => (
                    <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{
                        background: "#1a1a22",
                        border: "1px solid #2a2a35",
                        fontFamily: "'Space Mono'",
                        fontSize: "9px",
                        color: "#888",
                        minWidth: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "1px",
                        flexShrink: 0,
                      }}>{i + 1}</span>
                      <span style={{ fontFamily: "'DM Mono'", fontSize: "12px", color: "#c8c4b8", lineHeight: 1.65 }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>


            {/* Code Example */}
            {result.exampleFix && (
              <div style={{
                background: "#050508",
                border: "1px solid #2a2a35",
                padding: "20px 28px",
              }}>
                <div className="section-label" style={{ marginBottom: "14px" }}>Example Fix</div>
                <pre style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  color: "#c8f0a0",
                  lineHeight: 1.8,
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>{result.exampleFix}</pre>
              </div>
            )}
          </div>
        )}

        {/* Info Footer */}
        {!result && !loading && (
          <div style={{ marginTop: "64px", borderTop: "1px solid #1a1a22", paddingTop: "40px" }}>
            <div className="section-label" style={{ marginBottom: "24px" }}>Supported Error Types</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
            }}>
              {[
                ["400", "Bad Request"],
                ["401", "Unauthorized"],
                ["403", "Forbidden"],
                ["404", "Not Found"],
                ["429", "Rate Limited"],
                ["500", "Server Error"],
                ["502", "Bad Gateway"],
                ["CORS", "Policy Blocked"],
                ["TIMEOUT", "Connection Dead"],
                ["DNS", "Resolution Failed"],
                ["JWT", "Token Issues"],
                ["SSL", "Cert Errors"],
              ].map(([code, label]) => (
                <div key={code} style={{
                  background: "#0d0d14",
                  border: "1px solid #1a1a22",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "border-color 0.15s",
                  cursor: "default",
                }}>
                  <span style={{
                    fontFamily: "'Space Mono'",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#ff6b00",
                    minWidth: "50px",
                  }}>{code}</span>
                  <span style={{ fontFamily: "'DM Mono'", fontSize: "11px", color: "#666" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
