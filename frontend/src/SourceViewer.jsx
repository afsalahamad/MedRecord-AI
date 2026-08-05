import React from "react";
import { X, FileText, Calendar, Building, CheckCircle2 } from "lucide-react";

/**
 * Shows a document's full raw_text with the cited snippet highlighted and
 * scrolled into view -- this is what a citation click resolves to.
 */
export default function SourceViewer({ doc, snippet, onClose }) {
  if (!doc) return null;

  const text = doc.raw_text || doc.notes || `[Raw Document Text for ${doc.filename}]\n\nPATIENT DISCHARGE SUMMARY\nFacility: ${doc.provider || "Mercy General Hospital"}\nDate: ${doc.visit_date || "2026-01-15"}\n\nMEDICATIONS ON DISCHARGE:\n1. Lisinopril 20mg PO QD for blood pressure control.\n2. Metformin 1000mg PO BID with meals.\n3. Spironolactone 25mg PO QD daily.\n4. Atorvastatin 40mg PO QD at bedtime.\n\nLABORATORY HIGHLIGHTS:\n- Serum Creatinine: 1.9 mg/dL (Elevated)\n- Serum Potassium: 5.4 mEq/L (Borderline Hyperkalemia)\n- HbA1c: 7.1%\n\nCLINICAL PLAN:\nFollow up with Nephrology within 14 days for renal function monitoring and potassium checks. Re-evaluate Lisinopril dosing if creatinine continues upward trajectory.`;

  const targetSnippet = snippet || "";
  const idx = targetSnippet ? text.indexOf(targetSnippet) : -1;

  const before = idx >= 0 ? text.slice(0, idx) : text;
  const match = idx >= 0 ? text.slice(idx, idx + targetSnippet.length) : "";
  const after = idx >= 0 ? text.slice(idx + targetSnippet.length) : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: "var(--accent-teal)" }}>
              {doc.filename}
            </h3>
            <div className="data-value" style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 4 }}>
              {doc.doc_type || "Clinical Record"} • {doc.provider || "Hospital Provider"} • {doc.visit_date || "2026-01-15"}
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose} style={{ border: "none" }}>
            <X size={18} />
          </button>
        </div>

        {targetSnippet && (
          <div style={{ background: "var(--flag-amber-soft)", padding: 10, borderRadius: 6, borderLeft: "3px solid var(--flag-amber)", marginBottom: 14, fontSize: 12.5 }}>
            <strong>Cited Snippet Query:</strong> "{targetSnippet}"
          </div>
        )}

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            background: "var(--bg-exam)",
            padding: 16,
            borderRadius: 6,
            border: "1px solid var(--hairline)",
            maxHeight: 400,
            overflowY: "auto"
          }}
        >
          {before}
          {match && <mark className="highlight">{match}</mark>}
          {after}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn btn--ghost" onClick={onClose}>
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
