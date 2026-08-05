"""
Extraction layer: PDF text extraction (direct vs OCR) + Gemini structured JSON extraction.

Workflow:
1. Upload PDF / document
2. Check if PDF has selectable text via pypdf.
   - If selectable text exists: Extract text directly (no OCR).
   - If scanned / image-based / empty: Run Gemini Vision OCR.
3. Send text / vision input to Gemini with strict structured JSON schema.
"""

import os
import io
import json
from google import genai
from google.genai import types
import pypdf

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(api_key=GEMINI_API_KEY)

EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "doc_type": {
            "type": "string",
            "enum": ["lab", "prescription", "discharge", "note", "other"],
        },
        "patient_name": {"type": "string", "description": "Patient full name if present"},
        "age": {"type": "string", "description": "Patient age if present"},
        "gender": {"type": "string", "description": "Patient gender if present"},
        "doctor": {"type": "string", "description": "Doctor / Physician name if present"},
        "hospital": {"type": "string", "description": "Hospital / Clinic name if present"},
        "report_date": {"type": "string", "description": "Report or visit date if present"},
        "overall_summary": {"type": "string", "description": "Overall executive summary of patient report"},
        "diagnoses": {"type": "array", "items": {"type": "string"}},
        "diagnoses_detail": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "confidence": {"type": "string", "enum": ["High", "Medium", "Low"]},
                    "evidence": {"type": "string", "description": "Text snippet or finding supporting this diagnosis"},
                    "explanation": {"type": "string", "description": "Brief explanation in simple layperson language"},
                },
                "required": ["name", "confidence", "evidence", "explanation"],
            },
        },
        "abnormal_findings": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "finding": {"type": "string", "description": "High/low lab value, vital, imaging, or observation"},
                    "importance": {"type": "string", "description": "Why this finding is important in simple language"},
                },
                "required": ["finding", "importance"],
            },
        },
        "vitals": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "value": {"type": "string"},
                    "unit": {"type": "string"},
                    "status": {"type": "string"},
                },
                "required": ["name", "value"],
            },
        },
        "allergies": {"type": "array", "items": {"type": "string"}},
        "procedures": {"type": "array", "items": {"type": "string"}},
        "medications": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "dosage": {"type": "string"},
                    "frequency": {"type": "string"},
                    "source_snippet": {"type": "string"},
                },
                "required": ["name"],
            },
        },
        "laboratory_results": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "test_name": {"type": "string"},
                    "value": {"type": "string"},
                    "unit": {"type": "string"},
                    "reference_low": {"type": "string"},
                    "reference_high": {"type": "string"},
                    "status": {"type": "string", "description": "Normal, High, Low, Elevated, etc."},
                    "source_snippet": {"type": "string"},
                },
                "required": ["test_name", "value"],
            },
        },
        "ai_summary": {"type": "string", "description": "Brief executive summary of patient report"},
        "recommendations": {"type": "string", "description": "Clinical recommendations & next steps"},
        "raw_text": {
            "type": "string",
            "description": "Full extracted document text",
        },
    },
    "required": ["doc_type", "ai_summary", "raw_text"],
}


SYSTEM_PROMPT = (
    "You are an expert AI medical document parser and clinical assistant. "
    "Carefully extract all medical fields from the provided document. "
    "Do not invent facts or values that are not present. "
    "If a field is missing, leave it empty or null. "
    "Always return a clean, machine-readable JSON object matching the required schema."
)


def _extract_pdf_text_direct(file_bytes: bytes) -> str:
    """Extract text from PDF using pypdf. Returns empty string if scanned or image-based."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        extracted_pages = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_pages.append(t)
        full_text = "\n".join(extracted_pages).strip()
        # If text is too short or empty, consider it scanned/image-based
        if len(full_text) > 30:
            return full_text
    except Exception:
        pass
    return ""


def _media_type_for(filename: str) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]
    return {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
    }.get(ext, "application/octet-stream")


def extract_document(file_bytes: bytes, filename: str) -> dict:
    """
    Automatic PDF Text Extraction vs Gemini Vision OCR:
    1. Try pypdf text extraction first (no OCR if text exists).
    2. If scanned / image PDF, use Gemini Vision OCR.
    3. Send to Gemini for structured JSON extraction.
    """
    direct_text = ""
    if filename.lower().endswith(".pdf"):
        direct_text = _extract_pdf_text_direct(file_bytes)

    if direct_text:
        # Step 2 & 3: Direct text mode (No OCR needed)
        prompt_content = [
            f"Extract structured medical data from this document ({filename}).\n\nDocument Text:\n{direct_text}"
        ]
        text_for_raw = direct_text
    else:
        # Step 2 & 3: Scanned / Image-based PDF or image -> Use Gemini Vision OCR
        media_type = _media_type_for(filename)
        prompt_content = [
            types.Part.from_bytes(data=file_bytes, mime_type=media_type),
            f"Perform OCR transcription and extract structured medical data from this document ({filename}).",
        ]
        text_for_raw = ""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt_content,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_json_schema=EXTRACTION_SCHEMA,
            temperature=0,
        ),
    )

    try:
        parsed = json.loads(response.text)
        if not parsed.get("raw_text"):
            parsed["raw_text"] = text_for_raw or response.text or ""
        return parsed
    except (json.JSONDecodeError, TypeError):
        return {
            "doc_type": "other",
            "raw_text": text_for_raw or response.text or "",
            "ai_summary": "Extracted report document.",
            "diagnoses": [],
            "medications": [],
            "laboratory_results": [],
            "recommendations": "Follow up with attending physician."
        }


def explain_finding(prompt: str) -> str:
    """Helper for patient-specific medical Q&A with conversational greetings and safety guardrails."""
    system_instruction = (
        "You are a friendly, conversational, and professional Medical AI Assistant for MedRecord AI.\n"
        "Your primary responsibility is to help users understand the currently selected patient's uploaded medical records.\n\n"
        "CONVERSATIONAL BEHAVIOR & RULES:\n"
        "1. GREETINGS: If the user says 'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', or 'what's up', respond naturally, warmly, and conversationally like a real assistant (e.g. 'Hello! 👋 Welcome to MedRecord AI. I'm here to help you understand the selected patient's medical reports. You can ask about diagnoses, medications, laboratory results, report summaries, or any information contained in the uploaded reports.').\n"
        "2. MEDICAL QUESTIONS: Answer all questions related to the patient's medical records accurately, concisely, and cleanly using bold text and bullet points. Never invent facts.\n"
        "3. MISSING INFORMATION: If the requested information is not in the uploaded reports, respond politely: 'I couldn't find that information in the uploaded medical reports.'\n"
        "4. UNRELATED QUESTIONS: If the user asks about sports, politics, coding, movies, mathematics, celebrities, jokes, etc., politely redirect: 'I'm your Medical AI Assistant, so I'm designed to help with the selected patient's medical reports and healthcare-related questions. If you'd like, you can ask me about diagnoses, medications, laboratory results, summaries, or other information from the uploaded records.'\n"
        "5. TONE & SAFETY: Always friendly, professional, patient, conversational, and helpful. Do not prescribe drugs or change dosages."
    )
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
        ),
    )
    return response.text or ""


