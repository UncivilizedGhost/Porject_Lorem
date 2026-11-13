from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from medml.data.splits import patient_level_split


def test_split_is_patient_disjoint(synthetic_df):
    split = patient_level_split(
        synthetic_df,
        patient_id="patient_id",
        target="mortality_30d",
        n_splits=10,
        test_folds=2,
        val_folds=1,
        seed=3,
    )
    train_patients = set(synthetic_df.iloc[split.train_idx]["patient_id"])
    val_patients = set(synthetic_df.iloc[split.val_idx]["patient_id"])
    test_patients = set(synthetic_df.iloc[split.test_idx]["patient_id"])

    assert train_patients.isdisjoint(val_patients)
    assert train_patients.isdisjoint(test_patients)
    assert val_patients.isdisjoint(test_patients)

    all_idx = np.concatenate([split.train_idx, split.val_idx, split.test_idx])
    assert len(all_idx) == len(synthetic_df)
    assert len(set(all_idx.tolist())) == len(all_idx)
    assert split.fold.isin(["train", "val", "test"]).all()


def test_split_sizes_are_approximate(synthetic_df):
    split = patient_level_split(
        synthetic_df,
        patient_id="patient_id",
        target="mortality_30d",
        n_splits=10,
        test_folds=2,
        val_folds=1,
        seed=11,
    )
    n = len(synthetic_df)
    assert 0.1 < len(split.test_idx) / n < 0.35
    assert 0.03 < len(split.val_idx) / n < 0.25
    assert len(split.train_idx) / n > 0.5


def test_small_cohort_falls_back_to_group_shuffle():
    rng = np.random.default_rng(0)
    n_patients = 8
    frame = pd.DataFrame(
        {
            "patient_id": [f"P{i}" for i in range(n_patients) for _ in range(2)],
            "target": rng.integers(0, 2, n_patients * 2),
        }
    )
    split = patient_level_split(
        frame,
        patient_id="patient_id",
        target="target",
        n_splits=10,
        test_folds=2,
        val_folds=1,
        seed=1,
    )
    assert split.sizes()["train"] > 0
    assert split.sizes()["test"] > 0
    assert split.sizes()["val"] > 0


def test_invalid_fold_configuration(synthetic_df):
    with pytest.raises(ValueError, match="test_folds"):
        patient_level_split(
            synthetic_df,
            patient_id="patient_id",
            target="mortality_30d",
            n_splits=5,
            test_folds=4,
            val_folds=1,
        )
