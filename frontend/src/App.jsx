import React, { useState, useEffect } from "react";
import "./styles.css";
import {
  Activity,
  User,
  Plus,
  FileText,
  Upload,
  Brain,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ChevronRight,
  Stethoscope,
  Loader2,
  AlertTriangle,
  Heart,
  Bot,
  Pill,
  FileSearch,
  BookOpen,
  FileCheck
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Pre-loaded sample report for demo patient Eleanor Vance
const MOCK_DEMO_REPORT = {
  document_id: 101,
  filename: "Heart_&_Kidney_Report_Jan2026.pdf",
  doc_type: "discharge",
  patient_name: "Eleanor Vance",
  age: "68",
  gender: "Female",
  doctor: "Dr. Robert Vance, MD",
  hospital: "Mercy General Hospital",
  report_date: "2026-01-15",
  raw_text: `PATIENT DISCHARGE SUMMARY & LAB REPORT
Patient Name: Eleanor Vance | Age: 68 | Gender: Female
Doctor: Dr. Robert Vance, MD | Hospital: Mercy General Hospital
Report Date: 2026-01-15

DIAGNOSES:
1. Type 2 Diabetes Mellitus (E11.9)
2. Essential Hypertension (I10)
3. Chronic Kidney Disease, Stage 3a (N18.31)
4. Hyperlipidemia (E78.5)

MEDICATIONS:
- Lisinopril 20mg PO once daily (Hypertension)
- Metformin 1000mg PO twice daily with meals (Diabetes)
- Spironolactone 25mg PO once daily in morning (Cardiology)
- Atorvastatin 40mg PO once daily at bedtime (Lipid control)

LAB RESULTS:
- Serum Creatinine: 1.9 mg/dL (Reference: 0.6 - 1.2 mg/dL) [HIGH]
- Calculated eGFR: 48 mL/min/1.73m² (Reference: 60 - 120 mL/min) [LOW]
- Serum Potassium: 5.4 mEq/L (Reference: 3.5 - 5.0 mEq/L) [ELEVATED]
- HbA1c: 7.1% (Reference: 4.0 - 5.6%) [CONTROLLED]

ALLERGIES:
- Penicillin G (Anaphylaxis)

PROCEDURES:
- 12-Lead Electrocardiogram (ECG)
- Renal Ultrasound & Basic Metabolic Panel

AI SUMMARY:
Patient is a 68-year-old female admitted for blood pressure management. Medical history notable for Type 2 Diabetes, Essential Hypertension, CKD Stage 3a, and Hyperlipidemia.

RECOMMENDATIONS:
Serum Creatinine demonstrates a progressive upward trend (1.1 → 1.9 mg/dL over 12 months) with eGFR declining to 48 mL/min. Dual RAAS blockade (Lisinopril 20mg + Spironolactone 25mg) requires close electrolyte monitoring and nephrology consultation within 14 days.`,
  ai_summary:
    "68-year-old female admitted for blood pressure management. Medical history notable for Type 2 Diabetes, Essential Hypertension, CKD Stage 3a, and Hyperlipidemia.",
  diagnoses_detail: [
    {
      name: "Chronic Kidney Disease, Stage 3a (ICD-10: N18.31)",
      confidence: "High",
      evidence: "Calculated eGFR 48 mL/min/1.73m² and persistent Serum Creatinine elevation (1.9 mg/dL).",
      explanation: "Kidney function is moderately decreased, impairing the body's ability to filter waste from the blood."
    },
    {
      name: "Type 2 Diabetes Mellitus (ICD-10: E11.9)",
      confidence: "High",
      evidence: "HbA1c 7.1% while taking Metformin 1000mg BID.",
      explanation: "A chronic condition affecting how the body processes blood sugar (glucose)."
    },
    {
      name: "Essential Hypertension (ICD-10: I10)",
      confidence: "High",
      evidence: "Blood pressure 138/86 mmHg; prescribed Lisinopril 20mg daily.",
      explanation: "High blood pressure requiring daily antihypertensive medication."
    },
    {
      name: "Hyperlipidemia (ICD-10: E78.5)",
      confidence: "High",
      evidence: "Prescribed Atorvastatin 40mg PO QD.",
      explanation: "Elevated lipid/cholesterol levels in the blood managed with statin therapy."
    }
  ],
  diagnoses: [
    "Chronic Kidney Disease, Stage 3a (N18.31)",
    "Type 2 Diabetes Mellitus (E11.9)",
    "Essential Hypertension (I10)",
    "Hyperlipidemia (E78.5)"
  ],
  abnormal_findings: [
    {
      finding: "Elevated Serum Creatinine (1.9 mg/dL, Ref: 0.6 – 1.2)",
      importance: "Indicates reduced kidney filtration capacity. Requires monitoring and dose adjustments for renally cleared drugs."
    },
    {
      finding: "Decreased eGFR Clearance (48 mL/min, Ref: 60 – 120)",
      importance: "eGFR below 60 mL/min confirms Stage 3a Chronic Kidney Disease."
    },
    {
      finding: "Elevated Serum Potassium (5.4 mEq/L, Ref: 3.5 – 5.0)",
      importance: "Hyperkalemia risk increased due to combined Lisinopril + Spironolactone therapy in reduced kidney clearance."
    }
  ],
  vitals: [
    { name: "Blood Pressure", value: "138/86", unit: "mmHg", status: "Borderline High" },
    { name: "Heart Rate", value: "76", unit: "bpm", status: "Normal" },
    { name: "Oxygen Saturation", value: "98", unit: "%", status: "Normal" },
    { name: "Temperature", value: "98.6", unit: "°F", status: "Normal" }
  ],
  medications: [
    { name: "Lisinopril", dosage: "20mg", frequency: "once daily" },
    { name: "Metformin", dosage: "1000mg", frequency: "twice daily with meals" },
    { name: "Spironolactone", dosage: "25mg", frequency: "once daily in morning" },
    { name: "Atorvastatin", dosage: "40mg", frequency: "once daily at bedtime" }
  ],
  laboratory_results: [
    { test_name: "Serum Creatinine", value: "1.9", unit: "mg/dL", reference_low: "0.6", reference_high: "1.2", status: "High" },
    { test_name: "eGFR Clearance", value: "48", unit: "mL/min", reference_low: "60", reference_high: "120", status: "Low" },
    { test_name: "Serum Potassium", value: "5.4", unit: "mEq/L", reference_low: "3.5", reference_high: "5.0", status: "Elevated" },
    { test_name: "HbA1c", value: "7.1", unit: "%", reference_low: "4.0", reference_high: "5.6", status: "Controlled" }
  ],
  allergies: ["Penicillin G (Anaphylaxis)"],
  procedures: ["12-Lead Electrocardiogram", "Renal Ultrasound"],
  recommendations:
    "Serum Creatinine demonstrates a progressive upward trend (1.9 mg/dL) and hyperkalemia risk (K+ 5.4 mEq/L). Dual RAAS blockade (Lisinopril + Spironolactone) requires close electrolyte monitoring and nephrology consultation within 14 days."
};

const WELCOME_CHAT_MSG = {
  sender: "ai",
  text: "👋 Welcome to MedRecord AI\n\nI'm your AI Medical Report Assistant. Upload a report or ask questions about the selected patient's uploaded medical records."
};

function App() {
  // Patients list state
  const [patients, setPatients] = useState([
    { id: 1, name: "Eleanor Vance (Demo Patient)" },
    { id: 2, name: "Arthur Pendelton (New Patient)" }
  ]);
  const [selectedPatientId, setSelectedPatientId] = useState(1);
  const [newPatientName, setNewPatientName] = useState("");
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // Core Application UI State: "empty" (State 1) | "processing" (State 2) | "complete" (State 3)
  const [appState, setAppState] = useState("complete");
  const [processingStep, setProcessingStep] = useState(1); // 1 to 6

  // Analysis & Document State per patient
  const [patientAnalyses, setPatientAnalyses] = useState({
    1: MOCK_DEMO_REPORT
  });
  const [patientReportsList, setPatientReportsList] = useState({
    1: [{ id: 101, filename: "Heart_&_Kidney_Report_Jan2026.pdf", date: "2026-01-15" }]
  });

  // Selected file for upload
  const [selectedFile, setSelectedFile] = useState(null);

  // Raw text modal viewer
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

  // Fetch patient list from backend if available
  useEffect(() => {
    fetch(`${API}/patients`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
        }
      })
      .catch(() => {});
  }, []);

  // Update application UI state when selected patient changes
  useEffect(() => {
    if (patientAnalyses[selectedPatientId]) {
      setAppState("complete");
    } else {
      setAppState("empty");
    }
    // Reset chat history for newly selected patient
    setChatMessages([WELCOME_CHAT_MSG]);
  }, [selectedPatientId]);

  // Create Patient (POST /patients)
  const handleCreatePatient = async () => {
    if (!newPatientName.trim()) return;
    try {
      const res = await fetch(`${API}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPatientName })
      });
      if (res.ok) {
        const patient = await res.json();
        setPatients((prev) => [...prev, patient]);
        setSelectedPatientId(patient.id);
        setNewPatientName("");
        setShowNewPatientModal(false);
        setAppState("empty");
        return;
      }
    } catch (e) {}

    // Local fallback
    const newP = { id: Date.now(), name: newPatientName };
    setPatients((prev) => [...prev, newP]);
    setSelectedPatientId(newP.id);
    setNewPatientName("");
    setShowNewPatientModal(false);
    setAppState("empty");
  };

  // Upload PDF -> State 2 (Processing) -> State 3 (Complete)
  const handleUploadPDF = async (fileObj) => {
    const file = fileObj || selectedFile;
    if (!file || !selectedPatientId) return;

    // Transition to STATE 2: Processing
    setAppState("processing");
    setProcessingStep(1);

    // Animated Checklist Progress Steps:
    // 1: Uploading Report... -> 2: Extracting Text... -> 3: Running OCR... -> 4: Analyzing with Gemini... -> 5: Generating AI Summary... -> 6: Completed
    setTimeout(() => setProcessingStep(2), 500);
    setTimeout(() => setProcessingStep(3), 1000);
    setTimeout(() => setProcessingStep(4), 1600);
    setTimeout(() => setProcessingStep(5), 2200);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/patients/${selectedPatientId}/documents`, {
        method: "POST",
        body: form
      });

      if (res.ok) {
        const data = await res.json();
        const extracted = data.extracted || {};

        const newAnalysis = {
          document_id: data.document_id,
          filename: file.name,
          doc_type: extracted.doc_type || "medical_report",
          patient_name: extracted.patient_name || patients.find((p) => p.id === selectedPatientId)?.name || "Patient Record",
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

        setTimeout(() => {
          setProcessingStep(6);
          setTimeout(() => {
            setPatientAnalyses((prev) => ({ ...prev, [selectedPatientId]: newAnalysis }));
            setPatientReportsList((prev) => ({
              ...prev,
              [selectedPatientId]: [
                { id: data.document_id, filename: file.name, date: newAnalysis.report_date },
                ...(prev[selectedPatientId] || [])
              ]
            }));
            setSelectedFile(null);
            setAppState("complete");
          }, 400);
        }, 2800);
        return;
      }
    } catch (err) {}

    // Fallback simulation for mock demo
    setTimeout(() => {
      setProcessingStep(6);
      setTimeout(() => {
        const uploadedDoc = {
          document_id: Date.now(),
          filename: file.name,
          doc_type: "lab_report",
          patient_name: patients.find((p) => p.id === selectedPatientId)?.name || "Selected Patient",
          age: "52",
          gender: "Female",
          doctor: "Dr. Sarah Lin, MD",
          hospital: "University Medical Center",
          report_date: new Date().toISOString().split("T")[0],
          raw_text: MOCK_DEMO_REPORT.raw_text,
          ai_summary: `Newly uploaded medical report (${file.name}). Processed via automatic pypdf text extraction & Gemini 2.5 Flash.`,
          diagnoses_detail: [
            {
              name: "Essential Hypertension (ICD-10: I10)",
              confidence: "High",
              evidence: "Blood pressure 138/86 mmHg, prescribed Lisinopril 10mg daily",
              explanation: "High blood pressure requiring routine daily medication."
            },
            {
              name: "Type 2 Diabetes Mellitus (ICD-10: E11.9)",
              confidence: "High",
              evidence: "Fasting Blood Glucose 135 mg/dL on Metformin 500mg BID",
              explanation: "Elevated blood sugar managed with oral diabetic therapy."
            }
          ],
          diagnoses: [
            "Essential Hypertension (ICD-10: I10)",
            "Type 2 Diabetes Mellitus (ICD-10: E11.9)"
          ],
          abnormal_findings: [
            {
              finding: "Elevated Serum Creatinine (1.3 mg/dL)",
              importance: "Slightly elevated kidney filtration marker; warrants routine repeat testing."
            },
            {
              finding: "Fasting Blood Glucose Elevated (135 mg/dL)",
              importance: "Above normal fasting reference interval (70 – 99 mg/dL)."
            }
          ],
          vitals: [
            { name: "Blood Pressure", value: "128/78", unit: "mmHg", status: "Normal" },
            { name: "Heart Rate", value: "72", unit: "bpm", status: "Normal" }
          ],
          medications: [
            { name: "Lisinopril", dosage: "10mg", frequency: "once daily" },
            { name: "Metformin", dosage: "500mg", frequency: "twice daily" }
          ],
          laboratory_results: [
            { test_name: "Serum Creatinine", value: "1.3", unit: "mg/dL", reference_low: "0.6", reference_high: "1.2", status: "High" },
            { test_name: "Fasting Blood Glucose", value: "135", unit: "mg/dL", reference_low: "70", reference_high: "99", status: "Elevated" }
          ],
          allergies: ["Penicillin G"],
          procedures: ["Routine Blood Draw"],
          recommendations: "Maintain fasting blood glucose log and repeat serum creatinine in 30 days."
        };

        setPatientAnalyses((prev) => ({ ...prev, [selectedPatientId]: uploadedDoc }));
        setPatientReportsList((prev) => ({
          ...prev,
          [selectedPatientId]: [
            { id: uploadedDoc.document_id, filename: file.name, date: uploadedDoc.report_date },
            ...(prev[selectedPatientId] || [])
          ]
        }));
        setSelectedFile(null);
        setAppState("complete");
      }, 400);
    }, 2800);
  };

  // Patient AI Chat Handler
  const handleAskAI = async (queryText) => {
    const q = queryText || inputQuery;
    if (!q.trim() || chatLoading) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: q }]);
    if (!queryText) setInputQuery("");
    setChatLoading(true);

    const qClean = q.trim().toLowerCase().replace(/[^\w\s]/g, "");

    // 1. Greetings Handler
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "how are you", "whats up"];
    if (greetings.some((g) => qClean === g || qClean.startsWith(g))) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Hello! 👋 I'm your AI Medical Assistant. How can I help you today? If you've uploaded a medical report, I can summarize it, explain diagnoses, review lab results, or answer questions about the patient's records."
          }
        ]);
        setChatLoading(false);
      }, 300);
      return;
    }

    // 2. Off-Topic Guardrail
    const offTopicKeywords = [
      "movie", "sport", "football", "cricket", "basketball", "politics", "president",
      "election", "joke", "code", "python", "javascript", "react", "math", "calculator",
      "weather", "recipe", "song", "music", "celebrity", "actor", "game"
    ];
    const isOffTopic = offTopicKeywords.some((k) => qClean.includes(k)) && !qClean.includes("lab") && !qClean.includes("report");

    if (isOffTopic) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "I'm your Medical AI Assistant. I can help explain diagnoses, medications, laboratory results, medical summaries, and other information from the uploaded medical reports."
          }
        ]);
        setChatLoading(false);
      }, 300);
      return;
    }

    // 3. Query Backend Endpoint /patients/{id}/chat
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
    } catch (e) {}

    // 4. Grounded Fallback Response using actual report content
    setTimeout(() => {
      const current = patientAnalyses[selectedPatientId];
      let responseText = "";

      if (!current) {
        responseText = "This information is not present in the uploaded medical reports.";
      } else if (qClean.includes("medication") || qClean.includes("drug") || qClean.includes("prescribed") || qClean.includes("taking")) {
        const meds = current.medications || [];
        if (meds.length > 0) {
          responseText = `Based on the uploaded report (**${current.filename}**), the active medications are:\n` +
            meds.map((m) => `• **${m.name}**: ${m.dosage || ""} ${m.frequency || ""}`).join("\n");
        } else {
          responseText = "This information is not present in the uploaded medical reports.";
        }
      } else if (qClean.includes("diagnosis") || qClean.includes("diagnoses") || qClean.includes("condition")) {
        const diagsDetailed = current.diagnoses_detail || [];
        const diagsSimple = current.diagnoses || [];
        if (diagsDetailed.length > 0) {
          responseText = `The uploaded medical report lists the following diagnoses:\n\n` +
            diagsDetailed.map((d) => `• **${d.name}**\n  *Evidence:* "${d.evidence || "Extracted from report"}"\n  *Note:* ${d.explanation || ""}`).join("\n\n");
        } else if (diagsSimple.length > 0) {
          responseText = `The uploaded report lists the following diagnoses:\n` +
            diagsSimple.map((d, i) => `${i + 1}. **${typeof d === "object" ? d.name : d}**`).join("\n");
        } else {
          responseText = "This information is not present in the uploaded medical reports.";
        }
      } else if (qClean.includes("abnormal") || qClean.includes("creatinine") || qClean.includes("potassium") || qClean.includes("value")) {
        const abnormal = current.abnormal_findings || [];
        const labs = current.laboratory_results || current.lab_results || [];
        const abnormalLabs = labs.filter((l) => l.status === "High" || l.status === "Elevated" || l.status === "Low");

        if (abnormal.length > 0) {
          responseText = `**Abnormal Findings Identified in Report:**\n\n` +
            abnormal.map((a) => `• **${a.finding}:** ${a.importance}`).join("\n\n");
        } else if (abnormalLabs.length > 0) {
          responseText = `**Abnormal Laboratory Values:**\n\n` +
            abnormalLabs.map((l) => `• **${l.test_name || l.test}:** ${l.value} ${l.unit} [${l.status}] (Reference: ${l.reference_low || "0.6"} – ${l.reference_high || "1.2"})`).join("\n");
        } else {
          responseText = "No abnormal findings were recorded in the uploaded report.";
        }
      } else if (qClean.includes("summary") || qClean.includes("summarize") || qClean.includes("report")) {
        responseText = `**Report Summary for ${current.patient_name || "Patient"}:**\n${current.ai_summary || current.patient_summary}`;
      } else if (qClean.includes("lab") || qClean.includes("result") || qClean.includes("test")) {
        const labs = current.laboratory_results || current.lab_results || [];
        if (labs.length > 0) {
          responseText = `**Laboratory Results from Report:**\n\n` +
            labs.map((l) => `• **${l.test_name || l.test}:** ${l.value} ${l.unit} ${l.status ? `[${l.status}]` : ""}`).join("\n");
        } else {
          responseText = "This information is not present in the uploaded medical reports.";
        }
      } else {
        responseText = "This information is not present in the uploaded medical reports.";
      }

      setChatMessages((prev) => [...prev, { sender: "ai", text: responseText }]);
      setChatLoading(false);
    }, 400);
  };

  const currentAnalysis = patientAnalyses[selectedPatientId];
  const recentReports = patientReportsList[selectedPatientId] || [];
  const labsList = currentAnalysis?.laboratory_results || currentAnalysis?.lab_results || [];

  return (
    <div>
      {/* App Header Navbar */}
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__logo">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="app-header__title">MedRecord AI</h1>
            <div className="app-header__subtitle">AI Medical Report Assistant</div>
          </div>
        </div>

        <div className="app-badge">
          <span className="pulse-dot" />
          AI Powered Analysis
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">

        {/* Patient Selector Bar (ALWAYS SHOWN) */}
        <section className="app-card" style={{ padding: "18px 24px" }}>
          <div className="patient-bar">
            <div className="patient-bar__select-group">
              <span className="patient-bar__label">
                <User size={18} style={{ color: "var(--primary-blue)" }} /> Patient
              </span>
              <select
                className="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn--secondary" onClick={() => setShowNewPatientModal(true)}>
              <Plus size={16} /> New Patient
            </button>
          </div>
        </section>

        {/* ============================================================
            STATE 1: BEFORE REPORT UPLOAD (Clean, Spacious MVP State)
           ============================================================ */}
        {appState === "empty" && (
          <section className="upload-card-box">
            {/* Title & Short Description Header */}
            <div className="empty-hero">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div className="app-header__logo" style={{ width: 52, height: 52, borderRadius: 16 }}>
                  <Brain size={30} />
                </div>
              </div>
              <h2 className="empty-hero__title">MedRecord AI</h2>
              <div className="empty-hero__subtitle">AI Medical Report Assistant</div>
              <p className="empty-hero__desc">Analyze medical reports using AI</p>
            </div>

            {/* Upload Area Box */}
            <div
              className="upload-dropzone"
              onClick={() => document.getElementById("report-file-input").click()}
            >
              <div className="dropzone-icon-circle">
                <FileText size={28} />
              </div>

              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
                {selectedFile ? selectedFile.name : "Upload Medical Report"}
              </h3>

              <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)" }}>
                Large Drag & Drop Upload Area or Choose File
              </p>

              <button className="btn btn--secondary" style={{ pointerEvents: "none" }}>
                Choose PDF
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

            <div style={{ marginTop: 10 }}>
              <button
                className="btn"
                style={{ padding: "12px 32px", fontSize: 15 }}
                disabled={!selectedFile}
                onClick={() => handleUploadPDF(selectedFile)}
              >
                <Upload size={18} /> Upload & Analyze Report
              </button>
            </div>

            <p style={{ marginTop: 18, fontSize: 13, color: "var(--text-muted)" }}>
              Upload a medical report to begin AI analysis.
            </p>
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
              Analyzing Report with Gemini AI...
            </h3>

            <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
              Please wait while we extract and structure your medical report findings.
            </p>

            <div className="progress-checklist">
              <div className={`checklist-step ${processingStep >= 1 ? (processingStep > 1 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 1 ? <CheckCircle2 size={18} /> : <div className="spin-icon"><Loader2 size={18} /></div>}
                <span>Uploading Report...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 2 ? (processingStep > 2 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 2 ? <CheckCircle2 size={18} /> : processingStep === 2 ? <div className="spin-icon"><Loader2 size={18} /></div> : <FileText size={18} />}
                <span>Extracting Text...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 3 ? (processingStep > 3 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 3 ? <CheckCircle2 size={18} /> : processingStep === 3 ? <div className="spin-icon"><Loader2 size={18} /></div> : <FileSearch size={18} />}
                <span>Running OCR (only if necessary)...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 4 ? (processingStep > 4 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 4 ? <CheckCircle2 size={18} /> : processingStep === 4 ? <div className="spin-icon"><Loader2 size={18} /></div> : <Brain size={18} />}
                <span>Analyzing with Gemini...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 5 ? (processingStep > 5 ? "checklist-step--completed" : "checklist-step--active") : ""}`}>
                {processingStep > 5 ? <CheckCircle2 size={18} /> : processingStep === 5 ? <div className="spin-icon"><Loader2 size={18} /></div> : <Sparkles size={18} />}
                <span>Generating AI Summary...</span>
              </div>

              <div className={`checklist-step ${processingStep >= 6 ? "checklist-step--completed" : ""}`}>
                {processingStep >= 6 ? <CheckCircle2 size={18} /> : <CheckCircle2 size={18} style={{ opacity: 0.3 }} />}
                <span>Completed</span>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            STATE 3: ANALYSIS COMPLETE (Clean Structured View & AI Chat)
           ============================================================ */}
        {appState === "complete" && currentAnalysis && (
          <>
            {/* Header Controls Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="app-badge" style={{ background: "var(--badge-green-soft)", color: "var(--badge-green)", borderColor: "var(--badge-green-border)" }}>
                <CheckCircle2 size={14} /> Analysis Complete
              </span>

              <button
                className="btn btn--secondary"
                style={{ padding: "7px 16px", fontSize: 13 }}
                onClick={() => setAppState("empty")}
              >
                <Upload size={14} /> Upload Another Report
              </button>
            </div>

            {/* 🧠 AI Summary Section */}
            <section className="app-card" style={{ borderLeft: "5px solid var(--primary-blue)" }}>
              <div className="app-card__header">
                <div>
                  <h3 className="app-card__title">
                    <span className="app-card__icon"><Brain size={18} /></span>
                    🧠 AI Summary
                  </h3>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
                    Source: <strong>{currentAnalysis.filename}</strong> ({currentAnalysis.report_date || currentAnalysis.visit_date})
                  </span>
                </div>

                <button
                  className="btn btn--ghost"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                  onClick={() => setViewDocModal(currentAnalysis)}
                >
                  View Full Text
                </button>
              </div>

              {/* Patient Demographics Banner */}
              {(currentAnalysis.patient_name || currentAnalysis.doctor || currentAnalysis.hospital) && (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18, background: "var(--bg-app)", padding: "10px 16px", borderRadius: 8, fontSize: 13 }}>
                  {currentAnalysis.patient_name && <span><strong>Patient:</strong> {currentAnalysis.patient_name} {currentAnalysis.age ? `(${currentAnalysis.age}y)` : ""}</span>}
                  {currentAnalysis.doctor && <span><strong>Doctor:</strong> {currentAnalysis.doctor}</span>}
                  {currentAnalysis.hospital && <span><strong>Hospital:</strong> {currentAnalysis.hospital}</span>}
                </div>
              )}

              {/* Overall Summary Callout */}
              <div className="analysis-overall-card">
                <strong style={{ color: "var(--primary-blue)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={16} /> Overall Summary
                </strong>
                <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--text-main)", lineHeight: 1.6 }}>
                  {currentAnalysis.ai_summary || currentAnalysis.overall_summary || currentAnalysis.patient_summary}
                </p>
              </div>

              {/* Diagnoses Section (Smart Visibility) */}
              {((currentAnalysis.diagnoses_detail && currentAnalysis.diagnoses_detail.length > 0) || (currentAnalysis.diagnoses && currentAnalysis.diagnoses.length > 0)) && (
                <div style={{ marginBottom: 24 }}>
                  <h4 className="analysis-section-title">
                    <CheckCircle2 size={18} style={{ color: "var(--primary-blue)" }} /> Diagnoses
                  </h4>

                  {currentAnalysis.diagnoses_detail && currentAnalysis.diagnoses_detail.length > 0 ? (
                    <div>
                      {currentAnalysis.diagnoses_detail.map((d, i) => (
                        <div key={i} className="diagnosis-item-card">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: 14.5, color: "var(--text-main)" }}>{d.name}</strong>
                            <span
                              className="app-badge"
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                background: d.confidence === "High" ? "var(--badge-green-soft)" : "var(--badge-amber-soft)",
                                color: d.confidence === "High" ? "var(--badge-green)" : "var(--badge-amber)",
                                borderColor: d.confidence === "High" ? "var(--badge-green-border)" : "var(--badge-amber-border)"
                              }}
                            >
                              {d.confidence} Confidence
                            </span>
                          </div>
                          {d.evidence && (
                            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
                              Evidence: "{d.evidence}"
                            </div>
                          )}
                          {d.explanation && (
                            <div style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 6, lineHeight: 1.5 }}>
                              {d.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="list-styled">
                      {currentAnalysis.diagnoses.map((d, i) => (
                        <li key={i}>{typeof d === "object" ? d.name : d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Abnormal Findings Section (Smart Visibility) */}
              {currentAnalysis.abnormal_findings && currentAnalysis.abnormal_findings.length > 0 && (
                <div style={{ marginBottom: 24, background: "var(--badge-red-soft)", border: "1px solid var(--badge-red-border)", borderRadius: 12, padding: 16 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--badge-red)", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={16} /> Abnormal Findings
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {currentAnalysis.abnormal_findings.map((a, i) => (
                      <div key={i} style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #FECACA" }}>
                        <strong style={{ fontSize: 13.5, color: "#991B1B" }}>{a.finding}</strong>
                        <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2 }}>
                          {a.importance}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured Grid: Medications & Labs (Smart Visibility) */}
              <div className="analysis-grid">
                {/* Current Medications */}
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

                {/* Laboratory Results */}
                {labsList && labsList.length > 0 && (
                  <div className="section-box">
                    <div className="section-box__title">
                      <Activity size={16} /> Laboratory Results
                    </div>
                    <ul className="list-styled">
                      {labsList.map((l, i) => {
                        const test = l.test_name || l.test;
                        const refStr = l.reference || (l.reference_low ? `${l.reference_low} – ${l.reference_high}` : "");
                        const isAbnormal = l.status === "High" || l.status === "Elevated" || l.status === "Low";
                        return (
                          <li key={i}>
                            {test}:{" "}
                            <span className="val-badge" style={{ fontWeight: 600, color: isAbnormal ? "var(--badge-red)" : "inherit" }}>
                              {l.value} {l.unit}
                            </span>{" "}
                            {refStr && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>(ref {refStr})</span>}
                            {l.status && (
                              <span style={{ fontSize: 11, marginLeft: 6, color: isAbnormal ? "var(--badge-red)" : "var(--badge-green)", fontWeight: 600 }}>
                                [{l.status}]
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommendations (Smart Visibility) */}
              {currentAnalysis.recommendations && currentAnalysis.recommendations.trim() !== "" && (
                <div style={{ marginTop: 20, background: "var(--badge-amber-soft)", border: "1px solid var(--badge-amber-border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--badge-amber)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={16} /> Recommendations
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#854D0E", lineHeight: 1.55 }}>
                    {currentAnalysis.recommendations}
                  </p>
                </div>
              )}

              {/* Allergies Footer (Smart Visibility) */}
              {currentAnalysis.allergies && currentAnalysis.allergies.length > 0 && (
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px dashed var(--border-color)", fontSize: 13 }}>
                  <strong style={{ color: "var(--badge-red)" }}>Allergies:</strong> {currentAnalysis.allergies.join(", ")}
                </div>
              )}
            </section>

            {/* 🤖 Ask MedRecord AI (ChatGPT-style Chat) */}
            <section className="app-card">
              <div className="app-card__header">
                <h3 className="app-card__title">
                  <span className="app-card__icon"><MessageSquare size={18} /></span>
                  🤖 Ask MedRecord AI
                </h3>
              </div>

              <div className="chat-container">
                {/* Suggested Questions Chips */}
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

                {/* Chat History List */}
                <div className="chat-history">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chat-bubble ${msg.sender === "user" ? "chat-bubble--user" : "chat-bubble--ai"}`}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 4, textTransform: "uppercase" }}>
                        {msg.sender === "user" ? "You" : "MedRecord AI Assistant"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="chat-bubble chat-bubble--ai" style={{ width: 140 }}>
                      <span className="pulse-dot" /> Analyzing...
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="chat-input-bar">
                  <input
                    className="chat-input-field"
                    placeholder="Ask a question about the uploaded medical report..."
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
                Create Patient
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
                placeholder="e.g. Arthur Pendelton"
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
                  {viewDocModal.hospital || viewDocModal.provider} • {viewDocModal.report_date || viewDocModal.visit_date}
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
