"""Apply IA-derived pattern mappings to blank redirect destinations.

Purpose
-------
The IA workbook is not only an exact source-url lookup. It also documents how
old URL concepts/categories map into the new MGB URL structure. This script
builds a conservative pattern dictionary from the IA workbook and uses it to
populate blank destinations in `redirect-list.csv`.

Important behavior
------------------
- Manual key / manual exclude URLs are still excluded from this script.
- Existing populated destinations are preserved.
- Exact IA source URL matches are highest confidence.
- IA-derived pattern matches only apply when the matched key has one clear
  destination or one dominant destination.
- Ambiguous/conflicting matches are written to suggestions but not applied.

Example
-------
python scripts/apply_ia_pattern_mappings.py \
  --redirect-list output/redirect-list.csv \
  --ia input/ia-map.xlsx \
  --manual-exclude input/manual-exclude.csv \
  --output-dir output
"""

from __future__ import annotations

import argparse
import io
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple
from urllib.parse import urlparse

import pandas as pd

SOURCE_COLUMN_NAMES = {
    "source url",
    "source url 1",
    "source url 2",
    "source url 3",
    "existing url",
    "old url",
    "address",
    "url",
}

DESTINATION_COLUMN_NAMES = {
    "full url",
    "destination url",
    "new url",
    "mgb url",
    "preview url",
    "final url",
}

URL_COLUMN_CANDIDATES = ["Existing URL", "Address", "URL", "Current URL"]
DESTINATION_COLUMN_CANDIDATES = ["Destination URL", "Full URL", "Final URL", "New URL"]
NOTES_COLUMN = "829 Notes"

EXCEL_EXTENSIONS = {".xlsx", ".xlsm", ".xls"}

STOP_WORDS = {
    "a",
    "an",
    "and",
    "at",
    "becoming",
    "brigham",
    "care",
    "center",
    "centers",
    "clinical",
    "com",
    "condition",
    "conditions",
    "contact",
    "department",
    "directions",
    "disease",
    "diseases",
    "en",
    "for",
    "from",
    "general",
    "home",
    "hospital",
    "information",
    "locations",
    "mass",
    "medicine",
    "mgb",
    "of",
    "on",
    "or",
    "org",
    "page",
    "pages",
    "patient",
    "patients",
    "program",
    "programs",
    "resources",
    "service",
    "services",
    "specialties",
    "specialty",
    "test",
    "tests",
    "the",
    "to",
    "treatment",
    "treatments",
    "using",
    "view",
    "visitor",
    "visitors",
    "with",
    "www",
}

# Do not auto-map generic single-concept keys. They are too broad across IA.
GENERIC_KEYS = {
    "about",
    "billing",
    "careers",
    "community",
    "employment",
    "giving",
    "health",
    "history",
    "home",
    "locations",
    "medical",
    "news",
    "patient",
    "reports",
    "resources",
    "services",
    "visits",
}

SYNONYM_TOKENS = {
    "rehab": "rehabilitation",
    "rehabilitative": "rehabilitation",
    "cardio": "cardiac",
    "obgyn": "ob-gyn",
    "ob": "ob-gyn",
    "gyn": "ob-gyn",
    "xray": "x-ray",
    "x": "x-ray",
    "ortho": "orthopedics",
    "orthopaedics": "orthopedics",
    "psychiatric": "psychiatry",
}


def safe_str(value: Any) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def clean_col(value: Any) -> str:
    return safe_str(value).lstrip("\ufeff").strip('"').strip()


def normalize_url(value: Any) -> str:
    raw = safe_str(value).strip('"')
    if not raw:
        return ""
    parsed = urlparse(raw)
    if parsed.scheme and parsed.netloc:
        return parsed._replace(fragment="").geturl().rstrip("/")
    return raw.rstrip("/")


def read_table(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in EXCEL_EXTENSIONS:
        df = pd.read_excel(path)
    else:
        raw = path.read_bytes()
        try:
            df = pd.read_csv(io.BytesIO(raw), sep=None, engine="python")
        except Exception:
            df = pd.read_csv(io.BytesIO(raw), sep="\t", engine="python")
    df.columns = [clean_col(col) for col in df.columns]
    return df


def find_col(df: pd.DataFrame, candidates: Iterable[str]) -> str | None:
    lookup = {clean_col(col).lower(): col for col in df.columns}
    for candidate in candidates:
        match = lookup.get(candidate.lower())
        if match is not None:
            return match
    return None


def ia_header_row(xl: pd.ExcelFile, sheet_name: str, max_rows: int = 25) -> int:
    raw = xl.parse(sheet_name, header=None, nrows=max_rows, dtype=object)
    for idx in range(len(raw)):
        values = {clean_col(value).lower() for value in raw.iloc[idx].tolist() if safe_str(value)}
        if values & SOURCE_COLUMN_NAMES and values & DESTINATION_COLUMN_NAMES:
            return idx
    for idx in range(len(raw)):
        values = {clean_col(value).lower() for value in raw.iloc[idx].tolist() if safe_str(value)}
        if "full url" in values:
            return idx
    return 0


def load_ia_pairs(path: Path) -> pd.DataFrame:
    rows: List[Dict[str, str]] = []
    if path.suffix.lower() not in EXCEL_EXTENSIONS:
        df = read_table(path)
        sheets = {path.stem: df}
    else:
        xl = pd.ExcelFile(path)
        sheets = {}
        for sheet_name in xl.sheet_names:
            try:
                header = ia_header_row(xl, sheet_name)
                df = xl.parse(sheet_name, header=header, dtype=object)
                df.columns = [clean_col(col) for col in df.columns]
                sheets[sheet_name] = df
            except Exception as exc:  # noqa: BLE001
                print(f"Skipped IA sheet '{sheet_name}': {exc}")

    for sheet_name, df in sheets.items():
        if df.empty:
            continue
        dest_col = find_col(df, DESTINATION_COLUMN_NAMES)
        if not dest_col:
            continue
        source_cols = [col for col in df.columns if clean_col(col).lower() in SOURCE_COLUMN_NAMES]
        for _, row in df.iterrows():
            destination = normalize_url(row.get(dest_col, ""))
            if not destination or not destination.startswith("http"):
                continue
            for source_col in source_cols:
                source = normalize_url(row.get(source_col, ""))
                if source and source.startswith("http"):
                    rows.append(
                        {
                            "Source URL": source,
                            "Destination URL": destination,
                            "IA Sheet": sheet_name,
                            "Match Basis": "source_url",
                        }
                    )
            # The Full URL itself is also useful: it teaches us that this concept exists.
            rows.append(
                {
                    "Source URL": destination,
                    "Destination URL": destination,
                    "IA Sheet": sheet_name,
                    "Match Basis": "destination_self",
                }
            )
    return pd.DataFrame(rows)


def path_segments(url: str) -> List[str]:
    path = urlparse(url).path.strip("/").lower()
    return [segment for segment in path.split("/") if segment]


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def normalize_token(token: str) -> str:
    token = token.strip().lower()
    return SYNONYM_TOKENS.get(token, token)


def slug_tokens(slug: str) -> List[str]:
    tokens = []
    for token in slug.split("-"):
        token = normalize_token(token)
        if token and token not in STOP_WORDS and len(token) > 1:
            tokens.append(token)
    return tokens


def concept_keys(url: str) -> List[str]:
    segments = [slugify(segment) for segment in path_segments(url)]
    keys: List[str] = []
    for segment in segments:
        tokens = slug_tokens(segment)
        if tokens:
            keys.append("-".join(tokens))

    if len(keys) >= 2:
        keys.append(f"{keys[-2]}-{keys[-1]}")

    expanded: List[str] = []
    for key in keys:
        expanded.append(key)
        for prefix in ["marthas-vineyard-", "martha-s-vineyard-", "massachusetts-"]:
            if key.startswith(prefix):
                expanded.append(key[len(prefix) :])

    output: List[str] = []
    for key in expanded:
        if key and len(key) > 2 and key not in output:
            output.append(key)
    return output


def build_pattern_index(ia_pairs: pd.DataFrame) -> Tuple[Dict[str, Counter], pd.DataFrame]:
    key_to_destinations: Dict[str, Counter] = defaultdict(Counter)
    rows: List[Dict[str, str]] = []
    for _, row in ia_pairs.iterrows():
        source = normalize_url(row.get("Source URL", ""))
        destination = normalize_url(row.get("Destination URL", ""))
        if not source or not destination:
            continue
        for key in concept_keys(source):
            key_to_destinations[key][destination] += 1
            rows.append(
                {
                    "Pattern Key": key,
                    "Destination URL": destination,
                    "Source URL": source,
                    "IA Sheet": safe_str(row.get("IA Sheet", "")),
                    "Match Basis": safe_str(row.get("Match Basis", "")),
                }
            )
    return key_to_destinations, pd.DataFrame(rows)


def key_is_safe_for_auto(key: str, url: str) -> bool:
    if key in GENERIC_KEYS:
        return False
    # Single-token mappings are safest for service/treatment-style pages.
    if "-" not in key:
        path = urlparse(url).path.lower()
        return any(section in path for section in ["/services/", "/treatments", "/conditions", "/patients_and_visitor/"])
    return True


def find_pattern_match(url: str, key_to_destinations: Dict[str, Counter]) -> Dict[str, Any] | None:
    candidates = concept_keys(url)
    possible: List[Dict[str, Any]] = []

    for key in candidates:
        if key not in key_to_destinations or not key_is_safe_for_auto(key, url):
            continue
        destination_counts = key_to_destinations[key]
        total = sum(destination_counts.values())
        most_common = destination_counts.most_common()
        if len(destination_counts) == 1:
            possible.append(
                {
                    "match_type": "exact_pattern_key",
                    "pattern_key": key,
                    "destination": most_common[0][0],
                    "confidence": 1.0,
                    "reason": "Pattern key has one IA destination.",
                }
            )
        else:
            destination, count = most_common[0]
            share = count / total if total else 0
            if count >= 3 and share >= 0.9:
                possible.append(
                    {
                        "match_type": "dominant_pattern_key",
                        "pattern_key": key,
                        "destination": destination,
                        "confidence": round(share, 3),
                        "reason": f"Pattern key has a dominant IA destination ({count}/{total}).",
                    }
                )
            else:
                possible.append(
                    {
                        "match_type": "ambiguous_pattern_key",
                        "pattern_key": key,
                        "destination": destination,
                        "confidence": round(share, 3),
                        "reason": f"Pattern key has multiple IA destinations ({len(destination_counts)} options); not applied.",
                    }
                )

    applied = [item for item in possible if not item["match_type"].startswith("ambiguous")]
    if applied:
        applied.sort(key=lambda item: (item["confidence"], len(item["pattern_key"])), reverse=True)
        return applied[0]

    # Fuzzy fallback is intentionally conservative.
    best: Dict[str, Any] | None = None
    for candidate_key in candidates:
        if candidate_key in GENERIC_KEYS or len(candidate_key) < 6:
            continue
        for pattern_key, destination_counts in key_to_destinations.items():
            if pattern_key in GENERIC_KEYS:
                continue
            if len(destination_counts) != 1:
                continue
            score = SequenceMatcher(None, candidate_key, pattern_key).ratio()
            if score >= 0.93:
                match = {
                    "match_type": "fuzzy_pattern_key",
                    "pattern_key": pattern_key,
                    "destination": next(iter(destination_counts.keys())),
                    "confidence": round(score, 3),
                    "reason": f"Fuzzy pattern key match from '{candidate_key}' to '{pattern_key}'.",
                }
                if best is None or match["confidence"] > best["confidence"]:
                    best = match
    return best


def load_manual_exclude(path: Path | None) -> set[str]:
    if not path or not path.exists():
        return set()
    df = read_table(path)
    url_col = find_col(df, URL_COLUMN_CANDIDATES)
    if not url_col:
        return set()
    excluded = set()
    for value in df[url_col].dropna().tolist():
        normalized = normalize_url(value)
        if normalized:
            excluded.add(normalized)
            excluded.add(normalized.rstrip("/"))
            excluded.add(normalized.rstrip("/") + "/")
    return excluded


def apply_pattern_mappings(
    redirect_list_path: Path,
    ia_path: Path,
    output_dir: Path,
    manual_exclude_path: Path | None = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    redirect_df = read_table(redirect_list_path)
    existing_col = find_col(redirect_df, ["Existing URL"])
    destination_col = find_col(redirect_df, ["Destination URL"])
    if not existing_col or not destination_col:
        raise ValueError("Redirect list must include Existing URL and Destination URL columns.")
    if NOTES_COLUMN not in redirect_df.columns:
        redirect_df[NOTES_COLUMN] = ""

    manual_excluded = load_manual_exclude(manual_exclude_path)
    ia_pairs = load_ia_pairs(ia_path)
    key_to_destinations, pattern_index = build_pattern_index(ia_pairs)

    suggestions: List[Dict[str, Any]] = []
    applied_rows: List[Dict[str, Any]] = []

    for idx, row in redirect_df.iterrows():
        existing_url = normalize_url(row.get(existing_col, ""))
        if not existing_url or existing_url in manual_excluded:
            continue
        current_destination = normalize_url(row.get(destination_col, ""))
        if current_destination:
            continue

        match = find_pattern_match(existing_url, key_to_destinations)
        if not match:
            continue

        suggestion = {
            "Existing URL": safe_str(row.get(existing_col, "")),
            "Suggested Destination URL": match["destination"],
            "Pattern Key": match["pattern_key"],
            "Match Type": match["match_type"],
            "Confidence": match["confidence"],
            "Reason": match["reason"],
        }
        suggestions.append(suggestion)

        if not match["match_type"].startswith("ambiguous"):
            redirect_df.at[idx, destination_col] = match["destination"]
            existing_note = safe_str(row.get(NOTES_COLUMN, ""))
            pattern_note = f"IA pattern match: {match['pattern_key']} ({match['match_type']}, confidence {match['confidence']})."
            redirect_df.at[idx, NOTES_COLUMN] = f"{existing_note} | {pattern_note}".strip(" |")
            applied_rows.append(suggestion)

    output_dir.mkdir(parents=True, exist_ok=True)
    updated_path = output_dir / "redirect-list.csv"
    suggestions_path = output_dir / "ia-pattern-suggestions.csv"
    applied_path = output_dir / "ia-pattern-applied.csv"
    index_path = output_dir / "ia-pattern-index.csv"

    redirect_df.to_csv(updated_path, index=False)
    pd.DataFrame(suggestions).to_csv(suggestions_path, index=False)
    pd.DataFrame(applied_rows).to_csv(applied_path, index=False)
    pattern_index.to_csv(index_path, index=False)

    return redirect_df, pd.DataFrame(suggestions), pd.DataFrame(applied_rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply IA-derived pattern mappings to blank redirect destinations.")
    parser.add_argument("--redirect-list", required=True, help="Path to redirect-list.csv")
    parser.add_argument("--ia", required=True, help="Path to IA workbook or IA CSV")
    parser.add_argument("--output-dir", required=True, help="Output directory for updated redirect-list and pattern QA files")
    parser.add_argument("--manual-exclude", help="Optional manual exclude CSV/XLSX")
    args = parser.parse_args()

    updated, suggestions, applied = apply_pattern_mappings(
        redirect_list_path=Path(args.redirect_list),
        ia_path=Path(args.ia),
        output_dir=Path(args.output_dir),
        manual_exclude_path=Path(args.manual_exclude) if args.manual_exclude else None,
    )
    print(f"Updated redirect-list rows: {len(updated)}")
    print(f"IA pattern suggestions: {len(suggestions)}")
    print(f"IA pattern mappings applied: {len(applied)}")


if __name__ == "__main__":
    main()
