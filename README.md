# MGB Redirect Automation

A browser-based redirect mapping portal for Mass General Brigham migration work, plus an optional local AI review script for higher-risk redirect decisions.

The browser app is designed to mirror the MGB redirect workbook workflow while keeping upload handling simple and safe. Users open the GitHub Pages URL, upload their files, generate the workbook locally in the browser, then download the finished output.

## Primary browser workflow

Open the portal, then upload:

1. **Source site crawl**  
   Screaming Frog export for the legacy site that needs redirect decisions.

2. **Manual exclude / key file**  
   The manual mapping export or `Manually Mapped URLs (exclude)` file.

The tool automatically loads the bundled MGB reference file:

```text
data/mgb-reference.csv
```

The advanced section can still override the bundled MGB reference files when needed.

Then click:

```text
Generate Redirect Workbook
```

The browser will generate a full `.xlsx` workbook plus a CSV-only redirect export.

## Core rule

Manual mapping rows are exclusions from automated processing.

They are written to:

```text
Manually Mapped URLs (exclude)
```

They are **not** duplicated into:

```text
Redirect List for CSV
```

## Generated workbook tabs

1. Redirect Logic
2. Redirect List for CSV
3. Manually Mapped URLs (exclude)
4. HUMAN CHECK
5. JS + CSS Pages
6. Images
7. PDFs Files Zip XML
8. Videos
9. Excluded Non-HTML
10. Working Filtered Crawl
11. Full Site Crawl
12. MGB Destination Candidates
13. Original Manual Export

## Workbook column conventions

`Redirect List for CSV` uses:

```text
Existing URL
Destination URL
DW - Approval
829 Notes
```

`Manually Mapped URLs (exclude)` uses:

```text
Existing URL
Destination URL
DW - Approval
829 Notes
```

`HUMAN CHECK` uses:

```text
Existing URL
Destination URL
DW - Approval
829 Notes
Content Type
Status Code
Title 1
```

## Mapping behavior

The browser workflow follows the same high-level process used in the MGB examples:

```text
Manual Mapping
→ IA Mapping
→ Destination Matching
→ Human Review
→ Final CSV
```

Important handling rules:

- Manual exclude URLs are removed before automation.
- Assets are separated into their own tabs.
- Provider/FAD pages map to the centralized MGB provider directory unless manually mapped 1:1.
- Service-section pages should map to service concepts before generic hospital/location pages.
- Location pages only map automatically when a strong destination match or safe NWH location fallback exists.
- News, article, press release, and historical-update pages are flagged for `HUMAN CHECK` unless a strong specific Newsroom destination exists.
- Bad general-purpose destinations such as random Newsroom pages, patient stories, locations, fraud alerts, and unrelated subdomains are filtered from general fuzzy matching.

## Optional local AI review workflow

The browser app stays rule-based and does not expose any API keys.

For a local AI pass, generate a workbook first, then run:

```bash
pip install -r requirements.txt
export OPENAI_API_KEY="your_api_key_here"
python scripts/ai_review_workbook.py "outputs/generated_workbook.xlsx" --max-rows 100
```

On Windows PowerShell:

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
python scripts/ai_review_workbook.py "outputs/generated_workbook.xlsx" --max-rows 100
```

The script reviews rows from:

```text
HUMAN CHECK
Redirect List for CSV rows with REVIEW/risk language
```

It adds adjacent AI columns instead of overwriting the mapping by default:

```text
AI Decision
AI Risk Level
AI Recommended Destination
AI Notes
AI Flags
```

The default behavior is intentionally conservative:

- It does not overwrite `Destination URL`.
- It does not overwrite `DW - Approval`.
- It reviews likely-problem rows first.
- It can be limited with `--max-rows` for cost control.

Optional flags:

```bash
# Review every redirect row too, not just flagged/HUMAN CHECK rows
python scripts/ai_review_workbook.py workbook.xlsx --include-clean-redirects

# Let the AI recommendation overwrite Destination URL for approve/review decisions
python scripts/ai_review_workbook.py workbook.xlsx --apply-ai-destination
```

Recommended first run:

```bash
python scripts/ai_review_workbook.py "nwh-redirect-mapping_Redirect_Mapping_Workbook.xlsx" --max-rows 25
```

Review that output manually before running the full workbook.

## Privacy / file handling

The current portal is a static browser app. Uploaded files are processed locally in the user's browser. They are not committed to GitHub and are not stored by the app.

The optional AI review script runs locally on your machine. It sends only selected row context and candidate destinations to the OpenAI API during review.

## GitHub Pages

This repo can be served from GitHub Pages using the root directory of the `main` branch.

Expected public URL format:

```text
https://jacobady-dev.github.io/mgb-redirect-automation/
```

If the page does not load, enable GitHub Pages in the repository settings and publish from `main` / root.

## Existing Python / Streamlit workflow

The older Python workflow is still present in the repo for local/backend experimentation:

```bash
pip install -r requirements.txt
streamlit run app/streamlit_app.py
```

The browser portal is the recommended first pass for shareable, non-technical use because it does not require a server and does not store uploaded client files.
