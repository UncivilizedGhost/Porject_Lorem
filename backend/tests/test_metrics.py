from __future__ import annotations

import numpy as np
import pandas as pd

from medml.evaluation.metrics import (
    bootstrap_intervals,
    calibration_summary,
    decision_curve,
    evaluate_binary,
    find_optimal_threshold,
    operating_point_at_sensitivity,
    subgroup_metrics,
)


def test_perfect_predictions():
    y = np.array([0, 0, 1, 1])
    p = np.array([0.1, 0.2, 0.8, 0.9])
    metrics = evaluate_binary(y, p, threshold=0.5)
    assert metrics["auroc"] == 1.0
    assert metrics["auprc"] == 1.0
    assert metrics["sensitivity"] == 1.0
    assert metrics["specificity"] == 1.0
    assert metrics["true_positive"] == 2
    assert metrics["false_positive"] == 0


def test_metrics_handle_single_class():
    metrics = evaluate_binary(np.zeros(5), np.linspace(0.1, 0.5, 5))
    assert metrics["auroc"] is None
    assert metrics["auprc"] is None
    assert metrics["sensitivity"] is None


def test_confusion_matrix_at_threshold():
    y = np.array([0, 0, 1, 1])
    p = np.array([0.2, 0.6, 0.4, 0.9])
    metrics = evaluate_binary(y, p, threshold=0.5)
    assert (metrics["true_positive"], metrics["false_positive"]) == (1, 1)
    assert (metrics["true_negative"], metrics["false_negative"]) == (1, 1)


def test_youden_threshold_separates_classes():
    y = np.array([0, 0, 0, 1, 1, 1])
    p = np.array([0.05, 0.1, 0.2, 0.8, 0.9, 0.95])
    threshold, details = find_optimal_threshold(y, p)
    assert 0.2 <= threshold <= 0.8
    assert details["youden_j"] == 1.0


def test_operating_point_reaches_target_sensitivity():
    rng = np.random.default_rng(0)
    y = rng.integers(0, 2, 300)
    p = np.clip(y * 0.4 + rng.normal(0.35, 0.2, 300), 0, 1)
    point = operating_point_at_sensitivity(y, p, target_sensitivity=0.9)
    assert point is not None
    assert point["sensitivity"] >= 0.9
    assert point["specificity"] >= 0.0


def test_calibration_summary_structure():
    rng = np.random.default_rng(1)
    p = rng.uniform(0, 1, 500)
    y = (rng.uniform(0, 1, 500) < p).astype(int)
    summary = calibration_summary(y, p, bins=5)
    assert 0 <= summary["ece"] <= 1
    assert 1 <= len(summary["bins"]) <= 5
    assert all(b["n"] > 0 for b in summary["bins"])


def test_bootstrap_intervals_bracket_point():
    rng = np.random.default_rng(2)
    y = rng.integers(0, 2, 200)
    p = np.clip(0.3 * y + rng.normal(0.35, 0.2, 200), 0, 1)
    out = bootstrap_intervals(y, p, n_bootstrap=50, seed=1)
    low, high = out["auroc_ci95"]
    assert 0 <= low <= high <= 1


def test_subgroup_metrics_flags_small_groups():
    frame = pd.DataFrame({"sex": ["F"] * 30 + ["M"] * 5})
    rng = np.random.default_rng(3)
    y = rng.integers(0, 2, 35)
    p = rng.uniform(0, 1, 35)
    out = subgroup_metrics(frame, y, p, columns=["sex"], threshold=0.5, min_n=20)
    assert set(out["sex"]) == {"F", "M"}
    assert out["sex"]["F"]["reliable"] is True
    assert out["sex"]["M"]["reliable"] is False


def test_decision_curve_treat_all_is_zero_at_prevalence():
    y = np.array([0, 1, 0, 1])
    p = np.array([0.1, 0.9, 0.2, 0.8])
    rows = decision_curve(y, p, thresholds=np.array([0.5]))
    # At threshold = prevalence, treating everyone has zero net benefit.
    assert abs(rows[0]["treat_all"]) < 1e-9
