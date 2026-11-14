# On-demand symptom reporting in cancer care: how it is done in practice

Research for the "Symptom Report" flow of the Cancer Pathway Companion (suspected lung cancer, Western Uusimaa / HUS).
Researched 2026-11-14. Each claim links to its source. Where a fact could not be checked against the primary document it is marked **unverified**.

---

## 1. Summary

- **Real-world triage is rule-based and human-owned.** The UK reference tool (UKONS 24-Hour Triage Toolkit, 3rd edition, December 2024) is a red/amber/green (RAG) risk-assessment tool built on NCI-CTCAE grades. Trained staff use it on the phone. It is "NOT a diagnostic tool". The rules are simple: the worst grade decides, and **two or more ambers count as red**. ([UKONS toolkit v3](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672))
- **Per-symptom guided questions are standard practice.** Every UKONS symptom row comes with a fixed set of questions to ask ("Is it new? How long? Is it getting worse?…") and grade criteria written in plain functional terms. That is the pattern for our guided questions.
- **Patient-facing products split the work in two.** Fixed rules give the patient advice straight away, including "contact us / go to the emergency department now" for severe answers. A nurse then reviews the report from a work queue, with no promise of real-time monitoring. Kaiku, Noona, eRAPID and the Basch trials all work this way. ([Kaiku App Store](https://apps.apple.com/app/id1477041425), [Peltola 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8138702/), [Warrington 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11552561/), [Basch 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4872028/))
- **The disclaimers say the same thing in every product.** "Meant for non-urgent communication", "not monitored after business hours", "in urgent matters call the clinic / ER / emergency number". HUS promises a Noona reply "within 1 to 2 days", and says that in urgent cases the patient should phone. ([HUS cancer treatment page](https://www.hus.fi/en/node/2666.md))
- **No reviewed system triages free text automatically.** PRO-CTCAE has an "Other symptoms" free-text item that is rated for severity only. In NCI trials, free text was mapped to terminology afterwards, and only about a third of it mapped to a PRO-CTCAE term. The Basch STAR trial did not allow free text at all. UKONS asks staff to record the caller's words verbatim, *in addition to* the structured grading. ([PRO-CTCAE items](https://healthcaredelivery.cancer.gov/pro-ctcae/instruments/pro-ctcae/pro-ctcae_english.pdf), [Chung 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6402312))
- **The evidence base is strong for scheduled ePRO with nurse alerts.** It includes better quality of life, fewer ED visits and, in single-centre and lung-specific trials, longer survival. Evidence for *purely on-demand* reporting is thinner. Most of the evidence comes from weekly scheduled surveys with alert thresholds such as "worsened by 2 or more points, or grade 3 or higher". ([Basch 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4872028/), [Denis 2017](https://doi.org/10.1093/jnci/djx029), [PRO-TECT 2025](https://doi.org/10.1038/s41591-025-03507-y))
- **The Finnish urgent-care messages are fixed and easy to copy.** If the patient's condition suddenly gets worse, call Päivystysapu **116117** or go to the nearest emergency department. Call **112** in an emergency. During treatment that lowers white blood cells, a fever of **38 °C or more** (ear temperature) means going to the emergency department. ([HUS cancer guide 2026](https://www.hus.fi/sites/default/files/2026-04/syopaan-sairastuneen-ja-syopakuntoutujan-opas-tukihoidoista-ja-palveluista.pdf))
- **What this means for our design.** Use a structured safety screen first. Then use UKONS-style per-symptom questions mapped to green/yellow/red with "worst wins" and "2 yellows = red". Give fixed advice immediately, and only ever *escalate* (never reassure) on the basis of free text. Show the honest response-time disclaimer that HUS already uses. Rank the Worklist by grade, and show the patient's own words verbatim next to the structured answers.

---

## 2. Findings by question

### Q1. UKONS 24-hour triage tool

**Version and owner.** The current version is the *Oncology/Haemato-oncology 24-Hour Triage Toolkit*, 3rd Edition, December 2024 (Triage Assessment Tool, Version 3). It was first launched in 2010 and updated in 2016. ([toolkit v3, cover and p.3](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672); [poster v3](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_tool_poster_a3_v3_final.pdf?dm=1755690853)). The links on ukons.org's old `/site/assets/files/1224/…` paths now return 404. The working copies above are linked from [ukons.org/resources/publicly-available-resources](https://ukons.org/resources/publicly-available-resources).

**Intended users.** The toolkit is "for use by all staff who are trained in the use of the toolkit and required to manage a 24-hour triage line". Each user must complete e-learning modules and a competency assessment ([toolkit §1.0, §5.0](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672)). It is a **clinician telephone tool, not a patient self-report tool**. The poster says: "Those using the tool should be trained to do so by a competent, recognised trainer." The toolkit says it is "a risk assessment tool… It is NOT a diagnostic tool" and is "a cautious tool" ([§3.4.2](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672)). The poster also says "This Tool Kit cannot be reproduced. All rights reserved." That limits copying its wording verbatim into a product.

**Structure.** The process has three steps: contact and data collection, assessment, and action. It uses an SBAR log sheet. The assessment tool is "based on the NCI-CTCAE common toxicity criteria V5" ([§3.0](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672)). The log sheet starts with "Reason for call? (in patients own words)". It records treatment type (SACT, immune checkpoint inhibitor (ICI), radiotherapy, etc.), days since last treatment, and temperature ("hypothermia is a significant indicator of sepsis"). It recommends that "all triage practitioners record verbatim what the patient/carer says" ([§4.0, log sheet](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672)).

**Symptoms covered (19 rows plus "Other")** ([poster v3](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_tool_poster_a3_v3_final.pdf?dm=1755690853)):
1. Shortness of breath, 2. Chest pain, 3. Bleeding/bruising, 4. Consciousness/cognitive disturbance, 5. Fever on SACT, 6. Infection, 7. Fever NOT on SACT, 8. Fatigue/performance status, 9. Ocular/eye, 10. Mucositis/oral, 11. Anorexia, 12. Nausea, 13. Vomiting, 14. Diarrhoea, 15. Constipation, 16. Urinary, 17. Skin, 18. Pain, 19. Neurosensory/motor.
Anything else is logged as "other", graded against the latest NCI-CTCAE, and discussed with a senior colleague.

**Per-symptom questions mapped to grades.** Each row lists the questions to ask, then grade 0–4 criteria. Lung-relevant examples, quoted from the poster:
- *Shortness of breath.* The questions are: "Is there any chest pain or tightness? (if yes → chest pain). Is this a new symptom? How long for? Is it getting worse? Do you have a cough? … Is it productive? If yes, what colour is your phlegm?" The poster lists conditions to consider: SVCO, anaemia, PE, pneumonitis, infection. Grade 1 is "new onset SOB with moderate exertion". Grade 2 is "with minimal exertion". Grade 3 is "at rest". Grade 4 is "life threatening… Advise 999".
- *Chest pain.* Any chest pain means "Advise URGENT ED for medical assessment – 999". The instruction is to stop oral/IV SACT until reviewed.
- *Bleeding.* The questions are: "Are you actively bleeding? Site? … Is the bleeding spraying, pouring or enough to make a puddle? Are you taking anticoagulants?" Bleeding that is not self-limiting means "Advise 999".
- *Fever on SACT* (within the last 6–8 weeks, or immunocompromised). "IF TEMPERATURE 37.5 °C OR ABOVE OR BELOW 36.0 °C OR GENERALLY UNWELL – URGENT ASSESSMENT… FOLLOW NEUTROPENIA PATHWAY." The tool warns that analgesics or steroids can mask fever.
- *Fever NOT on SACT.* The bands are: normal 36.0–37.4; <36.0 or 37.5–38.0; >38.0–40.0; >40.0.
- *Pain.* The questions are: "Is it a new problem? Where is it? How long? Have you taken any pain killers? … Back pain consider metastatic spinal cord compression (MSCC)."
- *Neurosensory/motor.* The poster asks about "perineal or buttock numbness (saddle paresthesia)… urinary or faecal incontinence" and says to consider MSCC or cerebral metastases.
- *Fatigue, diarrhoea.* "If patient is or has been on Immune Checkpoint Inhibitors, escalate to RED."

**RAG rules and actions** (verbatim from [poster](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_tool_poster_a3_v3_final.pdf?dm=1755690853) and [toolkit §3.3–3.4.2](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672)):

| Result | Action |
|---|---|
| All Green | "self care advice". The caller is told to call back if concerns continue or their condition gets worse. |
| 1 Amber | "review within 24 hours". Give self-care advice and a warning statement, and ask them to "call back immediately if they notice any change or deterioration". |
| 2 or more Amber | "escalate to red" |
| Any Red | "arrange for a face to face assessment as soon as possible". "Red – any toxicity graded red takes priority and action should follow immediately." |

- **Worst grade wins.** The rule is "The toxicity scoring the highest grading takes priority" ([toolkit algorithm, p.7](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672)).
- **Two ambers make red.** The stated reason is that many callers "will have a number of low grade symptoms". In the pilot, 67% (70/101) of callers asked to attend "requir[ed] either intervention or admission" ([§3.4.2](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672)).
- **Clinician override is allowed but must be documented.** "Escalation may provide inconvenience for the patient but no additional risk." The level of concern of the patient or carer is also a factor.
- **Follow-up.** "Within 24 hours, the completed triage log sheets should be reviewed, patient's outcomes followed up".

**Grade-to-colour mapping per cell: unverified.** On the poster, the RAG colour of each grade cell is shown only as cell shading, which text extraction cannot read. I could not render the PDF (no image output available). The text does show some fixed points. Grade 4 cells and chest pain say "999 / ED" (red). Fever on SACT ≥37.5 °C or <36.0 °C means urgent assessment (red). Fatigue and diarrhoea grade 2 say "escalate to red" for ICI patients, which implies grade 2 is amber by default. The common reading (grade 1 green or amber depending on the symptom, grade 2 amber, grade 3–4 red) is **unverified**. Open the poster PDF and read the shading before copying any mapping.

**Patient-facing or digital adaptations.**
- *OncsCare* (UK, single tertiary acute oncology service, July–Sept 2025): patients did daily check-ins mapped to "UKONS-informed green/amber/red tiers". Related alerts were grouped into "episodes" to reduce alert fragmentation. 85% of patients reported more reassurance, and clinicians reported better situational awareness without more workload. It is a service evaluation, not a validation ([Mohamed Azhar et al., JMIR Cancer 2026;12:e92586](https://cancer.jmir.org/2026/1/e92586)). I could only see search-result excerpts. Sample size and safety counts are **unverified**.
- UKONS also publishes a primary-care version ([primary care instruction manual](https://www.ukons.org/site/assets/files/1134/primary_care_instruction_manual.pdf); the link may now 404). The children's cancer version (CCLG, 3rd ed. 2026) says it aligns with UKONS V3 ([CCLG triage toolkit](https://cclg.org.uk/information-professionals/service-development-and-delivery/triage-tool-kit)). Ireland's NCIS uses a UKONS-derived telephone form with the same "2 or more Amber = Red" logic ([HSE NCIS form, 403 on fetch: **unverified** beyond the search snippet](https://www.hse.ie/eng/services/list/5/cancer/profinfo/medonc/projects/telephone-triage-assessment-form.pdf)).
- I found no official UKONS patient self-report version.

### Q2. PRO-CTCAE

**Free-text item. It exists.** The English Item Library v1.0 (version date 5/11/2023) ends with an "OTHER SYMPTOMS" section ([NCI PRO-CTCAE English items PDF](https://healthcaredelivery.cancer.gov/pro-ctcae/instruments/pro-ctcae/pro-ctcae_english.pdf)):
> "Do you have any other symptoms that you wish to report?" Yes / No
> "Please list any other symptoms:"
> 1.–5. "In the last 7 days, what was the SEVERITY of this symptom at its WORST?" None / Mild / Moderate / Severe / Very Severe

So the patient can write up to five symptoms in free text, and each one is rated for **severity only**, on the same 5-point scale. NCI Thesaurus code C180168, "Any Other Symptoms Reported" ([CISMeF mirror of NCIt](https://www.cismef.org/page/detail/en/NCI_CO_C180168)).

**How free text was used in practice.** In NCI-sponsored trials (1,760 patients, 3 trials), patients could add symptoms from a dropdown of PRO-CTCAE or MedDRA terms, or type free text. Free text and MedDRA entries recorded only presence, with no scoring. 913 free-text entries were collected. Afterwards, 32% could be mapped to a PRO-CTCAE term and 68% to a MedDRA term. The authors suggest *real-time* mapping as future work ([Chung et al., JAMIA 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6402312), [DOI 10.1093/jamia/ocy169](https://doi.org/10.1093/jamia/ocy169)). Some trial protocols leave the free-text item out because "the utility of this information and the analysis method have not been established" (seen in a ClinicalTrials.gov protocol via search snippet; **unverified** which protocol).

**Library size and recall.** The library has 124 items covering 78 symptomatic toxicities. The attributes are frequency, severity, interference and presence/absence ([NCI measurement page](https://healthcaredelivery.cancer.gov/pro-ctcae/measurement.html)). The standard recall period is "the last 7 days", and NCI says "we cannot recommend use of longer or shorter… recall periods" ([NCI FAQ](https://healthcaredelivery.cancer.gov/pro-ctcae/faqs.html)). Example items: shortness of breath has severity ("None…Very severe") plus interference ("Not at all…Very much") ([items PDF](https://healthcaredelivery.cancer.gov/pro-ctcae/instruments/pro-ctcae/pro-ctcae_english.pdf)).

**Scoring.**
- NCI FAQ: "PRO-CTCAE responses are scored from 0 to 4 (or 0/1 for absent/present)". "At present there are no guidelines yet established for how to combine attributes into a single score". "PRO-CTCAE scores for each attribute… should be presented descriptively." In other words, **items are not summed** into a total ([NCI FAQ](https://healthcaredelivery.cancer.gov/pro-ctcae/faqs.html)).
- Composite grading: Basch et al. published an algorithm that maps each combination of frequency, severity and interference answers to a single composite grade 0–3. Score combinations were rated by investigators, low-agreement ones went to a committee vote, and the result was validated in two phase III trials ([Basch et al., Clin Trials 2021, DOI 10.1177/1740774520975120](https://doi.org/10.1177/1740774520975120); abstract via search).
- **The sources disagree.** The NCI FAQ text still says no combining guideline exists, even though the composite algorithm was published in 2021. The FAQ may be out of date. Treat the composite grade as a published research method, not an NCI-mandated rule. Abstract figures also differ: 179 combinations in the article vs 187 in a 2020 ASCO abstract (per search summary, **unverified**).

**Alerting.** I found no NCI guidance on alert thresholds on the NCI pages reviewed (FAQ, measurement page). Alert thresholds come from the trials (see Q4), not from NCI.

### Q3. Noona and Kaiku Health

**Noona** (Noona Healthcare, Finnish origin, now Varian / Siemens Healthineers)
- *Origins and use at HUS.* Noona was developed with the HUS Comprehensive Cancer Center. HUS describes it as the mobile app for contacting the Cancer Center "during your treatment and monitoring periods". Patients "can ask your treatment team about symptoms related to your treatment". Symptom surveys "can sometimes replace appointments with a nurse or a physician". "If you report a serious symptom, Noona can send you care instructions automatically." **"We will respond within 1 to 2 days." "If you need to speak to our nursing staff urgently, please call us."** Messages are visible only to the nurses involved in the patient's care ([HUS – Cancer treatment](https://www.hus.fi/en/node/2666.md)).
- *HUS pilot* ([Peltola et al., JMIR Form Res 2021;5(5):e16156](https://pmc.ncbi.nlm.nih.gov/articles/PMC8138702/)). Nurses sent structured questionnaires, and "all patients could report using Noona how they are doing at any time". There were question wizards for pain, fatigue, nausea, vomiting and bowel symptoms, plus an open question form for other topics. Professionals have "a work queue to monitor new patients who have asked assistance or responded to a scheduled questionnaire". "In the first version of Noona no alarm or reminder function was included." Patients who got no response "within 24 hours" were told to call. Emergency patients were told to contact their local ER. Patients asked for photo sending. 86% of patients and 65% of professionals rated it reliable.
- *Current features (vendor).* Patients send "a symptom report or symptom questionnaire" and can upload photos. "Symptoms are color-coded, with red meaning the most urgent". "Each clinic can set up the automatic responses to reflect its symptom-specific emergency information" ([Siemens Healthineers blog, Nov 2023](https://cancercare.siemens-healthineers.com/newsroom/blog/noona-helps-unify-cancer-care-and-symptom-management-for-patients)).
- *Grading.* At Stanford, Noona symptom questionnaires graded physical symptoms by CTCAE v4.0 and pain on a 0–10 scale. Grade 3–4, or pain >7, "generated an internal alert", and the care team was notified within one business day. Patients were told not to use the tool for symptoms that need immediate attention and to call the clinic or 911. The platform prompted them to do so for severe symptoms. Secure messaging stayed in the EHR portal. A lesson learned: chronic symptoms re-entered on each questionnaire caused repeated alerts ([Generalova et al., J Patient Rep Outcomes 2021;5:91](https://pmc.ncbi.nlm.nih.gov/articles/PMC8443731/)).
- *Patient guides elsewhere.* Nova Scotia: "The Diary function is for personal use only and is NOT monitored… If you have urgent symptoms… call 911 or report to the nearest Emergency Department" ([NS Health handout, Apr 2024](https://www.nshealth.ca/sites/default/files/documents/NSHCCP4048-2024.04.25.pdf)). Eastern Health (Newfoundland): diary entries "are not a direct communication with the cancer centre", and a pop-up gives instructions if an emergent symptom is entered ([Eastern Health](https://cancercare.easternhealth.ca/?p=8431)). Manitoba describes separate "Ask About Symptoms" (pick from a treatment-specific list, or "Other symptom" with a description) and "Ask About a Non-Clinical Issue" buttons, and says Noona "is never to be used to report any urgent or emergency type issues" ([CancerCare Manitoba guide](https://www.cancercare.mb.ca/export/sites/default/.galleries/files/How-to-Contact-Your-Care-Team-Using-Noona.pdf)). The Manitoba site returned an error when fetched, so this is **unverified** beyond the search snippet.
- *Tays.* A Varian page (per search snippet) says Tays Cancer Centre uses Noona across all phases of care. The page now 404s, and I found nothing on pirha.fi. **Unverified.**

**Kaiku Health** (Finnish, Elekta since 2021; also sold as "Elekta ONE Patient Companion")
- *Patient side.* "Report your symptoms and get feedback on how they've developed since the last report". "Your care team will receive notifications of your reported symptoms". Messages are for "non-urgent questions", and photos can be attached. **"Kaiku Health is meant for non-urgent communication." "In urgent matters always be in direct contact with your care team, the ER or call the emergency line."** ([Kaiku Health, App Store](https://apps.apple.com/app/id1477041425))
- *Staff side* ([Kaiku staff user instructions, c.2020](https://static.helpjuice.com/helpjuice_production/uploads/upload/image/7497/direct/1602505370540-kaiku_user_instructions_core_features_en.pdf)). A follow-up programme decides which symptom questionnaires are sent. Notifications go to "nurses added to the patient's care team", and every patient must have at least one care-team member. Staff can assign the notification, view a symptom comparison with a grade of 0–3 per symptom, message the patient, and mark the task done. **Messages are a separate stream** on the staff home page, and messages may carry attachments and photos.
- *Mild vs severe.* According to the professional IFU (search snippet), mild-only reports do not raise a separate home-page notification ([Elekta Kaiku professional IFU E060553 Rev.07, 2025](https://www.elekta.com/products/oncology-informatics/elekta-one/instructions-for-use/assets/Kaiku%20Health%20Instructions%20for%20Use%20%28professional%29%20E060553%20Rev.07%20%282025%2009%2024%29.pdf); the PDF 404s on fetch, so this is **unverified**). The patient IFU (snippet): "If, after finishing a questionnaire, Kaiku Health tells you to contact your care team and/or emergency department, please do so without delay" ([patient IFU E060552 Rev.08](https://www.elekta.com/products/oncology-informatics/elekta-one/instructions-for-use/assets/Kaiku%20Health%20Instructions%20for%20Use%20%28patient%29%20E060552%20Rev.%2008%20%282025%2009%2024%29.pdf); **unverified**, could not open).
- *Finnish practice.* In Siun sote (North Karelia), 60 patients did a weekly questionnaire in 2022–23. Mild symptoms produced automatic self-care advice (for example, OTC medicine for mild nausea) and showed as **yellow** tags for nurses. Severe symptoms showed as **red** tags, and patients were told to contact the hospital if nurses had not reached them yet. A chat window existed, but some patients used it for unrelated matters, which cost nurse time ([Sitra, 13 Sep 2023](https://sitra.fi/en/articles/patients-using-a-self-monitoring-app-are-more-open-and-can-better-remember-to-report-how-they-are-doing)). Oulu University Hospital ran immunotherapy ePRO studies on Kaiku, where alerts are sent to the care unit for severe or changing symptoms ([Iivanainen et al., JMIR Form Res 2020](https://formative.jmir.org/2020/10/e17898)). Methods detail is **unverified**, as the page did not render.
- *Regulatory.* The Finnish Digi-HTA (FinCCHTA, 23.6.2020, now expired) lists Kaiku as **CE-marked Class IIa under the MDD**, with a machine-learning component that sends alerts based on predictions. Its usability rating had shortcomings (not fully WCAG 2.1 A/AA) ([FinCCHTA Digi-HTA](https://fincchta.fi/en/digi-hta/digi-hta-arvioinnit/expired-assessments/kaiku-health-palvelu-syopapotilaiden-oireseurantaan/)). This matters for us. Software that grades symptoms and gives advice is a medical device. Our fixed-rule design avoids AI, but it is still likely to be a device if used for real.
- *Kaiku at HUS:* none found. *Kaiku at Tays, KYS or TYKS:* none found (**unverified** either way).

**HUS today.** HUS cancer patient instructions (approved May 2024) say non-urgent treatment questions go "via Maisa or by phone weekdays 7:30–16:00, 09 471 74 900", with a "two working-day service promise" for non-urgent contacts ([HUS "Yleisohjeita syövän lääkehoitoa saavalle"](https://www.hus.fi/sites/default/files/2025-05/Yleisohjeita%20sy%C3%B6v%C3%A4n%20l%C3%A4%C3%A4kehoitoa%20saavalle.pdf)). So HUS currently runs both Maisa (Apotti portal) and Noona channels. Which one is used for which patient group is **unverified**.

### Q4. Evidence for ePRO symptom reporting with nurse alerts

| Study | Design | Who reviews / alert rule | Response time | Free text | Key outcome |
|---|---|---|---|---|---|
| **Basch 2016, JCO (STAR)** ([PMC4872028](https://pmc.ncbi.nlm.nih.gov/articles/PMC4872028/)) | RCT, 766 patients, MSKCC, 12 symptoms (CTCAE-based), weekly between visits | Nurses get an e-mail alert when a symptom "worsened by ≥ 2 points or reached an absolute grade ≥ 3" | No target set. Patients told "e-mails are not generally monitored after business hours" and to call the office | **Not allowed** ("did not allow skipped questions or free-text responses") | Better HRQL, fewer ER visits (34% vs 41%). Nurses responded mainly by phone (77% of alerts) |
| **Basch 2017, JAMA** ([DOI](https://doi.org/10.1001/jama.2017.7156)) | Same trial, survival | as above | | | Median OS 31.2 vs 26.0 months (from the article abstract; the Europe PMC record lacked the abstract, so the numbers are **unverified** here) |
| **PRO-TECT, JAMA 2022** ([PMC9168923](https://pmc.ncbi.nlm.nih.gov/articles/PMC9168923/)) | Cluster RCT, 52 US community practices, 1,191 patients, weekly PRO-CTCAE-based survey | Alerts when a score "reached a prespecified level of magnitude or worsening". Sent to administrative staff, then routed to the patient's nurse | Response "left to the discretion of the clinicians". Reminder at 24 h, staff backup call at 72 h for missed surveys | Not described | Better physical function, symptom control and HRQOL at 3 months. 59% of 6,979 alerts led to immediate nursing action, mostly a phone call |
| **PRO-TECT final, Nat Med 2025** ([DOI 10.1038/s41591-025-03507-y](https://doi.org/10.1038/s41591-025-03507-y)) | same | same | | | **No OS difference** (HR 0.99). Fewer ED visits (HR 0.84). 91.5% adherence (figures from search summary; **unverified** against full text) |
| **Denis 2017, JNCI** ([DOI 10.1093/jnci/djx029](https://doi.org/10.1093/jnci/djx029)) | Phase III RCT, 121 lung cancer patients after initial treatment, weekly self-scored symptoms (web, "Moovcare") | "An alert email was automatically sent to the oncologist when self-scored symptoms matched predefined criteria" | Not in abstract | Not in abstract | Median OS 19.0 vs 12.0 months. More relapses detected with good performance status |
| **Denis 2019, JAMA** ([DOI 10.1001/jama.2018.18085](https://doi.org/10.1001/jama.2018.18085)) | 2-year follow-up | | | | Survival benefit maintained (research letter; detail not checked) |
| **eRAPID, JCO 2021** ([DOI 10.1200/JCO.20.02015](https://doi.org/10.1200/JCO.20.02015)) and **process evaluation BMJ Open 2024** ([PMC11552561](https://pmc.ncbi.nlm.nih.gov/articles/PMC11552561/)) | RCT, 508 patients, Leeds, weekly online reports for 18 weeks | Automated "severity-tailored patient advice". For severe symptoms, patients "were advised to immediately contact the 24-hour acute oncology service". "Email notifications were sent to key clinicians; however, this functionality was not highlighted to patients" to avoid "creating an expectation of direct follow-up" | Not real-time. Clinicians viewed reports in the EPR | No free-text field described. Patients asked for more detail and photo upload | Better physical well-being at 6 and 12 weeks, better self-efficacy, no rise in admissions |
| **Noona HUS pilot 2021** ([PMC8138702](https://pmc.ncbi.nlm.nih.gov/articles/PMC8138702/)) | 44 patients, 17 professionals | Nurse work queue, no alarm function in v1 | Call if no reply within 24 h | Open question form | Usable and reliable |
| **Kaiku (Oulu, ICI)** ([JMIR Form Res 2020](https://formative.jmir.org/2020/10/e17898)) | Feasibility | Alert to the care unit for severe or changing symptoms | **unverified** | **unverified** | Feasible |

The main design pattern across these studies is a **scheduled** survey. On-demand reporting exists in Noona and Kaiku, but no trial above isolates its effect.

### Q5. Free-text handling in practice

- **Human review everywhere.** No system or trial reviewed here triages patient free text automatically. In PRO-CTCAE trials, free text was captured unscored and mapped *retrospectively* ([Chung 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6402312)). Noona and Kaiku send free-text messages and "other" to the nurse's queue ([Peltola 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8138702/); [Kaiku staff guide](https://static.helpjuice.com/helpjuice_production/uploads/upload/image/7497/direct/1602505370540-kaiku_user_instructions_core_features_en.pdf)). UKONS logs "other" and sends it to a senior clinician using the CTCAE ([poster](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_tool_poster_a3_v3_final.pdf?dm=1755690853)). Kaiku's CE-marked ML component works on *structured* symptom scores, not free text ([Digi-HTA](https://fincchta.fi/en/digi-hta/digi-hta-arvioinnit/expired-assessments/kaiku-health-palvelu-syopapotilaiden-oireseurantaan/)). Absence of evidence is not proof that no product does free-text triage.
- **Structured questions always come alongside free text.** I found no single guidance document that says so in those words. The practice is consistent, though:
  - UKONS pairs the caller's verbatim words with a methodical run "down the triage assessment tool" ([toolkit, Step 3](https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672)).
  - PRO-CTCAE asks for a severity rating for each free-text symptom.
  - Only a third of free text maps to a known symptom term ([Chung 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6402312)), so free text alone cannot drive a reliable grade.
  - The Siun sote experience shows that open chat gets used for unrelated matters and costs nurse time ([Sitra 2023](https://sitra.fi/en/articles/patients-using-a-self-monitoring-app-are-more-open-and-can-better-remember-to-report-how-they-are-doing)).
  - The reasoning for the safety-screen rule is ours, not a cited rule: a red-flag symptom typed only into free text would wait in a queue that is "not monitored in real time". So the red flags must be asked as explicit yes/no questions *before* free text.

### Q6. Finnish specifics

- **Urgent symptoms (HUS).** HUS guide, 2026 edition, section 1.1.2 "Kiireellinen hoito": "Päivystysasioissa, jos vointisi heikkenee äkillisesti: Ota yhteys päivystysapuun 116117 · Ota yhteys lähimpään päivystävään sairaalaan · Hätätapauksissa soita 112". In English: if your condition suddenly gets worse, call Päivystysapu 116117 or contact the nearest emergency hospital; in an emergency call 112 ([HUS guide](https://www.hus.fi/sites/default/files/2026-04/syopaan-sairastuneen-ja-syopakuntoutujan-opas-tukihoidoista-ja-palveluista.pdf)).
- **Non-urgent (HUS Syöpäkeskus).** Use Maisa, or phone 09 471 74 900 on weekdays 7:30–16:00, with a two-working-day service promise ([HUS instructions](https://www.hus.fi/sites/default/files/2025-05/Yleisohjeita%20sy%C3%B6v%C3%A4n%20l%C3%A4%C3%A4kehoitoa%20saavalle.pdf)). Noona replies come "within 1 to 2 days" ([HUS](https://www.hus.fi/en/node/2666.md)).
- **Fever threshold (HUS).** "Jos sinulle nousee valkosoluja laskevan syöpälääkehoidon aikana korkea kuume: korvalämpö 38 astetta tai enemmän, sinun pitää hakeutua oman asuinalueesi sairaalapäivystykseen". In English: during treatment that lowers white blood cells, an ear temperature of **38 °C or more** means going to your area's hospital emergency department. HUS adds that a marked drop in general condition *without* fever is also a reason to go ([HUS guide §3.1.1](https://www.hus.fi/sites/default/files/2026-04/syopaan-sairastuneen-ja-syopakuntoutujan-opas-tukihoidoista-ja-palveluista.pdf)). The guide also says to go to the emergency department for diarrhoea not improved by medicine within two days, strong watery diarrhoea, or fever ([same, §3.1.3](https://www.hus.fi/sites/default/files/2026-04/syopaan-sairastuneen-ja-syopakuntoutujan-opas-tukihoidoista-ja-palveluista.pdf)).
- **Other Finnish sources.** The Central Finland (Hyvaks) chemotherapy home-care guide says: fever ≥38.0 °C means go immediately to the emergency department. It also lists "lämpöily 37,5 astetta (38 ℃ tai yli → aina päivystykseen)", meaning a temperature of 37.5 °C is a reason to contact the unit, and 38 °C or more always means the emergency department. The same list includes breathlessness and chest pain ([Hyvaks guide](https://www.hyvaks.fi/sites/default/files/ohjeet/Solunsalpaajahoitoa%20saaneen%20potilaan%20kotihoito%20ohje.pdf)).
- **The thresholds disagree.**
  - Finland (HUS, Hyvaks): **38.0 °C** means emergency department.
  - UKONS (UK): **≥37.5 °C or <36.0 °C** on SACT means urgent assessment.
  - ESMO 2016 definition of febrile neutropenia: oral temperature >38.3 °C, or two readings >38.0 °C over 2 h, plus low neutrophils ([Klastersky et al., Ann Oncol 2016, DOI 10.1093/annonc/mdw325](https://doi.org/10.1093/annonc/mdw325); exact wording from secondary copies, **unverified** against the publisher page).
  - For a HUS-area product, use **38 °C** (HUS's own number). Treat **37.5–37.9 °C** on treatment as at least yellow (Hyvaks and UKONS), and treat feeling generally unwell even without fever as red (HUS and UKONS).
- **Western Uusimaa.** The HUS guide and 116117 apply to the HUS area. I did not check a separate Länsi-Uusimaa wellbeing county patient instruction (**unverified**).

---

## 3. Implications for the Symptom Report flow

These are recommendations for the hackathon prototype. Clinical owners at HUS must approve any real thresholds. The rules below are fixed and deterministic (no AI), in line with our EU AI Act and MDR stance. They are "UKONS-style" but written in our own words, because the UKONS toolkit "cannot be reproduced".

### 3.1 Before anything: the disclaimer banner (always visible on the entry screen)

> **This is not an emergency service.** Reports are read by the nurses at the Cancer Centre on weekdays, usually within 1–2 working days. They are not watched around the clock.
> If you feel suddenly much worse, call **Päivystysapu 116117** or go to the nearest emergency department. **In an emergency, call 112.**

Finnish version:
> **Tämä ei ole päivystyspalvelu.** Syöpäkeskuksen hoitajat lukevat ilmoitukset arkisin, yleensä 1–2 arkipäivän kuluessa. Ilmoituksia ei seurata ympäri vuorokauden. Jos vointisi heikkenee äkillisesti, soita Päivystysapuun **116117** tai hakeudu lähimpään päivystykseen. **Hätätilanteessa soita 112.**

Sources: HUS Noona "1 to 2 days", the HUS two-working-day promise, HUS 116117/112 wording, Kaiku's "meant for non-urgent communication", and STAR's "not monitored after business hours" (all cited above).

### 3.2 Safety screen (mandatory, yes/no, before symptom choice)

Any "yes" stops the flow. The patient sees **red** advice: call 112, or call 116117 / go to the emergency department now. Their answers are still saved, flagged red on the Worklist.

1. Are you very short of breath **at rest**, or struggling to breathe or speak? (UKONS SOB grade 3–4)
2. Do you have **chest pain** or chest tightness right now? (UKONS: any chest pain means ED)
3. Are you **coughing up or bleeding** more than a few streaks of blood, or bleeding that won't stop? (UKONS bleeding: "spraying, pouring… puddle")
4. Is your **temperature 38 °C or higher**, or are you having shaking chills, *and* have you had cancer medicine in the last 6 weeks? (HUS 38 °C; UKONS "within the last 6–8 weeks")
5. Have you **fainted**, or are you (or those around you) noticing new **confusion** or unusual drowsiness? (UKONS consciousness)
6. New **weakness or numbness in the legs**, numbness around the buttocks/groin, or new loss of bladder or bowel control? (UKONS neuro/MSCC)
7. New **swelling of the face, neck or arm** with breathlessness? (UKONS "Consider: SVCO")

For the suspected-cancer phase (no treatment yet), item 4 uses the UKONS "fever not on SACT" bands instead. Only >38.0 °C with feeling unwell is a stop; 37.5–38.0 °C becomes yellow inside the Fever symptom.

### 3.3 Symptoms to offer (5 plus "Something else")

These were chosen for lung cancer in the diagnostic and treatment phases, based on the UKONS rows and the STAR, PRO-TECT and Denis symptom sets:

1. **Breathlessness**
2. **Cough / coughing blood**
3. **Pain** (including chest-wall and back pain)
4. **Fever or feeling unwell / infection**
5. **Tiredness and appetite** (fatigue, eating and drinking less)
6. **Something else** → free text (see 3.5)

Patients can pick more than one symptom. Grades combine across symptoms by **worst wins + two yellows = red** (UKONS).

### 3.4 Guided questions and red/yellow/green mapping

The questions follow the UKONS pattern (new? how long? getting worse? what does it stop you doing?). The grades follow the CTCAE-style functional anchors in UKONS. Mappings marked † are our own judgement, because the exact UKONS cell colours are unverified (see Q1).

**Breathlessness**
- Is this new or worse than usual? How long has it been like this? Is it getting worse? Do you also have a cough or fever?
- Green: no change from your usual.
- Yellow: new breathlessness on moderate effort (e.g. stairs, brisk walking) †.
- Red: breathless on minimal effort (washing, dressing), at rest, or getting worse quickly. Red also if combined with fever while on treatment.

**Cough / coughing blood**
- How long? Are you coughing up phlegm, and what colour? Any blood: streaks only, or more?
- Green: ongoing cough, no change.
- Yellow: new or worse cough, or coloured phlegm without fever †; or occasional small streaks of blood, new.
- Red: more than streaks of blood, blood clots, or blood that keeps coming. Red also for a cough plus temperature ≥38 °C (on treatment) or feeling generally unwell.

**Pain**
- Where? New or known? Pain score 0–10? Have you taken your pain medicine, and did it help? Is it in your back?
- Green: mild, not affecting daily activities, controlled by your usual medicine.
- Yellow: moderate, affecting daily activities, or not controlled by your usual medicine (UKONS grade 2) †.
- Red: severe pain affecting daily activities or disabling (grade 3–4). Red also for **new back pain plus any leg weakness or numbness** (MSCC), and for new pain with a swollen, red, warm leg (possible thrombosis).

**Fever / feeling unwell**
- What is your temperature, and when did you measure it? Have you taken paracetamol or steroids (they can hide a fever)? Shivering? When was your last cancer treatment?
- On treatment: green is 36.0–37.4 °C and well. Yellow is 37.5–37.9 °C and otherwise well (Hyvaks: contact the unit). Red is ≥38.0 °C or <36.0 °C, or feeling generally unwell even without fever (HUS and UKONS).
- Not on treatment: green is 36.0–37.4 °C. Yellow is 37.5–38.0 °C. Red is >38.0 °C with feeling unwell (UKONS "not on SACT" bands, combined with the HUS "unwell" rule).

**Tiredness and appetite**
- New or worse? Can you look after yourself (wash, dress)? How much of the day are you in bed or a chair? Are you eating and drinking? Passing urine as usual?
- Green: tired but managing normal light activities.
- Yellow: not relieved by rest, can look after yourself but can't do usual activities; or eating noticeably less.
- Red: in bed or chair more than half the day, can't look after yourself; or hardly eating or drinking with little urine. Also red for patients on immunotherapy at the yellow level (UKONS ICI rule).

**Fixed advice per grade** (adapted from UKONS actions to our non-real-time channel):
- **Green.** Show self-care advice for that symptom, plus: "Report again or call if it gets worse." Goes to the Worklist as routine.
- **Yellow.** "A nurse will review your report, usually within 1–2 working days. If it gets worse before then, call [Cancer Centre 09 471 74 900, weekdays 7:30–16] or 116117 out of hours." Goes to the Worklist as priority. UKONS expects amber to be reviewed within 24 hours. We cannot promise that, so the advice must tell the patient to phone if they want to be seen sooner.
- **Red** (including two or more yellows). "Don't wait for a reply. Call 116117 now or go to the emergency department. In an emergency call 112." Goes to the top of the Worklist. This matches the eRAPID approach: the patient is told to act *themselves*, and the clinician alert is a backup.

### 3.5 "Something else" and free text

- Free text is **optional**, is always offered after the structured questions, and is also offered as the whole of "Something else".
- "Something else" gets three structured questions, so it can be graded without reading the text:
  1. How bad is it at its worst? None / Mild / Moderate / Severe / Very severe (PRO-CTCAE wording)
  2. How much does it stop your usual activities? (PRO-CTCAE interference scale)
  3. Is it new or getting worse?
  
  Mapping: severe/very severe, or "very much" interference, means red †. Moderate, or new and worsening, means yellow. Otherwise green.
- **The safety screen always runs first**, so a red flag is never left to free text alone.
- The system **never lowers a grade because of free text** and does not parse it to set the grade. Optional idea: a fixed keyword list ("veri/blood", "rintakipu/chest pain", "en saa henkeä") that can *raise* the item to "nurse look first" and show a "call 116117 / 112" prompt. Treat this as a rule-based safety net only, and keep it clearly documented.
- Label the text box: "In your own words (optional). A nurse will read this, but not straight away."

### 3.6 Worklist display (nurse view)

- **Sort** by grade (red, then yellow, then green), then by time submitted. Show how long each report has been waiting against the 1–2 working day promise.
- **One card per report** (an "episode"). If a patient reports again about the same symptom before review, group the reports instead of creating new alerts. This idea comes from OncsCare's episode-based review and Generalova's repeated-alert lesson.
- On each card:
  - the overall grade and the rule that set it (e.g. "Red: 2 yellows (Breathlessness, Fever)" or "Red: safety screen Q2 chest pain");
  - each symptom's answers and grade;
  - the patient's **own words verbatim** (UKONS records them verbatim);
  - the advice that was shown to the patient;
  - context: treatment type and phase, days since last treatment, ICI yes/no (the UKONS log sheet fields);
  - the patient's last weekly Check-in grade, for trend.
- **Actions** (Kaiku-style): assign to me, message the patient, record the action taken (UKONS log "action taken"), mark done. Keep secure messaging a **separate stream** from symptom reports, as Kaiku, Noona and Stanford all do.
- **Audit.** Store the rule version that produced each grade, so the fixed-rule logic can be reviewed.

---

## 4. Sources

**Triage tools**
- UKONS. *Oncology/Haemato-oncology 24-Hour Triage Toolkit, Information and Instruction Manual*, 3rd ed., Dec 2024. https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_toolkit_v3_final.pdf?dm=1756386672
- UKONS. *Triage Assessment Tool, Version 3* (A3 poster). https://tempus-fujit.files.svdcdn.com/production/images/ukons_triage_tool_poster_a3_v3_final.pdf?dm=1755690853
- UKONS publicly available resources page. https://ukons.org/resources/publicly-available-resources
- Mohamed Azhar MS et al. UKONS-informed digital symptom triage with episode-based review (OncsCare). JMIR Cancer 2026;12:e92586. https://cancer.jmir.org/2026/1/e92586 (abstract via search only)
- CCLG Triage Toolkit page. https://cclg.org.uk/information-professionals/service-development-and-delivery/triage-tool-kit
- HSE NCIS telephone triage assessment form (not retrievable, 403). https://www.hse.ie/eng/services/list/5/cancer/profinfo/medonc/projects/telephone-triage-assessment-form.pdf

**PRO-CTCAE**
- NCI. PRO-CTCAE Items – English, Item Library v1.0 (version date 5/11/2023). https://healthcaredelivery.cancer.gov/pro-ctcae/instruments/pro-ctcae/pro-ctcae_english.pdf
- NCI. PRO-CTCAE FAQs. https://healthcaredelivery.cancer.gov/pro-ctcae/faqs.html
- NCI. PRO-CTCAE Measurement System. https://healthcaredelivery.cancer.gov/pro-ctcae/measurement.html
- Basch E et al. Composite grading algorithm for the NCI PRO-CTCAE. Clin Trials 2021. https://doi.org/10.1177/1740774520975120
- Chung AE et al. Patient free text reporting of symptomatic AEs using PRO-CTCAE. JAMIA 2019. https://pmc.ncbi.nlm.nih.gov/articles/PMC6402312
- NCIt C180168 "Any Other Symptoms Reported" (CISMeF mirror). https://www.cismef.org/page/detail/en/NCI_CO_C180168

**Trials and studies**
- Basch E et al. Symptom monitoring with PROs during routine cancer treatment: RCT. JCO 2016. https://pmc.ncbi.nlm.nih.gov/articles/PMC4872028/
- Basch E et al. Overall survival results… JAMA 2017. https://doi.org/10.1001/jama.2017.7156
- Basch E et al. Effect of electronic symptom monitoring on PROs (PRO-TECT). JAMA 2022. https://pmc.ncbi.nlm.nih.gov/articles/PMC9168923/
- Basch E et al. PRO-TECT final results. Nat Med 2025. https://doi.org/10.1038/s41591-025-03507-y
- Denis F et al. Randomized trial comparing a web-mediated follow-up with routine surveillance in lung cancer patients. JNCI 2017. https://doi.org/10.1093/jnci/djx029
- Denis F et al. Two-year survival… lung cancer. JAMA 2019. https://doi.org/10.1001/jama.2018.18085
- Absolom K et al. Phase III RCT of eRAPID. JCO 2021. https://doi.org/10.1200/JCO.20.02015
- Warrington L et al. Patient and clinician perspectives of eRAPID. BMJ Open 2024. https://pmc.ncbi.nlm.nih.gov/articles/PMC11552561/
- Peltola MK et al. A novel digital PRO platform (Noona)… pilot. JMIR Form Res 2021;5(5):e16156. https://pmc.ncbi.nlm.nih.gov/articles/PMC8138702/
- Generalova O et al. Implementation of a cloud-based ePRO platform in advanced cancer. J Patient Rep Outcomes 2021;5:91. https://pmc.ncbi.nlm.nih.gov/articles/PMC8443731/
- Iivanainen S et al. Kaiku ePRO in ICI patients (KISS). JMIR Form Res 2020. https://formative.jmir.org/2020/10/e17898
- Klastersky J et al. Management of febrile neutropaenia: ESMO CPG. Ann Oncol 2016. https://doi.org/10.1093/annonc/mdw325

**Vendors and hospitals**
- HUS. Cancer treatment (Noona section). https://www.hus.fi/en/node/2666.md
- HUS Syöpäkeskus. *Syöpään sairastuneen ja syöpäkuntoutujan opas tukihoidoista ja palveluista* (2026). https://www.hus.fi/sites/default/files/2026-04/syopaan-sairastuneen-ja-syopakuntoutujan-opas-tukihoidoista-ja-palveluista.pdf
- HUS Syöpäkeskus. *Yleisohjeita syövän lääkehoitoa saavalle* (approved 2024). https://www.hus.fi/sites/default/files/2025-05/Yleisohjeita%20sy%C3%B6v%C3%A4n%20l%C3%A4%C3%A4kehoitoa%20saavalle.pdf
- Keski-Suomen hyvinvointialue. *Solunsalpaajahoitoa saaneen potilaan kotihoito-ohje.* https://www.hyvaks.fi/sites/default/files/ohjeet/Solunsalpaajahoitoa%20saaneen%20potilaan%20kotihoito%20ohje.pdf
- Siemens Healthineers. Noona helps unify cancer care and symptom management (Nov 2023). https://cancercare.siemens-healthineers.com/newsroom/blog/noona-helps-unify-cancer-care-and-symptom-management-for-patients
- Nova Scotia Health. Noona patient handout NSHCCP4048 (Apr 2024). https://www.nshealth.ca/sites/default/files/documents/NSHCCP4048-2024.04.25.pdf
- Eastern Health (NL). Noona support information. https://cancercare.easternhealth.ca/?p=8431
- CancerCare Manitoba. How to contact your care team using Noona (not retrievable at time of research). https://www.cancercare.mb.ca/export/sites/default/.galleries/files/How-to-Contact-Your-Care-Team-Using-Noona.pdf
- Kaiku Health – App Store listing. https://apps.apple.com/app/id1477041425
- Kaiku Health service user instructions (staff, c.2020). https://static.helpjuice.com/helpjuice_production/uploads/upload/image/7497/direct/1602505370540-kaiku_user_instructions_core_features_en.pdf
- Elekta. Kaiku Health IFU (patient E060552 Rev.08; professional E060553 Rev.07), 2025 (404 at time of research). See URLs in Q3.
- FinCCHTA Digi-HTA: Kaiku Health -palvelu syöpäpotilaiden oireseurantaan (2020, expired). https://fincchta.fi/en/digi-hta/digi-hta-arvioinnit/expired-assessments/kaiku-health-palvelu-syopapotilaiden-oireseurantaan/
- Sitra. Patients using a self-monitoring app… (13 Sep 2023). https://sitra.fi/en/articles/patients-using-a-self-monitoring-app-are-more-open-and-can-better-remember-to-report-how-they-are-doing
