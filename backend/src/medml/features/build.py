"""Feature engineering and the leakage-safe preprocessing pipeline."""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from medml.utils import LOGGER


def _yes_no(series: pd.Series) -> pd.Series:
    return (
        series.astype("string")
        .str.strip()
        .str.lower()
        .map({"yes": 1.0, "true": 1.0, "1": 1.0, "no": 0.0, "false": 0.0, "0": 0.0})
    )


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add common, deterministic clinical features when their inputs exist.

    Only row-wise transformations live here, so nothing is fitted on the data
    and there is no cross-split leakage. Missing inputs produce missing derived
    values, which the imputer handles.
    """
    out = df.copy()

    if {"heart_rate", "sbp"}.issubset(out.columns):
        sbp = pd.to_numeric(out["sbp"], errors="coerce").replace(0, np.nan)
        out["shock_index"] = pd.to_numeric(out["heart_rate"], errors="coerce") / sbp

    if {"sbp", "dbp"}.issubset(out.columns):
        out["map_mmhg"] = (
            pd.to_numeric(out["sbp"], errors="coerce")
            + 2 * pd.to_numeric(out["dbp"], errors="coerce")
        ) / 3.0

    if {"sbp", "dbp"}.issubset(out.columns):
        out["pulse_pressure"] = pd.to_numeric(
            out["sbp"], errors="coerce"
        ) - pd.to_numeric(out["dbp"], errors="coerce")

    if {"bun", "creatinine"}.issubset(out.columns):
        creat = pd.to_numeric(out["creatinine"], errors="coerce").replace(0, np.nan)
        out["bun_creatinine_ratio"] = pd.to_numeric(out["bun"], errors="coerce") / creat

    if {"creatinine", "age", "sex"}.issubset(out.columns):
        out["egfr_ckd_epi_2021"] = _egfr_ckd_epi_2021(out)

    comorbidity_flags = [
        c for c in ("diabetes", "hypertension", "ckd", "smoker") if c in out.columns
    ]
    if comorbidity_flags:
        flags = pd.concat([_yes_no(out[c]) for c in comorbidity_flags], axis=1)
        out["comorbidity_count"] = flags.sum(axis=1, min_count=1)

    lab_columns = [
        c
        for c in ("wbc", "hemoglobin", "platelets", "creatinine", "glucose", "lactate", "sodium")
        if c in out.columns
    ]
    if lab_columns:
        out["n_missing_labs"] = out[lab_columns].isna().sum(axis=1)

    if "age" in out.columns:
        age = pd.to_numeric(out["age"], errors="coerce")
        out["age_group"] = pd.cut(
            age,
            bins=[-np.inf, 40, 65, 80, np.inf],
            labels=["<40", "40-64", "65-79", "80+"],
            right=False,
        ).astype("string")

    new_columns = [c for c in out.columns if c not in df.columns]
    if new_columns:
        LOGGER.info("Derived %d feature(s): %s", len(new_columns), ", ".join(new_columns))
    return out


def _egfr_ckd_epi_2021(df: pd.DataFrame) -> pd.Series:
    """CKD-EPI 2021 creatinine equation (race-free). Units: mg/dL."""
    creat = pd.to_numeric(df["creatinine"], errors="coerce").replace(0, np.nan)
    age = pd.to_numeric(df["age"], errors="coerce")
    female = (
        df["sex"].astype("string").str.upper().str.startswith("F").fillna(False).astype(bool)
    )
    k = np.where(female, 0.7, 0.9)
    alpha = np.where(female, -0.241, -0.302)
    ratio = creat / k
    egfr = (
        142
        * np.minimum(ratio, 1.0) ** alpha
        * np.maximum(ratio, 1.0) ** -1.200
        * 0.9938**age
        * np.where(female, 1.012, 1.0)
    )
    return pd.Series(egfr, index=df.index, name="egfr_ckd_epi_2021")


def build_preprocessor(
    numeric_columns: list[str],
    categorical_columns: list[str],
    *,
    scale_numeric: bool = True,
) -> ColumnTransformer:
    """Build preprocessing that is always fitted *inside* the CV/split pipeline.

    Fitting an imputer or scaler on the full cohort is a classic leakage bug;
    keeping these steps inside a scikit-learn ``Pipeline`` prevents it.
    """
    numeric_steps: list[tuple[str, object]] = [
        ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
    ]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))

    numeric_pipe = Pipeline(numeric_steps)
    categorical_pipe = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "onehot",
                OneHotEncoder(handle_unknown="ignore", min_frequency=0.01, sparse_output=True),
            ),
        ]
    )

    transformers: list[tuple[str, object, list[str]]] = []
    if numeric_columns:
        transformers.append(("numeric", numeric_pipe, numeric_columns))
    if categorical_columns:
        transformers.append(("categorical", categorical_pipe, categorical_columns))

    return ColumnTransformer(transformers, remainder="drop", verbose_feature_names_out=False)
