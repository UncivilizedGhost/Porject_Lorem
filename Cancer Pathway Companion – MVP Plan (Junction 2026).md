# Cancer Pathway Companion – MVP Plan (Junction 2026)

Nov 13, 2026&#32;

## 1. Overview

**Cancer Pathway Companion gives every person at risk of or suspected of cancer a clock, a next step and a named nurse, whether or not they use apps, and shows decision-makers where the clock stops and for whom.** It adapts Nordic cancer patient pathways to Finland's existing services (Omapolku, Suomi.fi Messages, Kanta) instead of adding another portal.

**Product components**

| Component | User | Purpose |
| --- | --- | --- |
| Patient companion (web app, SMS, phone, paper) | Patient and next of kin | Warning signs, next step, confirmations, symptom check-ins, plain-language information |
| Coordinator worklist | Coordinator nurse | One prioritised list of who needs action today, and why |
| Equity dashboard | County and national decision-makers | Time to treatment by county and population group, with recommended actions |

**MVP scope:** suspected lung cancer in one demo county, from risk check to the first treatment cycle. Lung cancer carries the national strategy's largest survival-gap target \[1\], and a national lung cancer programme launched in 2026 [\[2\]](https://www.filha.fi/wp-content/uploads/2026/05/Valtakunnallinen-keuhkosyopaohjelma-2026-2035_180526_preprint.pdf).

**Fit to the challenge**

| Requirement | How the product meets it | Section |
| --- | --- | --- |
| Identify the gap | Share starting treatment within target time, by county, age, language and education group | 4.5 |
| Locate it in the pathway | Clock split into detection → referral → diagnosis → treatment | 4.1 |
| Recommend actions | Each gap linked to a Nordic-proven action with simulated impact | 4.5 |
| Goal 3 indicator | Patients start treatment within target times, with equity breakdown \[1\] | 4.5 |
| Reliable, sourced evidence | Numbered references; synthetic data labelled | 9 |
| Working demo | Patient app, worklist and dashboard on one data flow | 7 |
| Clear in 2 minutes | Dashboard opens on 3 numbers, 1 map, 3 actions | 4.5 |

## 2. Problem statement

**Finnish cancer patients lose time before and between hospital steps, the losses fall hardest on disadvantaged groups, and no one is measuring or owning the gaps.**

| Problem | Finnish evidence |
| --- | --- |
| Delays before diagnosis | One in three patients felt their diagnosis was delayed; a third needed at least three contacts before diagnosis; nearly 40% chased their own results [\[3\]](https://www.sttinfo.fi/tiedote/70972938/kyselyselvitys-joka-kolmas-syopapotilas-kokee-diagnoosin-viivastyneen?publisherId=69820264) |
| Slow entry to care | About 2 weeks to a primary care visit for lung symptoms vs. under 1 week elsewhere in the Nordics; 40–60% of patients see a nurse first [\[4\]](https://www.helsinki.fi/fi/uutiset/terveys/miksi-suomessa-keuhkosyopaan-kuollaan-aiemmin-kuin-pohjoismaissa) |
| Delays inside specialist care | In Satakunta, referral to lung cancer diagnosis took just under 2 months, with the biggest delay in specialist care [\[5\]](https://www.utupub.fi/handle/10024/180618) |
| Late-stage lung cancer | Only 27% of lung cancer patients reached curative treatment; stage was missing for nearly half [\[6\]](https://www.verkkouutiset.fi/a/keuhkosyopa-todetaan-usein-liian-myohaan-vain-joka-neljas-saa-parantavaa-hoitoa/) |
| Social inequity | Patients with lower education have higher odds of a stage IV diagnosis [\[7\]](https://www.demogr.mpg.de/en/publications_databases_6118/publications_1904/journal_articles/disparities_in_cancer_incidence_stage_at_diagnosis_treatment_and_mortality_across_socioeconomic_groups_8291/); 31.6% of those invited didn't take part in bowel screening [\[8\]](https://ouci.dntb.gov.ua/works/42LXLNW9) |
| No standard, no measurement | No national lung cancer time limit yet [\[2\]](https://www.filha.fi/wp-content/uploads/2026/05/Valtakunnallinen-keuhkosyopaohjelma-2026-2035_180526_preprint.pdf); treatment effectiveness isn't systematically monitored at hospital level, unlike Sweden and Denmark [\[4\]](https://www.helsinki.fi/fi/uutiset/terveys/miksi-suomessa-keuhkosyopaan-kuollaan-aiemmin-kuin-pohjoismaissa) |
| Digital exclusion | 500,000–600,000 people over 65 lack sufficient digital skills [\[9\]](https://www.arctictoday.com/finland-is-europes-most-digitalised-country-but-older-people-are-still-left-behind/); low education, poor health, migrant background and living alone raise the risk [\[10\]](https://kaupunkitieto.hel.fi/en/digitalisation-and-accessibility-of-public-services-in-finland-and-helsinki) |
| Digital-by-default mail | Hospital letters now go to Suomi.fi Messages; counties report notifications are easily missed and staff can't see who receives them [\[11\]](https://cdn.verkkopalvelu.suomi.fi/files/Hyvinvointialueiden%20yhteisty%C3%B6verkoston%20kokous%20-%20SFI-viestit%20ajanvarauksissa%2017032026-e1366ee9e9515a7c7ebf3b64eb852e9f.pdf); acting on someone's behalf doesn't switch on digital delivery [\[12\]](https://www.sttinfo.fi/tiedote/72148837/viranomaispostin-siirtyminen-digitaaliseksi-etenee-pohteella-sahkoisia-ajanvarauskirjeita-pilotoidaan-kempeleessa-176-alkaen?lang=fi) |
| Fragmented tools | Health Village serves Helsinki, HUS and 10 of the wellbeing services counties [\[13\]](https://www.terveyskyla.fi/en/information-about-health-village/health-villages-service-providers-and-partners); nurses ask not to run two systems [\[14\]](https://www.sitra.fi/?p=118869); patients are confused by many similar portals [\[15\]](https://www.innokyla.fi/sites/default/files/2025-12/RRF2_Digipolkujen-asiakaspalautteet_2023-2025.pdf) |

## 3. Standards and benchmarks

**The product uses Finland's 6-week target as its headline, Pirkanmaa's step times as stage warnings, and Nordic and European limits as benchmark lines.** There is no binding EU time standard and no Finnish lung-specific limit yet; the national lung cancer programme plans to set one [\[2\]](https://www.filha.fi/wp-content/uploads/2026/05/Valtakunnallinen-keuhkosyopaohjelma-2026-2035_180526_preprint.pdf).

### 3.1 Time limits for lung cancer

| Source | Clock starts | Limits | Target share |
| --- | --- | --- | --- |
| Finland, STM 2010:6 [\[16\]](https://www.iccp-portal.org/system/files/plans/selv_2010_6_syovan_hoito_verkko.pdf) | Referral received | Diagnosis and treatment within 6 weeks; imaging and pathology within 1 week | — |
| Pirkanmaa lung pathway [\[18\]](https://pirha.fi/documents/d/kehitysversio/keuhkosyopapotilaan-hoitopolku) | Referral received | Processed in 1–2 working days; invitation in 3–4; CT within about a week; bronchoscopy results in 3–5 days | — |
| Sweden, SVF [\[20\]](https://vardgivare.regionkalmar.se/globalassets/vard-och-behandling/cancersjukdomar/ledtider-svf-diagnoser-2022.pdf) | Well-founded suspicion | 44 days to surgery or radiotherapy; 40 to drugs; 30 to palliative care | 80%, met only for acute leukaemia in 2024 [\[21\]](https://cancercentrum.se/globalassets/om-rcc/samverkan/overenskommelse/bilaga-3-kortare-vantetider-i-cancervarden_arsrapport-2024.pdf) |
| Norway, 2015 standard [\[26\]](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5240346/) | Referral received | First visit 7 days; treatment decision 28; drugs 35; surgery or radiotherapy 42 | Over 70% |
| Norway, revised July 2026 [\[25\]](https://www.helsedirektoratet.no/nasjonale-forlop/lungekreft/behandling-av-lungekreft/forlopstid) | Completed work-up | Drugs 7 days; surgery or radiotherapy 14 | — |
| Denmark [\[27\]](https://www.ft.dk/samling/20171/almdel/SUU/bilag/372/1913632.pdf) | Referral received | First visit within 6 calendar days | — |
| European Respiratory Society review [\[28\]](https://doi.org/10.1183/16000617.0045-2018) | GP referral | Specialist within 14 days; diagnosis to treatment within 14 days | — |

THL's access-to-care definitions [\[17\]](https://core.ac.uk/download/78470017.pdf) set the timestamps, so the product's data matches national reporting.

### 3.2 Nordic care-model elements adopted

| Element | Nordic source | In the product |
| --- | --- | --- |
| Clock starts at well-founded suspicion; regions report waiting times nationally as a funding condition | Sweden [\[19\]](https://cancercentrum.se/syd/regional-cancer-centres/knowledge-based-healthcare/cancer-patient-pathways/) | "Suspected cancer" referral flag; national-reporting recommendation |
| Clear entry criteria (e.g. imaging findings, repeated coughing up blood) | Sweden [\[30\]](https://kunskapsbanken.cancercentrum.se/globalassets/cancerdiagnoser/lunga-och-lungsack/vardforlopp/svf-lungcancer.pdf); Norway names smokers over 40 as the risk group [\[24\]](https://www.helsedirektoratet.no/nasjonale-forlop/lungekreft/inngang-til-pakkeforlop-for-lungekreft) | Referral flag criteria and risk check |
| GP marks the referral and tells the patient what the pathway means | Norway [\[24\]](https://www.helsedirektoratet.no/nasjonale-forlop/lungekreft/inngang-til-pakkeforlop-for-lungekreft) | GP script in the referral step |
| Named contact nurse for every cancer patient, with a written assignment | Sweden [\[22\]](https://cancercentrum.se/globalassets/patient-och-narstaende/samverkan/kssk/nationellt-uppdrag-for-kontaktsjukskoterska.pdf) | Coordinator nurse owns the worklist |
| Nationally reviewed patient care plan, digital or paper, equal for all | Sweden, Min vårdplan [\[23\]](https://cancercentrum.se/syd/regional-cancer-centres/knowledge-based-healthcare/my-care-plan/) | Next-step card, pathway timeline, Learn content |

## 4. Solution and features

### 4.1 Patient journey

**One account follows the person from risk check to treatment, so nothing restarts between phases.**

| Phase | Trigger | What happens | Evidence |
| --- | --- | --- | --- |
| 0. Reach out | Screening non-responder, or a person in the lung screening pilot's risk group | Follow up people who don't respond to national screening letters; in pilot counties, invite risk groups; anyone can take an opt-in risk self-check | National screening already invites by letter, but many don't take part [\[8\]](https://ouci.dntb.gov.ua/works/42LXLNW9). England identifies people aged 55–74 with a smoking history from GP records, assesses risk, then scans [\[31\]](https://roycastle.org/lung-cancer-screening-given-green-light/). Finland's risk-based screening still needs a law change (roadmap 2.4.2) \[1\] |
| 1. Warning signs | Person learns the signs once and consents to be contacted | One tap "I have this" → coordinator call-back in 1–2 working days → GP visit + chest X-ray booked. No continuous monitoring of healthy people | Signs from Pirkanmaa's pathway: worsening cough, hoarseness over 3 weeks, coughing up blood, fatigue, poor appetite [\[18\]](https://pirha.fi/documents/d/kehitysversio/keuhkosyopapotilaan-hoitopolku). Awareness raised knowledge without raising anxiety [\[33\]](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4855769/) [\[34\]](https://bmcpublichealth.biomedcentral.com/track/pdf/10.1186/s12889-018-5606-3); messages must also counter negative beliefs about cancer [\[35\]](https://orca.cardiff.ac.uk/110555/1/s12885-018-4287-8%20K%20Brain.pdf) and fit low health literacy [\[36\]](https://www.maxapress.com/data/article/ejcc/preview/pdf/10.1155-2024-7919967.pdf) |
| 2. Suspected cancer | GP or X-ray raises suspicion; referral flagged | Pathway clock starts; next-step card; every step must be confirmed; escalation ladder if not | Sweden and Norway start the clock at referral or suspicion [\[19\]](https://cancercentrum.se/syd/regional-cancer-centres/knowledge-based-healthcare/cancer-patient-pathways/) [\[24\]](https://www.helsedirektoratet.no/nasjonale-forlop/lungekreft/inngang-til-pakkeforlop-for-lungekreft) |
| 3. Treatment | First treatment starts | Weekly symptom check-ins, medication reminders, rule-based alerts to the coordinator | Basch trial and PRO-TECT (section 4.4) |

Eligibility rules miss many cases: almost two-thirds of US lung cancer patients wouldn't have qualified for screening [\[32\]](https://www.healthday.com/health-news/cancer/under-current-guidelines-most-lung-cancer-patients-werent-eligible-for-cancer-screening). That is why phase 1 is open to everyone.

### 4.2 Channels and escalation

**The referral or invitation starts contact; the person never has to find or download anything.**

| Person's situation | Channel | Who acts |
| --- | --- | --- |
| Uses digital services | Next-step card in Omapolku (where the county uses it) or Suomi.fi Messages with a specific title, plus an SMS every time | Patient |
| Elderly or not comfortable with tech | SMS reply-to-confirm, automated call, paper letter | Patient + consented next of kin or health-station nurse |
| Low income, no smartphone, low health literacy | Ordinary SMS or call, plain-language Finnish (selkokieli), "call me" button | Coordinator nurse |
| No Finnish e-ID, or another language | Phone call with interpreter, paper in their language | Coordinator nurse |

**Escalation ladder when a step isn't confirmed** (intervals are draft values for clinicians to set):

1. Day 0: letter or message + SMS asking for confirmation
2. Day 2: automated phone call (press 1 to confirm, 2 to talk to a nurse)
3. Day 3: coordinator nurse calls
4. Day 5: consented next of kin is contacted
5. Day 7: flagged to the referring health centre and shown on the dashboard as "not reached"

**Read status differs by channel:** a Suomi.fi message shows as opened when read online, but paper gives no signal. For digital recipients, "unopened after 48 h" moves the ladder on; for paper recipients, only an SMS reply or answered call counts, and the day-2 call always goes out. Central Finland already adds an SMS reminder to appointment letters [\[37\]](https://www.sttinfo.fi/tiedote/72398092/keski-suomen-hyvinvointialue-lahettaa-kutsukirjeet-ensisijaisesti-suomifi-viesteilla-ja-tekstiviestimuistutuksella-tarkasta-puhelimesi-asetukset?lang=fi).

### 4.3 Patient companion features

**A web app (no app-store install) modelled on Sweden's Min vårdplan, with paper as an equal alternative** [\[23\]](https://cancercentrum.se/syd/regional-cancer-centres/knowledge-based-healthcare/my-care-plan/). Screens follow Min vårdplan's order: care team and contacts → investigation and diagnosis → treatment [\[38\]](https://cancercentrum.se/download/18.338b7ccc19d8ac2fb505443/1776234909110/Remiss%20Min%20v%C3%A5rdplan%20utredning%20av%20misst%C3%A4nkt%20cancer_Remissversion_20260415.pdf).

| Feature | Description | Phase |
| --- | --- | --- |
| Onboarding (2 min, or done by staff) | Language (fi, sv, en, plain Finnish + more), text size, voice, contrast, alarm style, next-of-kin consent; health-station staff or hotline can complete it | 0–3 |
| Risk check and warning signs | Opt-in self-check; warning-sign list with one-tap "I have this" and consent to be contacted | 0–1 |
| "Your next step" home card | What, when, where, how to get there, what to bring, named nurse and number; "How are you today?" and "I need help" buttons | 2–3 |
| Pathway timeline | Steps done and coming, with expected time per step | 2–3 |
| Alarm-style confirmations | Only 3 uses: appointment to confirm, red-flag safety check, time-critical medication. Slide to confirm; feeds the clock. All else is a quiet notification | 2–3 |
| Symptom check-in | About 10 PRO-CTCAE items (validated patient-reported symptoms), weekly or on demand, graded by fixed rules | 3 |
| Medication | Reminders for oral cancer drugs and supportive medicines; taken / skipped / side effect in one tap | 3 |
| Next-of-kin view | Appointments and confirmations, no clinical notes; can confirm on the patient's behalf (logged as proxy) | 0–3 |
| Learn | Plain-language answers from reviewed national sources (4.6) | 0–3 |
| Records | Structured summary, confirmed by the nurse, sent via the county record to Kanta (section 5) | 2–3 |

**Why only three alarm-style alerts:** constant alarms raise anxiety and drive uninstalls, especially in palliative care. iOS allows bypassing silent mode only with Apple's Critical Alerts approval, and Android 14 limits full-screen alerts to calling and alarm apps.

### 4.4 Coordinator worklist and alert rules

**One named coordinator nurse owns each person's pathway, combining Sweden's contact nurse [\[22\]](https://cancercentrum.se/globalassets/patient-och-narstaende/samverkan/kssk/nationellt-uppdrag-for-kontaktsjukskoterska.pdf) and Norway's pathway coordinator.** The worklist sits inside the patient record system, because nurses in the North Karelia Kaiku pilot asked not to run two systems [\[14\]](https://www.sitra.fi/?p=118869).

- Sorted by "needs action today": red alerts, then warning-sign call-backs, then overdue confirmations, then yellow trends
- One-line reason per person, e.g. "Hoarseness 4 weeks, call-back due" or "Letter unopened 72 h, no SMS reply"
- Delivery status: Suomi.fi active and opened, SMS confirmed, next of kin reached
- Pathway clock per person: days used vs. target, next deadline
- One-tap actions: call, book GP + X-ray, rebook, mark handled, hand over to next of kin
- Workload line: alerts per nurse per shift and share of false alarms

| Alert level | Trigger (thresholds set by oncologists) | Route |
| --- | --- | --- |
| Red | Red-flag combinations, e.g. fever during chemotherapy, breathlessness at rest, coughing up blood | Real-time to one named owner, who must acknowledge; patient sees "Call now" |
| Yellow | Moderate symptoms, worsening against own baseline, 2 missed doses, no confirmation within 48 h, a warning-sign tap | Daily worklist batch |
| Green | Mild or stable symptoms | Automatic self-care advice; no nurse |

**Evidence and claim:** in the Basch trial, alerts went to nurses only for new or worsening symptoms [\[40\]](https://sph.unc.edu/?p=294320). The larger PRO-TECT trial showed no survival difference but fewer emergency or hospital visits [\[41\]](https://oncologypro.esmo.org/meeting-resources/esmo-congress-2023/remote-symptom-monitoring-with-electronic-patient-reported-outcomes-epros-during-treatment-for-metastatic-cancer-results-from-the-pro-tect-trial), and about a quarter of nurses worried about workload [\[42\]](https://oncnursingnews.com/view/pro-tect-trial-shows-that-epros-may-be-feasibly-implemented-into-routine-oncology-practice). We claim fewer emergency visits and fewer missed steps, not longer survival.

### 4.5 Equity dashboard

**The first screen answers three questions in under 2 minutes: are people treated in time, where are days lost, and who is left behind.**

- **3 numbers:** % starting treatment within target time (with Norway's 70% and Sweden's 80% target lines); median days from referral to treatment; reach rate among over-75s
- **1 map:** the same % by wellbeing services county
- **1 pathway bar:** days per phase, from warning sign to treatment, coloured where targets are exceeded
- **Equity breakdown:** age, language, education group, municipality type
- **3 recommended actions,** each with evidence and simulated effect

The indicator copies Norway's: share of pathways completed within the maximum time, from referral to treatment start, by treatment type [\[29\]](https://www.helsedirektoratet.no/statistikk/kvalitetsindikatorer/kreft-behandling-og-overlevelse/pakkeforl%C3%B8p-for-26-organspesifikke-kreftformer/Pakkeforl%C3%B8p%20for%2024%20organspesifikke%20kreftformer%204.0.pdf).

| Gap detected | Recommended action | Evidence |
| --- | --- | --- |
| Warning signs reported late, worst in low-education groups | Opt-in risk check + warning-sign tap with call-back; plain-language messages that counter negative beliefs | [\[7\]](https://www.demogr.mpg.de/en/publications_databases_6118/publications_1904/journal_articles/disparities_in_cancer_incidence_stage_at_diagnosis_treatment_and_mortality_across_socioeconomic_groups_8291/) [\[35\]](https://orca.cardiff.ac.uk/110555/1/s12885-018-4287-8%20K%20Brain.pdf) |
| Large regional variation in referral-to-treatment time | National pathway time limits, with waiting-time reporting as a funding condition | Sweden [\[19\]](https://cancercentrum.se/syd/regional-cancer-centres/knowledge-based-healthcare/cancer-patient-pathways/) |
| No one owns the patient between units | Named coordinator for every patient, recorded in the register | Sweden [\[22\]](https://cancercentrum.se/globalassets/patient-och-narstaende/samverkan/kssk/nationellt-uppdrag-for-kontaktsjukskoterska.pdf) |
| Missed first visits, worst among over-75s | Phone or SMS reminders; nurse call when not confirmed | Phone reminders cut missed appointments by 43% in Denmark [\[43\]](https://www.ugeskriftet.dk/dmj/A5083) |
| Patient experience not measured | Annual survey of pathway patients | Sweden's 2025 survey had 21,819 respondents [\[44\]](https://www.varden.se/blogg/50001-nationella-patientenkaten-2025-sa-upplever-cancerpatienter-standardiserade-vardforlopp); supports Goal 1 \[1\] |

**Simulation:** sliders for "warning signs acted on X days sooner", "missed visits reduced by Y%" and "coordinator reaches Z% of silent patients" → days saved and extra people within target time, per county. Effect sizes come only from the cited evidence; synthetic patient flow is labelled.

### 4.6 Learn knowledge base

**The AI only rephrases reviewed Finnish sources in plain language and shows the source; it never diagnoses or decides.** The quality model is Sweden's Min vårdplan, whose texts are written by a national working group, reviewed by the guideline group and checked by the patient association [\[39\]](https://cancercentrum.se/globalassets/cancerdiagnoser/lunga-och-lungsack/min-vardplan/dokument-2.0-310326/patientinformation/min-vardplan-lungcancer-2.0-for-utskrift.pdf).

| Allowed source (licence checked before reuse) | Used for |
| --- | --- |
| Health Village Cancer Hub (Syöpätalo) [\[45\]](https://hus.fi/en/treatments-and-examinations/support-cancer-treatment) | Cancer types, tests, treatments |
| Pirkanmaa and OYS lung cancer pathways [\[18\]](https://pirha.fi/documents/d/kehitysversio/keuhkosyopapotilaan-hoitopolku) [\[46\]](https://ppshp.fi/dokumentit/Ohjeet%20potilaalle%20sislttyyppi/OYS%20keuhkosy%C3%B6p%C3%A4potilaan%20hoitopolku.pdf) | Warning signs, pathway steps |
| Current Care guideline patient versions (Käypä hoito) | Evidence-based symptom and treatment information |
| Cancer Society of Finland (kaikkisyovasta.fi) | Living with cancer, next-of-kin support |
| County and unit instructions | Phone numbers, local practical details |

**Guardrails:** answers only from retrieved passages with the source shown; no source → "ask your nurse" plus the number; no diagnosis, prognosis or dosing; red-flag words trigger a fixed pre-written safety message; plain Finnish, Swedish and English, other languages labelled machine-translated. **Quality check:** about 50 real questions scored by a clinician for correctness, faithfulness and readability before the demo.

## 5. Data and integration

**Record once, confirm once, share through existing channels.** Raw automatic syncing to national services isn't possible today: Kanta's personal health record (Omatietovaranto) was left in maintenance mode in early 2025 [\[47\]](https://www.innokyla.fi/sites/default/files/2026-07/Itse-%20ja%20omahoidon%20tuki%20Omatietovarannolla%20ja%20asiointipalveluilla.pdf) and proposed for closure [\[48\]](https://api.hankeikkuna.fi/asiakirjat/7851b6ab-1b8f-44a9-8399-e614d89fd548/efa91f37-a5c1-4f85-8e8c-79d9e4e8dc21/KIRJE_20250402103211.PDF). Kanta's interface for wellbeing apps mostly lets patients fetch their own records [\[49\]](https://www.kanta.fi/documents/d/guest/informointi-potilastietojen-saamisesta-hyvinvointisovellukseen), and Kanta's development funding falls significantly in 2026 [\[50\]](https://www.kanta.fi/en/ajankohtaista/kanta-services-in-2026-developing-kanta-data-to-better-aid-the-work-of-professionals).

| Step | What happens | System |
| --- | --- | --- |
| 1. Compile | Warning-sign taps, check-ins, confirmations, medication logs and next-of-kin notes become one structured summary per week or event, red flags first | Companion |
| 2. Confirm | Nurse accepts with one tap, making it a reviewed clinical entry (keeps noise and liability out of the record) | Coordinator worklist |
| 3. Store | Written as a normal entry in the county's patient record (e.g. Apotti, Lifecare) | County record system |
| 4. Share | County archives it to Kanta; other providers see it when the patient has given sharing permission | Kanta |
| 5. Return | App pulls appointments, lab results and medication list through Kanta's FHIR interface, so nothing is typed twice | Kanta → companion |

**Dashboard data is de-identified,** following Sweden's waiting-time database, which records pathway dates with age, sex and home region but no personal identity number [\[21\]](https://cancercentrum.se/globalassets/om-rcc/samverkan/overenskommelse/bilaga-3-kortare-vantetider-i-cancervarden_arsrapport-2024.pdf).

**Future-proof:** THL and Kela have started work on EU Health Data Space Article 5, the citizen's right to add their own data to the patient record [\[51\]](https://www.innokyla.fi/sites/default/files/2026-02/Kansalaisen%20omien%20tietojen%20tallentaminen.pdf), and Kanta is moving to FHIR [\[52\]](https://www.kanta.fi/en/fhir-technology-and-kanta). In the demo, steps 1–2 are real and 3–5 are labelled FHIR mock-ups.

| MVP data need | Source |
| --- | --- |
| Target times and definitions | STM 2010:6 [\[16\]](https://www.iccp-portal.org/system/files/plans/selv_2010_6_syovan_hoito_verkko.pdf), THL 21/2016 [\[17\]](https://core.ac.uk/download/78470017.pdf), strategy Goal 3 \[1\] |
| Equity baseline | Zai et al. 2025 [\[7\]](https://www.demogr.mpg.de/en/publications_databases_6118/publications_1904/journal_articles/disparities_in_cancer_incidence_stage_at_diagnosis_treatment_and_mortality_across_socioeconomic_groups_8291/), Finnish Cancer Registry, NORDCAN |
| Realistic delays | Satakunta study [\[5\]](https://www.utupub.fi/handle/10024/180618) |
| Patient flow | Synthetic, labelled, matched to published distributions |

## 6. Compliance, safety and governance

**The county owns the service and the data; oncologists own the thresholds; AI explains but never decides.**

| Area | Approach |
| --- | --- |
| Medical device (EU MDR) | Symptom grading likely makes the product a medical device; Health Village's Omapolku is one [\[53\]](https://www.terveyskyla.fi/en/omapolku/about-omapolku-and-digital-paths). Grading stays rule-based, with a nurse in the loop |
| EU AI Act | AI limited to explaining and summarising; no AI triage or decisions |
| Privacy (GDPR) | County is data controller; EU hosting; research use only through Findata permits; dashboard data de-identified |
| Consent | Explicit, plain-language consent for warning-sign contact (phase 1), next-of-kin access and data sharing; withdrawable at any time |
| Risk-based outreach | Only within the national lung screening pilot until the law allows risk-based screening (roadmap 2.4.2) \[1\] |
| Accessibility | WCAG 2.1 A and AA, legally required for Finnish public digital services [\[10\]](https://kaupunkitieto.hel.fi/en/digitalisation-and-accessibility-of-public-services-in-finland-and-helsinki); paper and phone equal to digital |

**AstraZeneca's role follows the Pirkanmaa kidney screening pilot,** where AstraZeneca partly funded development but not care, lab tests or other county duties [\[54\]](https://fimlab.fi/?p=17765). Here: the county owns and runs the service, AstraZeneca co-funds development and independent evaluation, receives aggregate results only, and no medicine is mentioned anywhere in the product.

## 7. Delivery plan

### 7.1 Success metrics

| KPI | Target basis |
| --- | --- |
| Share starting treatment within target time, by equity group | Goal 3 \[1\]; Norway's 70% and Sweden's 80% as benchmarks [\[26\]](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5240346/) [\[21\]](https://cancercentrum.se/globalassets/om-rcc/samverkan/overenskommelse/bilaga-3-kortare-vantetider-i-cancervarden_arsrapport-2024.pdf) |
| Days from warning-sign tap to GP + chest X-ray | Pirkanmaa step times [\[18\]](https://pirha.fi/documents/d/kehitysversio/keuhkosyopapotilaan-hoitopolku) |
| Reach rate (confirmed contact) among over-75s and non-digital users | Equity gap in [\[9\]](https://www.arctictoday.com/finland-is-europes-most-digitalised-country-but-older-people-are-still-left-behind/) |
| Missed first visits | 43% reduction seen with phone reminders [\[43\]](https://www.ugeskriftet.dk/dmj/A5083) |
| Emergency visits during treatment | Reduction seen in PRO-TECT [\[41\]](https://oncologypro.esmo.org/meeting-resources/esmo-congress-2023/remote-symptom-monitoring-with-electronic-patient-reported-outcomes-epros-during-treatment-for-metastatic-cancer-results-from-the-pro-tect-trial) |
| Alerts per nurse per shift; false-alarm share | Workload concern in [\[42\]](https://oncnursingnews.com/view/pro-tect-trial-shows-that-epros-may-be-feasibly-implemented-into-routine-oncology-practice) |

### 7.2 Demo script (2 minutes)

1. **(20 s) Dashboard:** "In County X, many over-75s start treatment late; days are lost before referral and before the first visit." Numbers synthetic and labelled.
2. **(20 s) Phase 0–1:** a 68-year-old former smoker in a pilot county takes the risk check, later taps "hoarseness over 3 weeks" → call-back → GP + X-ray booked.
3. **(25 s) Phase 2:** X-ray raises suspicion → referral flagged, clock starts → SMS goes unanswered → daughter confirms on his behalf.
4. **(20 s) Phase 3:** check-in reports fever → red alert → worklist line "Call now".
5. **(15 s) Learn:** "What is a bronchoscopy?" → plain-Finnish answer with source.
6. **(20 s) Dashboard:** simulation shows days saved and the 3 recommended Nordic actions.

### 7.3 Build split

| Person | Builds |
| --- | --- |
| 1 | Equity dashboard + simulation (synthetic data, Nordic target lines) |
| 2 | Patient companion web app incl. risk check and warning-sign tap; printable care-plan card |
| 3 | Coordinator worklist, alert rules engine, escalation ladder |
| 4 | Learn knowledge base + 50-question quality check; SMS through a sandbox gateway; FHIR mock-ups |
| All (Saturday) | Check thresholds, ladder timing and outreach rules with Kaisa Kaitila (Medical Affairs) |

## 8. Open questions for mentors

- [ ] Can a "suspected cancer" referral be identified automatically in Finnish patient record systems today?
- [ ] Do wellbeing services counties have a coordinator or contact nurse role that could own the worklist?
- [ ] Can a sender see whether a Suomi.fi message was opened? Answered: yes when read online, no way to know on paper. Design decision below the escalation ladder.
- [ ] Which Finnish time limit should the lung pathway use: STM's 6 weeks, or a Swedish/Norwegian-style per-stage limit? Draft decision in the Scope section; confirm with mentors.
- [ ] Would AstraZeneca use the Pirkanmaa kidney pilot as the model for a follow-up with a county?

## 9. References

1. Ministry of Social Affairs and Health. Kansallinen syöpästrategia 2026–2035, and implementation roadmap 2026–2031 (project documents)
2. Filha. [Valtakunnallinen keuhkosyöpäohjelma 2026–2035 (preprint, May 2026)](https://www.filha.fi/wp-content/uploads/2026/05/Valtakunnallinen-keuhkosyopaohjelma-2026-2035_180526_preprint.pdf)
3. Suomen Syöpäpotilaat. [Kyselyselvitys: joka kolmas syöpäpotilas kokee diagnoosin viivästyneen (2025)](https://www.sttinfo.fi/tiedote/70972938/kyselyselvitys-joka-kolmas-syopapotilas-kokee-diagnoosin-viivastyneen?publisherId=69820264)
4. University of Helsinki. [Miksi Suomessa keuhkosyöpään kuollaan aiemmin kuin Pohjoismaissa?](https://www.helsinki.fi/fi/uutiset/terveys/miksi-suomessa-keuhkosyopaan-kuollaan-aiemmin-kuin-pohjoismaissa)
5. Mattila S. [Keuhkosyövän diagnostinen viive Satakunnassa (University of Turku, 2025)](https://www.utupub.fi/handle/10024/180618)
6. Verkkouutiset. [Keuhkosyöpä todetaan usein liian myöhään (Syöpäjärjestöt report)](https://www.verkkouutiset.fi/a/keuhkosyopa-todetaan-usein-liian-myohaan-vain-joka-neljas-saa-parantavaa-hoitoa/)
7. Zai X et al. [Disparities in cancer incidence, stage at diagnosis, treatment and mortality across socioeconomic groups in Finland. BMJ Public Health 2025](https://www.demogr.mpg.de/en/publications_databases_6118/publications_1904/journal_articles/disparities_in_cancer_incidence_stage_at_diagnosis_treatment_and_mortality_across_socioeconomic_groups_8291/)
8. [Sociodemographic features and patterns of non-participation in colorectal cancer screening in Finland. Eur J Public Health 2021](https://ouci.dntb.gov.ua/works/42LXLNW9)
9. Arctic Today. [Finland is Europe's most digitalised country, but older people are still left behind](https://www.arctictoday.com/finland-is-europes-most-digitalised-country-but-older-people-are-still-left-behind/)
10. City of Helsinki. [Digitalisation and accessibility of public services in Finland and Helsinki](https://kaupunkitieto.hel.fi/en/digitalisation-and-accessibility-of-public-services-in-finland-and-helsinki)
11. DVV. [Suomi.fi-viestit ajanvarauksissa, wellbeing services counties network (March 2026)](https://cdn.verkkopalvelu.suomi.fi/files/Hyvinvointialueiden%20yhteisty%C3%B6verkoston%20kokous%20-%20SFI-viestit%20ajanvarauksissa%2017032026-e1366ee9e9515a7c7ebf3b64eb852e9f.pdf)
12. Pohde. [Sähköisiä ajanvarauskirjeitä pilotoidaan Kempeleessä (2026)](https://www.sttinfo.fi/tiedote/72148837/viranomaispostin-siirtyminen-digitaaliseksi-etenee-pohteella-sahkoisia-ajanvarauskirjeita-pilotoidaan-kempeleessa-176-alkaen?lang=fi)
13. Health Village. [Service providers and partners](https://www.terveyskyla.fi/en/information-about-health-village/health-villages-service-providers-and-partners)
14. Sitra. [Kaiku self-monitoring pilot in North Karelia](https://www.sitra.fi/?p=118869)
15. Soite. [Digipolkujen asiakaspalautteet 2023–2025 (Innokylä)](https://www.innokyla.fi/sites/default/files/2025-12/RRF2_Digipolkujen-asiakaspalautteet_2023-2025.pdf)
16. STM. [Syövän hoidon kehittäminen vuosina 2010–2020 (2010:6)](https://www.iccp-portal.org/system/files/plans/selv_2010_6_syovan_hoito_verkko.pdf)
17. THL. [Hoitoonpääsyn seuranta syövän hoidossa, Ohjaus 21/2016](https://core.ac.uk/download/78470017.pdf)
18. Pirkanmaa wellbeing services county. [Keuhkosyöpäpotilaan hoitopolku](https://pirha.fi/documents/d/kehitysversio/keuhkosyopapotilaan-hoitopolku)
19. RCC Syd. [Cancer Patient Pathways (SVF)](https://cancercentrum.se/syd/regional-cancer-centres/knowledge-based-healthcare/cancer-patient-pathways/)
20. Region Kalmar. [Ledtider SVF-diagnoser 2022](https://vardgivare.regionkalmar.se/globalassets/vard-och-behandling/cancersjukdomar/ledtider-svf-diagnoser-2022.pdf)
21. RCC i samverkan. [Kortare väntetider i cancervården, årsrapport 2024](https://cancercentrum.se/globalassets/om-rcc/samverkan/overenskommelse/bilaga-3-kortare-vantetider-i-cancervarden_arsrapport-2024.pdf)
22. RCC. [Nationellt uppdrag för kontaktsjuksköterska](https://cancercentrum.se/globalassets/patient-och-narstaende/samverkan/kssk/nationellt-uppdrag-for-kontaktsjukskoterska.pdf)
23. RCC Syd. [My Care Plan in Cancer Care](https://cancercentrum.se/syd/regional-cancer-centres/knowledge-based-healthcare/my-care-plan/)
24. Helsedirektoratet. [Inngang til pakkeforløp for lungekreft](https://www.helsedirektoratet.no/nasjonale-forlop/lungekreft/inngang-til-pakkeforlop-for-lungekreft)
25. Helsedirektoratet. [Forløpstid, behandling av lungekreft (revised July 2026)](https://www.helsedirektoratet.no/nasjonale-forlop/lungekreft/behandling-av-lungekreft/forlopstid)
26. [Medical complexity and time to lung cancer treatment, St. Olavs Hospital (Norway national standard 2015)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5240346/)
27. Sundhedsstyrelsen. [Pakkeforløb for lungekræft, patient leaflet](https://www.ft.dk/samling/20171/almdel/SUU/bilag/372/1913632.pdf)
28. Malalasekera A et al. [How long is too long? Health system delays in lung cancer. Eur Respir Rev 2018](https://doi.org/10.1183/16000617.0045-2018)
29. Helsedirektoratet. [Kvalitetsindikator: pakkeforløp for 24 organspesifikke kreftformer](https://www.helsedirektoratet.no/statistikk/kvalitetsindikatorer/kreft-behandling-og-overlevelse/pakkeforl%C3%B8p-for-26-organspesifikke-kreftformer/Pakkeforl%C3%B8p%20for%2024%20organspesifikke%20kreftformer%204.0.pdf)
30. RCC. [SVF lungcancer](https://kunskapsbanken.cancercentrum.se/globalassets/cancerdiagnoser/lunga-och-lungsack/vardforlopp/svf-lungcancer.pdf)
31. Roy Castle Lung Cancer Foundation. [Lung cancer screening given green light (England)](https://roycastle.org/lung-cancer-screening-given-green-light/)
32. HealthDay. [Under current guidelines, most lung cancer patients weren't eligible for screening (2025)](https://www.healthday.com/health-news/cancer/under-current-guidelines-most-lung-cancer-patients-werent-eligible-for-cancer-screening)
33. [Information leaflet to increase prompt help-seeking for gynaecological cancer symptoms (BMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4855769/)
34. [Feasibility of a cancer symptom awareness intervention in deprived communities. BMC Public Health 2018](https://bmcpublichealth.biomedcentral.com/track/pdf/10.1186/s12889-018-5606-3)
35. Pedersen AF et al. [Negative cancer beliefs and anticipated time to help-seeking (ICBP). BMC Cancer 2018](https://orca.cardiff.ac.uk/110555/1/s12885-018-4287-8%20K%20Brain.pdf)
36. [Health literacy and healthcare seeking with lung cancer symptoms, Danish Symptom Cohort II (2024)](https://www.maxapress.com/data/article/ejcc/preview/pdf/10.1155-2024-7919967.pdf)
37. Central Finland wellbeing services county. [Kutsukirjeet Suomi.fi-viesteillä ja tekstiviestimuistutuksella](https://www.sttinfo.fi/tiedote/72398092/keski-suomen-hyvinvointialue-lahettaa-kutsukirjeet-ensisijaisesti-suomifi-viesteilla-ja-tekstiviestimuistutuksella-tarkasta-puhelimesi-asetukset?lang=fi)
38. RCC. [Min vårdplan utredning av misstänkt cancer (2026 draft)](https://cancercentrum.se/download/18.338b7ccc19d8ac2fb505443/1776234909110/Remiss%20Min%20v%C3%A5rdplan%20utredning%20av%20misst%C3%A4nkt%20cancer_Remissversion_20260415.pdf)
39. RCC. [Min vårdplan lungcancer 2.0](https://cancercentrum.se/globalassets/cancerdiagnoser/lunga-och-lungsack/min-vardplan/dokument-2.0-310326/patientinformation/min-vardplan-lungcancer-2.0-for-utskrift.pdf)
40. UNC Gillings School of Global Public Health. [Advanced cancer patients survive longer when given chance to report symptoms (Basch trial)](https://sph.unc.edu/?p=294320)
41. ESMO Congress 2023. [Remote symptom monitoring with ePROs: results from the PRO-TECT trial](https://oncologypro.esmo.org/meeting-resources/esmo-congress-2023/remote-symptom-monitoring-with-electronic-patient-reported-outcomes-epros-during-treatment-for-metastatic-cancer-results-from-the-pro-tect-trial)
42. Oncology Nursing News. [PRO-TECT trial shows ePROs may be feasibly implemented](https://oncnursingnews.com/view/pro-tect-trial-shows-that-epros-may-be-feasibly-implemented-into-routine-oncology-practice)
43. Danish Medical Journal. [Telephone reminders reduce non-attendance, Herlev Hospital](https://www.ugeskriftet.dk/dmj/A5083)
44. Vården.se. [Nationella patientenkäten 2025: cancerpatienter och SVF](https://www.varden.se/blogg/50001-nationella-patientenkaten-2025-sa-upplever-cancerpatienter-standardiserade-vardforlopp)
45. HUS. [Support during cancer treatment (Cancer Hub)](https://hus.fi/en/treatments-and-examinations/support-cancer-treatment)
46. OYS. [Keuhkosyöpäpotilaan hoitopolku](https://ppshp.fi/dokumentit/Ohjeet%20potilaalle%20sislttyyppi/OYS%20keuhkosy%C3%B6p%C3%A4potilaan%20hoitopolku.pdf)
47. Innokylä. [Itse- ja omahoidon tuki Omatietovarannolla ja asiointipalveluilla (2026)](https://www.innokyla.fi/sites/default/files/2026-07/Itse-%20ja%20omahoidon%20tuki%20Omatietovarannolla%20ja%20asiointipalveluilla.pdf)
48. Hankeikkuna. [Government proposal letter on Kanta services (2025)](https://api.hankeikkuna.fi/asiakirjat/7851b6ab-1b8f-44a9-8399-e614d89fd548/efa91f37-a5c1-4f85-8e8c-79d9e4e8dc21/KIRJE_20250402103211.PDF)
49. Kanta. [Informointi potilastietojen saamisesta hyvinvointisovellukseen](https://www.kanta.fi/documents/d/guest/informointi-potilastietojen-saamisesta-hyvinvointisovellukseen)
50. Kanta. [Kanta services in 2026](https://www.kanta.fi/en/ajankohtaista/kanta-services-in-2026-developing-kanta-data-to-better-aid-the-work-of-professionals)
51. Innokylä. [Kansalaisen omien tietojen tallentaminen, EHDS Article 5 (2026)](https://www.innokyla.fi/sites/default/files/2026-02/Kansalaisen%20omien%20tietojen%20tallentaminen.pdf)
52. Kanta. [FHIR technology and Kanta](https://www.kanta.fi/en/fhir-technology-and-kanta)
53. Health Village. [About Omapolku and digital paths](https://www.terveyskyla.fi/en/omapolku/about-omapolku-and-digital-paths)
54. Fimlab. [Chronic kidney disease screening pilot (Pirkanmaa, AstraZeneca)](https://fimlab.fi/?p=17765)
