import React, { useState, useEffect } from "react";
import "./styles.css";
import {
  Activity,
  User,
  Plus,
  Trash2,
  FileText,
  Upload,
  Brain,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Stethoscope,
  Loader2,
  AlertTriangle,
  FileSearch,
  FileCheck
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000" || https://medrecord-ai.afzalahmed12598.workers.dev;

const WELCOME_CHAT_MSG = {
  sender: "ai",
  text: "Hello! Welcome to MedRecord AI.\n\nI'm your AI Medical Report Assistant. Upload a report or ask questions about the selected patient's medical records."
};

// Helper function to sanitize any leftover Markdown tags (###, **, ---, etc.)
const cleanMarkdownText = (text) => {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[\-\*\_]{3,}\s*$/gm, "")
    .replace(/^\s*[\*\-]\s+/gm, "• ")
    .trim();
};

function App() {
  // Patients list state (populated from Supabase PostgreSQL via FastAPI)
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // Delete Patient state
  const [showDeletePatientModal, setShowDeletePatientModal] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Core Application UI State: "empty" | "processing" | "complete"
  const [appState, setAppState] = useState("empty");
  const [processingStep, setProcessingStep] = useState(1);

  // Real Analysis Data per patient
  const [patientAnalyses, setPatientAnalyses] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  // Modal for raw text viewer
  const [viewDocModal, setViewDocModal] = useState(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState([WELCOME_CHAT_MSG]);
  const [inputQuery, setInputQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Suggested Questions
  const suggestedQuestions = [
    "Summarize this report",
    "Explain the diagnosis",
    "Current medications",
    "Explain laboratory results",
    "Are there abnormal findings?"
  ];

  console.log(`[DEBUG LOG] Component render: selectedPatientId='${selectedPatientId}', appState='${appState}', hasAnalysis=${!!patientAnalyses[selectedPatientId]}`);

  // Fetch patient list from backend
  const fetchPatients = () => {
    console.log("[DEBUG LOG] Fetching patients list from backend...");
    fetch(`${API}/patients`)
      .then((r) => r.json())
      .then((data) => {
        console.log("[DEBUG LOG] Patients fetch response:", data);
        if (Array.isArray(data)) {
          setPatients(data);
          if (data.length > 0 && !selectedPatientId) {
            setSelectedPatientId(data[0].id);
          }
        }
      })
      .catch((err) => console.error("[DEBUG ERROR] Patients fetch failed:", err));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Helper to fetch analysis from Supabase PostgreSQL
  const fetchPatientAnalysis = (patientId) => {
    if (!patientId) return;
    console.log(`[DEBUG LOG] Fetching analysis from backend for patient ID '${patientId}'...`);
    fetch(`${API}/patients/${patientId}/analysis`)
      .then((r) => r.json())
      .then((data) => {
        console.log("[DEBUG LOG] Frontend fetch response (GET /analysis):", data);
        if (data && data.document_id) {
          console.log("[DEBUG LOG] React state update: setting patientAnalyses and appState to 'complete'");
          setPatientAnalyses((prev) => ({ ...prev, [patientId]: data }));
          setAppState("complete");
        } else {
          console.log("[DEBUG LOG] No analysis record found for patient, setting appState to 'empty'");
          setAppState("empty");
        }
      })
      .catch((err) => {
        console.error("[DEBUG ERROR] Analysis fetch failed:", err);
        setAppState("empty");
      });
  };

  // Fetch analysis & chat history when selected patient changes
  useEffect(() => {
    if (!selectedPatientId) {
      setAppState("empty");
      setChatMessages([WELCOME_CHAT_MSG]);
      return;
    }

    fetchPatientAnalysis(selectedPatientId);

    // Fetch existing chat history from Supabase
    fetch(`${API}/patients/${selectedPatientId}/chat`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formattedHistory = [
            WELCOME_CHAT_MSG,
            ...data.flatMap((h) => [
              { sender: "user", text: h.question },
              { sender: "ai", text: h.answer }
            ])
          ];
          setChatMessages(formattedHistory);
        } else {
          setChatMessages([WELCOME_CHAT_MSG]);
        }
      })
      .catch(() => {
        setChatMessages([WELCOME_CHAT_MSG]);
      });
  }, [selectedPatientId]);

  // Create Patient (POST /patients)
  const handleCreatePatient = async () => {
    if (!newPatientName.trim()) return;
    console.log("[DEBUG LOG] Creating patient:", newPatientName);
    try {
      const res = await fetch(`${API}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPatientName })
      });
      if (res.ok) {
        const patient = await res.json();
        console.log("[DEBUG LOG] Patient created:", patient);
        setPatients((prev) => [...prev, patient]);
        setSelectedPatientId(patient.id);
        setNewPatientName("");
        setShowNewPatientModal(false);
        setAppState("empty");
        setToastMessage("Patient created successfully.");
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (e) {
      console.error("[DEBUG ERROR] Error creating patient:", e);
    }
  };

  // Delete Patient (DELETE /patients/{patient_id})
  const handleDeletePatient = async () => {
    if (!selectedPatientId) return;
    setDeletingPatient(true);
    console.log(`[DEBUG LOG] Deleting patient '${selectedPatientId}'...`);
    try {
      const res = await fetch(`${API}/patients/${selectedPatientId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        console.log(`[DEBUG LOG] Patient '${selectedPatientId}' deleted successfully.`);
        setToastMessage("Patient deleted successfully.");
        setTimeout(() => setToastMessage(""), 4000);

        setShowDeletePatientModal(false);
        setDeletingPatient(false);

        // Remove deleted patient from local array
        const remaining = patients.filter((p) => String(p.id) !== String(selectedPatientId));
        setPatients(remaining);
        setPatientAnalyses((prev) => {
          const copy = { ...prev };
          delete copy[selectedPatientId];
          return copy;
        });

        // Clear selection & reset to empty state if no patients left or select next
        const nextPatientId = remaining.length > 0 ? remaining[0].id : "";
        setSelectedPatientId(nextPatientId);
        if (!nextPatientId) {
          setAppState("empty");
          setChatMessages([WELCOME_CHAT_MSG]);
        }
        return;
      } else {
        const errText = await res.text();
        console.error("[DEBUG ERROR] Delete patient API error:", errText);
        alert(`Failed to delete patient: ${errText}`);
      }
    } catch (err) {
      console.error("[DEBUG ERROR] Delete patient network error:", err);
      alert("Failed to delete patient due to network error.");
    }
    setDeletingPatient(false);
  };

  // Upload PDF -> Supabase Storage -> Gemini OCR -> Analysis State
  const handleUploadPDF = async (fileObj) => {
    const file = fileObj || selectedFile;
    if (!file || !selectedPatientId) return;

    console.log(`[DEBUG LOG] Upload started: filename='${file.name}', patient_id='${selectedPatientId}'`);
    setAppState("processing");
    setProcessingStep(1);

    setTimeout(() => setProcessingStep(2), 600);
    setTimeout(() => setProcessingStep(3), 1200);
    setTimeout(() => setProcessingStep(4), 1800);
    setTimeout(() => setProcessingStep(5), 2400);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/patients/${selectedPatientId}/documents`, {
        method: "POST",
        body: form
      });

      console.log(`[DEBUG LOG] Upload completed: status=${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log("[DEBUG LOG] API response (POST /documents):", data);
        const extracted = data.extracted || {};

        const newAnalysis = {
          document_id: data.document_id,
          filename: file.name,
          doc_type: extracted.doc_type || "medical_report",
          patient_name: extracted.patient_name || patients.find((p) => String(p.id) === String(selectedPatientId))?.name || "Patient Record",
          age: extracted.age || null,
          gender: extracted.gender || null,
          doctor: extracted.doctor || extracted.provider || "Attending Physician",
          hospital: extracted.hospital || extracted.provider || "Medical Health System",
          report_date: extracted.report_date || extracted.visit_date || new Date().toISOString().split("T")[0],
          raw_text: extracted.raw_text || "Full extracted document text processed by Gemini Vision OCR.",
          ai_summary: extracted.ai_summary || extracted.patient_summary || extracted.summary || `Extracted report for ${file.name}.`,
          diagnoses_detail: extracted.diagnoses_detail || [],
          diagnoses: extracted.diagnoses || [],
          abnormal_findings: extracted.abnormal_findings || [],
          vitals: extracted.vitals || [],
          medications: extracted.medications || [],
          laboratory_results: extracted.laboratory_results || extracted.lab_results || [],
          allergies: extracted.allergies || [],
          procedures: extracted.procedures || [],
          recommendations: extracted.recommendations || extracted.recommendation || ""
        };

        setProcessingStep(6);
        setTimeout(() => {
          console.log("[DEBUG LOG] React state update: setting patientAnalyses and appState='complete'");
          setPatientAnalyses((prev) => ({ ...prev, [selectedPatientId]: newAnalysis }));
          setSelectedFile(null);
          setAppState("complete");
          // Re-sync with Supabase PostgreSQL
          fetchPatientAnalysis(selectedPatientId);
        }, 500);
        return;
      } else {
        const errText = await res.text();
        console.error("[DEBUG ERROR] API error response:", errText);
      }
    } catch (err) {
      console.error("[DEBUG ERROR] Upload network/execution error:", err);
    }

    setAppState("empty");
  };

  // Patient AI Chat Handler
  const handleAskAI = async (queryText) => {
    const q = queryText || inputQuery;
    if (!q.trim() || chatLoading || !selectedPatientId) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: q }]);
    if (!queryText) setInputQuery("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API}/patients/${selectedPatientId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.answer }]);
        setChatLoading(false);
        return;
      }
    } catch (e) {
      console.error("[DEBUG ERROR] Chat error:", e);
    }

    setChatMessages((prev) => [
      ...prev,
      { sender: "ai", text: "Unable to query records. Please ensure a medical report is uploaded for this patient." }
    ]);
    setChatLoading(false);
  };

  const currentAnalysis = patientAnalyses[selectedPatientId];
  const labsList = currentAnalysis?.laboratory_results || currentAnalysis?.lab_results || [];

  return (
    <div>
      {/* Success Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 9999,
          background: "#10B981",
          color: "#FFFFFF",
          padding: "12px 20px",
          borderRadius: 10,
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 600,
          fontSize: 14
        }}>
          <CheckCircle2 size={18} /> {toastMessage}
        </div>
      )}

      {/* App Header Navbar */}
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__logo">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="app-header__title">MedRecord AI</h1>
            <div className="app-header__subtitle">AI Medical Report Assistant (Supabase Edition)</div>
          </div>
        </div>

        <div className="app-badge">
          <span className="pulse-dot" />
          Live Database & Storage
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">

        {/* Patient Selector Bar */}
        <section className="app-card" style={{ padding: "18px 24px" }}>
          <div className="patient-bar">
            <div className="patient-bar__select-group">
              <span className="patient-bar__label">
                <User size={18} style={{ color: "var(--primary-blue)" }} /> Patient:
              </span>
              <select
                className="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.length === 0 ? (
                  <option value="">No Patients Created Yet</option>
                ) : (
                  patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn--secondary" onClick={() => setShowNewPatientModal(true)}>
                <Plus size={16} /> New Patient
              </button>

              <button
                className="btn"
                style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5" }}
                disabled={!selectedPatientId || patients.length === 0}
                onClick={() => setShowDeletePatientModal(true)}
              >
                <Trash2 size={16} /> Delete Patient
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================
            STATE 1: EMPTY STATE (No Patients or No Reports Uploaded Yet)
           ============================================================ */}
        {appState === "empty" && (
          <section className="upload-card-box">
            <div className="empty-hero">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div className="app-header__logo" style={{ width: 52, height: 52, borderRadius: 16 }}>
                  <Brain size={30} />
                </div>
              </div>
              <h2 className="empty-hero__title">
                {patients.length === 0 ? "Create a Patient to Begin" : "Upload Medical Report"}
              </h2>
              <div className="empty-hero__subtitle">AI Medical Report Assistant</div>
              <p className="empty-hero__desc">
                {patients.length === 0
                  ? "Start by creating a new patient above, then upload their PDF medical reports."
                  : "Upload a PDF or image medical report to extract findings and analyze with Gemini AI."}
              </p>
            </div>

            {patients.length > 0 && (
              <>
                <div
                  className="upload-dropzone"
                  onClick={() => document.getElementById("report-file-input").click()}
                >
                  <div className="dropzone-icon-circle">
                    <FileText size={28} />
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
                    {selectedFile ? selectedFile.name : "Choose or Drag Medical Report PDF"}
                  </h3>

                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)" }}>
                    Files will be securely stored in Supabase Storage & parsed by Gemini Vision.
                  </p>

                  <button className="btn btn--secondary" style={{ pointerEvents: "none" }}>
                    Select PDF File
                  </button>

                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                    Supported Format: <strong>PDF, PNG, JPG</strong>
                  </div>

                  <input
                    id="report-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    className="btn"
                    style={{ padding: "12px 32px", fontSize: 15 }}
                    disabled={!selectedFile || !selectedPatientId}
                    onClick={() => handleUploadPDF(selectedFile)}
                  >
                    <Upload size={18} /> Upload & Analyze Report
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {/* ============================================================
            STATE 2: PROCESSING (Loading Steps Checklist)
           ============================================================ */}
        {appState === "processing" && (
          <section className="processing-box">
            <div className="processing-spinner-circle">
              <Loader2 size={36} className="spin-icon" />
            </div>

            <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--text-main)" }}>
              Processing & Storing in Supabase...
            </h3>

            <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
              Uploading PDF to Supabase Storage and extracting clinical JSON with Gemini Vision OCR.
            </p>

            <div className="progress-checklist">
              <div className={`checklist-step ${processingStep >= 1 ? (processingStep > 1 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 1 ? <CheckCircle2 size={18} /> : <div className="spin-icon"><Loader2 size={18} /></div>}
                <span>Uploading to Supabase Storage...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 2 ? (processingStep > 2 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 2 ? <CheckCircle2 size={18} /> : processingStep === 2 ? <div className="spin-icon"><Loader2 size={18} /></div> : <FileText size={18} />}
                <span>Extracting Text...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 3 ? (processingStep > 3 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 3 ? <CheckCircle2 size={18} /> : processingStep === 3 ? <div className="spin-icon"><Loader2 size={18} /></div> : <FileSearch size={18} />}
                <span>Running Gemini Vision OCR...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 4 ? (processingStep > 4 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 4 ? <CheckCircle2 size={18} /> : processingStep === 4 ? <div className="spin-icon"><Loader2 size={18} /></div> : <Brain size={18} />}
                <span>Extracting Clinical Entities...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 5 ? (processingStep > 5 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 5 ? <CheckCircle2 size={18} /> : processingStep === 5 ? <div className="spin-icon"><Loader2 size={18} /></div> : <Sparkles size={18} />}
                <span>Saving to Supabase PostgreSQL...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 6 ? "checklist-step--completed" : ""}`}>
                {processingStep >= 6 ? <CheckCircle2 size={18} /> : <CheckCircle2 size={18} style={{ opacity: 0.3 }} />}
                <span>Completed</span>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            STATE 3: ANALYSIS COMPLETE (Real Data from Supabase)
           ============================================================ */}
        {appState === "complete" && currentAnalysis && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="app-badge" style={{ background: "var(--badge-green-soft)", color: "var(--badge-green)", borderColor: "var(--badge-green-border)" }}>
                <CheckCircle2 size={14} /> Real Database Record (Supabase)
              </span>

              <button
                className="btn btn--secondary"
                style={{ padding: "7px 16px", fontSize: 13 }}
                onClick={() => setAppState("empty")}
              >
                <Upload size={14} /> Upload Another Report
              </button>
            </div>

            {/* AI Summary Section */}
            <section className="app-card" style={{ borderLeft: "5px solid var(--primary-blue)" }}>
              <div className="app-card__header">
                <div>
                  <h3 className="app-card__title">
                    <span className="app-card__icon"><Brain size={18} /></span>
                    🧠 AI Summary
                  </h3>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
                    Source File: <strong>{currentAnalysis.filename}</strong> ({currentAnalysis.report_date})
                  </span>
                </div>

                <button
                  className="btn btn--ghost"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                  onClick={() => setViewDocModal(currentAnalysis)}
                >
                  View Raw Text
                </button>
              </div>

              {/* Patient Demographics Banner */}
              {(currentAnalysis.patient_name || currentAnalysis.doctor || currentAnalysis.hospital) && (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18, background: "var(--bg-app)", padding: "10px 16px", borderRadius: 8, fontSize: 13 }}>
                  {currentAnalysis.patient_name && <span><strong>Patient:</strong> {currentAnalysis.patient_name}</span>}
                  {currentAnalysis.doctor && <span><strong>Doctor/Provider:</strong> {currentAnalysis.doctor}</span>}
                  {currentAnalysis.hospital && <span><strong>Facility:</strong> {currentAnalysis.hospital}</span>}
                </div>
              )}

              {/* Overall Summary Callout */}
              <div className="analysis-overall-card">
                <strong style={{ color: "var(--primary-blue)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={16} /> Clinical Summary
                </strong>
                <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--text-main)", lineHeight: 1.6 }}>
                  {cleanMarkdownText(currentAnalysis.ai_summary) || "Report parsed successfully."}
                </p>
              </div>

              {/* Diagnoses Section */}
              {currentAnalysis.diagnoses && currentAnalysis.diagnoses.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 className="analysis-section-title">
                    <CheckCircle2 size={18} style={{ color: "var(--primary-blue)" }} /> Diagnoses
                  </h4>
                  <ul className="list-styled">
                    {currentAnalysis.diagnoses.map((d, i) => (
                      <li key={i}>
                        <strong>{typeof d === "object" ? d.name : d}</strong>
                        {typeof d === "object" && d.code ? ` (ICD-10: ${d.code})` : ""}
                        {typeof d === "object" && d.explanation ? ` — ${d.explanation}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Abnormal Findings */}
              {currentAnalysis.abnormal_findings && currentAnalysis.abnormal_findings.length > 0 && (
                <div style={{ marginBottom: 24, background: "var(--badge-red-soft)", border: "1px solid var(--badge-red-border)", borderRadius: 12, padding: 16 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--badge-red)", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={16} /> Abnormal Findings
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {currentAnalysis.abnormal_findings.map((a, i) => (
                      <div key={i} style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #FECACA" }}>
                        <strong style={{ fontSize: 13.5, color: "#991B1B" }}>{typeof a === "object" ? a.finding : a}</strong>
                        {typeof a === "object" && a.importance && (
                          <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2 }}>{a.importance}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured Grid: Medications & Labs */}
              <div className="analysis-grid">
                {currentAnalysis.medications && currentAnalysis.medications.length > 0 && (
                  <div className="section-box">
                    <div className="section-box__title">
                      <Stethoscope size={16} /> Current Medications
                    </div>
                    <ul className="list-styled">
                      {currentAnalysis.medications.map((m, i) => (
                        <li key={i}>
                          <strong>{m.name}</strong>{" "}
                          {m.dosage && <span className="val-badge">{m.dosage}</span>}{" "}
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.frequency}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {labsList && labsList.length > 0 && (
                  <div className="section-box">
                    <div className="section-box__title">
                      <Activity size={16} /> Laboratory Results
                    </div>
                    <ul className="list-styled">
                      {labsList.map((l, i) => (
                        <li key={i}>
                          {l.test_name || l.test}:{" "}
                          <span className="val-badge" style={{ fontWeight: 600 }}>
                            {l.value} {l.unit}
                          </span>{" "}
                          {(l.reference_low || l.reference_high) && (
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              (ref {l.reference_low} – {l.reference_high})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {currentAnalysis.recommendations && currentAnalysis.recommendations.trim() !== "" && (
                <div style={{ marginTop: 20, background: "var(--badge-amber-soft)", border: "1px solid var(--badge-amber-border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--badge-amber)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={16} /> Recommendations
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#854D0E", lineHeight: 1.55 }}>
                    {cleanMarkdownText(currentAnalysis.recommendations)}
                  </p>
                </div>
              )}
            </section>

            {/* Ask MedRecord AI Chat */}
            <section className="app-card">
              <div className="app-card__header">
                <h3 className="app-card__title">
                  <span className="app-card__icon"><MessageSquare size={18} /></span>
                  🤖 Ask MedRecord AI
                </h3>
              </div>

              <div className="chat-container">
                <div className="prompt-chips-row">
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginRight: 4 }}>
                    Suggested Questions:
                  </span>
                  {suggestedQuestions.map((qText, idx) => (
                    <button
                      key={idx}
                      className="prompt-chip-btn"
                      onClick={() => handleAskAI(qText)}
                    >
                      • {qText}
                    </button>
                  ))}
                </div>

                <div className="chat-history">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chat-bubble ${msg.sender === "user" ? "chat-bubble--user" : "chat-bubble--ai"}`}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 4, textTransform: "uppercase" }}>
                        {msg.sender === "user" ? "You" : "MedRecord AI Assistant"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {msg.sender === "ai" ? cleanMarkdownText(msg.text) : msg.text}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="chat-bubble chat-bubble--ai" style={{ width: 140 }}>
                      <span className="pulse-dot" /> Analyzing...
                    </div>
                  )}
                </div>

                <div className="chat-input-bar">
                  <input
                    className="chat-input-field"
                    placeholder="Ask a question about the uploaded medical records..."
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
                  />
                  <button className="btn" onClick={() => handleAskAI()}>
                    <Send size={16} /> Send
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

      </main>

      {/* New Patient Modal */}
      {showNewPatientModal && (
        <div className="modal-overlay" onClick={() => setShowNewPatientModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--text-main)" }}>
                Create Patient Profile
              </h3>
              <button className="btn btn--ghost" style={{ padding: "4px 8px" }} onClick={() => setShowNewPatientModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--text-soft)" }}>
                Patient Full Name
              </label>
              <input
                className="chat-input-field"
                style={{ width: "100%" }}
                placeholder="e.g. John Doe"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePatient()}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn--ghost" onClick={() => setShowNewPatientModal(false)}>
                Cancel
              </button>
              <button className="btn" disabled={!newPatientName.trim()} onClick={handleCreatePatient}>
                Create Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {showDeletePatientModal && (
        <div className="modal-overlay" onClick={() => !deletingPatient && setShowDeletePatientModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#DC2626", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={20} /> Delete Patient?
              </h3>
              <button
                className="btn btn--ghost"
                style={{ padding: "4px 8px" }}
                disabled={deletingPatient}
                onClick={() => setShowDeletePatientModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 14, color: "var(--text-main)", lineHeight: 1.6, marginBottom: 16 }}>
              This action will permanently delete the patient and all associated medical reports, AI analysis, chat history, diagnoses, medications, laboratory results, allergies, procedures, and uploaded files.
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 24 }}>
              This action cannot be undone.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                className="btn btn--ghost"
                disabled={deletingPatient}
                onClick={() => setShowDeletePatientModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#DC2626", color: "#FFFFFF", border: "none" }}
                disabled={deletingPatient}
                onClick={handleDeletePatient}
              >
                <Trash2 size={16} /> {deletingPatient ? "Deleting..." : "Delete Patient"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Document Text Modal */}
      {viewDocModal && (
        <div className="modal-overlay" onClick={() => setViewDocModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--primary-blue)" }}>
                  {viewDocModal.filename}
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {viewDocModal.hospital || viewDocModal.provider} • {viewDocModal.report_date}
                </span>
              </div>
              <button className="btn btn--ghost" style={{ padding: "4px 8px" }} onClick={() => setViewDocModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: "var(--bg-app)",
              padding: 16,
              borderRadius: 10,
              fontFamily: "monospace",
              fontSize: 13,
              whiteSpace: "pre-wrap",
              maxHeight: 380,
              overflowY: "auto",
              border: "1px solid var(--border-color)"
            }}>
              {viewDocModal.raw_text}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn--ghost" onClick={() => setViewDocModal(null)}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
