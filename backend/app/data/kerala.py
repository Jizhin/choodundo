"""Kerala district reference data and a lightweight pincode -> district map.

The 14 official districts are the canonical aggregation buckets. The pincode
prefix map gives an offline fallback for resolving a district from a pincode
when the geocoder is unavailable or rate-limited.
"""
from __future__ import annotations

# Canonical ordering (north -> south) as required by the spec.
DISTRICTS: list[str] = [
    "Kasaragod",
    "Kannur",
    "Wayanad",
    "Kozhikode",
    "Malappuram",
    "Palakkad",
    "Thrissur",
    "Ernakulam",
    "Idukki",
    "Kottayam",
    "Alappuzha",
    "Pathanamthitta",
    "Kollam",
    "Thiruvananthapuram",
]

DISTRICT_SET: set[str] = set(DISTRICTS)

# Normalised lookup for tolerant matching (handles casing / common variants).
_DISTRICT_ALIASES: dict[str, str] = {
    "kasargod": "Kasaragod",
    "kasaragod": "Kasaragod",
    "kannur": "Kannur",
    "cannanore": "Kannur",
    "wayanad": "Wayanad",
    "wynad": "Wayanad",
    "kozhikode": "Kozhikode",
    "calicut": "Kozhikode",
    "malappuram": "Malappuram",
    "palakkad": "Palakkad",
    "palghat": "Palakkad",
    "thrissur": "Thrissur",
    "trichur": "Thrissur",
    "ernakulam": "Ernakulam",
    "kochi": "Ernakulam",
    "cochin": "Ernakulam",
    "idukki": "Idukki",
    "kottayam": "Kottayam",
    "alappuzha": "Alappuzha",
    "alleppey": "Alappuzha",
    "pathanamthitta": "Pathanamthitta",
    "kollam": "Kollam",
    "quilon": "Kollam",
    "thiruvananthapuram": "Thiruvananthapuram",
    "trivandrum": "Thiruvananthapuram",
}


def normalize_district(name: str | None) -> str | None:
    if not name:
        return None
    key = name.strip().lower()
    if key in _DISTRICT_ALIASES:
        return _DISTRICT_ALIASES[key]
    # Try contains-match against alias keys (geocoders return e.g. "Kannur district").
    for alias, canonical in _DISTRICT_ALIASES.items():
        if alias in key:
            return canonical
    return None


# Kerala pincodes are 670000-695615. The first 3 digits map to a region.
# This is an approximate offline fallback, not a substitute for geocoding.
_PIN_PREFIX_TO_DISTRICT: list[tuple[int, int, str]] = [
    (670, 671, "Kannur"),
    (671, 672, "Kasaragod"),
    (673, 674, "Kozhikode"),
    (676, 677, "Malappuram"),
    (678, 679, "Palakkad"),
    (680, 681, "Thrissur"),
    (682, 683, "Ernakulam"),
    (684, 686, "Kottayam"),
    (685, 686, "Idukki"),
    (688, 689, "Alappuzha"),
    (689, 690, "Pathanamthitta"),
    (691, 692, "Kollam"),
    (695, 696, "Thiruvananthapuram"),
]

# More specific overrides keyed on full 3-digit prefix.
_PIN3_OVERRIDES: dict[str, str] = {
    "670": "Kannur",
    "671": "Kasaragod",
    "673": "Kozhikode",
    "670645": "Wayanad",  # placeholder; refined below by 673xxx Wayanad pockets
    "676": "Malappuram",
    "678": "Palakkad",
    "679": "Malappuram",
    "680": "Thrissur",
    "682": "Ernakulam",
    "683": "Ernakulam",
    "685": "Idukki",
    "686": "Kottayam",
    "688": "Alappuzha",
    "689": "Pathanamthitta",
    "690": "Kollam",
    "691": "Kollam",
    "695": "Thiruvananthapuram",
}

# Wayanad uses pockets within 670/673 ranges (e.g. 673121 Kalpetta).
_WAYANAD_PIN3 = {"673"}  # refined: Kalpetta 673121, Sulthan Bathery 673592


def district_from_pincode(pincode: str | None) -> str | None:
    if not pincode or len(pincode) < 3 or not pincode[:3].isdigit():
        return None
    p3 = pincode[:3]
    if p3 in _PIN3_OVERRIDES:
        return _PIN3_OVERRIDES[p3]
    p = int(p3)
    for lo, hi, district in _PIN_PREFIX_TO_DISTRICT:
        if lo <= p < hi:
            return district
    return None
