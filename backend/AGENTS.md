# Project instructions: medml

This repository is a reproducible template for medical / clinical machine learning
in Python. The data is synthetic by default; real patient data must stay
de-identified and out of Git.

The medml implementation lives in `backend/`; run the commands below from that
directory.

## Setup

### Primary: Pure manual (venv only)

Requires Python and pip only — no nix, no direnv:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

This installs the `medml` package plus all dependencies
(`numpy`, `pandas`, `scikit-learn`, `pyyaml`, `joblib`, `elevenlabs`,
`python-dotenv`) and the dev tools (`pytest`, `ruff`, `matplotlib`).

### Alternative: Nix + direnv

Requires [nix](https://nixos.org/) and [direnv](https://direnv.net/):

```bash
cd backend
direnv allow .envrc
```

`direnv` loads `use flake` (Python, git, ruff, pytest from nixpkgs) and adds
the venv's `site-packages` to `PYTHONPATH` for third-party deps not in nixpkgs
(elevenlabs, python-dotenv). Create the venv once:

```bash
python3 -m venv .venv
```

Then run any `make` target; direnv handles the environment automatically.

## Commands

Run from `backend/`:

```bash
make data                   # generate the synthetic cohort
make train                  # train + evaluate; writes runs/<timestamp>/
make test                   # pytest
make lint                   # ruff check
make check                  # lint + tests
make predict                # batch-score data/processed/cohort.csv
```

If not using `make`, prefix commands with `PYTHONPATH=src`:

```bash
PYTHONPATH=src python -m medml.train --config configs/default.yaml
```

## Invariants — do not break these

1. **Patient-level splits.** Rows are encounters; `patient_level_split` groups by
   `patient_id`. Never replace it with a random row split, and never let one
   patient appear in more than one split.
2. **Preprocessing lives inside the pipeline.** Imputation, scaling, and one-hot
   encoding must be fit on training data only. Do not fit them on the full cohort.
3. **The test split is frozen.** Choose thresholds and models on validation data.
   Do not use test metrics to select a model, feature, or threshold.
4. **No PHI in Git.** `data/**`, `runs/**`, `*.joblib`, DICOM/NIfTI files, and
   prediction CSVs are ignored. Never commit real patient data, notes, or
   identifiable artefacts.
5. **Local-only files are not committed.** Local development files (in
   `.gitignore`) are ignored and must not be committed.
6. **Report calibration and subgroup performance**, not AUROC alone. State when
   subgroup sample sizes are too small to be reliable.
7. **Synthetic metrics are not clinical evidence.** Never present them as a
   medical finding.

## Layout

- `src/medml/data/` — loading, validation, leakage audit, splitting, synthetic data
- `src/medml/features/build.py` — derived features + preprocessing pipeline
- `src/medml/models/registry.py` — model definitions
- `src/medml/evaluation/` — metrics and plots
- `src/medml/train.py` / `predict.py` — CLIs
- `configs/` — experiment configs; add a config per experiment
- `docs/data_contract.md` — schema and adaptation notes
- `docs/model_card_template.md` — fill this in for any model that leaves the repo
- `tests/` — unit and end-to-end tests

## Verification requirements

- Run `make check` after code changes.
- Run `make train` after changing data handling, features, models, or evaluation.
- Add or update tests for new behaviour.
- For any model claim, include AUROC, AUPRC, calibration, and an operating point.
- Keep changes consistent with the existing config-driven, typed, src-layout style.
