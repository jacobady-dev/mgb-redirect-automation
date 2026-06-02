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
CONTENT_TYPE_COLUMNS = ["Content Type", "MIME Type"]

OUTPUT_COLUMNS = [
    "Existing URL",
    "Destination URL",
    "Status Code",
    "Index Status",
    "829 Notes",
    "Rule ID",
]


def load_yaml(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return data


def safe_str(value: Any) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def normalize_url(url: str) -> str:
    return safe_str(url).rstrip("/")


def url_host(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.lower()


def path_lower(url: str) -> str:
    parsed = urlparse(url)
    return parsed.path.lower()


def value_from_row(row: pd.Series, column: str | None) -> str:
    if not column:
        return ""
    return safe_str(row.get(column, ""))


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

    exclude_df = pd.read_csv(exclude_path, low_memory=False)
    url_col = require_column(exclude_df, CRAWL_URL_COLUMNS, "manual exclude URL column")
    return {normalize_url(url) for url in exclude_df[url_col].dropna().map(str)}


def build_ia_map(site_root: Path, site_config: Dict[str, Any], rules_config: Dict[str, Any]) -> Dict[str, str]:
    input_files = site_config.get("input_files", {}) or {}
    ia_relative = input_files.get("ia_map")
    if not ia_relative:
        return {}

    ia_path = site_root / ia_relative
    if not ia_path.exists():
        return {}

    ia_rule = None
    for rule in rules_config.get("redirect_rules", []) or []:
        if rule.get("type") == "ia_exact_match":
            ia_rule = rule
            break

    if not ia_rule:
        return {}

    ia_df = pd.read_csv(ia_path, low_memory=False)
    source_col = require_column(
        ia_df,
        ia_rule.get("source_column_candidates", CRAWL_URL_COLUMNS),
        "IA source URL column",
    )
    destination_col = require_column(
        ia_df,
        ia_rule.get("destination_column_candidates", ["Destination URL", "New URL"]),
        "IA destination URL column",
    )

    mapping: Dict[str, str] = {}
    for _, row in ia_df.iterrows():
        source = normalize_url(row.get(source_col, ""))
        destination = safe_str(row.get(destination_col, ""))
        if source and destination:
            mapping[source] = destination
    return mapping


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

    # Rules can have multiple possible match fields. Treat them as OR conditions.
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

    crawl_df = pd.read_csv(crawl_path, low_memory=False)

    url_col = require_column(crawl_df, CRAWL_URL_COLUMNS, "crawl URL column")
    status_col = find_column(crawl_df, STATUS_COLUMNS)
    indexability_col = find_column(crawl_df, INDEXABILITY_COLUMNS)
    content_type_col = find_column(crawl_df, CONTENT_TYPE_COLUMNS)

    excluded_urls = load_manual_excludes(site_root, site_config)
    ia_map = build_ia_map(site_root, site_config, rules_config)

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
        content_type = value_from_row(row, content_type_col)

        if normalized_existing_url in excluded_urls:
            ignored.append(
                {
                    "Existing URL": existing_url,
                    "Reason": "Manual exclude enabled for this site. Search agency owns this URL.",
                }
            )
            continue

        # IA exact matches are the highest-confidence output after excludes.
        if normalized_existing_url in ia_map:
            redirects.append(
                {
                    "Existing URL": existing_url,
                    "Destination URL": ia_map[normalized_existing_url],
                    "Status Code": default_status,
                    "Index Status": indexability,
                    "829 Notes": "IA-backed exact match.",
                    "Rule ID": "ia_exact_match",
                }
            )
            continue

        matched = False

        for rule in rules_config.get("red_flag_rules", []) or []:
            if rule_matches(rule, existing_url, status_code, indexability, content_type):
                red_flags.append(
                    {
                        "Existing URL": existing_url,
                        "Destination URL": safe_str(rule.get("destination", "")),
                        "Status Code": default_status,
                        "Index Status": indexability,
                        "829 Notes": safe_str(rule.get("note", "Needs review.")),
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
                        "Status Code": default_status,
                        "Index Status": indexability,
                        "829 Notes": safe_str(rule.get("note", "Rule-backed redirect.")),
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
                "Status Code": default_status,
                "Index Status": indexability,
                "829 Notes": no_match_note,
                "Rule ID": "no_confident_match",
            }
        )

    redirect_df = pd.DataFrame(redirects, columns=OUTPUT_COLUMNS)
    red_flag_df = pd.DataFrame(red_flags, columns=OUTPUT_COLUMNS)
    ignored_df = pd.DataFrame(ignored, columns=["Existing URL", "Reason"])
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

    return redirect_df, red_flag_df, ignored_df, qa_df


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate redirect outputs for a configured site.")
    parser.add_argument("--site", required=True, help="Site folder ID under sites/, such as site-01")
    args = parser.parse_args()
    process_site(args.site)


if __name__ == "__main__":
    main()
