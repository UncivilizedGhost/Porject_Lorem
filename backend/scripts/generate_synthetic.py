#!/usr/bin/env python3
"""Generate a synthetic clinical cohort for local development."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow running this file directly without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from medml.data.synthetic import write_synthetic_cohort  # noqa: E402
from medml.utils import configure_logging  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="data/processed/cohort.csv")
    parser.add_argument("--patients", type=int, default=900)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--max-encounters", type=int, default=3)
    parser.add_argument("--missing-rate", type=float, default=0.06)
    args = parser.parse_args()

    configure_logging()
    path = write_synthetic_cohort(
        args.output,
        n_patients=args.patients,
        seed=args.seed,
        max_encounters=args.max_encounters,
        missing_rate=args.missing_rate,
    )
    print(f"Wrote synthetic cohort to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
