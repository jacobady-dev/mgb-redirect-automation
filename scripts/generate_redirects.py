"""Generate Google Sheets-ready redirect outputs from site configs.

Usage:
    python scripts/generate_redirects.py --site site-01
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple
from urllib.parse import urlparse

import pandas as pd
import yaml

from normalize_columns import find_column, require_column
from validators import build_qa_summary


CRAWL_URL_COLUMNS = ["Address", "URL", "Existing URL", "Source URL", "Old URL"]
STATUS_COLUMNS = ["Status Code", "Status", "HTTP Status"]
INDEXABILITY_COLUMNS = ["Indexability", "Index Status", "Indexable"]
INDEXABILITY_STATUS_COLUMNS = ["Indexability Status", "Index Status Reason"]
CONTENT_TYPE_COLUMNS = ["Content Type", "MIME Type"]
REDIRECT_URL_COLUMNS = ["Redirect URL", "Redirect Target", "Final Redirect URL"]

CLIENT_OUTPUT_COLUMNS = [
    "Existing URL",
    "Destination URL",
    "829 Notes",
    "Status Code",
    "Index Status",
]

INTERNAL_OUTPUT_COLUMNS = CLIENT_OUTPUT_COLUMNS + ["Rule ID"]

SOURCE_COLUMN_PATTERNS = [
    "source url",
    "source url 1",
    "source url 2",
    "source url 3",
    "existing url",
    "old url",
    "address",
]

DESTINATION_COLUMN_CANDIDATES = [
    "Full URL",
    "Destination URL",
    "New URL",
    "MGB URL",
    "Preview URL",
    "Final URL",
]

EXCEL_EXTENSIONS = {".xlsx", ".xlsm", ".xls"}


def load_yaml(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return data


def safe_str(value: Any) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def normalize_url(url: str) -> str:
    cleaned = safe_str(url)
    if not cleaned:
        return ""
    parsed = urlparse(cleaned)
    if parsed.scheme and parsed.netloc:
        rebuilt = parsed._replace(fragment="").geturl()
        return rebuilt.rstrip("/")
    return cleaned.rstrip("/")


def path_lower(url: str) -> str:
    parsed = urlparse(url)
    return parsed.path.lower()


def value_from_row(row: pd.Series, column: str | None) -> str:
    if not column:
        return ""
    return safe_str(row.get(column, ""))


def load_table(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in EXCEL_EXTENSIONS:
        return pd.read_excel(path)
    return pd.read_csv(path, low_memory=False)


def load_excel_sheets(path: Path) -> Dict[str, pd.DataFrame]:
    if path.suffix.lower() in EXCEL_EXTENSIONS:
        return pd.read_excel(path, sheet_name=None)
    return {path.stem: pd.read_csv(path, low_memory=False)}


def is_non_indexable_blocked_or_noindex(indexability: str, indexability_status: str) -> bool:
    status = f"{indexability} {indexability_status}".lower()
    if "non-indexable" not in status:
        return False
    if "redirect" in status:
        return False
    return any(reason in status for reason in ["blocked", "noindex", "canonical", "canonicalised", "canonicalized"])


def is_redirect_status(status_code: str) -> bool:
    return status_code.startswith("3")


def is_four_xx_or_non_200_non_3xx(status_code: str) -> bool:
    if not status_code:
        return False
    if status_code.startswith("2") or status_code.startswith("3"):
        return False
    return True


def load_manual_excludes(site_root: Path, site_config: Dict[str, Any]) -> set[str]:
    manual = site_config.get("manual_exclude", {}) or {}
    if not manual.get("enabled", False):
        return set()

    file_name = manual.get("file")
    if not file_name:
        return set()

    exclude_path = site_root / "input" / file_name
    if not exclude_path.exists():
        raise FileNotFoundError(f"Manual exclude is enabled, but file was not found: {exclude_path}")

    exclude_df = load_table(exclude_path)
    url_col = require_column(exclude_df, CRAWL_URL_COLUMNS, "manual exclude URL column")
    return {normalize_url(url) for url in exclude_df[url_col].dropna().map(str)}


def column_name_matches(column: str, candidates: Iterable[str]) -> bool:
    normalized = str(column).strip().lower()
    return normalized in {candidate.strip().lower() for candidate in candidates}


def source_columns_for_df(df: pd.DataFrame, configured_candidates: Iterable[str]) -> List[str]:
    configured = [candidate.strip().lower() for candidate in configured_candidates]
    source_cols: List[str] = []
    for col in df.columns:
        normalized = str(col).strip().lower()
        if normalized in configured or normalized in SOURCE_COLUMN_PATTERNS:
            source_cols.append(col)
    return source_cols


def destination_column_for_df(df: pd.DataFrame, configured_candidates: Iterable[str]) -> str | None:
    return find_column(df, list(configured_candidates) + DESTINATION_COLUMN_CANDIDATES)


def build_ia_map(site_root: Path, site_config: Dict[str, Any], rules_config: Dict[str, Any]) -> Tuple[Dict[str, str], List[Dict[str, str]]]:
    input_files = site_config.get("input_files", {}) or {}
    ia_relative = input_files.get("ia_map")
    if not ia_relative:
        return {}, []

    ia_path = site_root / ia_relative
    if not ia_path.exists():
        return {}, []

    ia_rule = None
    for rule in rules_config.get("redirect_rules", []) or []:
        if rule.get("type") == "ia_exact_match":
            ia_rule = rule
            break

    source_candidates = (ia_rule or {}).get("source_column_candidates", CRAWL_URL_COLUMNS + SOURCE_COLUMN_PATTERNS)
    destination_candidates = (ia_rule or {}).get("destination_column_candidates", DESTINATION_COLUMN_CANDIDATES)

    mapping: Dict[str, str] = {}
    incomplete_rows: List[Dict[str, str]] = []
    sheets = load_excel_sheets(ia_path)

    for sheet_name, df in sheets.items():
        if df.empty:
            continue
        source_cols = source_columns_for_df(df, source_candidates)
        destination_col = destination_column_for_df(df, destination_candidates)
        if not source_cols:
            continue

        for _, row in df.iterrows():
            destination = safe_str(row.get(destination_col, "")) if destination_col else ""
            for source_col in source_cols:
                source = normalize_url(row.get(source_col, ""))
                if not source or not source.startswith("http"):
                    continue
                if destination:
                    mapping[source] = destination
                else:
                    incomplete_rows.append(
                        {
                            "Existing URL": source,
                            "Destination URL": "",
                            "829 Notes": f"IA source found on sheet '{sheet_name}' but no destination Full URL was available.",
                            "Status Code": str((rules_config.get("defaults", {}) or {}).get("status_code", 301)),
                            "Index Status": "",
                            "Rule ID": "ia_source_without_destination",
                        }
                    )
    return mapping, incomplete_rows


def has_any_contains(url: str, needles: Iterable[str]) -> bool:
    lower = url.lower()
    return any(str(needle).lower() in lower for needle in needles or [])


def has_any_extension(url: str, extensions: Iterable[str]) -> bool:
    lower_path = path_lower(url)
    return any(lower_path.endswith(str(ext).lower()) for ext in extensions or [])


def matches_any_regex(url: str, patterns: Iterable[str]) -> bool:
    return any(re.search(pattern, url, flags=re.IGNORECASE) for pattern in patterns or [])


def rule_matches(rule: Dict[str, Any], url: str, status_code: str, indexability: str, content_type: str) -> bool:
    checks: List[bool] = []

    if "status_code_starts_with" in rule:
        checks.append(status_code.startswith(str(rule["status_code_starts_with"])))

    if "status_code_non_200_non_3xx" in rule:
        checks.append(is_four_xx_or_non_200_non_3xx(status_code))

    if rule.get("match_contains"):
        checks.append(has_any_contains(url, rule.get("match_contains", [])))

    if rule.get("match_regex"):
        checks.append(matches_any_regex(url, rule.get("match_regex", [])))

    if rule.get("file_extensions"):
        checks.append(has_any_extension(url, rule.get("file_extensions", [])))

    if rule.get("content_type_contains"):
        checks.append(has_any_contains(content_type, rule.get("content_type_contains", [])))

    if not checks:
        return False

    return any(checks)


def process_site(site_id: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    repo_root = Path.cwd()
    site_root = repo_root / "sites" / site_id
    site_config = load_yaml(site_root / "config" / "site.yml")
    rules_config = load_yaml(site_root / "config" / "rules.yml")

    input_files = site_config.get("input_files", {}) or {}
    crawl_path = site_root / input_files.get("crawl", "input/crawl.csv")
    if not crawl_path.exists():
        raise FileNotFoundError(f"Crawl file was not found: {crawl_path}")

    crawl_df = load_table(crawl_path)

    url_col = require_column(crawl_df, CRAWL_URL_COLUMNS, "crawl URL column")
    status_col = find_column(crawl_df, STATUS_COLUMNS)
    indexability_col = find_column(crawl_df, INDEXABILITY_COLUMNS)
    indexability_status_col = find_column(crawl_df, INDEXABILITY_STATUS_COLUMNS)
    content_type_col = find_column(crawl_df, CONTENT_TYPE_COLUMNS)
    redirect_url_col = find_column(crawl_df, REDIRECT_URL_COLUMNS)

    excluded_urls = load_manual_excludes(site_root, site_config)
    ia_map, incomplete_ia_rows = build_ia_map(site_root, site_config, rules_config)
    incomplete_ia_lookup = {normalize_url(row["Existing URL"]): row for row in incomplete_ia_rows}

    default_status = str((rules_config.get("defaults", {}) or {}).get("status_code", 301))
    no_match_note = (rules_config.get("defaults", {}) or {}).get(
        "no_match_note", "No confident IA-backed destination found. Needs human review."
    )

    redirects: List[Dict[str, str]] = []
    red_flags: List[Dict[str, str]] = []
    ignored: List[Dict[str, str]] = []

    for _, row in crawl_df.iterrows():
        existing_url = safe_str(row.get(url_col, ""))
        normalized_existing_url = normalize_url(existing_url)
        if not existing_url:
            continue

        status_code = value_from_row(row, status_col)
        indexability = value_from_row(row, indexability_col)
        indexability_status = value_from_row(row, indexability_status_col)
        index_status = indexability if not indexability_status else f"{indexability} - {indexability_status}"
        content_type = value_from_row(row, content_type_col)
        redirect_url = value_from_row(row, redirect_url_col)

        if normalized_existing_url in excluded_urls:
            ignored.append(
                {
                    "Existing URL": existing_url,
                    "Reason": "Manual exclude enabled for this site. Search agency owns this URL.",
                }
            )
            continue

        if is_non_indexable_blocked_or_noindex(indexability, indexability_status):
            ignored.append(
                {
                    "Existing URL": existing_url,
                    "Reason": f"Excluded from CSV: {index_status}",
                }
            )
            continue

        if is_redirect_status(status_code):
            ignored.append(
                {
                    "Existing URL": existing_url,
                    "Reason": f"Existing crawl redirect excluded from final CSV. Redirect URL: {redirect_url}",
                }
            )
            continue

        if normalized_existing_url in ia_map:
            redirects.append(
                {
                    "Existing URL": existing_url,
                    "Destination URL": ia_map[normalized_existing_url],
                    "829 Notes": "IA-backed exact match.",
                    "Status Code": default_status,
                    "Index Status": index_status,
                    "Rule ID": "ia_exact_match",
                }
            )
            continue

        if normalized_existing_url in incomplete_ia_lookup:
            flagged = incomplete_ia_lookup[normalized_existing_url].copy()
            flagged["Index Status"] = index_status
            red_flags.append(flagged)
            continue

        matched = False

        for rule in rules_config.get("red_flag_rules", []) or []:
            if rule_matches(rule, existing_url, status_code, indexability, content_type):
                red_flags.append(
                    {
                        "Existing URL": existing_url,
                        "Destination URL": safe_str(rule.get("destination", "")),
                        "829 Notes": safe_str(rule.get("note", "Needs review.")),
                        "Status Code": default_status,
                        "Index Status": index_status,
                        "Rule ID": safe_str(rule.get("id", "red_flag_rule")),
                    }
                )
                matched = True
                break

        if matched:
            continue

        for rule in rules_config.get("redirect_rules", []) or []:
            if rule.get("type") == "ia_exact_match":
                continue
            if rule_matches(rule, existing_url, status_code, indexability, content_type):
                redirects.append(
                    {
                        "Existing URL": existing_url,
                        "Destination URL": safe_str(rule.get("destination", "")),
                        "829 Notes": safe_str(rule.get("note", "Rule-backed redirect.")),
                        "Status Code": default_status,
                        "Index Status": index_status,
                        "Rule ID": safe_str(rule.get("id", "redirect_rule")),
                    }
                )
                matched = True
                break

        if matched:
            continue

        red_flags.append(
            {
                "Existing URL": existing_url,
                "Destination URL": "",
                "829 Notes": no_match_note,
                "Status Code": default_status,
                "Index Status": index_status,
                "Rule ID": "no_confident_match",
            }
        )

    redirect_df_internal = pd.DataFrame(redirects, columns=INTERNAL_OUTPUT_COLUMNS)
    red_flag_df_internal = pd.DataFrame(red_flags, columns=INTERNAL_OUTPUT_COLUMNS)
    ignored_df = pd.DataFrame(ignored, columns=["Existing URL", "Reason"])

    redirect_df = redirect_df_internal[CLIENT_OUTPUT_COLUMNS].copy()
    red_flag_df = red_flag_df_internal[CLIENT_OUTPUT_COLUMNS].copy()
    qa_df = build_qa_summary(redirect_df, red_flag_df, ignored_df, len(crawl_df))

    outputs = site_config.get("outputs", {}) or {}
    for key, df in [
        ("redirect_list", redirect_df),
        ("red_flags", red_flag_df),
        ("ignored_search_agency", ignored_df),
        ("qa_summary", qa_df),
    ]:
        relative = outputs.get(key)
        if not relative:
            continue
        output_path = site_root / relative
        output_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)
        print(f"Wrote {len(df)} rows to {output_path}")

    internal_relative = outputs.get("internal_rule_matches")
    if internal_relative:
        internal_path = site_root / internal_relative
        internal_path.parent.mkdir(parents=True, exist_ok=True)
        pd.concat(
            [
                redirect_df_internal.assign(Output="Redirect List"),
                red_flag_df_internal.assign(Output="Red Flags"),
            ],
            ignore_index=True,
        ).to_csv(internal_path, index=False)
        print(f"Wrote internal rule matches to {internal_path}")

    return redirect_df, red_flag_df, ignored_df, qa_df


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate redirect outputs for a configured site.")
    parser.add_argument("--site", required=True, help="Site folder ID under sites/, such as site-01")
    args = parser.parse_args()
    process_site(args.site)


if __name__ == "__main__":
    main()
