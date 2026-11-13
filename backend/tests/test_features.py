from __future__ import annotations

import numpy as np
import pandas as pd

from medml.features.build import add_derived_features, build_preprocessor


def test_derived_features_are_added(synthetic_df):
    out = add_derived_features(synthetic_df)
    assert "shock_index" in out.columns
    assert "map_mmhg" in out.columns
    assert "bun_creatinine_ratio" in out.columns
    assert "egfr_ckd_epi_2021" in out.columns
    assert "comorbidity_count" in out.columns
    assert "age_group" in out.columns
    assert out["age_group"].isin(["<40", "40-64", "65-79", "80+"]).all()

    row = out.iloc[0]
    if pd.notna(row["heart_rate"]) and pd.notna(row["sbp"]):
        assert np.isclose(row["shock_index"], row["heart_rate"] / row["sbp"])
    if pd.notna(row["sbp"]) and pd.notna(row["dbp"]):
        assert np.isclose(row["map_mmhg"], (row["sbp"] + 2 * row["dbp"]) / 3)


def test_derived_features_are_deterministic(synthetic_df):
    a = add_derived_features(synthetic_df)
    b = add_derived_features(synthetic_df)
    pd.testing.assert_frame_equal(a, b)


def test_derived_features_handle_missing_inputs():
    frame = pd.DataFrame(
        {
            "age": [70.0],
            "sex": ["F"],
            "heart_rate": [np.nan],
            "sbp": [100.0],
            "dbp": [np.nan],
            "creatinine": [np.nan],
        }
    )
    out = add_derived_features(frame)
    assert np.isnan(out.loc[0, "shock_index"])
    assert np.isnan(out.loc[0, "map_mmhg"])
    assert np.isnan(out.loc[0, "egfr_ckd_epi_2021"])


def test_preprocessor_handles_missing_and_unseen_categories():
    train = pd.DataFrame(
        {
            "age": [50.0, np.nan, 70.0, 60.0],
            "sex": ["F", "M", "F", None],
        }
    )
    test = pd.DataFrame({"age": [55.0, np.nan], "sex": ["Other", "F"]})

    preprocessor = build_preprocessor(["age"], ["sex"])
    transformed_train = preprocessor.fit_transform(train)
    transformed_test = preprocessor.transform(test)
    assert transformed_train.shape[0] == 4
    assert transformed_test.shape[0] == 2
    assert transformed_test.shape[1] == transformed_train.shape[1]
    assert np.isfinite(transformed_test.toarray() if hasattr(transformed_test, "toarray") else transformed_test).all()


def test_preprocessing_statistics_come_from_fit_data_only():
    train = pd.DataFrame({"age": [40.0, 50.0, 60.0, np.nan], "sex": ["F", "M", "F", "M"]})
    # A very different inference batch must not change the fitted scaler.
    preprocessor = build_preprocessor(["age"], ["sex"])
    preprocessor.fit(train)
    numeric = preprocessor.named_transformers_["numeric"]
    imputer = numeric.named_steps["imputer"]
    scaler = numeric.named_steps["scaler"]
    assert imputer.statistics_[0] == 50.0
    assert np.isclose(scaler.mean_[0], (40 + 50 + 60 + 50) / 4)
