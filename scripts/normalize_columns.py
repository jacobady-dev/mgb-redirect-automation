"""Helpers for normalizing common crawl and IA spreadsheet columns."""

from __future__ import annotations

from typing import Iterable, Optional

import pandas as pd


def find_column(df: pd.DataFrame, candidates: Iterable[str]) -> Optional[str]:
    """Return the first matching column from a list of possible names.

    Matching is case-insensitive and ignores leading/trailing spaces.
    """
    normalized = {str(col).strip().lower(): col for col in df.columns}
    for candidate in candidates:
        key = str(candidate).strip().lower()
        if key in normalized:
            return normalized[key]
    return None


def require_column(df: pd.DataFrame, candidates: Iterable[str], label: str) -> str:
    """Return a matching column or raise a useful error."""
    column = find_column(df, candidates)
    if column is None:
        candidate_list = ", ".join(candidates)
        available = ", ".join(map(str, df.columns))
        raise ValueError(
            f"Could not find {label}. Tried: {candidate_list}. Available columns: {available}"
        )
    return column
