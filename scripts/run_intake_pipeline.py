"""Run the full redirect intake pipeline from local files.

This is the CLI version of the intake app flow:
1. Copy crawl + IA files into a temporary site folder.
2. Optionally convert a Manual Mapping Key into manual-exclude.csv.
3. Run redirect generation.
4. Build a reference-style workbook.

Example:
    python scripts/run_intake_pipeline.py \
      --crawl path/to/crawl.csv \
      --ia path/to/ia.xlsx \
      --manual-key path/to/manual-key.csv \
      --output-dir output/mvh-test \
      --site-label "Martha's Vineyard Hospital" \
      --source-domain mvhospital.org \
      --source-domain www.mvhospital.org
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

import yaml

from build_manual_exclude_from_key import build_manual_exclude
from build_output_workbook import build_workbook
from generate_redirects import process_site


TEXT_TABLE_EXTENSIONS = {".csv", ".tsv", ".txt"}


def copy_input(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def site_config(
    site_id: str,
    site_label: str,
    source_domains: list[str],
    destination_domain: str,
    crawl_name: str,
    ia_name: str,
    manual_enabled: bool,
) -> dict:
    return {
        "site_id": site_id,
        "site_label": site_label,
        "source_domains": source_domains,
        "destination_domain": destination_domain,
        "input_files": {
            "crawl": f"input/{crawl_name}",
            "ia_map": f"input/{ia_name}",
        },
        "manual_exclude": {
            "enabled": manual_enabled,
            "file": "manual-exclude.csv" if manual_enabled else None,
        },
        "outputs": {
            "redirect_list": "output/redirect-list.csv",
            "red_flags": "output/red-flags.csv",
            "ignored_search_agency": "output/ignored-search-agency.csv",
            "qa_summary": "output/qa-summary.csv",
            "internal_rule_matches": "output/internal-rule-matches.csv",
            "internal_ia_map_detected": "output/ia-map-detected.csv",
            "internal_red_flags": "output/internal-red-flags.csv",
            "js_css_pages": "output/js-css-pages.csv",
        },
    }


def default_rules() -> dict:
    return {
        "defaults": {
            "status_code": 301,
            "no_match_output": "redirect_list",
            "no_match_note": "",
        },
        "redirect_rules": [
            {
                "id": "ia_exact_match",
                "type": "ia_exact_match",
                "source_column_candidates": ["Existing URL", "Source URL", "source URL", "source URL 2", "source URL 3", "Old URL", "Address", "URL"],
                "destination_column_candidates": ["Full URL", "Destination URL", "New URL", "MGB URL", "Preview URL", "Final URL"],
            }
        ],
    }


def run_pipeline(args: argparse.Namespace) -> Path:
    repo_root = Path.cwd()
    site_id = args.site_id
    site_root = repo_root / "sites" / site_id
    input_dir = site_root / "input"
    config_dir = site_root / "config"
    output_dir = Path(args.output_dir)

    if site_root.exists() and args.clean:
        shutil.rmtree(site_root)
    input_dir.mkdir(parents=True, exist_ok=True)
    config_dir.mkdir(parents=True, exist_ok=True)

    crawl_path = Path(args.crawl)
    ia_path = Path(args.ia)
    crawl_name = f"crawl{crawl_path.suffix or '.csv'}"
    ia_name = f"ia-map{ia_path.suffix or '.xlsx'}"
    copy_input(crawl_path, input_dir / crawl_name)
    copy_input(ia_path, input_dir / ia_name)

    manual_enabled = bool(args.manual_key or args.manual_exclude)
    manual_exclude_path = input_dir / "manual-exclude.csv"
    if args.manual_key:
        key_source = Path(args.manual_key)
        key_destination = input_dir / f"manual-mapping-key{key_source.suffix or '.csv'}"
        copy_input(key_source, key_destination)
        manual_df = build_manual_exclude(key_destination, manual_exclude_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        manual_df.to_csv(output_dir / "manually-mapped-urls-exclude.csv", index=False)
    elif args.manual_exclude:
        copy_input(Path(args.manual_exclude), manual_exclude_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(manual_exclude_path, output_dir / "manually-mapped-urls-exclude.csv")

    config = site_config(
        site_id=site_id,
        site_label=args.site_label,
        source_domains=args.source_domain,
        destination_domain=args.destination_domain,
        crawl_name=crawl_name,
        ia_name=ia_name,
        manual_enabled=manual_enabled,
    )
    (config_dir / "site.yml").write_text(yaml.safe_dump(config, sort_keys=False), encoding="utf-8")
    (config_dir / "rules.yml").write_text(yaml.safe_dump(default_rules(), sort_keys=False), encoding="utf-8")

    # process_site writes to the configured site output folder, so temporarily point output config to requested output dir by copying after run.
    process_site(site_id)
    generated_output = site_root / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    for csv_file in generated_output.glob("*.csv"):
        shutil.copy2(csv_file, output_dir / csv_file.name)
    if (site_root / "output" / "manually-mapped-urls-exclude.csv").exists():
        shutil.copy2(site_root / "output" / "manually-mapped-urls-exclude.csv", output_dir / "manually-mapped-urls-exclude.csv")

    workbook_path = output_dir / "redirect-workbook.xlsx"
    build_workbook(
        output_dir=output_dir,
        workbook_path=workbook_path,
        crawl_path=input_dir / crawl_name,
        manual_exclude_path=manual_exclude_path if manual_enabled else None,
    )
    return workbook_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Run redirect intake pipeline and build workbook.")
    parser.add_argument("--crawl", required=True)
    parser.add_argument("--ia", required=True)
    parser.add_argument("--manual-key")
    parser.add_argument("--manual-exclude")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--site-id", default="local-intake-run")
    parser.add_argument("--site-label", default="Site")
    parser.add_argument("--source-domain", action="append", default=[])
    parser.add_argument("--destination-domain", default="https://www.massgeneralbrigham.org")
    parser.add_argument("--clean", action="store_true")
    args = parser.parse_args()

    workbook = run_pipeline(args)
    print(f"Workbook written to: {workbook}")


if __name__ == "__main__":
    main()
