"""Build a Manually Mapped URLs (exclude) CSV from an SEO key export.

Input key columns expected:
- Current URL
- Approved?
- Final URL

Output columns:
- Existing URL
- Destination URL (To Be Populated By Search Team)

Default behavior:
- Include rows where Current URL is present and Approved? is Yes.
- Final URL may be blank; the URL is still excluded from automation.

Usage:
    python scripts/build_manual_exclude_from_key.py \
      --input path/to/manual-key.csv \
      --output path/to/manually-mapped-urls-exclude.csv
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

CURRENT_URL_CANDIDATES = ["Current URL", "Existing URL", "URL", "Address"]
APPROVED_CANDIDATES = ["Approved?", "Approved"]
FINAL_URL_CANDIDATES = ["Final URL", "Destination URL", "New URL"]

OUTPUT_COLUMNS = ["Existing URL", "Destination URL (To Be Populated By Search Team)"]


def find_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    normalized = {str(col).strip().lower(): col for col in df.columns}
    for candidate in candidates:
        match = normalized.get(candidate.strip().lower())
        if match is not None:
            return match
    return None


def read_table(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in {".xlsx", ".xlsm", ".xls"}:
        return pd.read_excel(path)
    return pd.read_csv(path, sep=None, engine="python")


def normalize_url(value: object) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def build_manual_exclude(input_path: Path, output_path: Path) -> pd.DataFrame:
    df = read_table(input_path)
    current_col = find_column(df, CURRENT_URL_CANDIDATES)
    if current_col is None:
        raise ValueError(f"Could not find Current URL column. Available columns: {list(df.columns)}")

    approved_col = find_column(df, APPROVED_CANDIDATES)
    final_col = find_column(df, FINAL_URL_CANDIDATES)

    work = df.copy()
    work["__current_url"] = work[current_col].map(normalize_url)
    if approved_col:
        work["__approved"] = work[approved_col].map(lambda value: str(value).strip().lower() == "yes")
    else:
        work["__approved"] = True

    if final_col:
        work["__final_url"] = work[final_col].map(normalize_url)
    else:
        work["__final_url"] = ""

    output = work[(work["__current_url"] != "") & (work["__approved"])].copy()
    output = output.drop_duplicates(subset=["__current_url"])

    result = pd.DataFrame(
        {
            OUTPUT_COLUMNS[0]: output["__current_url"],
            OUTPUT_COLUMNS[1]: output["__final_url"],
        }
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output_path, index=False)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Build manual exclude CSV from SEO key export.")
    parser.add_argument("--input", required=True, help="Path to manual mapping key CSV/XLSX")
    parser.add_argument("--output", required=True, help="Path for generated manual exclude CSV")
    args = parser.parse_args()

    result = build_manual_exclude(Path(args.input), Path(args.output))
    populated = result[OUTPUT_COLUMNS[1]].fillna("").ne("").sum()
    print(f"Wrote {len(result)} manually mapped URLs to {args.output}")
    print(f"Rows with destination populated: {populated}")
    print(f"Rows with destination blank: {len(result) - populated}")


if __name__ == "__main__":
    main()
