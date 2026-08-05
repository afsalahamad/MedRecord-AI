"""
MedRecord AI -- FastAPI backend.

Endpoints:
  POST /patients                    create a patient
  GET  /patients                    list patients
  POST /patients/{id}/documents     upload + extract a document (PDF/image)
  GET  /documents/{id}              raw text + structured JSON for one document (source viewer)
  GET  /patients/{id}/timeline      chronological merged record
  GET  /patients/{id}/interactions  RxNav-checked drug interactions (ground-truth, severity-colored)
  GET  /patients/{id}/conflicts     deterministic duplicate/dosage/frequency conflict detection
  GET  /patients/{id}/graph         provenance & conflict graph (nodes + edges) for the graph UI
  GET  /patients/{id}/lab-tests     distinct lab test names, for autocomplete/quick-filter chips
  GET  /patients/{id}/trends/{test} deterministic trend + LLM explanation for one lab test
  POST /patients/{id}/chat          RAG Q&A with citations + confidence

Run locally:
  uvicorn main:app --reload
"""
from fastapi import FastAPI, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from db import Base, engine, get_db
from models import Patient, Document, Medication, LabResult
import extraction
import rxnav
import trends
import rag
import conflicts as conflicts_module
import normalization

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedRecord AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)


class PatientCreate(BaseModel):
    name: str


class ChatRequest(BaseModel):
    question: str


DISCLAIMER = "\n\n⚠️ This is not medical advice. Please consult a doctor or pharmacist."


@app.post("/patients")
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    patient = Patient(name=payload.name)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@app.get("/patients")
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()


@app.post("/patients/{patient_id}/documents")
async def upload_document(patient_id: int, file: UploadFile, db: Session = Depends(get_db)):
    patient = db.query(Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")

    file_bytes = await file.read()
    extracted = extraction.extract_document(file_bytes, file.filename)

    doc = Document(
        patient_id=patient_id,
        filename=file.filename,
        doc_type=extracted.get("doc_type", "other"),
        provider=extracted.get("provider"),
        visit_date=extracted.get("visit_date"),
        raw_text=extracted.get("raw_text", ""),
        structured_json=extracted,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    for med in extracted.get("medications", []):
        db.add(
            Medication(
                document_id=doc.id,
                name_raw=med.get("name"),
                dosage=med.get("dosage"),
                frequency=med.get("frequency"),
                source_snippet=med.get("source_snippet"),
            )
        )

    lab_list = extracted.get("laboratory_results") or extracted.get("lab_results", [])
    for lab in lab_list:
        db.add(
            LabResult(
                document_id=doc.id,
                test_name=lab.get("test_name"),
                value=str(lab.get("value", "")),
                unit=lab.get("unit"),
                reference_low=str(lab.get("reference_low", "")) if lab.get("reference_low") is not None else None,
                reference_high=str(lab.get("reference_high", "")) if lab.get("reference_high") is not None else None,
                source_snippet=lab.get("source_snippet"),
            )
        )

    db.commit()
    return {"document_id": doc.id, "extracted": extracted}



@app.get("/documents/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Raw text + structured JSON for one document -- backs the citation
    click-through / source viewer in the frontend."""
    doc = db.query(Document).get(document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "doc_type": doc.doc_type,
        "provider": doc.provider,
        "visit_date": doc.visit_date,
        "raw_text": doc.raw_text,
        "structured_json": doc.structured_json,
    }


def _resolve_medications(patient_id: int, db: Session) -> list[dict]:
    """
    Shared helper: pull every medication for a patient, resolve each to a
    canonical RxNorm concept (local fuzzy match first, then RxNav), and
    return plain dicts ready for the conflicts engine or the graph endpoint.
    """
    meds = (
        db.query(Medication)
        .join(Document)
        .filter(Document.patient_id == patient_id)
        .all()
    )

    resolved = []
    for m in meds:
        if not m.rxcui and m.name_raw:
            local_guess = normalization.normalize_name(m.name_raw)
            match = rxnav.normalize_drug_name(local_guess)
            if match:
                m.name_normalized = match["name"]
                m.rxcui = match["rxcui"]
            else:
                m.name_normalized = local_guess
            db.commit()

        resolved.append(
            {
                "id": m.id,
                "document_id": m.document_id,
                "filename": m.document.filename,
                "provider": m.document.provider,
                "visit_date": m.document.visit_date,
                "name_raw": m.name_raw,
                "name_normalized": m.name_normalized,
                "rxcui": m.rxcui,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "source_snippet": m.source_snippet,
            }
        )
    return resolved


@app.get("/patients/{patient_id}/timeline")
def get_timeline(patient_id: int, db: Session = Depends(get_db)):
    docs = (
        db.query(Document)
        .filter(Document.patient_id == patient_id)
        .order_by(Document.visit_date)
        .all()
    )
    return [
        {
            "document_id": d.id,
            "filename": d.filename,
            "doc_type": d.doc_type,
            "provider": d.provider,
            "visit_date": d.visit_date,
            "medications": [
                {"name": m.name_raw, "dosage": m.dosage, "frequency": m.frequency, "source": m.source_snippet}
                for m in d.medications
            ],
            "lab_results": [
                {
                    "test": l.test_name,
                    "value": l.value,
                    "unit": l.unit,
                    "reference": [l.reference_low, l.reference_high],
                    "source": l.source_snippet,
                }
                for l in d.lab_results
            ],
        }
        for d in docs
    ]


@app.get("/patients/{patient_id}/interactions")
def get_interactions(patient_id: int, db: Session = Depends(get_db)):
    """Ground-truth drug-drug interactions from NIH RxNav -- never LLM memory.
    Each result carries a `severity_color` (red/amber/green) for the UI's
    hospital-style triage flag tabs."""
    resolved = [m for m in _resolve_medications(patient_id, db) if m["rxcui"]]
    rxcuis = list({m["rxcui"] for m in resolved})
    raw_interactions = rxnav.check_interactions(rxcuis)

    interactions = [
        {**i, "severity_color": rxnav.severity_to_color(i.get("severity"))} for i in raw_interactions
    ]

    explanation = None
    if interactions:
        prompt = (
            f"Interactions found (from RxNav, a ground-truth NIH database): {interactions}\n"
            "Explain these findings in plain language for the patient."
        )
        explanation = extraction.explain_finding(prompt) + DISCLAIMER

    return {"interactions": interactions, "explanation": explanation}


@app.get("/patients/{patient_id}/conflicts")
def get_conflicts(patient_id: int, db: Session = Depends(get_db)):
    """Deterministic (non-LLM) conflict detection: duplicates, dosage
    conflicts, and frequency conflicts, grouped by RxNorm concept. Claude is
    only used afterward to phrase the plain-language explanation."""
    resolved = _resolve_medications(patient_id, db)
    found = conflicts_module.detect_conflicts(resolved)

    explanation = None
    if found:
        prompt = (
            f"A deterministic rules engine flagged these medication conflicts: {found}\n"
            "Explain these findings in plain language for the patient, grouped by drug."
        )
        explanation = extraction.explain_finding(prompt) + DISCLAIMER

    return {"conflicts": found, "explanation": explanation}


@app.get("/patients/{patient_id}/graph")
def get_provenance_graph(patient_id: int, db: Session = Depends(get_db)):
    """
    Nodes + edges for the Provenance & Conflict Graph UI.

    Nodes: one per document, one per distinct medication concept.
    Edges: document -> medication (provenance, "prescribed_in") and
           medication -> medication (conflict, colored by severity).
    """
    docs = db.query(Document).filter(Document.patient_id == patient_id).all()
    resolved = _resolve_medications(patient_id, db)
    found = conflicts_module.detect_conflicts(resolved)

    nodes = [
        {
            "id": f"doc-{d.id}",
            "type": "document",
            "label": d.filename,
            "doc_type": d.doc_type,
            "provider": d.provider,
            "visit_date": d.visit_date,
        }
        for d in docs
    ]

    seen_concepts = {}
    edges = []
    for m in resolved:
        concept_key = m["rxcui"] or m["name_normalized"] or m["name_raw"]
        if not concept_key:
            continue
        node_id = f"med-{concept_key}"
        if node_id not in seen_concepts:
            seen_concepts[node_id] = True
            nodes.append(
                {
                    "id": node_id,
                    "type": "medication",
                    "label": m["name_normalized"] or m["name_raw"],
                }
            )
        edges.append(
            {
                "source": f"doc-{m['document_id']}",
                "target": node_id,
                "type": "provenance",
                "medication_id": m["id"],
                "source_snippet": m["source_snippet"],
            }
        )

    # Conflict edges connect the documents disagreeing about the same drug
    for c in found:
        node_id = f"med-{c['drug']}"
        doc_ids = c["document_ids"]
        for i in range(len(doc_ids)):
            for j in range(i + 1, len(doc_ids)):
                edges.append(
                    {
                        "source": f"doc-{doc_ids[i]}",
                        "target": f"doc-{doc_ids[j]}",
                        "type": "conflict",
                        "conflict_type": c["type"],
                        "severity": c["severity"],
                        "via": node_id,
                        "detail": c["detail"],
                    }
                )

    return {"nodes": nodes, "edges": edges}


@app.get("/patients/{patient_id}/lab-tests")
def list_lab_tests(patient_id: int, db: Session = Depends(get_db)):
    """Distinct lab test names for this patient -- powers the frontend's
    <datalist> autocomplete and quick-select filter chips."""
    rows = (
        db.query(LabResult.test_name)
        .join(Document)
        .filter(Document.patient_id == patient_id, LabResult.test_name.isnot(None))
        .distinct()
        .all()
    )
    return sorted({r[0] for r in rows if r[0]})


@app.get("/patients/{patient_id}/trends/{test_name}")
def get_trend(patient_id: int, test_name: str, db: Session = Depends(get_db)):
    results = (
        db.query(LabResult)
        .join(Document)
        .filter(Document.patient_id == patient_id, LabResult.test_name.ilike(test_name))
        .order_by(Document.visit_date)
        .all()
    )
    if not results:
        raise HTTPException(404, f"No lab results found for '{test_name}'")

    values = [r.value for r in results]
    trend = trends.compute_trend(values, list(range(len(values))))
    statuses = [trends.flag_out_of_range(r.value, r.reference_low, r.reference_high) for r in results]

    latest = results[-1]
    prompt = (
        f"Lab test: {test_name}. Values over time: {values}. "
        f"Computed trend: {trend}. Reference range: {latest.reference_low}-{latest.reference_high}. "
        "Explain what this trend means in plain language."
    )
    explanation = extraction.explain_finding(prompt) + DISCLAIMER

    return {
        "test_name": test_name,
        "values": values,
        "statuses": statuses,
        "visit_dates": [r.document.visit_date for r in results],
        "trend": trend,
        "reference_range": [latest.reference_low, latest.reference_high],
        "explanation": explanation,
        "sources": [{"document_id": r.document_id, "snippet": r.source_snippet} for r in results],
    }


@app.post("/patients/{patient_id}/chat")
def chat(patient_id: int, payload: ChatRequest, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.patient_id == patient_id).all()
    if not docs:
        raise HTTPException(404, "No documents for this patient yet")

    # Build chunk pool from raw_text of every document (provenance: doc id + filename)
    chunks = []
    for d in docs:
        for piece in rag.chunk_document_text(d.raw_text or ""):
            chunks.append({"text": piece, "document_id": d.id, "filename": d.filename})

    top_chunks = rag.retrieve(payload.question, chunks, top_k=5)

    # Confidence: derived from retrieval similarity, not invented by the LLM
    avg_similarity = sum(c["similarity"] for c in top_chunks) / len(top_chunks) if top_chunks else 0.0
    confidence = "high" if avg_similarity > 0.6 else "medium" if avg_similarity > 0.4 else "low"

    context = "\n\n".join(f"[Source: {c['filename']} (doc #{c['document_id']})]\n{c['text']}" for c in top_chunks)
    prompt = (
        f"Patient question: {payload.question}\n\n"
        f"Relevant excerpts from the patient's records:\n{context}\n\n"
        "Answer using ONLY the excerpts above. Cite which document each fact came from. "
        "If the excerpts don't contain the answer, say so plainly."
    )
    answer = extraction.explain_finding(prompt) + DISCLAIMER

    return {
        "answer": answer,
        "confidence": confidence,
        "sources": [{"document_id": c["document_id"], "filename": c["filename"], "similarity": c["similarity"]} for c in top_chunks],
    }


@app.get("/")
def root():
    return {"status": "ok", "service": "MedRecord AI backend"}
