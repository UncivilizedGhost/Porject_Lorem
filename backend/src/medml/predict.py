"""Batch inference entry point: ``python -m medml.predict``."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from medml.features.build import add_derived_features
from medml.utils import LOGGER, configure_logging, ensure_dir


def load_bundle(path: str | Path) -> dict[str, Any]:
    bundle = joblib.load(path)
    if not isinstance(bundle, dict) or "pipeline" not in bundle:
        raise ValueError(
            f"{path} is not a medml model bundle. Retrain with `python -m medml.train`."
        )
    return bundle


def prepare_features(df: pd.DataFrame, bundle: dict[str, Any]) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    if bundle.get("derived_features"):
        df = add_derived_features(df)

    columns = list(bundle["numeric_columns"]) + list(bundle["categorical_columns"])
    missing = sorted(set(columns) - set(df.columns))
    if missing:
        raise ValueError(
            "Input is missing feature column(s): "
            + ", ".join(missing)
            + ". The prediction pipeline expects the same schema used for training."
        )
    return df[columns]


def predict_frame(
    df: pd.DataFrame,
    bundle: dict[str, Any],
    *,
    threshold: float | None = None,
) -> pd.DataFrame:
    features = prepare_features(df, bundle)
    probability = bundle["pipeline"].predict_proba(features)[:, 1]
    cutoff = float(threshold if threshold is not None else bundle["threshold"])

    output = df.copy()
    output["probability"] = np.asarray(probability, dtype=float)
    output["prediction"] = (output["probability"] >= cutoff).astype(int)
    output["threshold"] = cutoff
    return output


def run_prediction(
    *,
    model_path: str | Path,
    input_path: str | Path,
    output_path: str | Path,
    threshold: float | None = None,
) -> Path:
    bundle = load_bundle(model_path)
    frame = pd.read_csv(input_path)
    LOGGER.info("Scoring %d row(s) from %s", len(frame), input_path)
    scored = predict_frame(frame, bundle, threshold=threshold)

    output_path = Path(output_path)
    ensure_dir(output_path.parent)
    scored.to_csv(output_path, index=False)
    LOGGER.info(
        "Wrote %d prediction(s) at threshold %.4f to %s",
        len(scored),
        float(scored["threshold"].iloc[0]) if len(scored) else float("nan"),
        output_path,
    )
    return output_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Score a CSV with a trained medml model.")
    parser.add_argument("--model", default="runs/latest/model.joblib")
    parser.add_argument("--input", required=True, help="CSV with the training schema")
    parser.add_argument("--output", default="data/processed/predictions.csv")
    parser.add_argument("--threshold", type=float, default=None, help="Override saved threshold")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    configure_logging()
    run_prediction(
        model_path=args.model,
        input_path=args.input,
        output_path=args.output,
        threshold=args.threshold,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
