import React, { useState } from "react";
import { GitCommit, FileText, Pill, AlertTriangle, ShieldAlert, Filter, ZoomIn } from "lucide-react";
import ProvenanceGraph from "./ProvenanceGraph.jsx";

export default function GraphTab({ graph, onOpenSource }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const docCount = graph.nodes ? graph.nodes.filter((n) => n.type === "document").length : 0;
  const medCount = graph.nodes ? graph.nodes.filter((n) => n.type === "medication").length : 0;
  const conflictCount = graph.edges ? graph.edges.filter((e) => e.type === "conflict").length : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header Summary */}
      <div className="chart-panel" style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 className="chart-panel__title" style={{ margin: 0, padding: 0, border: "none" }}>
              <GitCommit size={18} /> Deterministic Provenance & Conflict Graph
            </h3>
            <div className="chart-panel__subtitle" style={{ marginTop: 4 }}>
              Circular visualizer linking document nodes on the outer ring to resolved drug concepts in the center core.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div className="meta-pill">
              <strong>Document Nodes:</strong> <span className="data-value">{docCount}</span>
            </div>
            <div className="meta-pill">
              <strong>Drug Nodes:</strong> <span className="data-value">{medCount}</span>
            </div>
            <div className="meta-pill" style={{ borderColor: conflictCount > 0 ? "var(--flag-red)" : "var(--hairline)" }}>
              <strong>Conflict Edges:</strong>{" "}
              <span className="data-value" style={{ color: conflictCount > 0 ? "var(--flag-red)" : "var(--flag-green)" }}>
                {conflictCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2-1">
        {/* SVG Graph Surface */}
        <div className="chart-panel" style={{ textAlign: "center", minHeight: 540, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <ProvenanceGraph
            graph={graph}
            onDocumentClick={(docId) => {
              onOpenSource(docId, null);
            }}
          />
        </div>

        {/* Graph Legend & Inspector Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="chart-panel">
            <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--accent-teal)" }}>
              Visual Graph Legend
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 14, height: 14, border: "1.5px solid var(--ink)", borderRadius: 3, background: "#FFFFFF" }} />
                <span><strong>Outer Ring Tiles:</strong> Uploaded Document Sources</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, border: "2px solid var(--accent-teal)", borderRadius: "50%", background: "#FFFFFF" }} />
                <span><strong>Center Core Circles:</strong> Normalized Drug Concepts</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 2, background: "var(--accent-teal)", opacity: 0.6 }} />
                <span><strong>Solid Teal Lines:</strong> Provenance (Prescribed In)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 2.5, borderBottom: "2.5px dashed var(--flag-red)" }} />
                <span><strong>Red Dashed Lines:</strong> High-Severity Dosage Conflict</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 2.5, borderBottom: "2.5px dashed var(--flag-amber)" }} />
                <span><strong>Amber Dashed Lines:</strong> Moderate / Duplicate Alert</span>
              </div>
            </div>
          </div>

          <div className="chart-panel">
            <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--accent-teal)" }}>
              Interactive Node Inspector
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 12px" }}>
              Hover or click on any document node in the graph to preview extracted provenance or launch source text comparison.
            </p>
            <div style={{ background: "var(--bg-exam)", padding: 14, borderRadius: 6, border: "1px solid var(--hairline)" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginBottom: 4 }}>
                Mercy_General_Discharge_Jan2026.pdf
              </div>
              <div className="data-value" style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 8 }}>
                Discharge Summary • Mercy General • 2026-01-15
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                Contains 4 extracted medications and 3 lab parameters. Disagrees with Nephrology Consult on Lisinopril dosing.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
