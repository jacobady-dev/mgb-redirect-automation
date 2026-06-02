# MGB Redirect Automation

A repeatable, config-driven workflow for building Google Sheets-ready redirect maps for multiple legacy-site migrations into the Mass General Brigham site structure.

## What this does

For each site folder, the pipeline:

1. Reads the Screaming Frog crawl from `input/crawl.csv`.
2. Reads site-specific settings from `config/site.yml`.
3. Reads reusable redirect/red-flag rules from `config/rules.yml`.
4. Optionally skips URLs from a manual exclude file when enabled.
5. Produces clean CSV outputs for Google Sheets review.

## Core principle

Confident, IA-backed mapping goes to the redirect list.

Concerned, uncertain, unsupported, or risky mappings go to red flags.

## Generic folder pattern

```text
sites/
  site-01/
    input/
      crawl.csv
      ia-map.csv
    config/
      site.yml
      rules.yml
    output/
      redirect-list.csv
      red-flags.csv
      ignored-search-agency.csv
      qa-summary.csv
```

## Important handling rules

- Site-specific domains live in `site.yml`, not in Python.
- Migration logic lives in `rules.yml`, not in Python.
- Manual exclude files are optional.
- If `manual_exclude.enabled` is true, matching URLs are ignored completely.
- If no confident mapping exists, the URL goes to `red-flags.csv`.
- The final outputs are CSVs that can be imported into Google Sheets.

## Run locally

```bash
pip install -r requirements.txt
python scripts/generate_redirects.py --site site-01
```

## Run in GitHub

The workflow in `.github/workflows/build-redirects.yml` can be run manually from the Actions tab.

It will process configured site folders and upload the generated CSVs as a downloadable artifact.
