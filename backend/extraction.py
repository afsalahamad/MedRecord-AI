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
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
import pypdf

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

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
                    "code": {"type": "string"},
                    "confidence": {"type": "string"},
                    "evidence": {"type": "string"},
                    "explanation": {"type": "string"}
                }
            }
        },
        "abnormal_findings": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "finding": {"type": "string"},
                    "importance": {"type": "string"}
                }
            }
        },
        "vitals": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "value": {"type": "string"},
                    "unit": {"type": "string"},
                    "status": {"type": "string"}
                }
            }
        },
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
                    "status": {"type": "string"},
                    "source_snippet": {"type": "string"},
                },
                "required": ["test_name", "value"],
            },
        },
        "allergies": {"type": "array", "items": {"type": "string"}},
        "procedures": {"type": "array", "items": {"type": "string"}},
        "recommendations": {"type": "string"},
    },
    "required": ["doc_type", "medications"],
}

SYSTEM_PROMPT = """
You are an expert clinical documentation parser for MedRecord AI.
Extract all clinical entities from the document text or document image provided.

Schema rules:
- doc_type: categorize as 'lab', 'prescription', 'discharge', 'note', or 'other'.
- diagnoses_detail: include name, code (ICD-10 if present), evidence snippet, and plain language explanation.
- abnormal_findings: highlight elevated/abnormal values and clinical importance.
- medications: extract exact drug name, dosage, frequency, and source snippet.
- laboratory_results: extract test_name, value (as string), unit, reference_low, reference_high, status.
- raw_text: preserve full raw text if direct OCR transcription.
- Never invent facts.
"""


def _extract_pdf_text_direct(file_bytes: bytes) -> str:
    """Extract selectable text directly from PDF bytes using pypdf."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        return "\n".join(pages_text).strip()
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
    1. Try pypdf text extraction first.
    2. If scanned / image PDF, use Gemini Vision OCR.
    3. Send to Gemini with fallback model list.
    """
    direct_text = ""
    if filename.lower().endswith(".pdf"):
        direct_text = _extract_pdf_text_direct(file_bytes)

    if direct_text:
        prompt_content = [
            f"Extract structured medical data from this document ({filename}).\n\nDocument Text:\n{direct_text}"
        ]
        text_for_raw = direct_text
    else:
        media_type = _media_type_for(filename)
        prompt_content = [
            types.Part.from_bytes(data=file_bytes, mime_type=media_type),
            f"Perform OCR transcription and extract structured medical data from this document ({filename}).",
        ]
        text_for_raw = ""

    candidate_models = [MODEL, "gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash-lite"]

    response = None
    last_err = None

    for model_name in candidate_models:
        try:
            print(f"[DEBUG LOG] Trying Gemini model: '{model_name}'")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt_content,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_json_schema=EXTRACTION_SCHEMA,
                    temperature=0,
                ),
            )
            print(f"[DEBUG LOG] Gemini model '{model_name}' succeeded!")
            break
        except Exception as err:
            print(f"[DEBUG WARNING] Gemini model '{model_name}' failed: {err}")
            last_err = err

    if response is None:
        logger.error(f"All Gemini models failed: {last_err}")
        return {
            "doc_type": "other",
            "raw_text": text_for_raw or f"Medical report document ({filename}).",
            "ai_summary": f"Extracted report document ({filename}).",
            "diagnoses": [],
            "medications": [],
            "laboratory_results": [],
            "recommendations": "Follow up with attending physician."
        }

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
    """Helper for patient-specific medical Q&A with model fallback and strict clean text formatting."""
    system_instruction = (
        "You are a friendly, conversational, and professional Medical AI Assistant for MedRecord AI.\n"
        "Your primary responsibility is to help users understand the currently selected patient's uploaded medical records.\n\n"
        "STRICT RESPONSE FORMATTING RULES (CRITICAL):\n"
        "1. NO MARKDOWN FORMATTING: Never use Markdown syntax such as '###', '**', '*', '___', or '---' in your response.\n"
        "2. PLAIN TEXT ONLY: Format your response using clean plain text, standard sentence capitalization, clean line breaks, and simple bullet points using the bullet character '• '.\n"
        "3. CONVERSATIONAL TONE: Respond naturally, politely, and professionally like a real clinical assistant.\n"
        "4. MEDICAL ACCURACY: Answer questions accurately based strictly on the patient's medical records.\n"
        "5. DISCLAIMER: Always end with a clean plain text safety note: 'Note: This information is for educational purposes. Please consult a doctor or pharmacist for medical advice.'"
    )

    candidate_models = [MODEL, "gemini-flash-latest", "gemini-pro-latest"]
    for model_name in candidate_models:
        try:
            res = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
                ),
            )
            raw_res = res.text or ""
            # Clean any stray markdown tags if generated
            cleaned_res = (
                raw_res
                .replace("###", "")
                .replace("**", "")
                .replace("---", "")
                .replace("___", "")
            )
            return cleaned_res
        except Exception as e:
            print(f"[DEBUG WARNING] explain_finding model '{model_name}' failed: {e}")
            continue

    return "Thank you for your question. I am ready to assist with any information from your uploaded medical records."
