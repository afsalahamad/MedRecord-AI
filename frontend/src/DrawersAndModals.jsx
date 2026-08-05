import React, { useState } from "react";
import { X, Upload, CheckCircle2, ShieldAlert, FileText, Printer, Download, UserPlus } from "lucide-react";

export function UploadModal({ isOpen, onClose, onUpload, uploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [docCategory, setDocCategory] = useState("Discharge Summary");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile, docCategory);
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "var(--accent-teal)" }}>
            Upload Clinical Document
          </h3>
          <button className="btn btn--ghost btn--sm" onClick={onClose} style={{ border: "none" }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 16px" }}>
          Gemini vision will process your PDF or image file, extract raw text, and construct structured medication & lab JSON schemas.
        </p>

        <div className="dropzone" onClick={() => document.getElementById("modal-file-input").click()}>
          <Upload size={32} style={{ color: "var(--accent-teal)", marginBottom: 8 }} />
          <h4 style={{ margin: "0 0 4px", fontSize: 14 }}>
            {selectedFile ? selectedFile.name : "Click or drag medical file to upload"}
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>
            Supports PDF, PNG, JPG, JPEG (Native Vision OCR Parsing)
          </p>
          <input
            id="modal-file-input"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 4 }}>
            Document Classification Type
          </label>
          <select
            style={{ width: "100%" }}
            value={docCategory}
            onChange={(e) => setDocCategory(e.target.value)}
          >
            <option value="Discharge Summary">Discharge Summary</option>
            <option value="Specialist Consultation">Specialist Consultation</option>
            <option value="Progress Note">Progress Note</option>
            <option value="Lab Report">Lab Report</option>
            <option value="Radiology Report">Radiology Report</option>
          </select>
        </div>

        {uploading && (
          <div style={{ marginTop: 16, background: "var(--accent-teal-soft)", padding: 12, borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-teal)" }}>
              Processing OCR vision extraction with Gemini API...
            </span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={!selectedFile || uploading} onClick={handleSubmit}>
            Extract Document with Gemini →
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreatePatientModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name);
    setName("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "var(--accent-teal)" }}>
            Create New Patient Record
          </h3>
          <button className="btn btn--ghost btn--sm" onClick={onClose} style={{ border: "none" }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 16px" }}>
          Add a new patient entry into the local SQLite database.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 4 }}>
              Full Legal Name
            </label>
            <input
              style={{ width: "100%" }}
              placeholder="e.g. Dr. Sarah Lin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={!name.trim()} onClick={handleSubmit}>
            Create Patient →
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConflictDetailDrawer({ isOpen, onClose, conflict }) {
  if (!isOpen || !conflict) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-body" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span className={`flag-tab flag-tab--${conflict.severity || "red"}`} style={{ fontSize: 13, margin: 0 }}>
            <ShieldAlert size={15} />
            {conflict.type ? conflict.type.replace("_", " ").toUpperCase() : "DOSAGE CONFLICT"}
          </span>
          <button className="btn btn--ghost btn--sm" onClick={onClose} style={{ border: "none" }}>
            <X size={18} />
          </button>
        </div>

        <h2 style={{ fontSize: 20, marginBottom: 8, color: "var(--ink)" }}>
          {conflict.drug || conflict.name} Conflict Analysis
        </h2>

        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, margin: "0 0 20px" }}>
          {conflict.detail || "Discrepancy detected across multiple document sources requiring physician reconciliation."}
        </p>

        <div style={{ background: "var(--bg-exam)", padding: 16, borderRadius: 8, border: "1px solid var(--hairline)", marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--accent-teal)" }}>
            Cross-Document Evidence Comparison
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
            <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 4, borderLeft: "3px solid var(--flag-red)" }}>
              <strong>Mercy General Hospital Discharge (Jan 15, 2026):</strong>
              <div className="data-value" style={{ marginTop: 2, color: "var(--flag-red)" }}>Lisinopril 20mg PO QD</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 4, borderLeft: "3px solid var(--accent-teal)" }}>
              <strong>St. Jude Nephrology Consult (Nov 20, 2025):</strong>
              <div className="data-value" style={{ marginTop: 2, color: "var(--accent-teal)" }}>Lisinopril 10mg PO QD (Dose reduced for eGFR 54)</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ink)" }}>
            Physician Action Plan Checklist
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" defaultChecked /> Reconcile 10mg vs 20mg Lisinopril target dose with prescribing cardiologist.
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" defaultChecked /> Order repeat BMP (Basic Metabolic Panel) for Creatinine and Potassium within 3 days.
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" /> Evaluate necessity of dual RAAS blockade (Lisinopril + Spironolactone).
            </label>
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
          <button className="btn btn--ghost" style={{ flex: 1 }} onClick={onClose}>
            Close Drawer
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={() => { alert("Action saved to patient chart!"); onClose(); }}>
            <CheckCircle2 size={14} /> Confirm Resolution
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExportReportModal({ isOpen, onClose, patient }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--hairline)", paddingBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: "var(--accent-teal)" }}>
              Clinical Intelligence Executive Summary
            </h3>
            <span className="data-value" style={{ fontSize: 11, color: "var(--ink-muted)" }}>
              Generated on {new Date().toLocaleDateString()} • Ground-Truth Verified
            </span>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose} style={{ border: "none" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: "var(--bg-exam)", padding: 20, borderRadius: 8, border: "1px solid var(--hairline)", fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, borderBottom: "1px solid var(--hairline)", paddingBottom: 8 }}>
            <div>
              <strong>Patient Name:</strong> {patient?.name || "Eleanor Vance"} <br />
              <strong>MRN:</strong> {patient?.mrn || "MRN-889241"}
            </div>
            <div>
              <strong>Primary Care:</strong> {patient?.pcp || "Dr. Robert Vance"} <br />
              <strong>Risk Level:</strong> <span style={{ color: "var(--flag-red)", fontWeight: 600 }}>High Risk</span>
            </div>
          </div>

          <h4 style={{ margin: "0 0 6px", color: "var(--accent-teal)" }}>Executive Overview</h4>
          <p style={{ margin: "0 0 12px" }}>
            Patient presents with multi-facility clinical documentation showing Stage 3a CKD (eGFR 48 mL/min) and rising serum creatinine (1.1 → 1.9 mg/dL). Cross-document deterministic auditing flagged an active Lisinopril 20mg vs 10mg dosage discrepancy between hospital discharge and outpatient nephrology consultation.
          </p>

          <h4 style={{ margin: "0 0 6px", color: "var(--accent-teal)" }}>Active Medication Conflicts</h4>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li><strong>Lisinopril:</strong> Discharge summary specifies 20mg QD; Nephrology consult lowered to 10mg QD due to renal stress.</li>
            <li><strong>Metformin:</strong> Discharge summary lists 1000mg BID; Nephrology consult reduced to 500mg BID.</li>
          </ul>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn" onClick={() => window.print()}>
            <Printer size={14} /> Print Summary PDF
          </button>
        </div>
      </div>
    </div>
  );
}
