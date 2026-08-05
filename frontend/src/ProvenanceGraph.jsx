import React, { useMemo, useState } from "react";

const SEVERITY_COLOR = {
  red: "var(--flag-red)",
  amber: "var(--flag-amber)",
  green: "var(--flag-green)",
};

/**
 * Custom force-free circular layout: documents on the outer ring
 * (chronological order, like pages fanned out), medications clustered
 * in the center. Provenance edges (doc -> medication) are thin teal
 * lines; conflict edges (doc <-> doc, same drug) are thick colored
 * arcs so disagreement is visually loud without needing a legend.
 */
export default function ProvenanceGraph({ graph, onDocumentClick }) {
  const [hovered, setHovered] = useState(null);

  const { docNodes, medNodes, positions } = useMemo(() => {
    const docNodes = graph.nodes.filter((n) => n.type === "document");
    const medNodes = graph.nodes.filter((n) => n.type === "medication");

    const cx = 300, cy = 260;
    const docRadius = 210, medRadius = 90;
    const positions = {};

    docNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(docNodes.length, 1) - Math.PI / 2;
      positions[n.id] = { x: cx + docRadius * Math.cos(angle), y: cy + docRadius * Math.sin(angle) };
    });
    medNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(medNodes.length, 1) - Math.PI / 2;
      positions[n.id] = { x: cx + medRadius * Math.cos(angle), y: cy + medRadius * Math.sin(angle) };
    });

    return { docNodes, medNodes, positions };
  }, [graph]);

  if (docNodes.length === 0) {
    return <p style={{ color: "var(--ink-soft)" }}>Upload documents to see the provenance graph.</p>;
  }

  const provenanceEdges = graph.edges.filter((e) => e.type === "provenance");
  const conflictEdges = graph.edges.filter((e) => e.type === "conflict");

  return (
    <div>
      <svg viewBox="0 0 600 520" width="100%" style={{ maxWidth: 620, display: "block", margin: "0 auto" }}>
        {/* Provenance edges: document -> medication */}
        {provenanceEdges.map((e, i) => {
          const a = positions[e.source], b = positions[e.target];
          if (!a || !b) return null;
          const active = hovered && (hovered === e.source || hovered === e.target);
          return (
            <line
              key={`prov-${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="var(--accent-teal)"
              strokeOpacity={active ? 0.9 : 0.25}
              strokeWidth={active ? 2 : 1}
            />
          );
        })}

        {/* Conflict edges: document <-> document, colored by severity */}
        {conflictEdges.map((e, i) => {
          const a = positions[e.source], b = positions[e.target];
          if (!a || !b) return null;
          const active = hovered && (hovered === e.source || hovered === e.target);
          return (
            <line
              key={`conf-${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={SEVERITY_COLOR[e.severity] || "var(--flag-amber)"}
              strokeWidth={active ? 4 : 2.5}
              strokeDasharray="6 4"
              opacity={active ? 1 : 0.75}
            >
              <title>{e.detail}</title>
            </line>
          );
        })}

        {/* Medication nodes (center cluster) */}
        {medNodes.map((n) => {
          const p = positions[n.id];
          return (
            <g key={n.id} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}>
              <circle cx={p.x} cy={p.y} r={10} fill="var(--bg-chart)" stroke="var(--accent-teal)" strokeWidth={2} />
              <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink)">
                {n.label}
              </text>
            </g>
          );
        })}

        {/* Document nodes (outer ring) */}
        {docNodes.map((n) => {
          const p = positions[n.id];
          return (
            <g
              key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onDocumentClick && onDocumentClick(n.id.replace("doc-", ""))}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={p.x - 46} y={p.y - 16} width={92} height={32} rx={3}
                fill="var(--bg-chart)" stroke="var(--ink)" strokeWidth={1.2}
              />
              <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize={10} fontFamily="var(--font-sans)" fill="var(--ink)">
                {n.label.length > 16 ? n.label.slice(0, 14) + "…" : n.label}
              </text>
              <text x={p.x} y={p.y + 11} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--ink-soft)">
                {n.visit_date || n.doc_type}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center" }}>
        Dashed lines = conflicts between documents (color = severity). Solid teal lines = provenance
        (which document a medication came from). Click a document tile to view its source text.
      </p>
    </div>
  );
}
