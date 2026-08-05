"""
Core data model.

Patient -> Document (uploaded file, raw text, doc_type, provider, visit_date)
        -> Medication (extracted per document)
        -> LabResult (extracted per document)

Storing raw_text + structured JSON on Document is what makes provenance
possible: any claim made later can point back to document_id (+ optionally
a snippet of raw_text) so the frontend can show "source: Discharge Summary,
March 3".
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from db import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    filename = Column(String, nullable=False)
    doc_type = Column(String)          # lab | prescription | discharge | note | other
    provider = Column(String)          # e.g. "Dr. Smith, City Clinic"
    visit_date = Column(String)        # kept as string (ISO) to survive messy OCR dates

    raw_text = Column(Text)            # full extracted text, used for provenance snippets
    structured_json = Column(JSON)     # raw model output for this doc (medications, labs, etc.)

    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="documents")
    medications = relationship("Medication", back_populates="document", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="document", cascade="all, delete-orphan")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)

    name_raw = Column(String)          # exactly as written in the source doc
    name_normalized = Column(String)   # RxNorm-normalized name, filled in later
    rxcui = Column(String)             # RxNorm concept id, once resolved
    dosage = Column(String)
    frequency = Column(String)
    source_snippet = Column(Text)      # sentence/line this was extracted from (provenance)

    document = relationship("Document", back_populates="medications")


class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)

    test_name = Column(String)
    value = Column(Float)
    unit = Column(String)
    reference_low = Column(Float)
    reference_high = Column(Float)
    source_snippet = Column(Text)

    document = relationship("Document", back_populates="lab_results")
