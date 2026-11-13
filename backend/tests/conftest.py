"""Shared fixtures. All data here is synthetic; no PHI is used in tests."""

from __future__ import annotations

import pandas as pd
import pytest

from medml.data.synthetic import generate_synthetic_cohort


@pytest.fixture(scope="session")
def synthetic_df() -> pd.DataFrame:
    return generate_synthetic_cohort(n_patients=180, seed=7)


@pytest.fixture()
def cohort_path(tmp_path, synthetic_df) -> str:
    path = tmp_path / "cohort.csv"
    synthetic_df.to_csv(path, index=False)
    return str(path)
