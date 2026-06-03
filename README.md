# MGB Redirect Automation

A browser-based redirect mapping portal for Mass General Brigham migration work.

The app is designed to mirror the MGB redirect workbook workflow while keeping upload handling simple and safe. Users open the GitHub Pages URL, upload their files, generate the workbook locally in the browser, then download the finished output.

## Primary workflow

Open the portal, then upload:

1. **Source site crawl**  
   Screaming Frog export for the legacy site that needs redirect decisions.

2. **Manual exclude / key file**  
   The manual mapping export or `Manually Mapped URLs (exclude)` file.

3. **MGB destination crawl**  
   Screaming Frog export of `massgeneralbrigham.org` destination URLs.

4. **MGB IA doc**  
   Optional, but recommended for stronger IA/category matching.

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

- Provider detail pages are not force-mapped. They go to `HUMAN CHECK` unless a confirmed destination provider URL is supplied later.
- Provider directory pages may map to the MGB provider directory.
- Location pages only map automatically when a strong MGB location candidate exists.
- News, article, press release, and historical-update pages are flagged for `HUMAN CHECK` unless a strong specific Newsroom destination exists.
- JS/CSS, image files, document assets, XML, ZIP files, and videos are separated into dedicated tabs.

## Privacy / file handling

The current portal is a static browser app. Uploaded files are processed locally in the user's browser. They are not committed to GitHub and are not stored by the app.

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
