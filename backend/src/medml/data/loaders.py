"""Data loading, validation, and cohort level checks."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from medml.utils import LOGGER


class DataValidationError(ValueError):
    """Raised when a cohort does not satisfy the expected contract."""


def load_cohort(
    path: str | Path,
    *,
    target: str,
    patient_id: str,
    encounter_id: str | None = None,
) -> pd.DataFrame:
    """Read a CSV cohort and enforce the minimum data contract.

    Expected columns:
      - ``patient_id``: stable patient identifier (required, never a feature)
      - ``encounter_id``: encounter/admission identifier (created if absent)
      - ``target``: binary label encoded as 0/1 (bools are accepted)
      - any number of numeric / categorical feature columns
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Cohort not found: {path}")

    df = pd.read_csv(path)
    df.columns = [str(c).strip() for c in df.columns]

    if target not in df.columns:
        raise DataValidationError(f"Target column {target!r} is missing from {path}")
    if patient_id not in df.columns:
        raise DataValidationError(f"Patient id column {patient_id!r} is missing from {path}")

    # Normalise the target: accept bool / 0-1 ints / numeric strings.
    y = df[target]
    if y.isna().any():
        n_missing = int(y.isna().sum())
        LOGGER.warning("Dropping %d row(s) with a missing target", n_missing)
        df = df.loc[y.notna()].copy()
        y = df[target]

    if y.dtype == bool:
        y = y.astype(int)
    elif not pd.api.types.is_numeric_dtype(y):
        mapped = y.astype(str).str.strip().str.lower().map(
            {"1": 1, "0": 0, "true": 1, "false": 0, "yes": 1, "no": 0}
        )
        if mapped.isna().any():
            bad = sorted(y[mapped.isna()].astype(str).unique())[:5]
            raise DataValidationError(
                f"Target {target!r} must be binary 0/1; unparseable values: {bad}"
            )
        y = mapped.astype(int)
    else:
        y = y.astype(int)

    if not set(y.unique()).issubset({0, 1}):
        raise DataValidationError(
            f"Target {target!r} must be binary 0/1; found {sorted(y.unique())[:5]}"
        )
    if y.nunique() < 2:
        raise DataValidationError(
            f"Target {target!r} has a single class; cannot train a classifier"
        )
    df[target] = y

    if df[patient_id].isna().any():
        raise DataValidationError(f"Patient id {patient_id!r} contains missing values")

    if encounter_id:
        if encounter_id not in df.columns:
            LOGGER.warning("Encounter id %r not found; creating one per row", encounter_id)
            df[encounter_id] = [f"{pid}-{i}" for i, pid in enumerate(df[patient_id])]
        elif df[encounter_id].duplicated().any():
            n_dup = int(df[encounter_id].duplicated().sum())
            LOGGER.warning("%d duplicated encounter id(s); check the source data", n_dup)

    if df.empty:
        raise DataValidationError(f"Cohort at {path} is empty after validation")

    LOGGER.info("Loaded %d rows x %d columns from %s", *df.shape, path)
    return df


def infer_feature_columns(
    df: pd.DataFrame,
    *,
    target: str,
    patient_id: str,
    encounter_id: str | None,
    exclude: list[str] | None = None,
    numeric_columns: list[str] | None = None,
    categorical_columns: list[str] | None = None,
) -> tuple[list[str], list[str]]:
    """Return (numeric, categorical) feature columns, excluding IDs and target."""
    protected = {target, patient_id, *(exclude or [])}
    if encounter_id:
        protected.add(encounter_id)
    candidates = [c for c in df.columns if c not in protected]

    if numeric_columns is not None or categorical_columns is not None:
        numeric = list(numeric_columns or [])
        categorical = list(categorical_columns or [])
        overlap = set(numeric) & set(categorical)
        if overlap:
            raise ValueError(f"Columns declared both numeric and categorical: {sorted(overlap)}")
        unknown = (set(numeric) | set(categorical)) - set(df.columns)
        if unknown:
            raise ValueError(f"Configured feature columns not in data: {sorted(unknown)}")
        missing = set(candidates) - set(numeric) - set(categorical)
        if missing:
            raise ValueError(
                "Every non-ID column must be assigned to numeric or categorical "
                f"when either list is given; unassigned: {sorted(missing)}"
            )
        return numeric, categorical

    numeric, categorical = [], []
    for col in candidates:
        dtype = df[col].dtype
        if (
            pd.api.types.is_bool_dtype(dtype)
            or pd.api.types.is_object_dtype(dtype)
            or pd.api.types.is_string_dtype(dtype)
            or isinstance(dtype, pd.CategoricalDtype)
        ):
            categorical.append(col)
        elif pd.api.types.is_numeric_dtype(dtype):
            numeric.append(col)
        else:  # datetimes, intervals, ... are not supported implicitly
            raise DataValidationError(
                f"Unsupported dtype for feature {col!r}: {dtype}. "
                "Dtype-cast it or exclude it explicitly."
            )
    return numeric, categorical


def audit_leakage(
    df: pd.DataFrame,
    *,
    target: str,
    numeric_columns: list[str],
    categorical_columns: list[str],
) -> list[str]:
    """Cheap sanity checks for common clinical-ML leakage mistakes.

    These are warnings, not proofs. Always review features with a clinician.
    """
    warnings: list[str] = []

    for col in numeric_columns + categorical_columns:
        series = df[col]
        if series.nunique(dropna=False) <= 1:
            warnings.append(f"Constant column: {col!r}")
        if series.isna().mean() > 0.8:
            warnings.append(f"Column {col!r} is >80% missing")

    for col in categorical_columns:
        series = df[col].astype("string")
        if series.nunique(dropna=True) > 50:
            warnings.append(f"High-cardinality categorical column: {col!r}")

    for col in numeric_columns:
        if df[col].nunique(dropna=True) < 2:
            continue
        corr = df[[col, target]].corr(numeric_only=True).iloc[0, 1]
        if pd.notna(corr) and abs(corr) > 0.95:
            warnings.append(
                f"Feature {col!r} has |corr|={abs(corr):.3f} with the target; possible leakage"
            )

    suspicious_names = {"target", "label", "outcome", "mortality", "death", "readmission"}
    for col in numeric_columns + categorical_columns:
        lowered = col.lower()
        if lowered != target.lower() and any(s in lowered for s in suspicious_names):
            warnings.append(f"Feature name looks outcome-related: {col!r}")

    if df.duplicated(subset=[c for c in df.columns if c != target]).any():
        warnings.append("Duplicate feature rows found; possible duplicated encounters")

    for message in warnings:
        LOGGER.warning("Leakage audit: %s", message)
    if not warnings:
        LOGGER.info("Leakage audit: no obvious issues found")
    return warnings


def cohort_summary(df: pd.DataFrame, *, target: str, patient_id: str) -> dict[str, Any]:
    """Compact dataset description stored with the run."""
    return {
        "n_rows": int(len(df)),
        "n_patients": int(df[patient_id].nunique()),
        "n_features_raw": int(df.shape[1] - 1),
        "prevalence": float(df[target].mean()),
        "n_positive": int(df[target].sum()),
        "missing_fraction": float(df.drop(columns=[target]).isna().to_numpy().mean()),
        "rows_per_patient": float(len(df) / max(df[patient_id].nunique(), 1)),
        "target": target,
    }


def is_numeric(series: pd.Series) -> bool:
    return pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(
        series
    )


def finite_or_nan(values: np.ndarray) -> np.ndarray:
    out = np.asarray(values, dtype=float)
    out[~np.isfinite(out)] = np.nan
    return out
