"""Validation helpers for redirect outputs."""

from __future__ import annotations

import pandas as pd


def build_qa_summary(
    redirect_df: pd.DataFrame,
    red_flag_df: pd.DataFrame,
    ignored_df: pd.DataFrame,
    total_crawl_rows: int,
) -> pd.DataFrame:
    """Create a simple Google Sheets-ready QA summary."""
    duplicate_sources = 0
    if not redirect_df.empty and "Existing URL" in redirect_df.columns:
        duplicate_sources = int(redirect_df["Existing URL"].duplicated().sum())

    missing_destinations = 0
    if not redirect_df.empty and "Destination URL" in redirect_df.columns:
        missing_destinations = int(redirect_df["Destination URL"].fillna("").eq("").sum())

    rows = [
        {"Metric": "Total crawl rows", "Value": total_crawl_rows},
        {"Metric": "Redirect list rows", "Value": len(redirect_df)},
        {"Metric": "Red flag rows", "Value": len(red_flag_df)},
        {"Metric": "Ignored search-agency rows", "Value": len(ignored_df)},
        {"Metric": "Duplicate redirect sources", "Value": duplicate_sources},
        {"Metric": "Missing redirect destinations", "Value": missing_destinations},
    ]
    return pd.DataFrame(rows)
