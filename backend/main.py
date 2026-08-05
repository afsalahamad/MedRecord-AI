"""
MedRecord AI -- FastAPI backend (Supabase PostgreSQL + Storage + Gemini API).

Endpoints:
  POST /patients                    create a patient (UUID)
  GET  /patients                    list patients
  POST /patients/{id}/documents     upload PDF to Supabase Storage + extract document with Gemini
  GET  /patients/{id}/documents     list all documents for a patient
  GET  /documents/{id}              raw text + structured JSON for one document
  GET  /patients/{id}/analysis      latest aggregated analysis for a patient
  GET  /patients/{id}/timeline      chronological merged record
  GET  /patients/{id}/interactions  RxNav-checked drug interactions
  GET  /patients/{id}/conflicts     deterministic conflict detection
  GET  /patients/{id}/graph         provenance & conflict graph
  GET  /patients/{id}/lab-tests     distinct lab test names
  GET  /patients/{id}/trends/{test} lab test trend analysis
  POST /patients/{id}/chat          RAG Q&A (stored in Supabase chat_history)
  GET  /patients/{id}/chat          fetch chat history from Supabase
"""
import json
import traceback
from fastapi import FastAPI, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from db import Base, engine, get_db
from models import (
    Patient, Document, Medication, LabResult,
    Diagnosis, Allergy, Procedure, ReportAnalysis, ChatHistory
)
from supabase_storage import upload_file_to_supabase, delete_patient_files_from_supabase
import extraction
import rxnav
import trends
import rag
import conflicts as conflicts_module
import normalization

# Create tables in PostgreSQL / SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedRecord AI Engine")

import os

origins_env = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
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
    print(f"[DEBUG LOG] Create patient requested: '{payload.name}'")
    patient = Patient(name=payload.name)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    print(f"[DEBUG LOG] Patient created in DB: ID '{patient.id}'")
    return patient


@app.get("/patients")
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()


@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    print(f"[DEBUG LOG] Delete patient requested: patient_id='{patient_id}'")
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        print(f"[DEBUG ERROR] Patient not found for deletion: patient_id='{patient_id}'")
        raise HTTPException(404, f"Patient with ID '{patient_id}' not found")

    try:
        # Collect file storage paths before deletion
        docs = db.query(Document).filter(Document.patient_id == patient_id).all()
        storage_paths = [doc.storage_path for doc in docs if doc.storage_path]

        # Delete uploaded PDF files from Supabase Storage
        delete_patient_files_from_supabase(patient_id, storage_paths)

        # Delete patient from DB (SQLAlchemy cascades delete to all 8 related models)
        db.delete(patient)
        db.commit()
        print(f"[DEBUG LOG] Patient '{patient_id}' and all related records deleted cleanly!")
        return {"status": "success", "message": f"Patient '{patient_id}' deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"[DEBUG ERROR] Failed to delete patient '{patient_id}': {e}")
        traceback.print_exc()
        raise HTTPException(500, f"Failed to delete patient: {str(e)}")


@app.post("/patients/{patient_id}/documents")
async def upload_document(patient_id: str, file: UploadFile, db: Session = Depends(get_db)):
    print(f"\n==========================================")
    print(f"[DEBUG LOG] Upload started: filename='{file.filename}', patient_id='{patient_id}'")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        print(f"[DEBUG ERROR] Patient not found: ID '{patient_id}'")
        raise HTTPException(404, f"Patient with ID '{patient_id}' not found")

    try:
        file_bytes = await file.read()
        print(f"[DEBUG LOG] File read completed: {len(file_bytes)} bytes read")

        # 1. Upload file to Supabase Storage bucket
        print(f"[DEBUG LOG] Supabase storage upload started...")
        storage_res = upload_file_to_supabase(
            file_bytes=file_bytes,
            filename=file.filename,
            patient_id=patient_id,
            content_type=file.content_type or "application/pdf"
        )
        print(f"[DEBUG LOG] Supabase storage upload completed: {storage_res}")

        # 2. Extract structured analysis via Gemini Vision OCR
        print(f"[DEBUG LOG] OCR / Gemini analysis started...")
        extracted = extraction.extract_document(file_bytes, file.filename)
        print(f"[DEBUG LOG] OCR / Gemini analysis completed: {json.dumps(extracted, indent=2)[:300]}...")

        # 3. Store Document in Supabase PostgreSQL
        print(f"[DEBUG LOG] Database save started...")
        doc = Document(
            patient_id=patient_id,
            filename=file.filename,
            doc_type=extracted.get("doc_type", "other"),
            provider=extracted.get("provider") or extracted.get("doctor") or extracted.get("hospital"),
            visit_date=str(extracted.get("visit_date") or extracted.get("report_date") or ""),
            raw_text=extracted.get("raw_text", ""),
            structured_json=extracted,
            storage_path=storage_res.get("storage_path"),
            storage_bucket=storage_res.get("storage_bucket"),
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        print(f"[DEBUG LOG] Document saved to DB: ID '{doc.id}'")

        # 4. Save Medications
        for med in extracted.get("medications", []):
            if isinstance(med, dict):
                db.add(
                    Medication(
                        document_id=doc.id,
                        name_raw=med.get("name"),
                        dosage=med.get("dosage"),
                        frequency=med.get("frequency"),
                        source_snippet=med.get("source_snippet"),
                    )
                )

        # 5. Save Lab Results
        lab_list = extracted.get("laboratory_results") or extracted.get("lab_results", [])
        for lab in lab_list:
            if isinstance(lab, dict):
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

        # 6. Save Diagnoses
        diag_list = extracted.get("diagnoses_detail") or extracted.get("diagnoses", [])
        for diag in diag_list:
            if isinstance(diag, dict):
                db.add(
                    Diagnosis(
                        document_id=doc.id,
                        name=diag.get("name") or diag.get("diagnosis"),
                        code=diag.get("code") or diag.get("icd10"),
                        status=diag.get("status", "Active"),
                        onset=diag.get("onset"),
                        evidence=diag.get("evidence"),
                        explanation=diag.get("explanation"),
                        source_snippet=diag.get("source_snippet"),
                    )
                )
            elif isinstance(diag, str):
                db.add(Diagnosis(document_id=doc.id, name=diag, status="Active"))

        # 7. Save Allergies
        for allergy in extracted.get("allergies", []):
            if isinstance(allergy, dict):
                db.add(
                    Allergy(
                        document_id=doc.id,
                        allergen=allergy.get("allergen") or allergy.get("name"),
                        reaction=allergy.get("reaction"),
                        severity=allergy.get("severity", "medium"),
                    )
                )
            elif isinstance(allergy, str):
                db.add(Allergy(document_id=doc.id, allergen=allergy))

        # 8. Save Procedures
        for proc in extracted.get("procedures", []):
            if isinstance(proc, dict):
                db.add(Procedure(document_id=doc.id, name=proc.get("name"), date=proc.get("date")))
            elif isinstance(proc, str):
                db.add(Procedure(document_id=doc.id, name=proc))

        # 9. Save Report Analysis
        analysis = ReportAnalysis(
            document_id=doc.id,
            ai_summary=extracted.get("ai_summary") or extracted.get("patient_summary") or extracted.get("summary", ""),
            recommendations=extracted.get("recommendations") or extracted.get("recommendation", ""),
            abnormal_findings=extracted.get("abnormal_findings", []),
            vitals=extracted.get("vitals", []),
        )
        db.add(analysis)

        db.commit()
        print(f"[DEBUG LOG] Database save completed successfully for document '{doc.id}'!")

        response_payload = {"document_id": doc.id, "extracted": extracted, "storage": storage_res}
        print(f"[DEBUG LOG] API response payload prepared successfully")
        print(f"==========================================\n")
        return response_payload

    except Exception as exc:
        print(f"[DEBUG ERROR] Exception in upload_document: {exc}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(500, f"Error processing document upload: {str(exc)}")


@app.get("/patients/{patient_id}/documents")
def get_patient_documents(patient_id: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.patient_id == patient_id).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "doc_type": d.doc_type,
            "provider": d.provider,
            "visit_date": d.visit_date,
            "created_at": d.created_at,
            "storage_path": d.storage_path,
            "storage_bucket": d.storage_bucket
        }
        for d in docs
    ]


@app.get("/documents/{document_id}")
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
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
        "storage_path": doc.storage_path,
        "storage_bucket": doc.storage_bucket
    }


@app.get("/patients/{patient_id}/analysis")
def get_patient_analysis(patient_id: str, db: Session = Depends(get_db)):
    """Aggregates all real patient data stored in Supabase PostgreSQL."""
    docs = db.query(Document).filter(Document.patient_id == patient_id).order_by(Document.created_at.desc()).all()
    if not docs:
        return None

    latest_doc = docs[0]
    meds = db.query(Medication).join(Document).filter(Document.patient_id == patient_id).all()
    labs = db.query(LabResult).join(Document).filter(Document.patient_id == patient_id).all()
    diags = db.query(Diagnosis).join(Document).filter(Document.patient_id == patient_id).all()
    allergies = db.query(Allergy).join(Document).filter(Document.patient_id == patient_id).all()
    procs = db.query(Procedure).join(Document).filter(Document.patient_id == patient_id).all()
    analyses = db.query(ReportAnalysis).join(Document).filter(Document.patient_id == patient_id).all()

    latest_analysis = analyses[0] if analyses else None

    return {
        "document_id": latest_doc.id,
        "filename": latest_doc.filename,
        "doc_type": latest_doc.doc_type,
        "provider": latest_doc.provider,
        "report_date": latest_doc.visit_date,
        "raw_text": latest_doc.raw_text,
        "ai_summary": latest_analysis.ai_summary if latest_analysis else "",
        "recommendations": latest_analysis.recommendations if latest_analysis else "",
        "abnormal_findings": latest_analysis.abnormal_findings if latest_analysis else [],
        "vitals": latest_analysis.vitals if latest_analysis else [],
        "diagnoses": [{"name": d.name, "code": d.code, "status": d.status, "explanation": d.explanation} for d in diags],
        "medications": [{"name": m.name_raw, "dosage": m.dosage, "frequency": m.frequency} for m in meds],
        "laboratory_results": [
            {
                "test_name": l.test_name,
                "value": l.value,
                "unit": l.unit,
                "reference_low": l.reference_low,
                "reference_high": l.reference_high
            } for l in labs
        ],
        "allergies": [{"allergen": a.allergen, "reaction": a.reaction, "severity": a.severity} for a in allergies],
        "procedures": [p.name for p in procs]
    }


def _resolve_medications(patient_id: str, db: Session) -> list[dict]:
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
def get_timeline(patient_id: str, db: Session = Depends(get_db)):
    docs = (
        db.query(Document)
        .filter(Document.patient_id == patient_id)
        .order_by(Document.created_at)
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
def get_interactions(patient_id: str, db: Session = Depends(get_db)):
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
def get_conflicts(patient_id: str, db: Session = Depends(get_db)):
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
def get_provenance_graph(patient_id: str, db: Session = Depends(get_db)):
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
def list_lab_tests(patient_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(LabResult.test_name)
        .join(Document)
        .filter(Document.patient_id == patient_id, LabResult.test_name.isnot(None))
        .distinct()
        .all()
    )
    return sorted({r[0] for r in rows if r[0]})


@app.get("/patients/{patient_id}/trends/{test_name}")
def get_trend(patient_id: str, test_name: str, db: Session = Depends(get_db)):
    results = (
        db.query(LabResult)
        .join(Document)
        .filter(Document.patient_id == patient_id, LabResult.test_name.ilike(test_name))
        .order_by(Document.created_at)
        .all()
    )
    if not results:
        raise HTTPException(404, f"No lab results found for '{test_name}'")

    raw_values = []
    for r in results:
        try:
            val = float(r.value.replace(",", "").strip())
            raw_values.append(val)
        except (ValueError, AttributeError):
            pass

    if not raw_values:
        raise HTTPException(400, f"Lab results for '{test_name}' could not be parsed as numerical values.")

    trend = trends.compute_trend(raw_values, list(range(len(raw_values))))
    statuses = [trends.flag_out_of_range(v, results[i].reference_low, results[i].reference_high) for i, v in enumerate(raw_values)]

    latest = results[-1]
    prompt = (
        f"Lab test: {test_name}. Values over time: {raw_values}. "
        f"Computed trend: {trend}. Reference range: {latest.reference_low}-{latest.reference_high}. "
        "Explain what this trend means in plain language."
    )
    explanation = extraction.explain_finding(prompt) + DISCLAIMER

    return {
        "test_name": test_name,
        "values": raw_values,
        "statuses": statuses,
        "visit_dates": [r.document.visit_date or "N/A" for r in results[:len(raw_values)]],
        "trend": trend,
        "reference_range": [latest.reference_low, latest.reference_high],
        "explanation": explanation,
        "sources": [{"document_id": r.document_id, "snippet": r.source_snippet} for r in results[:len(raw_values)]],
    }


@app.post("/patients/{patient_id}/chat")
def chat(patient_id: str, payload: ChatRequest, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.patient_id == patient_id).all()
    if not docs:
        raise HTTPException(404, "No documents uploaded for this patient yet")

    chunks = []
    for d in docs:
        for piece in rag.chunk_document_text(d.raw_text or ""):
            chunks.append({"text": piece, "document_id": d.id, "filename": d.filename})

    if not chunks:
        raise HTTPException(400, "Uploaded documents contain no readable text for analysis.")

    top_chunks = rag.retrieve(payload.question, chunks, top_k=5)
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

    sources_data = [{"document_id": c["document_id"], "filename": c["filename"], "similarity": c["similarity"]} for c in top_chunks]

    # Save chat history entry in Supabase PostgreSQL
    chat_entry = ChatHistory(
        patient_id=patient_id,
        question=payload.question,
        answer=answer,
        confidence=confidence,
        sources=sources_data
    )
    db.add(chat_entry)
    db.commit()

    return {
        "id": chat_entry.id,
        "answer": answer,
        "confidence": confidence,
        "sources": sources_data,
        "created_at": chat_entry.created_at
    }


@app.get("/patients/{patient_id}/chat")
def get_chat_history(patient_id: str, db: Session = Depends(get_db)):
    history = db.query(ChatHistory).filter(ChatHistory.patient_id == patient_id).order_by(ChatHistory.created_at).all()
    return [
        {
            "id": h.id,
            "question": h.question,
            "answer": h.answer,
            "confidence": h.confidence,
            "sources": h.sources,
            "created_at": h.created_at
        }
        for h in history
    ]


@app.get("/")
def root():
    return {"status": "ok", "service": "MedRecord AI Supabase Backend Engine"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

