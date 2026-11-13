from __future__ import annotations

import pandas as pd
import pytest

from medml.data.loaders import (
    DataValidationError,
    audit_leakage,
    infer_feature_columns,
    load_cohort,
)


def _write(tmp_path, frame):
    path = tmp_path / "cohort.csv"
    frame.to_csv(path, index=False)
    return path


def test_load_cohort_basic(synthetic_df, tmp_path):
    path = _write(tmp_path, synthetic_df)
    df = load_cohort(
        path, target="mortality_30d", patient_id="patient_id", encounter_id="encounter_id"
    )
    assert df["mortality_30d"].isin([0, 1]).all()
    assert df["mortality_30d"].dtype.kind == "i"


def test_bool_target_and_missing_encounter(tmp_path):
    frame = pd.DataFrame(
        {
            "patient_id": ["a", "b", "b"],
            "label": [True, False, True],
            "x": [1.0, 2.0, 3.0],
        }
    )
    path = _write(tmp_path, frame)
    df = load_cohort(path, target="label", patient_id="patient_id", encounter_id="enc")
    assert df["label"].tolist() == [1, 0, 1]
    assert df["enc"].is_unique


def test_target_missing_raises(tmp_path):
    path = _write(tmp_path, pd.DataFrame({"patient_id": ["a"], "x": [1]}))
    with pytest.raises(DataValidationError, match="Target column"):
        load_cohort(path, target="y", patient_id="patient_id")


def test_non_binary_target_raises(tmp_path):
    frame = pd.DataFrame({"patient_id": ["a", "b"], "y": [0, 2]})
    path = _write(tmp_path, frame)
    with pytest.raises(DataValidationError, match="binary"):
        load_cohort(path, target="y", patient_id="patient_id")


def test_string_binary_target_is_parsed(tmp_path):
    frame = pd.DataFrame({"patient_id": ["a", "b", "c"], "y": ["yes", "no", "no"]})
    path = _write(tmp_path, frame)
    df = load_cohort(path, target="y", patient_id="patient_id")
    assert df["y"].tolist() == [1, 0, 0]


def test_infer_feature_columns(synthetic_df):
    numeric, categorical = infer_feature_columns(
        synthetic_df,
        target="mortality_30d",
        patient_id="patient_id",
        encounter_id="encounter_id",
    )
    assert "age" in numeric
    assert "sex" in categorical
    assert "patient_id" not in numeric + categorical
    assert "mortality_30d" not in numeric + categorical


def test_explicit_feature_columns_must_cover_everything(synthetic_df):
    with pytest.raises(ValueError, match="unassigned"):
        infer_feature_columns(
            synthetic_df,
            target="mortality_30d",
            patient_id="patient_id",
            encounter_id="encounter_id",
            numeric_columns=["age"],
            categorical_columns=["sex"],
        )


def test_leakage_audit_flags_perfect_feature(synthetic_df):
    frame = synthetic_df.copy()
    frame["leaky_outcome"] = frame["mortality_30d"]
    warnings = audit_leakage(
        frame,
        target="mortality_30d",
        numeric_columns=["age", "leaky_outcome"],
        categorical_columns=["sex"],
    )
    assert any("leaky_outcome" in w for w in warnings)
