import React from "react";
import { Activity, Plus, Upload, FileText, ShieldAlert, Cpu } from "lucide-react";

export default function Navbar({
  patientsCount,
  documentsCount,
  conflictsCount,
  onOpenNewPatient,
  onOpenUpload,
  onOpenExport
}) {
  return (
    <header className="app-navbar">
      <div className="app-navbar__brand">
        <div className="app-navbar__logo-icon">
          <Activity size={20} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="app-navbar__title">MedRecord AI</span>
            <span className="app-navbar__badge">
              <span className="pulse-dot" />
              Gemini 2.5 Flash • RxNav Grounded
            </span>
          </div>
        </div>
      </div>

      <div className="app-navbar__metrics">
        <div className="nav-metric">
          <span className="nav-metric__val">{patientsCount}</span>
          <span className="nav-metric__lbl">Patients</span>
        </div>
        <div className="nav-metric">
          <span className="nav-metric__val">{documentsCount}</span>
          <span className="nav-metric__lbl">Documents</span>
        </div>
        <div className="nav-metric">
          <span className="nav-metric__val" style={{ color: conflictsCount > 0 ? "#F87171" : "#34D399" }}>
            {conflictsCount}
          </span>
          <span className="nav-metric__lbl">Active Alerts</span>
        </div>
      </div>

      <div className="app-navbar__actions">
        <button className="btn btn--ghost" style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.3)" }} onClick={onOpenExport}>
          <FileText size={14} />
          Export Report
        </button>
        <button className="btn btn--ghost" style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.3)" }} onClick={onOpenUpload}>
          <Upload size={14} />
          Upload Record
        </button>
        <button className="btn" style={{ background: "#1D6F60" }} onClick={onOpenNewPatient}>
          <Plus size={14} />
          New Patient
        </button>
      </div>
    </header>
  );
}
