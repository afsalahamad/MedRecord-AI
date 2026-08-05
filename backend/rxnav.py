"""
Client for the NIH RxNav/RxNorm REST API -- free, public, no API key.

Docs: https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html
      https://lhncbc.nlm.nih.gov/RxNav/APIs/InteractionAPIs.html

We use this instead of asking the LLM to "remember" interactions from
training data -- ground-truth data source, then the LLM only explains it.
"""
import httpx

BASE = "https://rxnav.nlm.nih.gov/REST"


def normalize_drug_name(name: str) -> dict | None:
    """
    Look up the approximate RxNorm match for a raw drug name string
    (e.g. "Metformin 500mg" -> canonical name + rxcui).
    """
    with httpx.Client(timeout=10) as client:
        resp = client.get(f"{BASE}/approximateTerm.json", params={"term": name, "maxEntries": 1})
        resp.raise_for_status()
        candidates = resp.json().get("approximateGroup", {}).get("candidate", [])
        if not candidates:
            return None
        top = candidates[0]
        rxcui = top.get("rxcui")
        if not rxcui:
            return None

        # Get the clean display name for this rxcui
        prop_resp = client.get(f"{BASE}/rxcui/{rxcui}/property.json", params={"propName": "RxNorm Name"})
        prop_resp.raise_for_status()
        props = prop_resp.json().get("propConceptGroup", {}).get("propConcept", [])
        display_name = props[0]["propValue"] if props else name

        return {"rxcui": rxcui, "name": display_name}


def check_interactions(rxcuis: list[str]) -> list[dict]:
    """
    Given a list of RxCUIs (normalized drug ids), return known pairwise
    interactions from the RxNav interaction API.
    """
    if len(rxcuis) < 2:
        return []

    with httpx.Client(timeout=10) as client:
        resp = client.get(
            f"{BASE}/interaction/list.json",
            params={"rxcuis": "+".join(rxcuis)},
        )
        resp.raise_for_status()
        data = resp.json()

    interactions = []
    for group in data.get("fullInteractionTypeGroup", []):
        for itype in group.get("fullInteractionType", []):
            pair_names = [c["minConceptItem"]["name"] for c in itype.get("interactionPair", [{}])[0].get(
                "interactionConcept", []
            )] if itype.get("interactionPair") else []
            for pair in itype.get("interactionPair", []):
                interactions.append(
                    {
                        "description": pair.get("description", ""),
                        "severity": pair.get("severity", "unknown"),
                        "drugs": [c["minConceptItem"]["name"] for c in pair.get("interactionConcept", [])],
                    }
                )
    return interactions


# RxNav severities are free-text (e.g. "high", "moderate", "N/A"). Map them
# to the three-color hospital triage scheme the UI uses for flag tabs.
def severity_to_color(severity: str) -> str:
    s = (severity or "").lower()
    if "high" in s or "severe" in s or "contraindicated" in s:
        return "red"
    if "moderate" in s or "medium" in s:
        return "amber"
    if "low" in s or "minor" in s:
        return "green"
    return "amber"  # unknown severity -- err on the side of caution, not silence
