# Data contract

`medml` expects a single CSV table (one row per encounter) with a binary outcome.
This file documents the assumptions and how to adapt common medical data sources.

## Minimum schema

| Column | Required | Type | Example | Notes |
|---|---|---|---|---|
| `patient_id` | yes | string/int | `P000123` | Stable across encounters. Never used as a feature. |
| `encounter_id` | recommended | string/int | `P000123-E1` | Created per row if missing. Never a feature. |
| `<target>` | yes | 0/1 | `mortality_30d = 1` | Configurable name. Bool and yes/no strings accepted. |
| features | yes | numeric / bool / string | `age=74`, `sex=F`, `lactate=2.1` | Everything else is a feature unless excluded. |

The default target column is `mortality_30d`; set `data.target` in the config for
your outcome (e.g. `readmitted_30d`, `aki_stage_ge2`, `icu_mortality`).

Constraints enforced by `medml.data.loaders.load_cohort`:

- The target must exist, be binary, and contain at least one row of each class.
- Rows with a missing target are dropped with a warning.
- `patient_id` cannot be missing.
- Duplicate `encounter_id` values produce a warning (not an error).
- Numeric, boolean, string, and pandas categorical dtypes are supported. Datetime
  and other exotic dtypes must be cast or excluded explicitly.
- Column names are stripped of leading/trailing whitespace.

## Feature types

- **Numeric** — median-imputed (with missingness indicators) and standard-scaled
  for linear models. Tree models receive the same imputation but no scaling.
- **Categorical** — mode-imputed then one-hot encoded with `handle_unknown="ignore"`.
  Categories seen only at inference are encoded as all zeros rather than crashing.
- **Boolean** — treated as categorical (safe if `True`/`False`/missing).
- **Missingness** — expected and supported. The imputer is fitted on training data
  only. If missingness itself is informative, the numeric missing-indicators let
  the model use it.

By default feature roles are inferred from dtypes. To pin them explicitly:

```yaml
data:
  numeric_columns: [age, bmi, heart_rate, sbp, lactate, creatinine]
  categorical_columns: [sex, smoker, admission_type]
```

When either list is supplied, **every** non-ID, non-target column must be assigned
to one of the lists, or loading fails. This prevents a feature being silently
dropped by a typo.

## Patient vs encounter

Rows are encounters, but patients are the unit of independence. The template:

1. Splits by `patient_id` using `StratifiedGroupKFold`;
2. Reports row-level metrics (standard in the literature) while keeping all rows
   from a patient in exactly one split;
3. Uses patient-grouped CV on the training split.

If your dataset has one row per patient, keep a `patient_id` column equal to the
row identifier; the same machinery applies. If you have multiple labels per
patient (e.g. several admissions), consider aggregating to a patient-level outcome
or using a hierarchical model — the template's row-level metrics can otherwise
overstate precision.

## Example

```csv
patient_id,encounter_id,age,sex,bmi,smoker,heart_rate,sbp,spo2,lactate,creatinine,mortality_30d
P000001,P000001-E1,74.0,F,31.2,No,112.0,98.0,91.0,3.4,1.8,1
P000002,P000002-E1,58.0,M,27.1,Yes,84.0,132.0,96.0,1.1,0.9,0
P000002,P000002-E2,58.0,M,27.1,Yes,101.0,,95.0,1.7,,0
```

Missing values are empty CSV fields. Avoid sentinel values such as `-1`, `999`, or
`"Unknown"` for continuous measurements; convert them to empty fields during
cleaning or they will bias imputation and scaling.

## Adapting real sources

### MIMIC-IV / eICU

Build a de-identified encounter-level extract with one row per `hadm_id`
(MIMIC-IV) or `patientunitstayid` (eICU). Typical preparation:

- Demographics from `patients` / `admissions` (age, sex, admission type).
- First-24h vitals and labs aggregated to min/max/mean per admission.
- Comorbidities from diagnoses or a Charlson/Elixhauser derivation.
- Outcome: in-hospital mortality, 30-day mortality, or readmission — define the
  index time and prediction time explicitly.
- Use `subject_id` as `patient_id` and `hadm_id` as `encounter_id`.

Keep the extraction SQL/scripts in a separate, access-controlled repository if the
source is credentialed. Only the de-identified CSV needed for modelling should land
in `data/processed`.

### Imaging (DICOM / NIfTI)

The CSV contract does not fit pixels. Reuse the split, metric, and reporting layers
and add an imaging package:

- De-identify DICOM headers (PS3.15 profile) before storage; never commit files.
- Store one row per study/series with a path to a de-identified array and a
  `patient_id`/`encounter_id`.
- Split by patient, then load arrays in a MONAI/PyTorch `Dataset`.
- Report patient-level metrics (not slice-level) for the primary claim.

### Physiological signals (ECG, EEG, waveforms)

- Split by patient and recording, not by window.
- Aggregate window predictions to a patient-level decision before evaluating.
- Keep sampling-rate and device metadata; they are common shortcut features.

### Clinical text

- De-identify before any storage or modelling; free text is high-risk PHI.
- Split by patient, and avoid temporal leakage (notes written after the outcome).
- Evaluate calibration and subgroup performance on structured outcomes.

## Privacy and governance

- `data/**` is gitignored except `.gitkeep`. Keep it that way.
- Confirm your data-use agreement permits local storage and model training.
- Do not commit row-level predictions or model artefacts that could memorise PHI.
- Record the data version/extract date in `run.json` or a sidecar file. This
  template records environment metadata but cannot know your extract's provenance.
- For prospective use, add drift monitoring, access controls, audit logging, and a
  documented update policy before deployment.
