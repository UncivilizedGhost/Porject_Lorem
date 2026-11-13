"""Configuration objects and YAML loading.

The template uses plain dataclasses so the config is typed, validated, and
serialisable into run artifacts without any extra dependency.
"""

from __future__ import annotations

import dataclasses
import types
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Union, get_args, get_origin, get_type_hints

import yaml


@dataclass
class DataConfig:
    raw_path: str = "data/processed/cohort.csv"
    target: str = "mortality_30d"
    patient_id: str = "patient_id"
    encounter_id: str | None = "encounter_id"
    exclude_columns: list[str] = field(default_factory=list)
    numeric_columns: list[str] | None = None
    categorical_columns: list[str] | None = None
    n_splits: int = 10
    test_folds: int = 2
    val_folds: int = 1
    cv_folds: int = 5
    run_cv: bool = True
    synthetic_if_missing: bool = True
    synthetic_patients: int = 900


@dataclass
class FeatureConfig:
    derived: bool = True
    drop_columns: list[str] = field(default_factory=list)


@dataclass
class ModelConfig:
    name: str = "gradient_boosting"
    params: dict[str, Any] = field(default_factory=dict)


@dataclass
class EvaluationConfig:
    threshold: float = 0.5
    optimize_threshold: bool = True
    subgroup_columns: list[str] = field(default_factory=lambda: ["sex", "age_group"])
    min_subgroup_n: int = 20
    calibration_bins: int = 10
    n_bootstrap: int = 200
    decision_curve: bool = True


@dataclass
class OutputConfig:
    run_dir: str = "runs"
    save_plots: bool = True
    save_predictions: bool = True


@dataclass
class Config:
    seed: int = 42
    data: DataConfig = field(default_factory=DataConfig)
    features: FeatureConfig = field(default_factory=FeatureConfig)
    model: ModelConfig = field(default_factory=ModelConfig)
    evaluation: EvaluationConfig = field(default_factory=EvaluationConfig)
    output: OutputConfig = field(default_factory=OutputConfig)

    @classmethod
    def load(cls, path: str | Path) -> Config:
        text = Path(path).read_text(encoding="utf-8")
        raw = yaml.safe_load(text) or {}
        if not isinstance(raw, dict):
            raise ValueError(f"Config root must be a mapping, got {type(raw).__name__}")
        return _build(cls, raw, path=str(path))

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)

    def validate(self) -> None:
        if not 0 < self.evaluation.threshold < 1:
            raise ValueError("evaluation.threshold must be in (0, 1)")
        if self.data.n_splits < 3:
            raise ValueError("data.n_splits must be >= 3")
        if self.data.test_folds < 1 or self.data.val_folds < 1:
            raise ValueError("data.test_folds and data.val_folds must be >= 1")
        if self.data.test_folds + self.data.val_folds >= self.data.n_splits:
            raise ValueError("test_folds + val_folds must be < n_splits")


def _build(cls: type, values: dict[str, Any], *, path: str = "<config>") -> Any:
    """Recursively build a dataclass, rejecting unknown keys."""
    hints = get_type_hints(cls)
    field_names = {f.name for f in dataclasses.fields(cls)}
    unknown = set(values) - field_names
    if unknown:
        raise ValueError(f"Unknown config key(s) in {path}: {sorted(unknown)}")

    kwargs: dict[str, Any] = {}
    for name, value in values.items():
        target = hints[name]
        if dataclasses.is_dataclass(target) and isinstance(value, dict):
            kwargs[name] = _build(target, value, path=f"{path}.{name}")
        elif _is_optional_dataclass(target) and isinstance(value, dict):
            inner = _unwrap_optional(target)
            kwargs[name] = _build(inner, value, path=f"{path}.{name}")
        else:
            kwargs[name] = value
    return cls(**kwargs)


def _unwrap_optional(tp: Any) -> Any:
    args = [a for a in get_args(tp) if a is not type(None)]
    return args[0] if args else tp


def _is_optional_dataclass(tp: Any) -> bool:
    if get_origin(tp) in (Union, types.UnionType):
        inner = _unwrap_optional(tp)
        return dataclasses.is_dataclass(inner)
    return False
