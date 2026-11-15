# Lung Cancer Risk Category Requirements

Based on: `data/lung_cancer_findings.md` (Finnish Cancer Registry quality reports, Cancer 2022/2023/2024, Kaikki syövästä patient information)

## Purpose

Determine which risk category a patient falls into after completing the lung cancer pre-assessment questionnaire. The category drives what information and actions are shown next (e.g., offer to schedule an appointment for categories B and C).

## Risk Categories

### Category A — Not in a risk category

**Criteria:** All of the following must be true:
- Never smoked (current_smoker = "no" AND ex_smoker = "no")
- No lung diagnosis (lung_diagnosis = "no" — COPD, emphysema, bronchitis, TB)
- No prior malignancy (malignancy = "no")
- No frequent coughing (frequent_coughing = "no")
- No breathlessness (breathlessness = "no")

**Rationale:** Only ~1 in 10 lung cancer patients has never smoked. Smoking causes ~90% of lung cancers. COPD, TB, and prior malignancy are established risk factors. Persistent cough and breathlessness are common first symptoms.

**Action:** Show "Not in a risk category" result. Recommend contacting a nurse if anything changes.

---

### Category B — In a risk category and/or showing symptoms of possible lung cancer

**Criteria:** Any of the following is true:
- Current smoker (current_smoker = "yes"), regardless of age or pack-years
- Ex-smoker (ex_smoker = "yes")
- Lung diagnosis present (lung_diagnosis = "yes" — COPD, emphysema, bronchitis, TB, or COPD)
- Prior malignancy (malignancy = "yes")
- Frequent coughing (frequent_coughing = "yes")
- Breathlessness (breathlessness = "yes")
- OR server risk_group = "screening_pilot_eligible" (age 50–74, current smoker, high pack-years, pilot county)

**Rationale:**
- Smoking causes ~90% of lung cancers; smoker's risk is 15–30x higher than never-smokers
- Only 1 in 10 lung cancer patients has never smoked
- COPD, previous tuberculosis, and prior malignancy increase risk
- Common first symptoms: persistent cough, coughing up blood, shortness of breath, chest/shoulder pain, hoarseness, recurrent lung infections
- Two-thirds of lung cancer patients are 70+ at diagnosis; only ~9-10% under 60

**Action:** Show "You are in a risk category" result. Offer to schedule an appointment to discuss results with a nurse. Provide helpline (116 117) and symptom report link.

---

### Category C — Immediate danger

**Criteria:** Any of the following is true:
- Breathlessness = "yes" AND current_smoker = "yes" AND age >= 50
- Coughing up blood (captured in warning signs, not questionnaire)

**Rationale:** Breathlessness in a current or former smoker aged 50+ is concerning for possible advanced lung cancer. Only ~5% of lung cancers are diagnosed at a localized stage; most are detected after spread. 5-year survival is low (13–16% men, 21–26% women).

**Action:** Show "Seek immediate medical attention" result. Provide emergency numbers (112, 116 117).

---

## Classification Logic

```
if breathlessness == "yes" AND current_smoker == "yes" AND age >= 50:
    return Category C (immediate danger)
elif risk_group == "screening_pilot_eligible" OR lung_diagnosis == "yes" 
     OR malignancy == "yes" OR frequent_coughing == "yes" OR breathlessness == "yes":
    return Category B (risk category)
else:
    return Category A (not in risk category)
```

## Questionnaire Fields Used

| Field | Type | Values | Risk Relevance |
|-------|------|--------|----------------|
| age | number | integer | Age >= 50 increases risk; 70+ is highest risk group |
| sex | choice | male/female | Men have slightly higher incidence; women have somewhat better prognosis |
| current_smoker | choice | yes/no | Primary risk factor — causes ~90% of lung cancers |
| cigarettes_per_day | number | integer | Higher = higher risk |
| years_smoked | number | integer | Longer duration = higher risk |
| ex_smoker | choice | yes/no | Former smokers still have elevated risk |
| frequent_coughing | choice | yes/no | Common first symptom |
| breathlessness | choice | yes/no | Common first symptom; Category C trigger with smoking + age 50+ |
| inhaled_medication | choice | yes/no | May indicate existing lung condition |
| lung_diagnosis | choice | yes/no | COPD, emphysema, bronchitis, TB increase risk |
| malignancy | choice | yes/no | Prior cancer increases risk |

## County (NOT a risk factor)

County is collected for the screening pilot program but is NOT a clinical risk factor. It should NOT be used to determine risk category.

## Age Notes

- Only ~9-10% of lung cancer patients are under 60
- About two-thirds are 70+ at diagnosis
- Median age ~73
- Age 50+ with current smoker + breathlessness = Category C (immediate danger)
