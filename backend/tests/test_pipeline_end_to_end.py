from __future__ import annotations

import json

import joblib
import pandas as pd

from medml.config import Config
from medml.predict import predict_frame
from medml.train import run_training


def _fast_config(data_path: str, output_dir: str) -> Config:
    cfg = Config()
    cfg.seed = 3
    cfg.data.raw_path = data_path
    cfg.data.synthetic_if_missing = False
    cfg.data.run_cv = False
    cfg.data.cv_folds = 3
    cfg.model.name = "logistic_regression"
    cfg.output.run_dir = output_dir
    cfg.output.save_plots = False
    cfg.evaluation.n_bootstrap = 20
    cfg.evaluation.decision_curve = False
    return cfg


def test_end_to_end_training_and_prediction(tmp_path, cohort_path):
    output_dir = tmp_path / "runs"
    cfg = _fast_config(cohort_path, str(output_dir))

    run_dir = run_training(cfg)
    assert (run_dir / "model.joblib").exists()
    assert (run_dir / "metrics.json").exists()
    assert (run_dir / "run.json").exists()
    assert (run_dir / "config.yaml").exists()
    assert (run_dir / "test_predictions.csv").exists()

    metrics = json.loads((run_dir / "metrics.json").read_text())
    assert 0 <= metrics["test"]["auroc"] <= 1
    assert metrics["threshold_selection"]["method"] == "youden_j_on_validation"
    assert metrics["test"]["n"] > 0
    assert "sex" in metrics["subgroups"]["test"]

    bundle = joblib.load(run_dir / "model.joblib")
    frame = pd.read_csv(cohort_path).drop(columns=["mortality_30d"])
    scored = predict_frame(frame.head(10), bundle)
    assert len(scored) == 10
    assert scored["probability"].between(0, 1).all()
    assert set(scored["prediction"].unique()).issubset({0, 1})


def test_training_is_reproducible(tmp_path, cohort_path):
    cfg_a = _fast_config(cohort_path, str(tmp_path / "a"))
    cfg_b = _fast_config(cohort_path, str(tmp_path / "b"))
    run_a = run_training(cfg_a)
    run_b = run_training(cfg_b)

    metrics_a = json.loads((run_a / "metrics.json").read_text())
    metrics_b = json.loads((run_b / "metrics.json").read_text())
    assert metrics_a["test"]["auroc"] == metrics_b["test"]["auroc"]
    assert metrics_a["threshold_selection"]["threshold"] == metrics_b["threshold_selection"][
        "threshold"
    ]


def test_prediction_rejects_missing_columns(tmp_path, cohort_path):
    cfg = _fast_config(cohort_path, str(tmp_path / "runs"))
    run_dir = run_training(cfg)
    bundle = joblib.load(run_dir / "model.joblib")

    frame = pd.read_csv(cohort_path).drop(columns=["age"])
    try:
        predict_frame(frame.head(5), bundle)
    except ValueError as exc:
        assert "age" in str(exc)
    else:  # pragma: no cover
        raise AssertionError("Expected a ValueError for a missing feature column")
