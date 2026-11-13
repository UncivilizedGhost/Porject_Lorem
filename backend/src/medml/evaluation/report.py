"""Run artefacts and plots.

Plotting is optional: if matplotlib is unavailable the run still completes and
the metrics JSON remains the source of truth.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from medml.evaluation.metrics import calibration_summary
from medml.utils import LOGGER, ensure_dir


def _pyplot():
    try:
        import matplotlib

        matplotlib.use("Agg", force=True)
        import matplotlib.pyplot as plt

        return plt
    except Exception as exc:  # pragma: no cover - optional dependency
        LOGGER.warning("matplotlib unavailable, skipping plots: %s", exc)
        return None


def save_plots(
    y_true: np.ndarray | pd.Series,
    y_prob: np.ndarray | pd.Series,
    *,
    threshold: float,
    out_dir: str | Path,
    calibration_bins: int = 10,
    decision_rows: list[dict[str, float]] | None = None,
) -> list[str]:
    plt = _pyplot()
    if plt is None:
        return []

    from sklearn.metrics import (
        ConfusionMatrixDisplay,
        PrecisionRecallDisplay,
        RocCurveDisplay,
        confusion_matrix,
    )

    y = np.asarray(y_true).astype(int)
    p = np.asarray(y_prob, dtype=float)
    out = ensure_dir(out_dir)
    saved: list[str] = []

    if len(np.unique(y)) == 2:
        fig, axes = plt.subplots(1, 2, figsize=(10, 4))
        RocCurveDisplay.from_predictions(y, p, ax=axes[0], name="model")
        axes[0].plot([0, 1], [0, 1], "k--", linewidth=1, label="chance")
        axes[0].set_title("ROC curve")
        axes[0].legend(loc="lower right")
        PrecisionRecallDisplay.from_predictions(y, p, ax=axes[1], name="model")
        axes[1].set_title("Precision-recall curve")
        fig.tight_layout()
        path = out / "roc_pr.png"
        fig.savefig(path, dpi=160)
        plt.close(fig)
        saved.append(str(path))

    cm = confusion_matrix(y, (p >= threshold).astype(int), labels=[0, 1])
    fig, ax = plt.subplots(figsize=(4.5, 4))
    ConfusionMatrixDisplay(cm, display_labels=["No event", "Event"]).plot(
        ax=ax, colorbar=False, cmap="Blues"
    )
    ax.set_title(f"Confusion matrix @ {threshold:.2f}")
    fig.tight_layout()
    path = out / "confusion_matrix.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    saved.append(str(path))

    calibration = calibration_summary(y, p, bins=calibration_bins)
    table = pd.DataFrame(calibration["bins"])
    if not table.empty:
        fig, ax = plt.subplots(figsize=(4.8, 4.2))
        ax.plot([0, 1], [0, 1], "k--", linewidth=1, label="perfect")
        ax.plot(table["mean_predicted"], table["observed_rate"], "o-", label="model")
        ax.set_xlabel("Mean predicted risk")
        ax.set_ylabel("Observed event rate")
        ax.set_title(f"Calibration (ECE={calibration['ece']:.3f})")
        ax.legend(loc="upper left")
        fig.tight_layout()
        path = out / "calibration.png"
        fig.savefig(path, dpi=160)
        plt.close(fig)
        saved.append(str(path))

    if decision_rows:
        curve = pd.DataFrame(decision_rows)
        fig, ax = plt.subplots(figsize=(5, 4))
        ax.plot(curve["threshold"], curve["net_benefit"], label="model")
        ax.plot(curve["threshold"], curve["treat_all"], linestyle="--", label="treat all")
        ax.axhline(0, color="black", linewidth=1, linestyle=":", label="treat none")
        ax.set_xlabel("Threshold probability")
        ax.set_ylabel("Net benefit")
        ax.set_title("Decision curve")
        ax.legend()
        fig.tight_layout()
        path = out / "decision_curve.png"
        fig.savefig(path, dpi=160)
        plt.close(fig)
        saved.append(str(path))

    return saved


def save_predictions(
    frame: pd.DataFrame,
    *,
    y_prob: np.ndarray,
    threshold: float,
    target: str | None,
    path: str | Path,
) -> Path:
    path = Path(path)
    payload = frame.copy()
    payload["probability"] = np.asarray(y_prob, dtype=float)
    payload["prediction"] = (payload["probability"] >= threshold).astype(int)
    payload["threshold"] = float(threshold)
    if target and target not in payload.columns:
        payload[target] = np.nan
    ensure_dir(path.parent)
    payload.to_csv(path, index=False)
    return path


def metrics_table(metrics: dict[str, Any]) -> str:
    """Human-readable one-screen summary for the console."""
    keys = [
        ("n", "n"),
        ("prevalence", "Prevalence"),
        ("auroc", "AUROC"),
        ("auprc", "AUPRC"),
        ("brier", "Brier"),
        ("sensitivity", "Sensitivity"),
        ("specificity", "Specificity"),
        ("ppv", "PPV"),
        ("npv", "NPV"),
        ("f1", "F1"),
        ("alert_rate", "Alert rate"),
    ]
    lines = []
    for split in ("val", "test"):
        if split not in metrics:
            continue
        row = metrics[split]
        lines.append(f"[{split}]")
        for key, label in keys:
            value = row.get(key)
            if value is None:
                continue
            if key in {"n", "true_positive", "false_positive", "true_negative", "false_negative"}:
                lines.append(f"  {label:<12} {int(value)}")
            else:
                lines.append(f"  {label:<12} {value:.4f}")
    return "\n".join(lines)
