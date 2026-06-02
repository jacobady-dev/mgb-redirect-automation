"""Build a reference-style redirect workbook from generated CSV outputs.

This keeps the CSV generation step simple while giving reviewers a workbook that
looks closer to the MGB redirect mapping examples.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict, Iterable

import pandas as pd


TAB_ORDER = [
    "Redirect Logic",
    "Redirect List for CSV",
    "JS + CSS Pages",
    "Manually Mapped URLs (exclude)",
    "Full Site Crawl",
    "Copy of Full Site Crawl",
    "QA Summary",
    "Internal Rule Matches",
    "IA Map Detected",
    "Internal Red Flags",
    "Ignored - Excluded",
]


REDIRECT_LOGIC_ROWS = [
    {"Condition": "Priority URLs identified by Search/SEO team", "Destination Rule": "Manually Mapped / Excluded from automation"},
    {"Condition": "All Images", "Destination Rule": "Image Subfolder (TBD)"},
    {"Condition": "All Videos", "Destination Rule": "Video Subfolder (TBD)"},
    {"Condition": "All Files, PDFs, docs, zip files", "Destination Rule": "File Subfolder (TBD)"},
    {"Condition": "4xx or non-200 pages excluding 3xx", "Destination Rule": "https://www.massgeneralbrigham.org"},
    {"Condition": "Non-indexable because blocked/noindex", "Destination Rule": "Exclude from CSV"},
    {"Condition": "IA exact match", "Destination Rule": "Use IA Full URL / destination"},
    {"Condition": "No IA match", "Destination Rule": "Keep in Redirect List with blank destination"},
]


def read_csv_if_exists(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


def read_table_if_exists(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    if path.suffix.lower() in {".xlsx", ".xlsm", ".xls"}:
        return pd.read_excel(path)
    return pd.read_csv(path, sep=None, engine="python")


def keep_columns(df: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=list(columns))
    result = df.copy()
    for column in columns:
        if column not in result.columns:
            result[column] = ""
    return result[list(columns)]


def build_workbook(
    output_dir: Path,
    workbook_path: Path,
    crawl_path: Path | None = None,
    manual_exclude_path: Path | None = None,
) -> Path:
    redirect_df = read_csv_if_exists(output_dir / "redirect-list.csv")
    js_css_df = read_csv_if_exists(output_dir / "js-css-pages.csv")
    manual_df = read_csv_if_exists(output_dir / "manually-mapped-urls-exclude.csv")
    if manual_df.empty and manual_exclude_path:
        manual_df = read_table_if_exists(manual_exclude_path)
    qa_df = read_csv_if_exists(output_dir / "qa-summary.csv")
    internal_rules_df = read_csv_if_exists(output_dir / "internal-rule-matches.csv")
    ia_detected_df = read_csv_if_exists(output_dir / "ia-map-detected.csv")
    internal_red_flags_df = read_csv_if_exists(output_dir / "internal-red-flags.csv")
    if internal_red_flags_df.empty:
        internal_red_flags_df = read_csv_if_exists(output_dir / "red-flags.csv")
    ignored_df = read_csv_if_exists(output_dir / "ignored-search-agency.csv")
    full_crawl_df = read_table_if_exists(crawl_path) if crawl_path else pd.DataFrame()

    sheets: Dict[str, pd.DataFrame] = {
        "Redirect Logic": pd.DataFrame(REDIRECT_LOGIC_ROWS),
        "Redirect List for CSV": keep_columns(redirect_df, ["Existing URL", "Destination URL", "829 Notes"]),
        "JS + CSS Pages": js_css_df if not js_css_df.empty else pd.DataFrame(columns=["Page URL"]),
        "Manually Mapped URLs (exclude)": manual_df if not manual_df.empty else pd.DataFrame(columns=["Existing URL", "Destination URL (To Be Populated By Search Team)"]),
        "Full Site Crawl": full_crawl_df,
        "Copy of Full Site Crawl": full_crawl_df.copy(),
        "QA Summary": qa_df,
        "Internal Rule Matches": internal_rules_df,
        "IA Map Detected": ia_detected_df,
        "Internal Red Flags": internal_red_flags_df,
        "Ignored - Excluded": ignored_df,
    }

    workbook_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(workbook_path, engine="openpyxl") as writer:
        for tab_name in TAB_ORDER:
            df = sheets.get(tab_name, pd.DataFrame())
            safe_tab = tab_name[:31]
            df.to_excel(writer, sheet_name=safe_tab, index=False)
            worksheet = writer.sheets[safe_tab]
            worksheet.freeze_panes = "A2"
            for column_cells in worksheet.columns:
                max_length = 0
                column_letter = column_cells[0].column_letter
                for cell in column_cells[:100]:
                    max_length = max(max_length, len(str(cell.value or "")))
                worksheet.column_dimensions[column_letter].width = min(max(max_length + 2, 12), 60)
    return workbook_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a redirect workbook from generated CSV outputs.")
    parser.add_argument("--output-dir", required=True, help="Directory containing generated CSV outputs")
    parser.add_argument("--workbook", required=True, help="Path to write .xlsx workbook")
    parser.add_argument("--crawl", required=False, help="Original crawl CSV/XLSX path")
    parser.add_argument("--manual-exclude", required=False, help="Manual exclude CSV/XLSX path")
    args = parser.parse_args()

    build_workbook(
        output_dir=Path(args.output_dir),
        workbook_path=Path(args.workbook),
        crawl_path=Path(args.crawl) if args.crawl else None,
        manual_exclude_path=Path(args.manual_exclude) if args.manual_exclude else None,
    )
    print(f"Wrote workbook to {args.workbook}")


if __name__ == "__main__":
    main()
