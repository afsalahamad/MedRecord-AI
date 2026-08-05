"""
Deterministic conflict-detection engine.

This is a rules-based Python engine, not an LLM guess: it groups
medications by their resolved RxNorm concept (rxcui) and flags disagreements
between providers programmatically. Claude is only ever handed the *already
flagged* result to phrase in plain language (see extraction.explain_finding)
-- it never decides whether a conflict exists.

Three conflict types, each carrying a hospital-triage severity:
  - duplicate:  same drug concept prescribed in >1 document
  - dosage:     same drug concept, different numeric mg/mcg across documents
  - frequency:  same drug concept, different dosing frequency across documents
"""
import re
from collections import defaultdict

# Rough frequency -> doses-per-day mapping, used only to detect disagreement,
# not to give clinical advice.
_FREQUENCY_MAP = {
    "once daily": 1, "once a day": 1, "qd": 1, "daily": 1, "od": 1,
    "twice daily": 2, "twice a day": 2, "bid": 2, "every 12 hours": 2,
    "three times daily": 3, "three times a day": 3, "tid": 3, "every 8 hours": 3,
    "four times daily": 4, "four times a day": 4, "qid": 4, "every 6 hours": 4,
    "as needed": None, "prn": None,
}


def _doses_per_day(frequency: str) -> int | None:
    if not frequency:
        return None
    f = frequency.strip().lower()
    if f in _FREQUENCY_MAP:
        return _FREQUENCY_MAP[f]
    for key, val in _FREQUENCY_MAP.items():
        if key in f:
            return val
    return None


def _mg_value(dosage: str) -> float | None:
    if not dosage:
        return None
    match = re.search(r"([\d.]+)\s*(mg|mcg|g)", dosage.lower())
    if not match:
        return None
    value, unit = float(match.group(1)), match.group(2)
    if unit == "mcg":
        value /= 1000
    elif unit == "g":
        value *= 1000
    return value


def detect_conflicts(medications: list[dict]) -> list[dict]:
    """
    medications: list of dicts with keys:
      id, document_id, filename, name_raw, name_normalized, rxcui,
      dosage, frequency, source_snippet, provider, visit_date

    Returns a list of conflict records, each with a `severity`
    ("red" | "amber" | "green") for the UI's chart flag tabs.
    """
    conflicts = []

    by_concept = defaultdict(list)
    for m in medications:
        key = m.get("rxcui") or m.get("name_normalized") or m.get("name_raw")
        if key:
            by_concept[key].append(m)

    for concept, meds in by_concept.items():
        doc_ids = {m["document_id"] for m in meds}
        if len(doc_ids) < 2:
            continue  # only prescribed once -- nothing to compare

        drug_label = meds[0].get("name_normalized") or meds[0].get("name_raw")

        # Duplicate: flagged whenever the same concept spans >1 document,
        # independent of whether dosage/frequency also disagree.
        conflicts.append(
            {
                "type": "duplicate",
                "severity": "amber",
                "drug": drug_label,
                "medication_ids": [m["id"] for m in meds],
                "document_ids": list(doc_ids),
                "detail": f"{drug_label} appears in {len(doc_ids)} separate documents.",
            }
        )

        # Dosage conflict: distinct numeric mg values across documents
        mg_values = {(_mg_value(m.get("dosage")), m["document_id"]) for m in meds if _mg_value(m.get("dosage"))}
        distinct_mgs = {v for v, _ in mg_values}
        if len(distinct_mgs) > 1:
            conflicts.append(
                {
                    "type": "dosage_conflict",
                    "severity": "red",
                    "drug": drug_label,
                    "medication_ids": [m["id"] for m in meds],
                    "document_ids": list(doc_ids),
                    "detail": f"Conflicting doses for {drug_label}: {sorted(distinct_mgs)} mg across documents.",
                }
            )

        # Frequency conflict: distinct doses-per-day across documents
        freqs = {(_doses_per_day(m.get("frequency")), m["document_id"]) for m in meds}
        distinct_freqs = {v for v, _ in freqs if v is not None}
        if len(distinct_freqs) > 1:
            conflicts.append(
                {
                    "type": "frequency_conflict",
                    "severity": "amber",
                    "drug": drug_label,
                    "medication_ids": [m["id"] for m in meds],
                    "document_ids": list(doc_ids),
                    "detail": f"Conflicting frequency for {drug_label}: {sorted(distinct_freqs)}x/day across documents.",
                }
            )

    return conflicts
