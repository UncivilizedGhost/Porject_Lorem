from __future__ import annotations

import pytest

from medml.config import Config


def test_default_config_is_valid():
    cfg = Config()
    cfg.validate()
    assert cfg.data.target == "mortality_30d"
    assert cfg.model.name == "gradient_boosting"


def test_yaml_roundtrip(tmp_path):
    path = tmp_path / "cfg.yaml"
    path.write_text(
        """
seed: 7
data:
  raw_path: data/raw/x.csv
  target: readmitted
  patient_id: subject_id
  encounter_id: null
model:
  name: logistic_regression
  params:
    C: 0.5
evaluation:
  subgroup_columns: [sex]
""",
        encoding="utf-8",
    )
    cfg = Config.load(path)
    assert cfg.seed == 7
    assert cfg.data.target == "readmitted"
    assert cfg.data.encounter_id is None
    assert cfg.model.name == "logistic_regression"
    assert cfg.model.params["C"] == 0.5
    assert cfg.evaluation.subgroup_columns == ["sex"]


def test_unknown_key_is_rejected(tmp_path):
    path = tmp_path / "bad.yaml"
    path.write_text("data:\n  target: y\n  typo_key: 1\n", encoding="utf-8")
    with pytest.raises(ValueError, match="Unknown config key"):
        Config.load(path)


def test_invalid_split_config_is_rejected():
    cfg = Config()
    cfg.data.test_folds = 9
    cfg.data.val_folds = 1
    with pytest.raises(ValueError, match="test_folds"):
        cfg.validate()


def test_invalid_threshold_is_rejected():
    cfg = Config()
    cfg.evaluation.threshold = 1.5
    with pytest.raises(ValueError, match="threshold"):
        cfg.validate()
