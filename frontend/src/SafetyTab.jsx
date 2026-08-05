import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Info, ExternalLink, RefreshCw } from "lucide-react";
import Citation from "./Citation.jsx";

export default function SafetyTab({
  interactions,
  conflicts,
  onLoadInteractions,
  onLoadConflicts,
  onOpenSource,
  onOpenConflictDetail
}) {
  const [activeSeverity, setActiveSeverity] = useState("all");

  const interactionList = interactions?.interactions || [];
  const conflictList = conflicts?.conflicts || [];

  const filteredConflicts = conflictList.filter((c) => {
    if (activeSeverity === "all") return true;
    if (activeSeverity === "red") return c.severity === "red";
    if (activeSeverity === "amber") return c.severity === "amber";
    if (activeSeverity === "green") return c.severity === "green";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Action Header */}
      <div className="chart-panel" style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 className="chart-panel__title" style={{ margin: 0, padding: 0, border: "none" }}>
              <ShieldAlert size={18} /> Ground-Truth Drug Safety & Conflict Engine
            </h3>
            <div className="chart-panel__subtitle" style={{ marginTop: 4 }}>
              Integrates NIH RxNav interaction database with deterministic rules engine for dosage & duplicate therapy auditing.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn--ghost btn--sm" onClick={onLoadInteractions}>
              <RefreshCw size={13} /> Re-Run RxNav Interactions
            </button>
            <button className="btn btn--sm" onClick={onLoadConflicts}>
              <RefreshCw size={13} /> Re-Run Conflict Engine
            </button>
          </div>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className="chip" style={{ fontWeight: 600, border: "none", cursor: "default" }}>
          Filter Severity:
        </span>
        <span
          className={`chip ${activeSeverity === "all" ? "chip--active" : ""}`}
          onClick={() => setActiveSeverity("all")}
        >
          All Issues ({conflictList.length + interactionList.length})
        </span>
        <span
          className={`chip ${activeSeverity === "red" ? "chip--active" : ""}`}
          style={{ borderColor: "var(--flag-red)", color: activeSeverity === "red" ? "#FFF" : "var(--flag-red)" }}
          onClick={() => setActiveSeverity("red")}
        >
          Critical High Risk ({conflictList.filter(c => c.severity === "red").length})
        </span>
        <span
          className={`chip ${activeSeverity === "amber" ? "chip--active" : ""}`}
          style={{ borderColor: "var(--flag-amber)", color: activeSeverity === "amber" ? "#FFF" : "var(--flag-amber)" }}
          onClick={() => setActiveSeverity("amber")}
        >
          Moderate Warnings ({conflictList.filter(c => c.severity === "amber").length})
        </span>
      </div>

      <div className="grid-2">
        {/* Ground Truth Drug-Drug Interactions */}
        <div className="chart-panel">
          <div className="chart-panel__header">
            <div>
              <h3 className="chart-panel__title" style={{ fontSize: 15 }}>
                <ShieldAlert size={16} /> NIH RxNav Ground-Truth Interactions
              </h3>
              <div className="chart-panel__subtitle">Non-LLM deterministic drug interaction query</div>
            </div>
          </div>

          {interactionList.length === 0 ? (
            <div style={{ padding: "20px 0", color: "var(--ink-soft)" }}>
              No high-severity drug-drug interactions detected by RxNav.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {interactionList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: item.severity_color === "red" ? "var(--flag-red-soft)" : "var(--flag-amber-soft)",
                    borderLeft: `4px solid ${item.severity_color === "red" ? "var(--flag-red)" : "var(--flag-amber)"}`,
                    borderRadius: 6,
                    padding: 14
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 14, color: item.severity_color === "red" ? "var(--flag-red)" : "var(--flag-amber)" }}>
                      {item.drugs ? item.drugs.join(" + ") : "Interaction"}
                    </strong>
                    <span className={`flag-tab flag-tab--${item.severity_color || "amber"}`} style={{ margin: 0 }}>
                      {item.severity || "Risk Alert"}
                    </span>
                  </div>

                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink)" }}>
                    {item.detail || item.mechanism}
                  </p>

                  {item.recommendation && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-soft)", fontWeight: 500 }}>
                      💡 <strong>Clinical Action:</strong> {item.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {interactions?.explanation && (
            <div className="disclaimer" style={{ fontSize: 12.5, lineHeight: 1.6, background: "var(--bg-exam)", padding: 12, borderRadius: 6, marginTop: 16 }}>
              <strong>AI Narrative Synthesis:</strong>
              <p style={{ margin: "4px 0 0" }}>{interactions.explanation}</p>
            </div>
          )}
        </div>

        {/* Deterministic Conflict Engine */}
        <div className="chart-panel">
          <div className="chart-panel__header">
            <div>
              <h3 className="chart-panel__title" style={{ fontSize: 15 }}>
                <AlertTriangle size={16} /> Cross-Document Conflict Engine
              </h3>
              <div className="chart-panel__subtitle">Dosage, frequency, & duplicate therapy detector</div>
            </div>
          </div>

          {filteredConflicts.length === 0 ? (
            <div style={{ padding: "20px 0", color: "var(--ink-soft)" }}>
              No medication conflicts flagged for this severity level.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredConflicts.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--bg-exam)",
                    border: "1px solid var(--hairline)",
                    borderLeft: `4px solid ${c.severity === "red" ? "var(--flag-red)" : "var(--flag-amber)"}`,
                    borderRadius: 6,
                    padding: 14
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`flag-tab flag-tab--${c.severity || "amber"}`} style={{ margin: 0 }}>
                        {c.type.replace("_", " ").toUpperCase()}
                      </span>
                      <strong style={{ fontSize: 14 }}>{c.drug}</strong>
                    </div>

                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => onOpenConflictDetail(c)}
                    >
                      Audit Details →
                    </button>
                  </div>

                  <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ink)" }}>
                    {c.detail}
                  </p>

                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>Document Sources:</span>
                    {c.document_ids?.map((docId) => (
                      <Citation key={docId} documentId={docId} snippet={null} filename={null} onOpen={onOpenSource} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {conflicts?.explanation && (
            <div className="disclaimer" style={{ fontSize: 12.5, lineHeight: 1.6, background: "var(--bg-exam)", padding: 12, borderRadius: 6, marginTop: 16 }}>
              <strong>Conflict Mitigation Protocol:</strong>
              <p style={{ margin: "4px 0 0" }}>{conflicts.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
