import asyncio
import io
import json
import traceback
from db import SessionLocal
from models import Patient, Document, Medication, LabResult, Diagnosis, Allergy, Procedure, ReportAnalysis
from fastapi import UploadFile
import extraction
from supabase_storage import upload_file_to_supabase

def test():
    db = SessionLocal()
    patient = Patient(name='Debug Patient')
    db.add(patient)
    db.commit()
    db.refresh(patient)

    patient_id = patient.id
    filename = "test_doc.pdf"
    file_bytes = b"%PDF-1.4 sample clinical discharge note\nPatient: Debug Patient\nMedication: Metformin 500mg\nLab: Glucose 110 mg/dL"

    print(f"[1] Patient Created: ID={patient_id}")

    # Step A: Storage
    try:
        storage_res = upload_file_to_supabase(file_bytes, filename, patient_id)
        print(f"[2] Storage Upload Success: {storage_res}")
    except Exception as e:
        print(f"[2] Storage Upload Exception: {e}")
        traceback.print_exc()

    # Step B: Extraction
    try:
        print("[3] Starting Gemini extraction...")
        extracted = extraction.extract_document(file_bytes, filename)
        print(f"[3] Gemini Extraction Success: {json.dumps(extracted, indent=2)[:300]}")
    except Exception as e:
        print(f"[3] Gemini Extraction Exception: {e}")
        traceback.print_exc()
        extracted = {}

    # Step C: DB Insert
    try:
        print("[4] Saving to DB...")
        doc = Document(
            patient_id=patient_id,
            filename=filename,
            doc_type=extracted.get("doc_type", "other"),
            provider=extracted.get("provider"),
            visit_date=str(extracted.get("visit_date") or ""),
            raw_text=extracted.get("raw_text", ""),
            structured_json=extracted,
            storage_path=storage_res.get("storage_path"),
            storage_bucket=storage_res.get("storage_bucket"),
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        print(f"[4] Document saved with ID={doc.id}")

        # Save ReportAnalysis
        analysis = ReportAnalysis(
            document_id=doc.id,
            ai_summary=extracted.get("ai_summary", ""),
            recommendations=extracted.get("recommendations", ""),
            abnormal_findings=extracted.get("abnormal_findings", []),
            vitals=extracted.get("vitals", []),
        )
        db.add(analysis)
        db.commit()
        print("[4] ReportAnalysis saved successfully!")
    except Exception as e:
        print(f"[4] DB Save Exception: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test()
