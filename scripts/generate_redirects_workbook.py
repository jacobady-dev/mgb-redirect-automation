"""Workbook-aligned redirect generator with flexible crawl and IA workbook parsing."""

from __future__ import annotations

import argparse
import io
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

CLIENT_OUTPUT_COLUMNS = ["Existing URL", "Destination URL", "829 Notes", "Status Code", "Index Status"]
INTERNAL_OUTPUT_COLUMNS = CLIENT_OUTPUT_COLUMNS + ["Rule ID"]

SOURCE_NAMES = ["source url", "source url 1", "source url 2", "source url 3", "existing url", "old url", "address", "url"]
DEST_NAMES = ["full url", "destination url", "new url", "mgb url", "preview url", "final url"]
EXCEL_EXTENSIONS = {".xlsx", ".xlsm", ".xls"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif", ".ico"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".m4v"}
FILE_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".csv", ".xml"}
JS_CSS_EXTENSIONS = {".js", ".css"}


def safe_str(value: Any) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def normalize_url(url: Any) -> str:
    cleaned = safe_str(url)
    if not cleaned:
        return ""
    parsed = urlparse(cleaned)
    if parsed.scheme and parsed.netloc:
        return parsed._replace(fragment="").geturl().rstrip("/")
    return cleaned.rstrip("/")


def path_lower(url: str) -> str:
    return urlparse(safe_str(url)).path.lower()


def value_from_row(row: pd.Series, column: str | None) -> str:
    return safe_str(row.get(column, "")) if column else ""


def load_yaml(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [safe_str(col) for col in df.columns]
    return df.dropna(how="all")


def read_csv_flexible(path: Path) -> pd.DataFrame:
    raw = path.read_bytes()
    try:
        df = pd.read_csv(io.BytesIO(raw), sep=None, engine="python")
    except Exception:
        df = pd.read_csv(io.BytesIO(raw), sep="\t")
    if len(df.columns) == 1:
        df = pd.read_csv(io.BytesIO(raw), sep="\t")
    return clean_columns(df)


def detect_header_row(path: Path, sheet_name: str, max_rows: int = 20) -> int | None:
    raw = pd.read_excel(path, sheet_name=sheet_name, header=None, dtype=object)
    source_set = set(SOURCE_NAMES)
    dest_set = set(DEST_NAMES)
    for idx in range(min(max_rows, len(raw))):
        values = {safe_str(value).lower() for value in raw.iloc[idx].tolist() if safe_str(value)}
        if values & source_set and values & dest_set:
            return idx
    for idx in range(min(max_rows, len(raw))):
        values = {safe_str(value).lower() for value in raw.iloc[idx].tolist() if safe_str(value)}
        if values & source_set:
            return idx
    return None


def read_excel_sheet_flexible(path: Path, sheet_name: str | int = 0) -> pd.DataFrame:
    if isinstance(sheet_name, int):
        return clean_columns(pd.read_excel(path, sheet_name=sheet_name))
    header_row = detect_header_row(path, sheet_name)
    if header_row is None:
        return clean_columns(pd.read_excel(path, sheet_name=sheet_name))
    return clean_columns(pd.read_excel(path, sheet_name=sheet_name, header=header_row))


def load_table(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in EXCEL_EXTENSIONS:
        return read_excel_sheet_flexible(path)
    return read_csv_flexible(path)


def load_all_sheets(path: Path) -> Dict[str, pd.DataFrame]:
    if path.suffix.lower() not in EXCEL_EXTENSIONS:
        return {path.stem: read_csv_flexible(path)}
    workbook = pd.ExcelFile(path)
    sheets: Dict[str, pd.DataFrame] = {}
    for sheet_name in workbook.sheet_names:
        try:
            sheets[sheet_name] = read_excel_sheet_flexible(path, sheet_name)
        except Exception as exc:  # noqa: BLE001
            print(f"Skipped IA sheet '{sheet_name}': {exc}")
    return sheets


def source_columns_for_df(df: pd.DataFrame, configured_candidates: Iterable[str]) -> List[str]:
    configured = {safe_str(candidate).lower() for candidate in configured_candidates}
    return [col for col in df.columns if safe_str(col).lower() in configured or safe_str(col).lower() in SOURCE_NAMES]


def destination_column_for_df(df: pd.DataFrame, configured_candidates: Iterable[str]) -> str | None:
    return find_column(df, list(configured_candidates) + [name.title() for name in DEST_NAMES] + DEST_NAMES)


def build_ia_map(site_root: Path, site_config: Dict[str, Any], rules_config: Dict[str, Any]) -> Tuple[Dict[str, str], List[Dict[str, str]], List[Dict[str, str]], pd.DataFrame]:
    ia_relative = (site_config.get("input_files", {}) or {}).get("ia_map")
    if not ia_relative:
        return {}, [], [], pd.DataFrame()
    ia_path = site_root / ia_relative
    if not ia_path.exists():
        return {}, [], [], pd.DataFrame()

    ia_rule = next((rule for rule in rules_config.get("redirect_rules", []) or [] if rule.get("type") == "ia_exact_match"), {})
    source_candidates = ia_rule.get("source_column_candidates", CRAWL_URL_COLUMNS + SOURCE_NAMES)
    destination_candidates = ia_rule.get("destination_column_candidates", DEST_NAMES)

    mapping: Dict[str, str] = {}
    incomplete_rows: List[Dict[str, str]] = []
    conflicts: List[Dict[str, str]] = []
    detected: List[Dict[str, str]] = []

    for sheet_name, df in load_all_sheets(ia_path).items():
        if df.empty:
            continue
        source_cols = source_columns_for_df(df, source_candidates)
        destination_col = destination_column_for_df(df, destination_candidates)
        if not source_cols:
            continue
        for _, row in df.iterrows():
            destination = normalize_url(row.get(destination_col, "")) if destination_col else ""
            for source_col in source_cols:
                source = normalize_url(row.get(source_col, ""))
                if not source or not source.startswith("http"):
                    continue
                if destination:
                    detected.append({"Source URL": source, "Destination URL": destination, "IA Sheet": sheet_name, "Source Column": source_col, "Destination Column": safe_str(destination_col)})
                    if source in mapping and mapping[source] != destination:
                        conflicts.append({"Existing URL": source, "Destination URL": destination, "829 Notes": f"Conflicting IA destinations. Existing mapped destination: {mapping[source]}. Conflict found on sheet '{sheet_name}'.", "Status Code": "301", "Index Status": "", "Rule ID": "ia_conflicting_destinations"})
                    else:
                        mapping[source] = destination
                else:
                    incomplete_rows.append({"Existing URL": source, "Destination URL": "", "829 Notes": f"IA source found on sheet '{sheet_name}' but no destination Full URL was available.", "Status Code": "301", "Index Status": "", "Rule ID": "ia_source_without_destination"})
    return mapping, incomplete_rows, conflicts, pd.DataFrame(detected)


def is_blocked_or_noindex(indexability: str, indexability_status: str) -> bool:
    status = f"{indexability} {indexability_status}".lower()
    if "non-indexable" not in status:
        return False
    if "redirect" in status:
        return False
    return "blocked" in status or "noindex" in status


def status_clean(status_code: Any) -> str:
    status = safe_str(status_code)
    return status[:-2] if status.endswith(".0") else status


def is_redirect_status(status_code: str) -> bool:
    return status_clean(status_code).startswith("3")


def is_non_200_non_3xx(status_code: str) -> bool:
    code = status_clean(status_code)
    return bool(code) and not code.startswith("2") and not code.startswith("3")


def classify_asset(url: str, content_type: str) -> str | None:
    path = path_lower(url)
    ctype = safe_str(content_type).lower()
    if any(path.endswith(ext) for ext in IMAGE_EXTENSIONS) or "image/" in ctype:
        return "image"
    if any(path.endswith(ext) for ext in VIDEO_EXTENSIONS) or "video/" in ctype:
        return "video"
    if any(path.endswith(ext) for ext in FILE_EXTENSIONS):
        return "file"
    if any(path.endswith(ext) for ext in JS_CSS_EXTENSIONS) or "javascript" in ctype or "text/css" in ctype:
        return "file"
    return None


def looks_like_provider(url: str) -> bool:
    lowered = url.lower()
    return any(token in lowered for token in ["/provider/", "/providers/", "/doctor/", "/doctors/", "/doctors-providers/"])


def looks_like_location(url: str) -> bool:
    lowered = url.lower()
    return "/location/" in lowered or "/locations/" in lowered


def looks_like_news(url: str) -> bool:
    lowered = url.lower()
    return any(token in lowered for token in ["/news/", "/press/", "/press-release/", "/blog/", "/article/", "/articles/", "/mvh-news"]) or bool(re.search(r"/(19|20)[0-9]{2}/", lowered))


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


def asset_destination(asset_type: str, rules_config: Dict[str, Any]) -> str:
    configured = rules_config.get("asset_destinations", {}) or {}
    defaults = {"image": "Image Subfolder (TBD)", "video": "Video Subfolder (TBD)", "file": "File Subfolder (TBD)"}
    return safe_str(configured.get(asset_type, defaults[asset_type]))


def process_site(site_id: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    repo_root = Path.cwd()
    site_root = repo_root / "sites" / site_id
    site_config = load_yaml(site_root / "config" / "site.yml")
    rules_config = load_yaml(site_root / "config" / "rules.yml")
    crawl_path = site_root / (site_config.get("input_files", {}) or {}).get("crawl", "input/crawl.csv")
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
    ia_map, incomplete_ia_rows, ia_conflicts, ia_detected_df = build_ia_map(site_root, site_config, rules_config)
    incomplete_lookup = {normalize_url(row["Existing URL"]): row for row in incomplete_ia_rows}
    conflict_lookup = {normalize_url(row["Existing URL"]): row for row in ia_conflicts}

    default_status = str((rules_config.get("defaults", {}) or {}).get("status_code", 301))
    destination_domain = safe_str(site_config.get("destination_domain", "https://www.massgeneralbrigham.org"))
    redirects: List[Dict[str, str]] = []
    red_flags: List[Dict[str, str]] = []
    ignored: List[Dict[str, str]] = []

    for _, row in crawl_df.iterrows():
        existing_url = safe_str(row.get(url_col, ""))
        normalized_url = normalize_url(existing_url)
        if not normalized_url:
            continue
        status_code = status_clean(value_from_row(row, status_col))
        indexability = value_from_row(row, indexability_col)
        indexability_status = value_from_row(row, indexability_status_col)
        index_status = indexability if not indexability_status else f"{indexability} - {indexability_status}"
        content_type = value_from_row(row, content_type_col)
        redirect_url = normalize_url(value_from_row(row, redirect_url_col))

        if normalized_url in excluded_urls:
            ignored.append({"Existing URL": existing_url, "Reason": "Manual exclude enabled for this site. Search agency owns this URL."})
            continue
        if is_blocked_or_noindex(indexability, indexability_status):
            ignored.append({"Existing URL": existing_url, "Reason": f"Excluded from CSV: {index_status}"})
            continue
        if normalized_url in conflict_lookup:
            flagged = conflict_lookup[normalized_url].copy()
            flagged["Index Status"] = index_status
            red_flags.append(flagged)
            continue
        if normalized_url in ia_map:
            redirects.append({"Existing URL": existing_url, "Destination URL": ia_map[normalized_url], "829 Notes": "IA-backed exact match.", "Status Code": default_status, "Index Status": index_status, "Rule ID": "ia_exact_match"})
            continue
        if is_redirect_status(status_code):
            redirects.append({"Existing URL": existing_url, "Destination URL": redirect_url, "829 Notes": "Existing crawl redirect. Destination pulled from Screaming Frog Redirect URL.", "Status Code": default_status, "Index Status": index_status, "Rule ID": "existing_3xx_redirect"})
            continue
        if is_non_200_non_3xx(status_code):
            redirects.append({"Existing URL": existing_url, "Destination URL": destination_domain, "829 Notes": "Non-200/non-3xx catch-all to homepage per Redirect Logic.", "Status Code": default_status, "Index Status": index_status, "Rule ID": "non_200_non_3xx_homepage"})
            continue
        asset_type = classify_asset(existing_url, content_type)
        if asset_type:
            redirects.append({"Existing URL": existing_url, "Destination URL": asset_destination(asset_type, rules_config), "829 Notes": "Asset routing per Redirect Logic.", "Status Code": default_status, "Index Status": index_status, "Rule ID": f"asset_{asset_type}_routing"})
            continue
        if normalized_url in incomplete_lookup:
            row_note = incomplete_lookup[normalized_url]
            redirects.append({"Existing URL": existing_url, "Destination URL": "", "829 Notes": row_note["829 Notes"], "Status Code": default_status, "Index Status": index_status, "Rule ID": "ia_source_without_destination"})
            continue

        note = "Needs destination review. No confident IA-backed destination found."
        rule_id = "needs_destination_review"
        if looks_like_provider(existing_url):
            note = "Provider URL needs destination review. No confirmed 1:1 destination found."
            rule_id = "provider_needs_review"
        elif looks_like_location(existing_url):
            note = "Location URL needs destination review. No confirmed 1:1 destination found."
            rule_id = "location_needs_review"
        elif looks_like_news(existing_url):
            note = "Press/news-like URL needs destination review. IA did not provide a confirmed destination."
            rule_id = "news_needs_review"
        redirects.append({"Existing URL": existing_url, "Destination URL": "", "829 Notes": note, "Status Code": default_status, "Index Status": index_status, "Rule ID": rule_id})

    seen_flag_urls = {normalize_url(row["Existing URL"]) for row in red_flags}
    for conflict in ia_conflicts:
        if normalize_url(conflict["Existing URL"]) not in seen_flag_urls:
            red_flags.append(conflict)

    redirect_internal = pd.DataFrame(redirects, columns=INTERNAL_OUTPUT_COLUMNS)
    redflag_internal = pd.DataFrame(red_flags, columns=INTERNAL_OUTPUT_COLUMNS)
    ignored_df = pd.DataFrame(ignored, columns=["Existing URL", "Reason"])
    redirect_df = redirect_internal[CLIENT_OUTPUT_COLUMNS].copy()
    redflag_df = redflag_internal[CLIENT_OUTPUT_COLUMNS].copy()
    qa_df = build_qa_summary(redirect_df, redflag_df, ignored_df, len(crawl_df))

    extra_qa = pd.DataFrame([
        {"Metric": "IA mapping rows detected", "Value": len(ia_map)},
        {"Metric": "IA source rows missing destination", "Value": len(incomplete_ia_rows)},
        {"Metric": "IA conflict rows detected", "Value": len(ia_conflicts)},
    ])
    qa_df = pd.concat([extra_qa, qa_df], ignore_index=True)

    outputs = site_config.get("outputs", {}) or {}
    for key, df in [("redirect_list", redirect_df), ("red_flags", redflag_df), ("ignored_search_agency", ignored_df), ("qa_summary", qa_df)]:
        relative = outputs.get(key)
        if relative:
            output_path = site_root / relative
            output_path.parent.mkdir(parents=True, exist_ok=True)
            df.to_csv(output_path, index=False)
            print(f"Wrote {len(df)} rows to {output_path}")

    internal_relative = outputs.get("internal_rule_matches")
    if internal_relative:
        internal_path = site_root / internal_relative
        internal_path.parent.mkdir(parents=True, exist_ok=True)
        pd.concat([redirect_internal.assign(Output="Redirect List"), redflag_internal.assign(Output="Red Flags")], ignore_index=True).to_csv(internal_path, index=False)
    ia_detected_relative = outputs.get("internal_ia_map_detected")
    if ia_detected_relative:
        ia_path = site_root / ia_detected_relative
        ia_path.parent.mkdir(parents=True, exist_ok=True)
        ia_detected_df.to_csv(ia_path, index=False)

    return redirect_df, redflag_df, ignored_df, qa_df


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate redirect outputs for a configured site.")
    parser.add_argument("--site", required=True, help="Site folder ID under sites/, such as site-01")
    args = parser.parse_args()
    process_site(args.site)


if __name__ == "__main__":
    main()
