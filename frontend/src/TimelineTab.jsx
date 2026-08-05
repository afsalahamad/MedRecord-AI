import React, { useState } from "react";
import { FileText, Calendar, Building, Search, Upload, CheckCircle2, ChevronRight } from "lucide-react";
import Citation from "./Citation.jsx";

export default function TimelineTab({
  timeline,
  onOpenSource,
  onOpenUpload
}) {
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { id: "all", label: "All Records" },
    { id: "Discharge Summary", label: "Discharge Summaries" },
    { id: "Specialist Consultation", label: "Consultations" },
    { id: "Progress Note", label: "Progress Notes" },
    { id: "Lab Report", label: "Lab Reports" },
  ];

  const filtered = timeline.filter((doc) => {
    const matchesCategory = filterType === "all" || doc.doc_type?.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      doc.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls Bar */}
      <div className="chart-panel" style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {categories.map((c) => (
              <span
                key={c.id}
                className={`chip ${filterType === c.id ? "chip--active" : ""}`}
                onClick={() => setFilterType(c.id)}
              >
                {c.label}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--ink-muted)" }} />
              <input
                style={{ paddingLeft: 30, width: 220 }}
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn--sm" onClick={onOpenUpload}>
              <Upload size={13} /> Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="chart-panel">
        <div className="chart-panel__header">
          <div>
            <h3 className="chart-panel__title">
              <FileText size={18} /> Chronological Clinical Records ({filtered.length})
            </h3>
            <div className="chart-panel__subtitle">Every extracted fact carries an immutable document provenance pointer</div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-soft)" }}>
            <FileText size={36} style={{ color: "var(--hairline)", marginBottom: 10 }} />
            <p style={{ margin: 0 }}>No clinical documents found matching your filter.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative", paddingLeft: 16 }}>
            {/* Vertical timeline bar line */}
            <div style={{ position: "absolute", left: 6, top: 10, bottom: 10, width: 2, background: "var(--hairline)" }} />

            {filtered.map((doc, idx) => (
              <div key={doc.document_id || idx} style={{ position: "relative", paddingLeft: 24 }}>
                {/* Timeline node dot */}
                <div
                  style={{
                    position: "absolute",
                    left: -14,
                    top: 14,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "var(--accent-teal)",
                    border: "2px solid #FFFFFF",
                    boxShadow: "0 0 0 2px var(--hairline)"
                  }}
                />

                <div style={{ background: "var(--bg-exam)", border: "1px solid var(--hairline)", borderRadius: 8, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, color: "var(--ink)" }}>{doc.filename}</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 12, color: "var(--ink-soft)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={13} />
                          <span className="data-value">{doc.visit_date || "Unknown Date"}</span>
                        </span>
                        <span>•</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Building size={13} />
                          {doc.provider || "Hospital Provider"}
                        </span>
                        <span>•</span>
                        <span className="flag-tab flag-tab--green" style={{ margin: 0, padding: "1px 8px", fontSize: 11 }}>
                          {doc.doc_type || "Clinical Record"}
                        </span>
                      </div>
                    </div>

                    <button className="citation" onClick={() => onOpenSource(doc.document_id, null)}>
                      Inspect Source Text →
                    </button>
                  </div>

                  {doc.notes && (
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 12px", background: "#FFFFFF", padding: "8px 12px", borderRadius: 4, border: "1px solid var(--hairline)" }}>
                      <strong>Clinical Notes:</strong> {doc.notes}
                    </p>
                  )}

                  <div className="grid-2">
                    {/* Medications extracted */}
                    {doc.medications && doc.medications.length > 0 && (
                      <div style={{ background: "#FFFFFF", padding: 12, borderRadius: 6, border: "1px solid var(--hairline)" }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "var(--accent-teal)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Prescribed Medications ({doc.medications.length})
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                          {doc.medications.map((m, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>
                              <strong>{m.name}</strong> <span className="data-value">{m.dosage} {m.frequency}</span>{" "}
                              {m.source && (
                                <Citation
                                  documentId={doc.document_id}
                                  snippet={m.source}
                                  filename={null}
                                  onOpen={onOpenSource}
                                />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Labs extracted */}
                    {doc.lab_results && doc.lab_results.length > 0 && (
                      <div style={{ background: "#FFFFFF", padding: 12, borderRadius: 6, border: "1px solid var(--hairline)" }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "var(--accent-teal)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Extracted Lab Parameters ({doc.lab_results.length})
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                          {doc.lab_results.map((l, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>
                              <strong>{l.test}</strong>:{" "}
                              <span className="data-value" style={{ color: Number(l.value) > l.reference?.[1] ? "var(--flag-red)" : "var(--ink)" }}>
                                {l.value} {l.unit}
                              </span>{" "}
                              <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>(ref {l.reference?.[0]}–{l.reference?.[1]})</span>{" "}
                              {l.source && (
                                <Citation
                                  documentId={doc.document_id}
                                  snippet={l.source}
                                  filename={null}
                                  onOpen={onOpenSource}
                                />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
