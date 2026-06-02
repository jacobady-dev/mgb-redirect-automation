"""Guided intake app for redirect mapping.

Run locally:
    streamlit run app/streamlit_app.py
"""

from __future__ import annotations

import io
import shutil
import sys
import tempfile
import uuid
import zipfile
from pathlib import Path
from typing import Dict

import pandas as pd
import streamlit as st
import yaml

# Let the app import the existing redirect engine from /scripts.
REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = REPO_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from build_manual_exclude_from_key import build_manual_exclude  # noqa: E402
from generate_redirects import process_site  # noqa: E402


DEFAULT_RULES_PATH = REPO_ROOT / "sites" / "site-01" / "config" / "rules.yml"
EXCEL_EXTENSIONS = {".xlsx", ".xlsm", ".xls"}
TEXT_TABLE_EXTENSIONS = {".csv", ".tsv", ".txt"}


st.set_page_config(page_title="Redirect Mapping Intake", layout="wide")


OUTPUT_FILES = {
    "redirect-list.csv": "Redirect List for CSV",
    "red-flags.csv": "Red Flags",
    "ignored-search-agency.csv": "Ignored / Excluded",
    "qa-summary.csv": "QA Summary",
    "internal-rule-matches.csv": "Internal Rule Matches",
    "manually-mapped-urls-exclude.csv": "Manually Mapped URLs (exclude)",
}


def read_default_rules() -> str:
    if DEFAULT_RULES_PATH.exists():
        return DEFAULT_RULES_PATH.read_text(encoding="utf-8")
    return "defaults:\n  status_code: 301\n"


def uploaded_extension(uploaded_file, fallback: str = ".csv") -> str:
    if uploaded_file is None:
        return fallback
    suffix = Path(uploaded_file.name).suffix.lower()
    return suffix or fallback


def normalized_input_extension(uploaded_file, fallback: str = ".csv") -> str:
    """Return the extension the app will save for the processing engine.

    CSV/TSV/TXT uploads are normalized into real comma-separated CSV files.
    Excel files are preserved as Excel files.
    """
    suffix = uploaded_extension(uploaded_file, fallback=fallback)
    if suffix in TEXT_TABLE_EXTENSIONS:
        return ".csv"
    return suffix


def build_site_config(
    site_id: str,
    site_label: str,
    source_domains: list[str],
    destination_domain: str,
    manual_exclude_enabled: bool,
    crawl_ext: str,
    ia_ext: str,
) -> Dict:
    return {
        "site_id": site_id,
        "site_label": site_label,
        "source_domains": source_domains,
        "destination_domain": destination_domain,
        "input_files": {
            "crawl": f"input/crawl{crawl_ext}",
            "ia_map": f"input/ia-map{ia_ext}",
        },
        "manual_exclude": {
            "enabled": manual_exclude_enabled,
            "file": "manual-exclude.csv" if manual_exclude_enabled else None,
        },
        "outputs": {
            "redirect_list": "output/redirect-list.csv",
            "red_flags": "output/red-flags.csv",
            "ignored_search_agency": "output/ignored-search-agency.csv",
            "qa_summary": "output/qa-summary.csv",
            "internal_rule_matches": "output/internal-rule-matches.csv",
            "internal_ia_map_detected": "output/ia-map-detected.csv",
            "internal_red_flags": "output/internal-red-flags.csv",
        },
    }


def save_uploaded_file(uploaded_file, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as handle:
        handle.write(uploaded_file.getbuffer())


def save_uploaded_table(uploaded_file, destination: Path) -> None:
    """Save uploaded files in a parser-friendly format.

    Screaming Frog exports may be comma-delimited, tab-delimited, or pasted as TXT.
    This normalizes text-table uploads into clean comma-separated CSV files before
    the redirect engine reads them.
    """
    destination.parent.mkdir(parents=True, exist_ok=True)
    suffix = uploaded_extension(uploaded_file)

    if suffix in EXCEL_EXTENSIONS:
        save_uploaded_file(uploaded_file, destination)
        return

    raw_bytes = uploaded_file.getvalue()
    try:
        df = pd.read_csv(io.BytesIO(raw_bytes), sep=None, engine="python")
    except Exception:
        df = pd.read_csv(io.BytesIO(raw_bytes), sep="\t")

    if len(df.columns) == 1:
        df = pd.read_csv(io.BytesIO(raw_bytes), sep="\t")

    df.to_csv(destination, index=False)


def zip_outputs(output_dir: Path) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for filename in OUTPUT_FILES:
            file_path = output_dir / filename
            if file_path.exists():
                zip_file.write(file_path, arcname=filename)
    buffer.seek(0)
    return buffer.getvalue()


def preview_csv(path: Path, label: str) -> None:
    if not path.exists():
        st.info(f"{label} was not generated.")
        return
    df = pd.read_csv(path)
    st.subheader(label)
    st.caption(f"{len(df):,} rows")
    st.dataframe(df.head(50), use_container_width=True)
    st.download_button(
        label=f"Download {path.name}",
        data=path.read_bytes(),
        file_name=path.name,
        mime="text/csv",
        key=f"download-{path.name}",
    )


st.title("Redirect Mapping Intake")
st.write(
    "Upload a Screaming Frog crawl, IA workbook/map, and optional manual mapping layer. "
    "The app generates Google Sheets-ready redirect outputs."
)

with st.sidebar:
    st.header("Run setup")
    site_label = st.text_input("Site label", value="Site 01")
    source_domains_raw = st.text_area(
        "Source domain(s)",
        value="example.org\nwww.example.org",
        help="Enter one source domain per line. These are stored for documentation and future validation.",
    )
    destination_domain = st.text_input(
        "Destination domain",
        value="https://www.massgeneralbrigham.org",
    )
    manual_input_mode = st.radio(
        "Manual mapping / exclude layer",
        options=[
            "None",
            "Upload Manually Mapped URLs (exclude)",
            "Upload Manual Mapping Key",
        ],
        index=0,
        help="Manual mapping rows are removed from automated redirect generation and output separately.",
    )

    st.divider()
    st.caption("Default handling")
    st.checkbox("Manual mapping/exclude rows are removed from automation", value=True, disabled=True)
    st.checkbox("Blocked/noindex rows are excluded from CSV", value=True, disabled=True)
    st.checkbox("Most unresolved rows remain in Redirect List with blank destinations", value=True, disabled=True)

crawl_file = st.file_uploader("Upload Screaming Frog crawl", type=["csv", "tsv", "txt", "xlsx", "xlsm", "xls"])
ia_file = st.file_uploader("Upload IA workbook or IA map", type=["csv", "tsv", "txt", "xlsx", "xlsm", "xls"])
manual_file = None
if manual_input_mode == "Upload Manually Mapped URLs (exclude)":
    manual_file = st.file_uploader("Upload Manually Mapped URLs (exclude)", type=["csv", "tsv", "txt", "xlsx", "xlsm", "xls"])
elif manual_input_mode == "Upload Manual Mapping Key":
    manual_file = st.file_uploader("Upload Manual Mapping Key", type=["csv", "tsv", "txt", "xlsx", "xlsm", "xls"])

with st.expander("Advanced: edit rules.yml for this run"):
    rules_text = st.text_area(
        "Rules YAML",
        value=read_default_rules(),
        height=420,
        help="These rules control which URLs become redirects and which URLs become red flags.",
    )

manual_required = manual_input_mode != "None"
can_generate = crawl_file is not None and ia_file is not None and (not manual_required or manual_file is not None)

if st.button("Generate redirect outputs", type="primary", disabled=not can_generate):
    run_id = f"intake-{uuid.uuid4().hex[:8]}"
    source_domains = [line.strip() for line in source_domains_raw.splitlines() if line.strip()]
    crawl_ext = normalized_input_extension(crawl_file)
    ia_ext = normalized_input_extension(ia_file, fallback=".xlsx")
    manual_ext = normalized_input_extension(manual_file) if manual_required else ".csv"
    manual_exclude_enabled = manual_required

    with tempfile.TemporaryDirectory() as tmp:
        tmp_root = Path(tmp)
        working_repo = tmp_root / "working-repo"
        shutil.copytree(REPO_ROOT, working_repo, ignore=shutil.ignore_patterns(".git", "__pycache__", "*.pyc"))

        site_root = working_repo / "sites" / run_id
        input_dir = site_root / "input"
        config_dir = site_root / "config"
        output_dir = site_root / "output"
        input_dir.mkdir(parents=True, exist_ok=True)
        config_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        save_uploaded_table(crawl_file, input_dir / f"crawl{crawl_ext}")
        save_uploaded_table(ia_file, input_dir / f"ia-map{ia_ext}")

        if manual_required and manual_file is not None:
            if manual_input_mode == "Upload Manual Mapping Key":
                manual_key_path = input_dir / f"manual-mapping-key{manual_ext}"
                save_uploaded_table(manual_file, manual_key_path)
                manual_exclude_df = build_manual_exclude(manual_key_path, input_dir / "manual-exclude.csv")
            else:
                save_uploaded_table(manual_file, input_dir / "manual-exclude.csv")
                manual_exclude_df = pd.read_csv(input_dir / "manual-exclude.csv")
            manual_exclude_df.to_csv(output_dir / "manually-mapped-urls-exclude.csv", index=False)

        site_config = build_site_config(
            site_id=run_id,
            site_label=site_label,
            source_domains=source_domains,
            destination_domain=destination_domain,
            manual_exclude_enabled=manual_exclude_enabled,
            crawl_ext=crawl_ext,
            ia_ext=ia_ext,
        )
        (config_dir / "site.yml").write_text(yaml.safe_dump(site_config, sort_keys=False), encoding="utf-8")
        (config_dir / "rules.yml").write_text(rules_text, encoding="utf-8")

        original_cwd = Path.cwd()
        run_failed = False
        try:
            import os

            os.chdir(working_repo)
            process_site(run_id)
        except Exception as exc:  # noqa: BLE001
            run_failed = True
            st.error("The run failed. Check that the uploaded files have recognizable URL columns.")
            st.exception(exc)
        finally:
            import os

            os.chdir(original_cwd)

        if not run_failed:
            st.success("Redirect outputs generated.")
            zip_bytes = zip_outputs(output_dir)
            st.download_button(
                label="Download all outputs as ZIP",
                data=zip_bytes,
                file_name=f"{run_id}-redirect-outputs.zip",
                mime="application/zip",
                key="download-zip",
            )

            for filename, label in OUTPUT_FILES.items():
                preview_csv(output_dir / filename, label)

elif not can_generate:
    st.info("Upload the required files to generate outputs.")

st.divider()
st.caption(
    "GitHub remains the version-controlled engine. This intake app is the user-friendly upload and download layer."
)
