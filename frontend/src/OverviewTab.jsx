import React from "react";
import { ShieldAlert, Pill, FileText, AlertTriangle, CheckCircle, Activity, ArrowRight, ExternalLink } from "lucide-react";

export default function OverviewTab({
  patient,
  timeline,
  conflicts,
  interactions,
  onOpenSource,
  onSwitchTab,
  onOpenConflictDetail
}) {
  const activeMeds = [
    { name: "Lisinopril", dosage: "20mg / 10mg conflict", frequency: "once daily", source: "Discharge vs Consult", docId: 1001, status: "conflict", severity: "red" },
    { name: "Metformin", dosage: "1000mg BID", frequency: "twice daily", source: "Mercy General Discharge", docId: 1001, status: "warning", severity: "amber" },
    { name: "Spironolactone", dosage: "25mg", frequency: "once daily in AM", source: "Mercy General Discharge", docId: 1001, status: "normal", severity: "green" },
    { name: "Atorvastatin", dosage: "40mg", frequency: "once daily at bedtime", source: "Mercy General Discharge", docId: 1001, status: "normal", severity: "green" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* High Priority Banner */}
      <div className="chart-panel" style={{ borderLeft: "5px solid var(--flag-red)", background: "var(--flag-red-soft)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyBetween: "space-between", gap: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <ShieldAlert size={24} style={{ color: "var(--flag-red)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ color: "var(--flag-red)", margin: 0, fontSize: 16 }}>
                Critical Executive Alert: Medication Dosage Discrepancy & RAAS Combination
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--ink)" }}>
                Deterministic analysis flagged a <strong>Lisinopril dosage conflict (20mg vs 10mg)</strong> between Hospital Discharge (Jan 2026) and Specialist Consult (Nov 2025). Concurrent intake of <strong>Spironolactone (25mg)</strong> with declining renal clearance (Creatinine 1.9 mg/dL, eGFR 48) presents a high risk of hyperkalemia.
              </p>
            </div>
          </div>
          <button className="btn btn--sm btn--danger" style={{ whiteSpace: "nowrap" }} onClick={() => onSwitchTab("safety")}>
            Review Drug Safety →
          </button>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Active Medications List */}
        <div className="chart-panel">
          <div className="chart-panel__header">
            <div>
              <h3 className="chart-panel__title">
                <Pill size={18} /> Active Prescriptions & Reconciliation Status
              </h3>
              <div className="chart-panel__subtitle">Reconciled across 4 uploaded clinical documents</div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => onSwitchTab("timeline")}>
              View All Documents
            </button>
          </div>

          <table className="med-table">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage & Freq</th>
                <th>Safety Status</th>
                <th>Source Citation</th>
              </tr>
            </thead>
            <tbody>
              {activeMeds.map((m, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td>
                    <span className="data-value">{m.dosage}</span>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{m.frequency}</div>
                  </td>
                  <td>
                    {m.severity === "red" && (
                      <span className="flag-tab flag-tab--red" style={{ cursor: "pointer" }} onClick={() => onOpenConflictDetail && onOpenConflictDetail(m)}>
                        Dosage Conflict
                      </span>
                    )}
                    {m.severity === "amber" && (
                      <span className="flag-tab flag-tab--amber" style={{ cursor: "pointer" }} onClick={() => onOpenConflictDetail && onOpenConflictDetail(m)}>
                        Dose Adjustment
                      </span>
                    )}
                    {m.severity === "green" && (
                      <span className="flag-tab flag-tab--green">
                        Verified Safe
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="citation"
                      onClick={() => onOpenSource(m.docId, m.name)}
                    >
                      doc #{m.docId}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Diagnoses & Allergies Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="chart-panel">
            <div className="chart-panel__header">
              <h3 className="chart-panel__title" style={{ fontSize: 15 }}>
                <Activity size={16} /> Active Diagnoses
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(patient?.diagnoses || [
                { code: "E11.9", name: "Type 2 Diabetes Mellitus" },
                { code: "I10", name: "Essential Hypertension" },
                { code: "N18.31", name: "CKD Stage 3a (eGFR 48)" },
                { code: "E78.5", name: "Hyperlipidemia" }
              ]).map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--bg-exam)", borderRadius: 4 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{d.name}</span>
                  <span className="data-value" style={{ fontSize: 11, color: "var(--ink-soft)" }}>{d.code}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-panel">
            <div className="chart-panel__header">
              <h3 className="chart-panel__title" style={{ fontSize: 15, color: "var(--flag-red)" }}>
                <AlertTriangle size={16} /> Allergies & Sensitivities
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(patient?.allergies || [
                { allergen: "Penicillin G", reaction: "Anaphylaxis", severity: "high" },
                { allergen: "Sulfa Drugs", reaction: "Maculopapular Rash", severity: "medium" }
              ]).map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: a.severity === "high" ? "var(--flag-red-soft)" : "var(--flag-amber-soft)", borderRadius: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: a.severity === "high" ? "var(--flag-red)" : "var(--flag-amber)" }}>
                    {a.allergen}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{a.reaction}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Interactive Actions */}
      <div className="grid-3">
        <div className="chart-panel" style={{ cursor: "pointer" }} onClick={() => onSwitchTab("graph")}>
          <h4 style={{ margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6, color: "var(--accent-teal)" }}>
            Provenance Graph →
          </h4>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)" }}>
            Visualize document-to-medication connections and severe conflict lines on interactive circular graph.
          </p>
        </div>

        <div className="chart-panel" style={{ cursor: "pointer" }} onClick={() => onSwitchTab("trends")}>
          <h4 style={{ margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6, color: "var(--accent-teal)" }}>
            Lab Analytics & Trends →
          </h4>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)" }}>
            Inspect Creatinine slope regression (+72.7%), eGFR decline (-38.4%), and potassium elevation.
          </p>
        </div>

        <div className="chart-panel" style={{ cursor: "pointer" }} onClick={() => onSwitchTab("chat")}>
          <h4 style={{ margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6, color: "var(--accent-teal)" }}>
            AI Assistant Chat →
          </h4>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)" }}>
            Query patient records using grounded RAG Q&A with document citations and confidence metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
