# backend — medml

Medical / clinical machine-learning template. Synthetic data by default; real
patient data must stay de-identified and out of Git.

## Get started

### 1. Create a virtual environment and install dependencies

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

### 2. Generate data and train

```bash
make data          # generate a synthetic cohort at data/processed/cohort.csv
make train         # train + evaluate; writes runs/<timestamp>/
make check         # lint + tests
make predict       # batch-score data/processed/cohort.csv
```

Or without `make`:

```bash
PYTHONPATH=src python scripts/generate_synthetic.py --output data/processed/cohort.csv
PYTHONPATH=src python -m medml.train --config configs/default.yaml
```

### 3. ElevenLabs text-to-speech (hello world)

The ElevenLabs SDK is included as a dependency. Your API key belongs in
`.env` (gitignored) as `ELEVENLABS_API_KEY`; the SDK reads it from the
environment. Never put the key in code, and never print or commit it.

```bash
PYTHONPATH=src python -m medml.elevenlabs_tts
```

This lists available voices and writes `hello_world.mp3`. No audio is produced
until you run this, and no key is ever printed or committed.

## Layout

- `src/medml/` — the `medml` package (config, data, features, models, evaluation, train, predict)
- `tests/` — unit and end-to-end tests
- `configs/` — experiment configs; add a config per experiment
- `scripts/` — synthetic data generation
- `docs/` — data contract and model card template

## Verification

Run `make check` after code changes. Run `make train` after changing data
handling, features, models, or evaluation.

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
5. **Report calibration and subgroup performance**, not AUROC alone. State when
   subgroup sample sizes are too small to be reliable.
6. **Synthetic metrics are not clinical evidence.** Never present them as a
   medical finding.
