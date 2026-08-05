"""
Core Data Models (Supabase PostgreSQL / SQLAlchemy compatible).

Supports UUID primary keys, cascading deletes, timestamps (created_at, updated_at),
and comprehensive clinical entity storage:
- Patient
- Document (Report)
- Medication
- LabResult
- Diagnosis
- Allergy
- Procedure
- ReportAnalysis
- ChatHistory
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship

from db import Base


def generate_uuid():
    return str(uuid.uuid4())


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="patient", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)

    filename = Column(String, nullable=False)
    doc_type = Column(String)          # lab | prescription | discharge | note | other
    provider = Column(String)          # e.g. "Dr. Smith, City Clinic"
    visit_date = Column(String)        # ISO date string

    raw_text = Column(Text)            # full extracted text
    structured_json = Column(JSON)     # raw extraction schema output

    storage_path = Column(String)      # Supabase Storage path
    storage_bucket = Column(String)    # Supabase Storage bucket name

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="documents")
    medications = relationship("Medication", back_populates="document", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="document", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="document", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="document", cascade="all, delete-orphan")
    procedures = relationship("Procedure", back_populates="document", cascade="all, delete-orphan")
    analysis = relationship("ReportAnalysis", back_populates="document", uselist=False, cascade="all, delete-orphan")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    name_raw = Column(String)          # raw name in report
    name_normalized = Column(String)   # RxNorm-normalized name
    rxcui = Column(String)             # RxNorm concept ID
    dosage = Column(String)
    frequency = Column(String)
    source_snippet = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="medications")


class LabResult(Base):
    __tablename__ = "laboratory_results"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    test_name = Column(String)
    value = Column(String)
    unit = Column(String)
    reference_low = Column(String)
    reference_high = Column(String)
    source_snippet = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="lab_results")


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    name = Column(String)
    code = Column(String)
    status = Column(String)
    onset = Column(String)
    evidence = Column(Text)
    explanation = Column(Text)
    source_snippet = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="diagnoses")


class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    allergen = Column(String)
    reaction = Column(String)
    severity = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="allergies")


class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    name = Column(String)
    date = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="procedures")


class ReportAnalysis(Base):
    __tablename__ = "report_analysis"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    ai_summary = Column(Text)
    recommendations = Column(Text)
    abnormal_findings = Column(JSON)
    vitals = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="analysis")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    confidence = Column(String)
    sources = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="chat_history")
