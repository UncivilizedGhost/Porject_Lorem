# Model card template

Fill this in for every model that leaves the notebook. Adapt the questions to your
clinical use case and local governance requirements. This is a documentation aid,
not a regulatory submission.

---

## 1. Model details

- **Name / version:**
- **Run directory (`runs/...`):**
- **Config file / commit:**
- **Owner / team:**
- **Date:**
- **Model type:** (e.g. logistic regression, gradient boosting)
- **Inputs:** (feature list and units; reference `run.json.features`)
- **Output:** probability of `<outcome>` at `<prediction time>`
- **Decision threshold:** value, method (e.g. Youden-J on validation), and rationale
- **Intended users:** (clinician, triage nurse, research analyst, automated system?)
- **Intended setting:** (ED, ICU, inpatient wards, retrospective research)
- **Out of scope:** (pediatrics, pregnancy, specific devices, external hospitals)

## 2. Intended use

- **Clinical question:**
- **Prediction time / data cutoff:** (what information is available at scoring time?)
- **Action triggered by the output:** (none, review, alert, treatment change)
- **Human oversight:** who sees the output, and what happens on disagreement?
- **Contraindications / populations excluded from development:**

## 3. Training data

- **Source and access approval:**
- **De-identification method:**
- **Data period and sites:**
- **Unit of analysis:** patient / encounter / stay
- **Cohort inclusion/exclusion criteria:**
- **Sample size:** patients, encounters, events, prevalence
- **Outcome definition and ascertainment:**
- **Missing data:** rates by feature; imputation strategy
- **Label quality / adjudication:**
- **Known selection or measurement biases:**

## 4. Evaluation

Report all of the following on the held-out test split, with confidence intervals
where possible:

| Metric | Value | 95% CI |
|---|---|---|
| AUROC | | |
| AUPRC | | |
| Brier score | | |
| Calibration slope / intercept | | |
| Sensitivity @ chosen threshold | | |
| Specificity @ chosen threshold | | |
| PPV / NPV @ chosen threshold | | |
| Decision-curve net benefit | | |

- **Split method:** patient-level, stratified; sizes and prevalence
- **Cross-validation:** folds, mean ± SD
- **Threshold selection:** validation only; confirm test was untouched
- **Subgroup performance:** sex, age band, race/ethnicity, site, insurance, etc.
  Report group sizes; flag unreliable small groups.
- **Sensitivity analyses:** alternative outcome definitions, missing-data handling,
  model families, temporal validation.
- **External / temporal validation:** sites, dates, performance, recalibration.

## 5. Limitations and risks

- **Discrimination vs calibration:** is the model well calibrated in the target
  range? Calibration-in-the-large and slope?
- **Distribution shift:** differences in devices, coding practices, case mix.
- **Shortcut/leakage risks:** features available only after the outcome, chart
  review, or treatment escalation.
- **Subgroup harms:** under-representation, differential error rates, feedback loops.
- **Automation bias and alert fatigue:**
- **Failure modes:** missing inputs, out-of-range values, pipeline version drift.
- **What the model does not establish:** causation, treatment effect, safety.

## 6. Ethical and regulatory considerations

- **IRB / ethics approval and consent status:**
- **Data-use agreement constraints:**
- **Privacy risks and mitigations:** membership inference, memorisation, small cells
- **Regulatory status:** research-only / clinical decision support / device pathway
- **Applicable guidance:** e.g. TRIPOD+AI, PROBAST, local AI governance policy
- **Monitoring plan:** performance, calibration, drift, subgroup metrics, retraining
  triggers, incident response
- **Versioning:** data version, code commit, config, model hash

## 7. Reproduction

```bash
# Exact command used
PYTHONPATH=src python -m medml.train --config configs/<name>.yaml

# Artefacts
runs/<run-id>/config.yaml
runs/<run-id>/run.json
runs/<run-id>/metrics.json
```

- **Environment:** (Python and package versions from `run.json.environment`)
- **Random seed(s):**
- **Known nondeterminism:** (GPU kernels, thread scheduling, library versions)
- **Data location / access process:**
