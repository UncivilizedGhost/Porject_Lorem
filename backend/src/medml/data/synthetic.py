"""Synthetic clinical cohort generator.

The generated data is entirely fake and exists so the template runs end to end
without touching real patient data. The schema mimics common EHR extracts:
one row per encounter, repeated encounters per patient, demographics, vitals,
labs, missingness, and a binary 30-day mortality label.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from medml.utils import ensure_dir


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))


def _maybe_missing(value: float, rng: np.random.Generator, probability: float) -> float:
    return np.nan if rng.random() < probability else value


def generate_synthetic_cohort(
    n_patients: int = 900,
    *,
    seed: int = 42,
    max_encounters: int = 3,
    missing_rate: float = 0.06,
) -> pd.DataFrame:
    """Generate a synthetic, patient-correlated clinical cohort.

    Parameters
    ----------
    n_patients:
        Number of unique patients. Encounters are generated per patient, so the
        final row count is larger and repeated patients share latent risk.
    seed:
        Seed for the local RNG (the global seed is not mutated).
    max_encounters:
        Upper bound on encounters per patient (1..max_encounters).
    missing_rate:
        Baseline probability that a lab/vital measurement is missing.
    """
    if n_patients < 10:
        raise ValueError("n_patients must be >= 10")
    rng = np.random.default_rng(seed)
    rows: list[dict[str, object]] = []

    for patient_idx in range(n_patients):
        patient_id = f"P{patient_idx:06d}"
        age = float(np.clip(rng.normal(63, 16), 18, 95))
        sex = "F" if rng.random() < 0.52 else "M"
        bmi = float(np.clip(rng.normal(28.5, 6.5), 16.0, 55.0))
        smoker = "Yes" if rng.random() < 0.22 else "No"
        diabetes = "Yes" if rng.random() < _sigmoid(-2.4 + 0.035 * (age - 60)) else "No"
        hypertension = (
            "Yes" if rng.random() < _sigmoid(-1.7 + 0.045 * (age - 60)) else "No"
        )
        ckd = "Yes" if rng.random() < _sigmoid(-3.4 + 0.055 * (age - 60)) else "No"

        # Latent, patient-level frailty: makes repeated encounters correlated.
        frailty = float(rng.normal(0.0, 0.55))
        n_encounters = int(rng.integers(1, max_encounters + 1))

        for encounter_idx in range(n_encounters):
            acuity = float(rng.normal(0.0, 1.0)) + 0.4 * frailty
            admission_type = str(
                rng.choice(["Emergency", "Urgent", "Elective"], p=[0.62, 0.18, 0.20])
            )

            heart_rate = np.clip(
                76 + 11 * acuity + 0.15 * (age - 55) + rng.normal(0, 8), 40, 190
            )
            sbp = np.clip(
                128 - 9 * acuity + 0.25 * (age - 55) + 3 * frailty + rng.normal(0, 12),
                60,
                230,
            )
            dbp = np.clip(
                76 - 4 * acuity + 0.10 * (age - 55) + rng.normal(0, 8), 35, 140
            )
            resp_rate = np.clip(17 + 3.5 * acuity + rng.normal(0, 2), 8, 45)
            temperature_c = np.clip(36.9 + 0.35 * acuity + rng.normal(0, 0.35), 34.0, 41.5)
            spo2 = np.clip(96.5 - 2.2 * acuity - 0.05 * (age - 60) + rng.normal(0, 1.6), 70, 100)

            wbc = np.clip(8.5 + 1.8 * acuity + rng.normal(0, 2.4), 1.0, 35.0)
            hemoglobin = np.clip(
                13.4
                - 0.6 * acuity
                - 0.02 * (age - 60)
                + (0.45 if sex == "M" else 0.0)
                + rng.normal(0, 1.4),
                5.0,
                19.0,
            )
            platelets = np.clip(240 - 18 * acuity + rng.normal(0, 45), 20, 600)
            creatinine = np.clip(
                0.95
                + 0.18 * acuity
                + (0.35 if ckd == "Yes" else 0.0)
                + 0.005 * (age - 60)
                + rng.normal(0, 0.2),
                0.3,
                8.0,
            )
            glucose = np.clip(
                115
                + 18 * acuity
                + (30 if diabetes == "Yes" else 0.0)
                + rng.normal(0, 25),
                40,
                500,
            )
            lactate = np.clip(1.3 + 0.55 * max(acuity, 0.0) + rng.normal(0, 0.4), 0.4, 15)
            sodium = np.clip(138 + rng.normal(0, 3), 120, 158)
            potassium = np.clip(4.1 + 0.12 * acuity + rng.normal(0, 0.35), 2.2, 7.0)
            bun = np.clip(
                15
                + 3 * acuity
                + (8 if ckd == "Yes" else 0.0)
                + 0.10 * (age - 60)
                + rng.normal(0, 5),
                3,
                120,
            )
            troponin = float(
                np.clip(0.02 * np.exp(0.55 * acuity) * rng.lognormal(0, 0.6), 0.0, 50.0)
            )

            logit = (
                -3.0
                + 0.045 * (age - 65)
                + 0.90 * acuity
                + 0.55 * (lactate - 1.3)
                + 0.70 * (creatinine - 1.0)
                + 0.045 * (bun - 15)
                + 0.55 * (smoker == "Yes")
                + 0.50 * (ckd == "Yes")
                + 0.25 * (diabetes == "Yes")
                - 0.12 * (spo2 - 96)
                - 0.012 * (sbp - 128)
                + 0.45 * frailty
            )
            target = int(rng.random() < _sigmoid(logit))

            # Missingness is slightly higher for sicker encounters (informative,
            # though not strongly so). IDs, target and demographics stay complete.
            miss = min(0.35, missing_rate + 0.03 * max(acuity, 0.0))
            rows.append(
                {
                    "patient_id": patient_id,
                    "encounter_id": f"{patient_id}-E{encounter_idx + 1}",
                    "age": round(age, 1),
                    "sex": sex,
                    "bmi": round(bmi, 1),
                    "smoker": smoker,
                    "diabetes": diabetes,
                    "hypertension": hypertension,
                    "ckd": ckd,
                    "admission_type": admission_type,
                    "heart_rate": _maybe_missing(round(float(heart_rate), 1), rng, miss * 0.5),
                    "sbp": _maybe_missing(round(float(sbp), 1), rng, miss * 0.4),
                    "dbp": _maybe_missing(round(float(dbp), 1), rng, miss * 0.5),
                    "resp_rate": _maybe_missing(
                        round(float(resp_rate), 1), rng, miss * 0.8
                    ),
                    "temperature_c": _maybe_missing(
                        round(float(temperature_c), 1), rng, miss * 0.9
                    ),
                    "spo2": _maybe_missing(round(float(spo2), 1), rng, miss * 0.6),
                    "wbc": _maybe_missing(round(float(wbc), 1), rng, miss),
                    "hemoglobin": _maybe_missing(round(float(hemoglobin), 1), rng, miss),
                    "platelets": _maybe_missing(round(float(platelets), 0), rng, miss),
                    "creatinine": _maybe_missing(round(float(creatinine), 2), rng, miss),
                    "glucose": _maybe_missing(round(float(glucose), 0), rng, miss),
                    "lactate": _maybe_missing(round(float(lactate), 2), rng, miss),
                    "sodium": _maybe_missing(round(float(sodium), 1), rng, miss),
                    "potassium": _maybe_missing(round(float(potassium), 2), rng, miss),
                    "bun": _maybe_missing(round(float(bun), 1), rng, miss),
                    "troponin": _maybe_missing(round(troponin, 3), rng, miss),
                    "mortality_30d": target,
                }
            )

    df = pd.DataFrame(rows)
    return df.sample(frac=1.0, random_state=seed).reset_index(drop=True)


def write_synthetic_cohort(
    output: str | Path,
    *,
    n_patients: int = 900,
    seed: int = 42,
    **kwargs: object,
) -> Path:
    df = generate_synthetic_cohort(n_patients=n_patients, seed=seed, **kwargs)
    output = Path(output)
    ensure_dir(output.parent)
    df.to_csv(output, index=False)
    return output
