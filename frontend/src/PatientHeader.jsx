import React from "react";
import { User, ShieldAlert, Heart, Activity, Droplet, Thermometer, Scale, AlertTriangle, ChevronDown } from "lucide-react";

export default function PatientHeader({
  patients,
  selectedPatientId,
  onSelectPatient,
  currentPatient,
  onOpenNewPatient,
  onOpenUpload
}) {
  if (!currentPatient) {
    return (
      <div className="patient-bar">
        <div className="patient-bar__top">
          <div className="patient-bar__select-group">
            <User size={18} style={{ color: "var(--accent-teal)" }} />
            <select
              className="patient-select"
              value={selectedPatientId || ""}
              onChange={(e) => onSelectPatient(Number(e.target.value))}
            >
              <option value="">— Select Patient Record —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.mrn ? `(${p.mrn})` : ""}
                </option>
              ))}
            </select>
            <button className="btn btn--ghost btn--sm" onClick={onOpenNewPatient}>
              + Create Patient
            </button>
          </div>
          <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Select a patient from the database or load a demo profile to begin clinical analysis.
          </div>
        </div>
      </div>
    );
  }

  const vitals = currentPatient.vitals || {
    bp: "138/86", bpStatus: "amber",
    hr: 76, hrStatus: "green",
    spo2: 98, spo2Status: "green",
    temp: "98.6°F", bmi: "27.8",
    egfr: "48 mL/min", egfrStatus: "amber"
  };

  return (
    <div className="patient-bar">
      <div className="patient-bar__top">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="patient-bar__select-group">
            <User size={20} style={{ color: "var(--accent-teal)" }} />
            <select
              className="patient-select"
              value={selectedPatientId || ""}
              onChange={(e) => onSelectPatient(Number(e.target.value))}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.mrn ? `(${p.mrn})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="patient-info-meta">
            <span className="meta-pill">
              <strong>Age/Sex:</strong> {currentPatient.age || 68}y {currentPatient.gender || "Female"}
            </span>
            <span className="meta-pill">
              <strong>DOB:</strong> <span className="data-value">{currentPatient.dob || "1958-03-14"}</span>
            </span>
            <span className="meta-pill">
              <strong>MRN:</strong> <span className="data-value">{currentPatient.mrn || `MRN-${currentPatient.id}`}</span>
            </span>
            <span className="meta-pill">
              <strong>PCP:</strong> {currentPatient.pcp || "Dr. Robert Vance, MD"}
            </span>
          </div>
        </div>

        <div>
          {currentPatient.riskLevel === "high" && (
            <span className="flag-tab flag-tab--red" style={{ fontSize: 13, padding: "6px 14px" }}>
              <ShieldAlert size={15} />
              {currentPatient.riskTitle || "High Risk Clinical Alert"}
            </span>
          )}
          {currentPatient.riskLevel === "medium" && (
            <span className="flag-tab flag-tab--amber" style={{ fontSize: 13, padding: "6px 14px" }}>
              <AlertTriangle size={15} />
              {currentPatient.riskTitle || "Moderate Risk Alert"}
            </span>
          )}
          {currentPatient.riskLevel === "low" && (
            <span className="flag-tab flag-tab--green" style={{ fontSize: 13, padding: "6px 14px" }}>
              Stable Clinical Record
            </span>
          )}
        </div>
      </div>

      {/* Vitals Strip */}
      <div className="vitals-strip">
        <div className="vital-card">
          <span className="vital-card__lbl">Blood Pressure</span>
          <span className="vital-card__val">
            {vitals.bp}
            <span className={`dot--${vitals.bpStatus || "amber"}`}>●</span>
          </span>
        </div>

        <div className="vital-card">
          <span className="vital-card__lbl">Heart Rate</span>
          <span className="vital-card__val">
            {vitals.hr} <small style={{ fontSize: 11, fontWeight: 400 }}>bpm</small>
            <span className="dot--green">●</span>
          </span>
        </div>

        <div className="vital-card">
          <span className="vital-card__lbl">SpO2</span>
          <span className="vital-card__val">
            {vitals.spo2}%
            <span className="dot--green">●</span>
          </span>
        </div>

        <div className="vital-card">
          <span className="vital-card__lbl">Temperature</span>
          <span className="vital-card__val">{vitals.temp}</span>
        </div>

        <div className="vital-card">
          <span className="vital-card__lbl">BMI</span>
          <span className="vital-card__val">{vitals.bmi}</span>
        </div>

        <div className="vital-card" style={{ borderColor: "var(--flag-amber)" }}>
          <span className="vital-card__lbl">eGFR Clearance</span>
          <span className="vital-card__val" style={{ color: "var(--flag-amber)" }}>
            {vitals.egfr}
            <span className="dot--amber">●</span>
          </span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn--sm btn--ghost" onClick={onOpenUpload}>
            + Upload PDF / Image
          </button>
        </div>
      </div>
    </div>
  );
}
