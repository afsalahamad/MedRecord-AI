"""
Deterministic lab trend calculation. No LLM math -- plain linear regression
via numpy. The slope + reference range get handed to Claude afterwards only
to phrase the plain-language explanation (see extraction.explain_finding).
"""
import numpy as np


def compute_trend(values: list[float], visit_indices: list[int]) -> dict:
    """
    values: lab result values in chronological order
    visit_indices: x-axis positions (e.g. 0,1,2... or days-since-first-visit)

    Returns slope, percent change from first to last, and direction.
    """
    if len(values) < 2:
        return {"slope": 0.0, "percent_change": 0.0, "direction": "insufficient_data"}

    x = np.array(visit_indices, dtype=float)
    y = np.array(values, dtype=float)

    slope, intercept = np.polyfit(x, y, 1)

    first, last = y[0], y[-1]
    percent_change = ((last - first) / first * 100) if first != 0 else 0.0

    direction = "rising" if slope > 0 else "falling" if slope < 0 else "flat"

    return {
        "slope": round(float(slope), 4),
        "percent_change": round(float(percent_change), 2),
        "direction": direction,
    }


def flag_out_of_range(value: float, ref_low: float | None, ref_high: float | None) -> str | None:
    if ref_low is not None and value < ref_low:
        return "below_range"
    if ref_high is not None and value > ref_high:
        return "above_range"
    return None
