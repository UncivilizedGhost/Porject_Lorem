"""Patient-level splitting.

Rows are encounters, not independent observations. Splitting rows at random
leaks the same patient into train and test and inflates performance. Every split
here is grouped by patient and stratified by outcome at the group level.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit, StratifiedGroupKFold

from medml.utils import LOGGER


@dataclass
class Split:
    train_idx: np.ndarray
    val_idx: np.ndarray
    test_idx: np.ndarray
    fold: pd.Series

    def sizes(self) -> dict[str, int]:
        return {
            "train": int(len(self.train_idx)),
            "val": int(len(self.val_idx)),
            "test": int(len(self.test_idx)),
        }


def patient_level_split(
    df: pd.DataFrame,
    *,
    patient_id: str,
    target: str,
    n_splits: int = 10,
    test_folds: int = 2,
    val_folds: int = 1,
    seed: int = 42,
) -> Split:
    """Stratified group split with test/val folds and the rest as train.

    With the defaults (10 folds, 2 test, 1 val) this yields roughly
    20% test / 10% validation / 70% train, stratified by outcome.
    """
    if test_folds + val_folds >= n_splits:
        raise ValueError("test_folds + val_folds must be < n_splits")

    groups = df[patient_id].to_numpy()
    y = df[target].to_numpy()
    n_groups = int(pd.Series(groups).nunique())

    fold_ids = np.full(len(df), -1, dtype=int)
    used_fallback = False
    if n_groups >= n_splits:
        splitter = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=seed)
        try:
            for fold, (_, holdout) in enumerate(splitter.split(df, y, groups)):
                fold_ids[holdout] = fold
        except ValueError as exc:
            LOGGER.warning("StratifiedGroupKFold failed (%s); using group shuffle", exc)
            used_fallback = True
    else:
        LOGGER.warning(
            "Only %d patients for %d folds; falling back to group shuffle", n_groups, n_splits
        )
        used_fallback = True

    if used_fallback or np.any(fold_ids < 0):
        test_frac = min(0.5, max(0.1, test_folds / n_splits))
        val_frac = min(0.5, max(0.1, val_folds / n_splits))
        first = GroupShuffleSplit(n_splits=1, test_size=test_frac, random_state=seed)
        rest_idx, test_idx = next(first.split(df, y, groups))
        second = GroupShuffleSplit(
            n_splits=1, test_size=val_frac / max(1e-9, 1 - test_frac), random_state=seed + 1
        )
        train_rel, val_rel = next(second.split(df.iloc[rest_idx], y[rest_idx], groups[rest_idx]))
        train_idx = rest_idx[train_rel]
        val_idx = rest_idx[val_rel]
        label = np.array(["train"] * len(df), dtype=object)
        label[val_idx] = "val"
        label[test_idx] = "test"
        return _finalise(df, train_idx, val_idx, test_idx, label, patient_id, target)

    test_idx = np.flatnonzero(np.isin(fold_ids, np.arange(test_folds)))
    val_idx = np.flatnonzero(
        np.isin(fold_ids, np.arange(test_folds, test_folds + val_folds))
    )
    train_idx = np.flatnonzero(fold_ids >= test_folds + val_folds)

    label = np.select(
        [fold_ids < test_folds, fold_ids < test_folds + val_folds],
        ["test", "val"],
        default="train",
    )
    return _finalise(df, train_idx, val_idx, test_idx, label, patient_id, target)


def _finalise(
    df: pd.DataFrame,
    train_idx: np.ndarray,
    val_idx: np.ndarray,
    test_idx: np.ndarray,
    label: np.ndarray,
    patient_id: str,
    target: str,
) -> Split:
    for name, idx in (("train", train_idx), ("val", val_idx), ("test", test_idx)):
        if len(idx) == 0:
            raise ValueError(f"Split {name!r} is empty; provide more data or fewer folds")

    parts = [
        set(df.iloc[train_idx][patient_id]),
        set(df.iloc[val_idx][patient_id]),
        set(df.iloc[test_idx][patient_id]),
    ]
    if parts[0] & parts[1] or parts[0] & parts[2] or parts[1] & parts[2]:
        raise AssertionError("Patient leakage detected between splits")

    fold = pd.Series(label, index=df.index, name="split")
    prevalence = {
        "train": float(df.iloc[train_idx][target].mean()),
        "val": float(df.iloc[val_idx][target].mean()),
        "test": float(df.iloc[test_idx][target].mean()),
    }
    LOGGER.info(
        "Split sizes rows=%s patients=%s prevalence=%s",
        {"train": len(train_idx), "val": len(val_idx), "test": len(test_idx)},
        {
            "train": len(parts[0]),
            "val": len(parts[1]),
            "test": len(parts[2]),
        },
        {k: round(v, 4) for k, v in prevalence.items()},
    )
    return Split(train_idx=train_idx, val_idx=val_idx, test_idx=test_idx, fold=fold)
