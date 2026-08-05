"""
Entity normalization layer.

Hybrid design (matches the "reduce API cost, improve reliability" plan):
  1. Try scispaCy first, if it's installed, for a free/fast/local first-pass
     pull of drug/chemical mentions straight out of raw_text. This is
     optional -- scispaCy's models are a large download, so the app runs
     fine without it (falls through to step 2/3), but if you `pip install
     scispacy` and the `en_core_sci_sm` model, this kicks in automatically.
  2. Fuzzy string matching (rapidfuzz) against a small local synonym table,
     for the common case of near-identical spelling ("Metformin 500mg" vs
     "metformin HCl") -- free, instant, no network call.
  3. Fall back to RxNav's approximateTerm API (rxnav.py) for anything the
     first two steps didn't resolve confidently.
"""
from rapidfuzz import fuzz, process

# Small local synonym table -- covers common brand/generic + salt-form
# variants so most lookups never need a network call at all.
_SYNONYMS = {
    "metformin": "metformin",
    "metformin hcl": "metformin",
    "glucophage": "metformin",
    "lisinopril": "lisinopril",
    "prinivil": "lisinopril",
    "zestril": "lisinopril",
    "atorvastatin": "atorvastatin",
    "lipitor": "atorvastatin",
    "amoxicillin": "amoxicillin",
    "amoxil": "amoxicillin",
    "ibuprofen": "ibuprofen",
    "advil": "ibuprofen",
    "motrin": "ibuprofen",
    "acetaminophen": "acetaminophen",
    "tylenol": "acetaminophen",
    "paracetamol": "acetaminophen",
    "omeprazole": "omeprazole",
    "prilosec": "omeprazole",
    "levothyroxine": "levothyroxine",
    "synthroid": "levothyroxine",
    "warfarin": "warfarin",
    "coumadin": "warfarin",
    "aspirin": "aspirin",
}

_scispacy_nlp = None
_scispacy_available = None


def _strip_dosage(name: str) -> str:
    """Drop trailing dosage/unit tokens so 'Metformin 500mg' -> 'metformin'."""
    tokens = name.lower().replace("mg", " mg").replace("mcg", " mcg").split()
    keep = []
    for t in tokens:
        if t in ("mg", "mcg", "ml", "g", "tablet", "tablets", "capsule", "capsules"):
            continue
        if any(ch.isdigit() for ch in t):
            continue
        keep.append(t)
    return " ".join(keep).strip()


def try_scispacy_entities(text: str) -> list[str]:
    """
    Optional local NER pass. Returns [] if scispaCy / the model isn't
    installed -- this is intentional graceful degradation, not an error.
    """
    global _scispacy_nlp, _scispacy_available

    if _scispacy_available is False:
        return []

    if _scispacy_nlp is None:
        try:
            import spacy

            _scispacy_nlp = spacy.load("en_ner_bc5cdr_md")
            _scispacy_available = True
        except Exception:
            _scispacy_available = False
            return []

    doc = _scispacy_nlp(text)
    return [ent.text for ent in doc.ents if ent.label_ == "CHEMICAL"]


def normalize_name(raw_name: str) -> str:
    """
    Best-effort local normalization before hitting RxNav. Returns a
    lowercase canonical-ish name good enough for grouping duplicates.
    """
    if not raw_name:
        return raw_name

    stripped = _strip_dosage(raw_name)

    if stripped in _SYNONYMS:
        return _SYNONYMS[stripped]

    match = process.extractOne(stripped, _SYNONYMS.keys(), scorer=fuzz.WRatio, score_cutoff=85)
    if match:
        return _SYNONYMS[match[0]]

    return stripped
