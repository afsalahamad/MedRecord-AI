// Realistic sample medical datasets for MedRecord AI Clinical Dashboard Prototype

export const SAMPLE_PATIENTS = [
  {
    id: 101,
    name: "Eleanor Vance",
    age: 68,
    gender: "Female",
    dob: "1958-03-14",
    mrn: "MRN-889241",
    pcp: "Dr. Robert Vance, MD",
    facility: "Mercy General Hospital",
    riskLevel: "high",
    riskTitle: "High Risk: Medication Conflict & Renal Stress",
    riskDescription: "Duplicate dosage conflict detected for Lisinopril across two hospital systems. Serum creatinine trending upward (1.1 → 1.9 mg/dL).",
    vitals: {
      bp: "138/86",
      bpStatus: "amber",
      hr: 76,
      hrStatus: "green",
      spo2: 98,
      spo2Status: "green",
      temp: "98.6°F",
      bmi: "27.8",
      egfr: "48 mL/min",
      egfrStatus: "amber",
    },
    diagnoses: [
      { code: "E11.9", name: "Type 2 Diabetes Mellitus", status: "Active", onset: "2018" },
      { code: "I10", name: "Essential Hypertension", status: "Active", onset: "2015" },
      { code: "N18.31", name: "Chronic Kidney Disease, Stage 3a", status: "Active", onset: "2023" },
      { code: "E78.5", name: "Hyperlipidemia", status: "Active", onset: "2019" },
    ],
    allergies: [
      { allergen: "Penicillin G", reaction: "Anaphylaxis & Urticaria", severity: "high" },
      { allergen: "Sulfa Antibiotics", reaction: "Cutaneous Maculopapular Rash", severity: "medium" },
    ]
  },
  {
    id: 102,
    name: "Arthur Pendelton",
    age: 74,
    gender: "Male",
    dob: "1952-11-03",
    mrn: "MRN-441029",
    pcp: "Dr. Sarah Lin, MD",
    facility: "St. Jude Medical Center",
    riskLevel: "medium",
    riskTitle: "Moderate Risk: Polypharmacy & Drug Interaction",
    riskDescription: "Potential interaction between Warfarin and newly prescribed Amiodarone. INR monitoring required.",
    vitals: {
      bp: "128/78",
      bpStatus: "green",
      hr: 64,
      hrStatus: "green",
      spo2: 96,
      spo2Status: "green",
      temp: "98.2°F",
      bmi: "25.1",
      egfr: "62 mL/min",
      egfrStatus: "green",
    },
    diagnoses: [
      { code: "I48.91", name: "Atrial Fibrillation", status: "Active", onset: "2020" },
      { code: "I50.9", name: "Heart Failure with Preserved EF", status: "Active", onset: "2021" },
      { code: "M10.9", name: "Gouty Arthritis", status: "Active", onset: "2017" },
    ],
    allergies: [
      { allergen: "Codeine", reaction: "Severe Nausea & Somnolence", severity: "medium" },
    ]
  },
  {
    id: 103,
    name: "Maria Santos",
    age: 52,
    gender: "Female",
    dob: "1974-06-21",
    mrn: "MRN-192840",
    pcp: "Dr. James Hayes, MD",
    facility: "University Health System",
    riskLevel: "low",
    riskTitle: "Low Risk: Stable Routine Follow-up",
    riskDescription: "Lab markers within normal reference intervals. No active dosage conflicts or critical interactions.",
    vitals: {
      bp: "118/74",
      bpStatus: "green",
      hr: 70,
      hrStatus: "green",
      spo2: 99,
      spo2Status: "green",
      temp: "98.4°F",
      bmi: "23.4",
      egfr: "92 mL/min",
      egfrStatus: "green",
    },
    diagnoses: [
      { code: "E03.9", name: "Hypothyroidism", status: "Active", onset: "2016" },
      { code: "M54.5", name: "Chronic Low Back Pain", status: "Active", onset: "2022" },
    ],
    allergies: [
      { allergen: "Latex", reaction: "Contact Dermatitis", severity: "low" },
    ]
  }
];

export const SAMPLE_TIMELINE = [
  {
    document_id: 1001,
    filename: "Mercy_General_Discharge_Summary_Jan2026.pdf",
    doc_type: "Discharge Summary",
    provider: "Mercy General Hospital - Cardiology Dept",
    visit_date: "2026-01-15",
    medications: [
      { name: "Lisinopril", dosage: "20mg", frequency: "once daily", source: "Discharged on Lisinopril 20mg PO QD for hypertension control." },
      { name: "Metformin", dosage: "1000mg", frequency: "twice daily with meals", source: "Continue Metformin 1000mg BID for type 2 diabetes." },
      { name: "Spironolactone", dosage: "25mg", frequency: "once daily in AM", source: "Added Spironolactone 25mg PO daily to regimen." },
      { name: "Atorvastatin", dosage: "40mg", frequency: "once daily at bedtime", source: "Atorvastatin 40mg PO QD maintained." }
    ],
    lab_results: [
      { test: "Creatinine", value: "1.9", unit: "mg/dL", reference: [0.6, 1.2], source: "Serum Creatinine elevated at 1.9 mg/dL on discharge lab panel." },
      { test: "Potassium", value: "5.4", unit: "mEq/L", reference: [3.5, 5.0], source: "Serum Potassium noted at 5.4 mEq/L (borderline hyperkalemia)." },
      { test: "HbA1c", value: "7.1", unit: "%", reference: [4.0, 5.6], source: "HbA1c 7.1% indicating controlled T2DM." }
    ],
    notes: "Patient admitted for hypertensive urgency. Stabilized with adjusted regimen. Advised nephrology follow-up within 2 weeks."
  },
  {
    document_id: 1002,
    filename: "Outpatient_Nephrology_Consult_Nov2025.pdf",
    doc_type: "Specialist Consultation",
    provider: "St. Jude Kidney & Hypertension Clinic",
    visit_date: "2025-11-20",
    medications: [
      { name: "Lisinopril", dosage: "10mg", frequency: "once daily", source: "Reduced Lisinopril dose to 10mg daily due to rising baseline creatinine." },
      { name: "Metformin", dosage: "500mg", frequency: "twice daily", source: "Metformin dose adjusted down to 500mg BID to prevent lactic acidosis risk." }
    ],
    lab_results: [
      { test: "Creatinine", value: "1.6", unit: "mg/dL", reference: [0.6, 1.2], source: "Creatinine 1.6 mg/dL up from 1.3 mg/dL three months prior." },
      { test: "eGFR", value: "54", unit: "mL/min/1.73m²", reference: [60, 120], source: "Calculated eGFR 54 mL/min/1.73m² (CKD Stage 3a)." }
    ],
    notes: "Recommending moderate dietary potassium restriction and close monitoring of renal parameters."
  },
  {
    document_id: 1003,
    filename: "Primary_Care_Progress_Note_Aug2025.pdf",
    doc_type: "Progress Note",
    provider: "Dr. Robert Vance, MD - Family Medicine",
    visit_date: "2025-08-10",
    medications: [
      { name: "Lisinopril", dosage: "20mg", frequency: "once daily", source: "Patient taking Lisinopril 20mg daily with good blood pressure response." },
      { name: "Glucophage (Metformin)", dosage: "500mg", frequency: "twice daily", source: "Prescribed Glucophage 500mg BID." },
      { name: "Atorvastatin", dosage: "20mg", frequency: "once daily", source: "Atorvastatin 20mg daily started for lipid management." }
    ],
    lab_results: [
      { test: "Creatinine", value: "1.3", unit: "mg/dL", reference: [0.6, 1.2], source: "Creatinine 1.3 mg/dL baseline." },
      { test: "Potassium", value: "4.6", unit: "mEq/L", reference: [3.5, 5.0], source: "Potassium 4.6 mEq/L within normal range." },
      { test: "HbA1c", value: "7.4", unit: "%", reference: [4.0, 5.6], source: "HbA1c 7.4%." }
    ],
    notes: "Routine follow-up visit. Blood pressure 132/82 mmHg."
  },
  {
    document_id: 1004,
    filename: "Annual_Metabolic_Panel_Jan2025.pdf",
    doc_type: "Lab Report",
    provider: "Quest Diagnostics Regional Lab",
    visit_date: "2025-01-08",
    medications: [],
    lab_results: [
      { test: "Creatinine", value: "1.1", unit: "mg/dL", reference: [0.6, 1.2], source: "Serum Creatinine 1.1 mg/dL." },
      { test: "Potassium", value: "4.2", unit: "mEq/L", reference: [3.5, 5.0], source: "Serum Potassium 4.2 mEq/L." },
      { test: "HbA1c", value: "7.8", unit: "%", reference: [4.0, 5.6], source: "HbA1c 7.8%." },
      { test: "Blood Glucose", value: "142", unit: "mg/dL", reference: [70, 99], source: "Fasting Blood Glucose 142 mg/dL." }
    ],
    notes: "Baseline annual lab screening."
  }
];

export const SAMPLE_GRAPH_DATA = {
  nodes: [
    { id: "doc-1001", type: "document", label: "Mercy_General_Discharge_Jan2026.pdf", doc_type: "Discharge Summary", provider: "Mercy General", visit_date: "2026-01-15" },
    { id: "doc-1002", type: "document", label: "Nephrology_Consult_Nov2025.pdf", doc_type: "Consultation", provider: "St. Jude Clinic", visit_date: "2025-11-20" },
    { id: "doc-1003", type: "document", label: "PCP_Progress_Note_Aug2025.pdf", doc_type: "Progress Note", provider: "Dr. Vance", visit_date: "2025-08-10" },
    { id: "doc-1004", type: "document", label: "Metabolic_Panel_Jan2025.pdf", doc_type: "Lab Report", provider: "Quest Lab", visit_date: "2025-01-08" },
    
    { id: "med-Lisinopril", type: "medication", label: "Lisinopril" },
    { id: "med-Metformin", type: "medication", label: "Metformin" },
    { id: "med-Spironolactone", type: "medication", label: "Spironolactone" },
    { id: "med-Atorvastatin", type: "medication", label: "Atorvastatin" },
  ],
  edges: [
    { source: "doc-1001", target: "med-Lisinopril", type: "provenance", medication_id: 1, source_snippet: "Discharged on Lisinopril 20mg PO QD" },
    { source: "doc-1002", target: "med-Lisinopril", type: "provenance", medication_id: 2, source_snippet: "Reduced Lisinopril dose to 10mg daily" },
    { source: "doc-1003", target: "med-Lisinopril", type: "provenance", medication_id: 3, source_snippet: "Lisinopril 20mg daily" },
    
    { source: "doc-1001", target: "med-Metformin", type: "provenance", medication_id: 4, source_snippet: "Metformin 1000mg BID" },
    { source: "doc-1002", target: "med-Metformin", type: "provenance", medication_id: 5, source_snippet: "Metformin 500mg BID" },
    { source: "doc-1003", target: "med-Metformin", type: "provenance", medication_id: 6, source_snippet: "Glucophage 500mg BID" },

    { source: "doc-1001", target: "med-Spironolactone", type: "provenance", medication_id: 7, source_snippet: "Added Spironolactone 25mg" },
    { source: "doc-1001", target: "med-Atorvastatin", type: "provenance", medication_id: 8, source_snippet: "Atorvastatin 40mg QD" },
    { source: "doc-1003", target: "med-Atorvastatin", type: "provenance", medication_id: 9, source_snippet: "Atorvastatin 20mg daily" },

    // Conflict edges
    {
      source: "doc-1001",
      target: "doc-1002",
      type: "conflict",
      conflict_type: "dosage_conflict",
      severity: "red",
      via: "med-Lisinopril",
      detail: "Lisinopril prescribed at 20mg daily in Hospital Discharge (Jan 2026) vs 10mg daily in Nephrology Note (Nov 2025)."
    },
    {
      source: "doc-1001",
      target: "doc-1002",
      type: "conflict",
      conflict_type: "dosage_conflict",
      severity: "amber",
      via: "med-Metformin",
      detail: "Metformin prescribed at 1000mg BID in Hospital Discharge vs 500mg BID in Nephrology Consult."
    },
    {
      source: "doc-1003",
      target: "doc-1002",
      type: "conflict",
      conflict_type: "duplicate_brand_generic",
      severity: "amber",
      via: "med-Metformin",
      detail: "Duplicate therapy recorded under brand name 'Glucophage' and generic 'Metformin'."
    }
  ]
};

export const SAMPLE_INTERACTIONS = {
  interactions: [
    {
      drugs: ["Lisinopril", "Spironolactone"],
      severity: "High (Severe Risk)",
      severity_color: "red",
      mechanism: "Dual renin-angiotensin-aldosterone system (RAAS) blockade with potassium-sparing diuretic.",
      detail: "Concomitant use significantly increases the risk of life-threatening hyperkalemia (Serum K+ > 5.5 mEq/L) and renal impairment in patients with CKD Stage 3a.",
      recommendation: "Monitor serum potassium and renal function closely within 3-5 days. Consider stopping Spironolactone or adjusting dose."
    },
    {
      drugs: ["Lisinopril", "Creatinine Elevation"],
      severity: "Moderate Risk",
      severity_color: "amber",
      mechanism: "Hemodynamic decrease in glomerular filtration pressure.",
      detail: "ACE inhibitor therapy in setting of rising serum creatinine (1.1 -> 1.9 mg/dL) requires dose evaluation.",
      recommendation: "Evaluate for renal artery stenosis or hypovolemia. Consider dose reduction."
    },
    {
      drugs: ["Atorvastatin", "Metformin"],
      severity: "Low Risk",
      severity_color: "green",
      mechanism: "Standard metabolic combination.",
      detail: "No clinically significant direct drug-drug interaction flagged by RxNav ground truth.",
      recommendation: "Routine metabolic monitoring."
    }
  ],
  explanation: "⚠️ RxNav Ground-Truth Grounded Evaluation: The patient is concurrently taking Lisinopril (20mg) and Spironolactone (25mg). In the presence of impaired renal clearance (eGFR 48 mL/min, Serum Creatinine 1.9 mg/dL), this combination creates a severe risk of acute hyperkalemia (currently 5.4 mEq/L). Frequent electrolyte monitoring is strongly recommended."
};

export const SAMPLE_CONFLICTS = {
  conflicts: [
    {
      type: "dosage_conflict",
      drug: "Lisinopril",
      severity: "red",
      document_ids: [1001, 1002],
      detail: "Hospital Discharge (Jan 2026) specifies Lisinopril 20mg QD, whereas Nephrology Consult (Nov 2025) intentionally reduced dose to 10mg QD due to renal stress.",
      actionRequired: "Confirm active target dose with prescribing cardiologist/nephrologist."
    },
    {
      type: "dosage_conflict",
      drug: "Metformin",
      severity: "amber",
      document_ids: [1001, 1002],
      detail: "Hospital Discharge specifies Metformin 1000mg BID, while Nephrology Consult ordered 500mg BID to prevent renal accumulation.",
      actionRequired: "Verify eGFR-adjusted dosing protocol."
    },
    {
      type: "duplicate_brand_generic",
      drug: "Metformin / Glucophage",
      severity: "amber",
      document_ids: [1002, 1003],
      detail: "PCP Note lists 'Glucophage 500mg BID' while Nephrology Note lists 'Metformin 500mg BID'. Risk of accidental double dosing if both prescriptions filled.",
      actionRequired: "Reconcile brand vs generic entries in pharmacy EHR."
    }
  ],
  explanation: "⚠️ Deterministic Conflict Engine: 3 cross-document conflicts detected. The primary safety concern is the Lisinopril dose escalation to 20mg at hospital discharge despite explicit prior nephrology dose reduction to 10mg due to declining eGFR."
};

export const SAMPLE_LAB_TEST_NAMES = [
  "Creatinine",
  "eGFR",
  "Potassium",
  "HbA1c",
  "Blood Glucose",
  "Total Cholesterol",
  "ALT",
  "AST"
];

export const SAMPLE_LAB_TRENDS_DATA = {
  "Creatinine": {
    test_name: "Creatinine",
    unit: "mg/dL",
    values: [1.1, 1.3, 1.6, 1.9],
    statuses: [null, null, "above_range", "above_range"],
    visit_dates: ["2025-01-08", "2025-08-10", "2025-11-20", "2026-01-15"],
    trend: { slope: 0.26, pct_change: 72.7, direction: "worsening_up" },
    reference_range: [0.6, 1.2],
    explanation: "Serum Creatinine demonstrates a progressive linear upward trajectory over 12 months (+72.7% increase from 1.1 to 1.9 mg/dL). Both recent values exceed the upper limit of normal (1.2 mg/dL), reflecting declining renal excretory clearance.",
    sources: [
      { document_id: 1004, snippet: "Serum Creatinine 1.1 mg/dL." },
      { document_id: 1003, snippet: "Creatinine 1.3 mg/dL baseline." },
      { document_id: 1002, snippet: "Creatinine 1.6 mg/dL up from 1.3 mg/dL." },
      { document_id: 1001, snippet: "Serum Creatinine elevated at 1.9 mg/dL." }
    ]
  },
  "eGFR": {
    test_name: "eGFR",
    unit: "mL/min/1.73m²",
    values: [78, 68, 54, 48],
    statuses: [null, null, "below_range", "below_range"],
    visit_dates: ["2025-01-08", "2025-08-10", "2025-11-20", "2026-01-15"],
    trend: { slope: -9.8, pct_change: -38.4, direction: "worsening_down" },
    reference_range: [60, 120],
    explanation: "eGFR has decreased steadily from 78 to 48 mL/min/1.73m² (-38.4%). Values under 60 mL/min indicate Stage 3a Chronic Kidney Disease. Dose adjustment for renally cleared drugs is indicated.",
    sources: [
      { document_id: 1004, snippet: "eGFR 78 mL/min/1.73m²." },
      { document_id: 1002, snippet: "Calculated eGFR 54 mL/min/1.73m² (CKD Stage 3a)." }
    ]
  },
  "Potassium": {
    test_name: "Potassium",
    unit: "mEq/L",
    values: [4.2, 4.6, 5.1, 5.4],
    statuses: [null, null, "above_range", "above_range"],
    visit_dates: ["2025-01-08", "2025-08-10", "2025-11-20", "2026-01-15"],
    trend: { slope: 0.38, pct_change: 28.5, direction: "worsening_up" },
    reference_range: [3.5, 5.0],
    explanation: "Serum Potassium has risen to 5.4 mEq/L (above reference range 3.5–5.0 mEq/L). This trend correlates with combined Lisinopril + Spironolactone intake and impaired renal excretion.",
    sources: [
      { document_id: 1004, snippet: "Serum Potassium 4.2 mEq/L." },
      { document_id: 1001, snippet: "Serum Potassium noted at 5.4 mEq/L." }
    ]
  },
  "HbA1c": {
    test_name: "HbA1c",
    unit: "%",
    values: [7.8, 7.4, 7.2, 7.1],
    statuses: ["above_range", "above_range", "above_range", "above_range"],
    visit_dates: ["2025-01-08", "2025-08-10", "2025-11-20", "2026-01-15"],
    trend: { slope: -0.22, pct_change: -8.9, direction: "improving_down" },
    reference_range: [4.0, 5.6],
    explanation: "HbA1c displays steady glycemic improvement from 7.8% down to 7.1% over the past year, reflecting effective diabetic therapy management.",
    sources: [
      { document_id: 1004, snippet: "HbA1c 7.8%." },
      { document_id: 1001, snippet: "HbA1c 7.1% indicating controlled T2DM." }
    ]
  }
};

export const SAMPLE_CHAT_RESPONSES = [
  {
    query_keywords: ["lisinopril", "dose", "dosage", "conflict"],
    answer: "Based on the uploaded medical records, there is a clear medication conflict regarding Lisinopril:\n\n1. In the **Outpatient Nephrology Consult (Nov 20, 2025)**, the dose was lowered to **10mg once daily** due to rising creatinine (1.6 mg/dL).\n2. In the **Mercy General Discharge Summary (Jan 15, 2026)**, Lisinopril was listed at **20mg once daily**.\n\nGiven the recent serum creatinine rise to 1.9 mg/dL and potassium at 5.4 mEq/L, taking Lisinopril at 20mg alongside Spironolactone 25mg poses a high hyperkalemia risk.",
    confidence: "high",
    sources: [
      { document_id: 1001, filename: "Mercy_General_Discharge_Summary_Jan2026.pdf", similarity: 0.89 },
      { document_id: 1002, filename: "Outpatient_Nephrology_Consult_Nov2025.pdf", similarity: 0.84 }
    ]
  },
  {
    query_keywords: ["creatinine", "kidney", "egfr", "lab", "renally"],
    answer: "Serum Creatinine has demonstrated a progressive increase over the last 12 months:\n• Jan 2025: **1.1 mg/dL** (Normal)\n• Aug 2025: **1.3 mg/dL**\n• Nov 2025: **1.6 mg/dL** (Above Normal)\n• Jan 2026: **1.9 mg/dL** (High - Discharged from Mercy General)\n\nSimultaneously, eGFR declined to **48 mL/min/1.73m²**, placing the patient in Stage 3a Chronic Kidney Disease. This warrants evaluation of all renally cleared drugs (Metformin, Lisinopril, Spironolactone).",
    confidence: "high",
    sources: [
      { document_id: 1001, filename: "Mercy_General_Discharge_Summary_Jan2026.pdf", similarity: 0.92 },
      { document_id: 1004, filename: "Annual_Metabolic_Panel_Jan2025.pdf", similarity: 0.78 }
    ]
  },
  {
    query_keywords: ["interaction", "spironolactone", "hyperkalemia", "danger"],
    answer: "Yes, a critical drug-drug interaction was identified:\n\n• **Lisinopril (20mg daily)** + **Spironolactone (25mg daily)**\n• **Risk:** Dual RAAS blockade combined with potassium sparing. In patients with CKD Stage 3a (eGFR 48), this leads to potassium retention.\n• **Current Serum K+:** **5.4 mEq/L** (Normal: 3.5–5.0 mEq/L).\n\n**Clinical Action:** Urgent review with nephrologist/cardiologist to determine if Spironolactone should be paused.",
    confidence: "high",
    sources: [
      { document_id: 1001, filename: "Mercy_General_Discharge_Summary_Jan2026.pdf", similarity: 0.91 }
    ]
  }
];

export const DEFAULT_AI_RESPONSE = {
  answer: "According to the patient's records, Eleanor Vance has 4 active diagnoses (Type 2 Diabetes, Hypertension, CKD Stage 3a, Hyperlipidemia) across 4 uploaded documents. Her current regimen includes Lisinopril, Metformin, Spironolactone, and Atorvastatin. Key clinical focus areas are reconciling her Lisinopril dosage and monitoring serum creatinine and potassium levels.",
  confidence: "medium",
  sources: [
    { document_id: 1001, filename: "Mercy_General_Discharge_Summary_Jan2026.pdf", similarity: 0.75 },
    { document_id: 1002, filename: "Outpatient_Nephrology_Consult_Nov2025.pdf", similarity: 0.71 }
  ]
};
