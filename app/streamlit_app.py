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

from generate_redirects import process_site  # noqa: E402


DEFAULT_RULES_PATH = REPO_ROOT / "sites" / "site-01" / "config" / "rules.yml"


st.set_page_config(page_title="Redirect Mapping Intake", layout="wide")


OUTPUT_FILES = {
    "redirect-list.csv": "Redirect List",
    "red-flags.csv": "Red Flags",
    "ignored-search-agency.csv": "Ignored / Search Agency",
    "qa-summary.csv": "QA Summary",
}


def read_default_rules() -> str:
    if DEFAULT_RULES_PATH.exists():
        return DEFAULT_RULES_PATH.read_text(encoding="utf-8")
    return "defaults:\n  status_code: 301\n"


def build_site_config(
    site_id: str,
    site_label: str,
    source_domains: list[str],
    destination_domain: str,
    manual_exclude_enabled: bool,
) -> Dict:
    return {
        "site_id": site_id,
        "site_label": site_label,
        "source_domains": source_domains,
        "destination_domain": destination_domain,
        "input_files": {
            "crawl": "input/crawl.csv",
            "ia_map": "input/ia-map.csv",
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
        },
    }


def save_uploaded_file(uploaded_file, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as handle:
        handle.write(uploaded_file.getbuffer())


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
    "Upload a Screaming Frog crawl, IA map, and optional manual exclude file. "
    "The app generates Google Sheets-ready redirect outputs and sends concerned URLs to Red Flags."
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
    manual_exclude_enabled = st.radio(
        "Is there a manual exclude file?",
        options=["No", "Yes"],
        index=0,
        help="If yes, matching URLs are ignored completely because another team owns them.",
    ) == "Yes"

    st.divider()
    st.caption("Default handling")
    st.checkbox("Send uncertain mappings to Red Flags", value=True, disabled=True)
    st.checkbox("Send provider uncertainty to Red Flags", value=True, disabled=True)
    st.checkbox("Send press/news uncertainty to Red Flags", value=True, disabled=True)
    st.checkbox("Send unclear assets to Red Flags", value=True, disabled=True)

crawl_file = st.file_uploader("Upload Screaming Frog crawl CSV", type=["csv"])
ia_file = st.file_uploader("Upload IA map CSV", type=["csv"])
exclude_file = None
if manual_exclude_enabled:
    exclude_file = st.file_uploader("Upload manual exclude CSV", type=["csv"])

with st.expander("Advanced: edit rules.yml for this run"):
    rules_text = st.text_area(
        "Rules YAML",
        value=read_default_rules(),
        height=420,
        help="These rules control which URLs become redirects and which URLs become red flags.",
    )

can_generate = crawl_file is not None and ia_file is not None and (not manual_exclude_enabled or exclude_file is not None)

if st.button("Generate redirect outputs", type="primary", disabled=not can_generate):
    run_id = f"intake-{uuid.uuid4().hex[:8]}"
    source_domains = [line.strip() for line in source_domains_raw.splitlines() if line.strip()]

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

        save_uploaded_file(crawl_file, input_dir / "crawl.csv")
        save_uploaded_file(ia_file, input_dir / "ia-map.csv")
        if manual_exclude_enabled and exclude_file is not None:
            save_uploaded_file(exclude_file, input_dir / "manual-exclude.csv")

        site_config = build_site_config(
            site_id=run_id,
            site_label=site_label,
            source_domains=source_domains,
            destination_domain=destination_domain,
            manual_exclude_enabled=manual_exclude_enabled,
        )
        (config_dir / "site.yml").write_text(yaml.safe_dump(site_config, sort_keys=False), encoding="utf-8")
        (config_dir / "rules.yml").write_text(rules_text, encoding="utf-8")

        original_cwd = Path.cwd()
        try:
            # process_site expects the current directory to be the repository root.
            import os

            os.chdir(working_repo)
            process_site(run_id)
        except Exception as exc:  # noqa: BLE001
            st.error("The run failed. Check that the uploaded files have recognizable URL columns.")
            st.exception(exc)
        finally:
            import os

            os.chdir(original_cwd)

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
    st.info("Upload the required CSV files to generate outputs.")

st.divider()
st.caption(
    "GitHub remains the version-controlled engine. This intake app is the user-friendly upload and download layer."
)
