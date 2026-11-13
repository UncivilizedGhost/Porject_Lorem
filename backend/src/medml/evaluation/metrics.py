"""Binary-classification metrics with a clinical-reporting flavour."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    roc_auc_score,
    roc_curve,
)


def _safe_auroc(y: np.ndarray, p: np.ndarray) -> float | None:
    return float(roc_auc_score(y, p)) if len(np.unique(y)) == 2 else None


def _safe_auprc(y: np.ndarray, p: np.ndarray) -> float | None:
    return float(average_precision_score(y, p)) if len(np.unique(y)) == 2 else None


def evaluate_binary(
    y_true: np.ndarray | pd.Series,
    y_prob: np.ndarray | pd.Series,
    *,
    threshold: float = 0.5,
) -> dict[str, Any]:
    """Discrimination, calibration, and a full confusion matrix at one threshold."""
    y = np.asarray(y_true).astype(int)
    p = np.asarray(y_prob, dtype=float)
    if len(y) != len(p):
        raise ValueError("y_true and y_prob must have the same length")
    if not 0 <= threshold <= 1:
        raise ValueError("threshold must be in [0, 1]")

    y_pred = (p >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, y_pred, labels=[0, 1]).ravel()
    n = len(y)
    prevalence = float(y.mean())

    # Sensitivity/specificity of the *positive* class, guarded for degenerate sets.
    sensitivity = tp / (tp + fn) if (tp + fn) else None
    specificity = tn / (tn + fp) if (tn + fp) else None
    ppv = tp / (tp + fp) if (tp + fp) else None
    npv = tn / (tn + fn) if (tn + fn) else None

    return {
        "n": int(n),
        "n_positive": int(y.sum()),
        "prevalence": prevalence,
        "threshold": float(threshold),
        "auroc": _safe_auroc(y, p),
        "auprc": _safe_auprc(y, p),
        "brier": float(brier_score_loss(y, p)),
        "accuracy": float(accuracy_score(y, y_pred)),
        "sensitivity": None if sensitivity is None else float(sensitivity),
        "specificity": None if specificity is None else float(specificity),
        "ppv": None if ppv is None else float(ppv),
        "npv": None if npv is None else float(npv),
        "f1": float(f1_score(y, y_pred, zero_division=0)),
        "alert_rate": float(y_pred.mean()),
        "true_positive": int(tp),
        "false_positive": int(fp),
        "true_negative": int(tn),
        "false_negative": int(fn),
    }


def find_optimal_threshold(
    y_true: np.ndarray | pd.Series,
    y_prob: np.ndarray | pd.Series,
    *,
    fallback: float = 0.5,
) -> tuple[float, dict[str, float]]:
    """Youden-J threshold (max sensitivity + specificity - 1) from validation data."""
    y = np.asarray(y_true).astype(int)
    p = np.asarray(y_prob, dtype=float)
    if len(np.unique(y)) < 2:
        return fallback, {"youden_j": 0.0}
    fpr, tpr, thresholds = roc_curve(y, p)
    j = tpr - fpr
    best = int(np.argmax(j))
    threshold = float(thresholds[best])
    if not np.isfinite(threshold) or not 0 < threshold < 1:
        return fallback, {"youden_j": float(j[best])}
    return threshold, {
        "youden_j": float(j[best]),
        "sensitivity": float(tpr[best]),
        "specificity": float(1 - fpr[best]),
    }


def operating_point_at_sensitivity(
    y_true: np.ndarray | pd.Series,
    y_prob: np.ndarray | pd.Series,
    *,
    target_sensitivity: float,
) -> dict[str, float] | None:
    """Highest-specificity threshold achieving at least the target sensitivity."""
    y = np.asarray(y_true).astype(int)
    p = np.asarray(y_prob, dtype=float)
    if len(np.unique(y)) < 2:
        return None
    fpr, tpr, thresholds = roc_curve(y, p)
    eligible = np.flatnonzero(tpr >= target_sensitivity)
    if eligible.size == 0:
        return None
    best = int(eligible[np.argmax(thresholds[eligible])])
    return {
        "target_sensitivity": float(target_sensitivity),
        "threshold": float(thresholds[best]),
        "sensitivity": float(tpr[best]),
        "specificity": float(1 - fpr[best]),
    }


def calibration_summary(
    y_true: np.ndarray | pd.Series,
    y_prob: np.ndarray | pd.Series,
    *,
    bins: int = 10,
) -> dict[str, Any]:
    """Equal-width calibration table, ECE, and calibration slope/intercept."""
    y = np.asarray(y_true).astype(int)
    p = np.clip(np.asarray(y_prob, dtype=float), 1e-6, 1 - 1e-6)
    edges = np.linspace(0.0, 1.0, bins + 1)
    bin_ids = np.clip(np.digitize(p, edges[1:-1]), 0, bins - 1)

    table: list[dict[str, Any]] = []
    ece = 0.0
    for b in range(bins):
        mask = bin_ids == b
        count = int(mask.sum())
        if count == 0:
            continue
        mean_pred = float(p[mask].mean())
        observed = float(y[mask].mean())
        ece += count / len(y) * abs(mean_pred - observed)
        table.append(
            {
                "bin_lower": float(edges[b]),
                "bin_upper": float(edges[b + 1]),
                "n": count,
                "mean_predicted": mean_pred,
                "observed_rate": observed,
            }
        )

    slope = intercept = None
    if len(np.unique(y)) == 2:
        logit = np.log(p / (1 - p)).reshape(-1, 1)
        model = LogisticRegression(C=1e6, solver="lbfgs", max_iter=1000)
        model.fit(logit, y)
        slope = float(model.coef_[0, 0])
        intercept = float(model.intercept_[0])

    return {
        "ece": float(ece),
        "calibration_slope": slope,
        "calibration_intercept": intercept,
        "bins": table,
    }


def bootstrap_intervals(
    y_true: np.ndarray | pd.Series,
    y_prob: np.ndarray | pd.Series,
    *,
    n_bootstrap: int = 200,
    seed: int = 42,
    alpha: float = 0.05,
) -> dict[str, Any]:
    """Percentile bootstrap CIs for AUROC and AUPRC (patient-level resampling is
    preferable for repeated encounters; this is a pragmatic row-level estimate)."""
    if n_bootstrap <= 0:
        return {}
    y = np.asarray(y_true).astype(int)
    p = np.asarray(y_prob, dtype=float)
    rng = np.random.default_rng(seed)
    aucs: list[float] = []
    auprcs: list[float] = []
    n = len(y)
    for _ in range(n_bootstrap):
        idx = rng.integers(0, n, n)
        if len(np.unique(y[idx])) < 2:
            continue
        aucs.append(float(roc_auc_score(y[idx], p[idx])))
        auprcs.append(float(average_precision_score(y[idx], p[idx])))
    if not aucs:
        return {}
    lo, hi = np.quantile(aucs, [alpha / 2, 1 - alpha / 2])
    plo, phi = np.quantile(auprcs, [alpha / 2, 1 - alpha / 2])
    return {
        "n_bootstrap": len(aucs),
        "auroc_ci95": [float(lo), float(hi)],
        "auprc_ci95": [float(plo), float(phi)],
    }


def subgroup_metrics(
    frame: pd.DataFrame,
    y_true: np.ndarray | pd.Series,
    y_prob: np.ndarray | pd.Series,
    *,
    columns: list[str],
    threshold: float,
    min_n: int = 20,
) -> dict[str, dict[str, Any]]:
    """Per-group performance, e.g. by sex or age band.

    Small groups still appear but are tagged ``reliable=False``.
    """
    y = np.asarray(y_true).astype(int)
    p = np.asarray(y_prob, dtype=float)
    frame = frame.reset_index(drop=True)
    output: dict[str, dict[str, Any]] = {}

    for column in columns:
        if column not in frame.columns:
            continue
        groups: dict[str, Any] = {}
        values = frame[column].astype("string").fillna("missing")
        for value in sorted(values.unique()):
            mask = (values == value).to_numpy()
            if mask.sum() == 0:
                continue
            metrics = evaluate_binary(y[mask], p[mask], threshold=threshold)
            metrics["reliable"] = bool(mask.sum() >= min_n and y[mask].sum() >= 5)
            groups[str(value)] = metrics
        if groups:
            output[column] = groups
    return output


def decision_curve(
    y_true: np.ndarray | pd.Series,
    y_prob: np.ndarray | pd.Series,
    *,
    thresholds: np.ndarray | None = None,
) -> list[dict[str, float]]:
    """Net benefit for decision-curve analysis (Vickers & Elkin)."""
    y = np.asarray(y_true).astype(int)
    p = np.asarray(y_prob, dtype=float)
    n = len(y)
    prevalence = float(y.mean())
    if thresholds is None:
        thresholds = np.arange(0.05, 0.55, 0.05)
    rows: list[dict[str, float]] = []
    for pt in thresholds:
        pred = p >= pt
        tp = int(np.sum(pred & (y == 1)))
        fp = int(np.sum(pred & (y == 0)))
        net_benefit = tp / n - fp / n * (pt / (1 - pt))
        treat_all = prevalence - (1 - prevalence) * (pt / (1 - pt))
        rows.append(
            {
                "threshold": float(pt),
                "net_benefit": float(net_benefit),
                "treat_all": float(treat_all),
                "treat_none": 0.0,
            }
        )
    return rows
