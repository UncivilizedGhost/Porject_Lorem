"""Small shared helpers: seeding, JSON serialisation, environment metadata."""

from __future__ import annotations

import json
import logging
import os
import platform
import random
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

LOGGER = logging.getLogger("medml")


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )


def set_seed(seed: int) -> None:
    """Seed every RNG we use. Also set PYTHONHASHSEED for child processes."""
    random.seed(seed)
    np.random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def run_id(prefix: str = "run") -> str:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{stamp}_{prefix}"


def ensure_dir(path: str | Path) -> Path:
    path = Path(path)
    path.mkdir(parents=True, exist_ok=True)
    return path


class _JsonEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, Path):
            return str(obj)
        return super().default(obj)


def write_json(payload: Any, path: str | Path) -> Path:
    path = Path(path)
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2, cls=_JsonEncoder, sort_keys=False) + "\n")
    return path


def environment_info() -> dict[str, Any]:
    """Versions captured next to every run for reproducibility."""
    import joblib
    import pandas as pd
    import sklearn

    info: dict[str, Any] = {
        "timestamp_utc": utc_timestamp(),
        "python": platform.python_version(),
        "platform": platform.platform(),
        "numpy": np.__version__,
        "pandas": pd.__version__,
        "scikit_learn": sklearn.__version__,
        "joblib": joblib.__version__,
    }
    try:
        import matplotlib

        info["matplotlib"] = matplotlib.__version__
    except Exception:  # pragma: no cover - optional dependency
        info["matplotlib"] = None
    info["git_commit"] = _git_commit()
    return info


def _git_commit() -> str | None:
    try:
        return (
            subprocess.check_output(
                ["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL, text=True
            ).strip()
            or None
        )
    except Exception:
        return None
