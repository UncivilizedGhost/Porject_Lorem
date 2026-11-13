"""Training entry point: ``python -m medml.train --config configs/default.yaml``."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import yaml
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline

from medml.config import Config
from medml.data.loaders import (
    audit_leakage,
    cohort_summary,
    infer_feature_columns,
    load_cohort,
)
from medml.data.splits import patient_level_split
from medml.data.synthetic import write_synthetic_cohort
from medml.evaluation.metrics import (
    bootstrap_intervals,
    calibration_summary,
    decision_curve,
    evaluate_binary,
    find_optimal_threshold,
    operating_point_at_sensitivity,
    subgroup_metrics,
)
from medml.evaluation.report import metrics_table, save_plots, save_predictions
from medml.features.build import add_derived_features, build_preprocessor
from medml.models.registry import make_estimator, supports_scaling
from medml.utils import (
    LOGGER,
    configure_logging,
    ensure_dir,
    environment_info,
    run_id,
    set_seed,
    write_json,
)


def _positive_proba(pipeline: Pipeline, features: pd.DataFrame) -> np.ndarray:
    return pipeline.predict_proba(features)[:, 1]


def _make_pipeline(cfg: Config, numeric: list[str], categorical: list[str]) -> Pipeline:
    preprocessor = build_preprocessor(
        numeric,
        categorical,
        scale_numeric=supports_scaling(cfg.model.name),
    )
    estimator = make_estimator(cfg.model.name, cfg.model.params, seed=cfg.seed)
    return Pipeline([("preprocess", preprocessor), ("model", estimator)])


def _cross_validate(
    X: pd.DataFrame,
    y: pd.Series,
    groups: pd.Series,
    cfg: Config,
    numeric: list[str],
    categorical: list[str],
) -> dict[str, Any]:
    n_groups = groups.nunique()
    n_splits = int(min(cfg.data.cv_folds, n_groups))
    if n_splits < 2:
        return {"skipped": "fewer than 2 patients"}

    splitter = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=cfg.seed)
    folds: list[dict[str, Any]] = []
    try:
        iterator = splitter.split(X, y, groups)
        for fold, (train_idx, valid_idx) in enumerate(iterator):
            pipeline = _make_pipeline(cfg, numeric, categorical)
            pipeline.fit(X.iloc[train_idx], y.iloc[train_idx])
            prob = _positive_proba(pipeline, X.iloc[valid_idx])
            fold_metrics = evaluate_binary(y.iloc[valid_idx], prob, threshold=0.5)
            folds.append(
                {
                    "fold": fold,
                    "n_train": int(len(train_idx)),
                    "n_valid": int(len(valid_idx)),
                    "auroc": fold_metrics["auroc"],
                    "auprc": fold_metrics["auprc"],
                    "brier": fold_metrics["brier"],
                }
            )
    except ValueError as exc:
        LOGGER.warning("Cross-validation skipped: %s", exc)
        return {"skipped": str(exc)}

    def _aggregate(key: str) -> tuple[float | None, float | None]:
        values = np.array([f[key] for f in folds if f[key] is not None], dtype=float)
        if values.size == 0:
            return None, None
        return float(values.mean()), float(values.std(ddof=1)) if values.size > 1 else 0.0

    auroc_mean, auroc_std = _aggregate("auroc")
    auprc_mean, auprc_std = _aggregate("auprc")
    brier_mean, brier_std = _aggregate("brier")
    return {
        "n_splits": n_splits,
        "auroc_mean": auroc_mean,
        "auroc_std": auroc_std,
        "auprc_mean": auprc_mean,
        "auprc_std": auprc_std,
        "brier_mean": brier_mean,
        "brier_std": brier_std,
        "folds": folds,
    }


def _new_run_dir(out_root: Path, name: str) -> Path:
    base = out_root / run_id(name)
    candidate = base
    suffix = 1
    while candidate.exists():
        candidate = out_root / f"{base.name}-{suffix}"
        suffix += 1
    return ensure_dir(candidate)


def run_training(
    cfg: Config,
    *,
    data_path: str | Path | None = None,
    output_dir: str | Path | None = None,
) -> Path:
    cfg.validate()
    set_seed(cfg.seed)

    source = Path(data_path or cfg.data.raw_path)
    if not source.exists():
        if not cfg.data.synthetic_if_missing:
            raise FileNotFoundError(
                f"{source} not found. Generate data first or enable "
                "data.synthetic_if_missing."
            )
        LOGGER.warning("Cohort %s not found; generating synthetic data", source)
        write_synthetic_cohort(
            source, n_patients=cfg.data.synthetic_patients, seed=cfg.seed
        )

    df = load_cohort(
        source,
        target=cfg.data.target,
        patient_id=cfg.data.patient_id,
        encounter_id=cfg.data.encounter_id,
    )
    summary = cohort_summary(df, target=cfg.data.target, patient_id=cfg.data.patient_id)

    if cfg.features.derived:
        df = add_derived_features(df)

    split = patient_level_split(
        df,
        patient_id=cfg.data.patient_id,
        target=cfg.data.target,
        n_splits=cfg.data.n_splits,
        test_folds=cfg.data.test_folds,
        val_folds=cfg.data.val_folds,
        seed=cfg.seed,
    )

    exclude = [*cfg.data.exclude_columns, *cfg.features.drop_columns]
    numeric, categorical = infer_feature_columns(
        df,
        target=cfg.data.target,
        patient_id=cfg.data.patient_id,
        encounter_id=cfg.data.encounter_id,
        exclude=exclude,
        numeric_columns=cfg.data.numeric_columns,
        categorical_columns=cfg.data.categorical_columns,
    )
    leakage_warnings = audit_leakage(
        df,
        target=cfg.data.target,
        numeric_columns=numeric,
        categorical_columns=categorical,
    )

    feature_columns = numeric + categorical
    X = df[feature_columns]
    y = df[cfg.data.target].astype(int)

    X_train, y_train = X.iloc[split.train_idx], y.iloc[split.train_idx]
    X_val, y_val = X.iloc[split.val_idx], y.iloc[split.val_idx]
    X_test, y_test = X.iloc[split.test_idx], y.iloc[split.test_idx]

    LOGGER.info(
        "Training %s on %d rows with %d numeric / %d categorical features",
        cfg.model.name,
        len(X_train),
        len(numeric),
        len(categorical),
    )
    pipeline = _make_pipeline(cfg, numeric, categorical)
    pipeline.fit(X_train, y_train)

    val_prob = _positive_proba(pipeline, X_val)
    test_prob = _positive_proba(pipeline, X_test)

    selection: dict[str, Any] = {
        "method": "youden_j_on_validation" if cfg.evaluation.optimize_threshold else "fixed",
        "threshold": float(cfg.evaluation.threshold),
    }
    threshold = float(cfg.evaluation.threshold)
    if cfg.evaluation.optimize_threshold:
        threshold, details = find_optimal_threshold(y_val, val_prob, fallback=threshold)
        selection.update(details)
        selection["threshold"] = threshold
    LOGGER.info("Decision threshold: %.4f (%s)", threshold, selection["method"])

    metrics: dict[str, Any] = {
        "threshold_selection": selection,
        "val": evaluate_binary(y_val, val_prob, threshold=threshold),
        "test": evaluate_binary(y_test, test_prob, threshold=threshold),
        "operating_points": {
            "val": [
                p
                for target in (0.80, 0.90, 0.95)
                if (p := operating_point_at_sensitivity(y_val, val_prob, target_sensitivity=target))
            ],
            "test": [
                p
                for target in (0.80, 0.90, 0.95)
                if (p := operating_point_at_sensitivity(y_test, test_prob, target_sensitivity=target))
            ],
        },
        "calibration": {
            "val": calibration_summary(y_val, val_prob, bins=cfg.evaluation.calibration_bins),
            "test": calibration_summary(y_test, test_prob, bins=cfg.evaluation.calibration_bins),
        },
        "subgroups": {
            "test": subgroup_metrics(
                df.iloc[split.test_idx],
                y_test,
                test_prob,
                columns=cfg.evaluation.subgroup_columns,
                threshold=threshold,
                min_n=cfg.evaluation.min_subgroup_n,
            )
        },
        "bootstrap": {
            "test": bootstrap_intervals(
                y_test, test_prob, n_bootstrap=cfg.evaluation.n_bootstrap, seed=cfg.seed
            )
        },
    }

    decision_rows = None
    if cfg.evaluation.decision_curve:
        decision_rows = decision_curve(y_test, test_prob)
        metrics["decision_curve"] = {"test": decision_rows}

    if cfg.data.run_cv:
        LOGGER.info("Running %d-fold patient-grouped cross-validation", cfg.data.cv_folds)
        metrics["cv_train"] = _cross_validate(
            X_train,
            y_train,
            df.iloc[split.train_idx][cfg.data.patient_id],
            cfg,
            numeric,
            categorical,
        )

    # ---------------------------------------------------------------- artefacts
    out_root = Path(output_dir or cfg.output.run_dir)
    run_dir = _new_run_dir(out_root, cfg.model.name)
    model_path = run_dir / "model.joblib"

    bundle = {
        "pipeline": pipeline,
        "threshold": threshold,
        "numeric_columns": numeric,
        "categorical_columns": categorical,
        "target": cfg.data.target,
        "patient_id": cfg.data.patient_id,
        "encounter_id": cfg.data.encounter_id,
        "derived_features": cfg.features.derived,
        "config": cfg.to_dict(),
        "trained_at": environment_info()["timestamp_utc"],
    }
    joblib.dump(bundle, model_path)

    run_info = {
        "environment": environment_info(),
        "config": cfg.to_dict(),
        "dataset": summary,
        "split": {
            "sizes": split.sizes(),
            "n_patients": {
                name: int(df.iloc[idx][cfg.data.patient_id].nunique())
                for name, idx in (
                    ("train", split.train_idx),
                    ("val", split.val_idx),
                    ("test", split.test_idx),
                )
            },
            "prevalence": {
                name: float(df.iloc[idx][cfg.data.target].mean())
                for name, idx in (
                    ("train", split.train_idx),
                    ("val", split.val_idx),
                    ("test", split.test_idx),
                )
            },
        },
        "features": {
            "numeric": numeric,
            "categorical": categorical,
            "n_model_inputs": len(feature_columns),
        },
        "leakage_warnings": leakage_warnings,
        "model": {"name": cfg.model.name, "params": cfg.model.params},
        "threshold": threshold,
        "metrics": metrics,
        "artifacts": {"model": str(model_path)},
    }

    write_json(run_info, run_dir / "run.json")
    write_json(metrics, run_dir / "metrics.json")
    (run_dir / "config.yaml").write_text(
        yaml.safe_dump(cfg.to_dict(), sort_keys=False), encoding="utf-8"
    )

    if cfg.output.save_predictions:
        test_frame = df.iloc[split.test_idx]
        pred_path = save_predictions(
            test_frame,
            y_prob=test_prob,
            threshold=threshold,
            target=cfg.data.target,
            path=run_dir / "test_predictions.csv",
        )
        run_info["artifacts"]["test_predictions"] = str(pred_path)

    if cfg.output.save_plots:
        plot_paths = save_plots(
            y_test,
            test_prob,
            threshold=threshold,
            out_dir=run_dir / "plots",
            calibration_bins=cfg.evaluation.calibration_bins,
            decision_rows=decision_rows,
        )
        run_info["artifacts"]["plots"] = plot_paths

    # Refresh run.json with artifact paths.
    write_json(run_info, run_dir / "run.json")

    latest = out_root / "latest"
    if latest.is_symlink():
        latest.unlink()
    if not latest.exists():
        try:
            os.symlink(run_dir.name, latest, target_is_directory=True)
        except OSError:  # pragma: no cover - platform dependent
            LOGGER.warning("Could not create latest-run symlink at %s", latest)

    if "cv_train" in metrics and metrics["cv_train"].get("auroc_mean") is not None:
        LOGGER.info(
            "CV AUROC %.3f +/- %.3f",
            metrics["cv_train"]["auroc_mean"],
            metrics["cv_train"]["auroc_std"],
        )
    LOGGER.info("Test AUROC: %s", metrics["test"]["auroc"])
    LOGGER.info("Artefacts written to %s", run_dir)
    print("\n" + metrics_table(metrics))
    return run_dir


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train and evaluate a clinical ML model.")
    parser.add_argument("--config", default="configs/default.yaml", help="YAML config path")
    parser.add_argument("--data", default=None, help="Override data.raw_path")
    parser.add_argument("--output", default=None, help="Override output.run_dir")
    parser.add_argument("--model", default=None, help="Override model.name")
    parser.add_argument("--seed", type=int, default=None, help="Override seed")
    parser.add_argument("--no-cv", action="store_true", help="Skip cross-validation")
    parser.add_argument("--no-plots", action="store_true", help="Skip plot generation")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    configure_logging()
    cfg = Config.load(args.config)
    if args.model:
        cfg.model.name = args.model
    if args.seed is not None:
        cfg.seed = args.seed
    if args.no_cv:
        cfg.data.run_cv = False
    if args.no_plots:
        cfg.output.save_plots = False
    run_training(cfg, data_path=args.data, output_dir=args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
