// Owner: person 4 — .scratch/learn-sms-fhir-voice/spec.md ("Learn (server)" → local corpus)
// Hand-collected plain-language passages from the allowed sources in plan section 4.6:
// Health Village Cancer Hub (Syöpätalo / Terveyskylä.fi), Kaikki syövästä (Syöpäjärjestöt),
// Terveyskirjasto (Duodecim), Finnish Cancer Registry (Syöpärekisteri), FICAN, Kela.
// Each passage: id, language, title, text, source, tags (keywords for retrieval).
// No diagnosis, prognosis (beyond sourced national figures) or dosing.

export type Lang = "fi" | "sv" | "en";

export interface Passage {
  id: string;
  language: Lang;
  title: string;
  text: string;
  source: { label: string; url?: string };
  tags: string[];
}

const SYOPATALO = { label: "Syöpätalo (Cancer Hub), Terveyskylä.fi", url: "https://www.terveyskyla.fi/syopatalo" };
const KAIKKISYOVASTA = { label: "Kaikki syövästä, Syöpäjärjestöt (Finnish Cancer Society)", url: "https://kaikkisyovasta.fi/" };
const TERVEYSKIRJASTO = { label: "Terveyskirjasto, Duodecim medical library", url: "http://www.terveyskirjasto.fi/" };
const SYOPAREKISTERI = { label: "Finnish Cancer Registry (Syöpärekisteri)", url: "https://syoparekisteri.fi/" };
const FICAN = { label: "National Cancer Center FICAN", url: "https://fican.fi/" };
const KELA = { label: "Kela", url: "https://www.kela.fi/" };
const PIRKANMAA = { label: "Pirkanmaa lung cancer pathway", url: "https://pirha.fi/" };

export const LEARN_CORPUS: Passage[] = [
// ---- bronchoscopy (demo question) ----
{ id: "bronchoscopy", language: "en", title: "What is a bronchoscopy?",
  text: "A bronchoscopy is a test that looks inside your breathing tubes. The doctor passes a thin, flexible tube with a small camera on the end through your nose or mouth and into your lungs. It can take small samples of tissue, which are checked in a laboratory. The test usually takes about 15–30 minutes. You are normally awake but relaxed, and your throat is numbed first. You can ask for medicine to help you relax. You usually go home the same day. Arrange for someone to take you home, because you may feel sleepy afterwards.",
  source: SYOPATALO,
  tags: ["bronchoscopy", "bronchoscope", "test", "lungs", "camera", "tube", "biopsy", "sample"] },
{ id: "bronchoscopy", language: "fi", title: "Mikä on keuhkoputkien tähystys?",
  text: "Keuhkoputkien tähystys eli bronkoskopia on tutkimus, jossa katsotaan hengitysteiden sisään. Lääkäri vie ohuen, taipuisan letkun, jonka päässä on pieni kamera, nenän tai suun kautta keuhkoihin. Tutkimuksessa voidaan ottaa pieniä kudosnäytteitä, jotka tutkitaan laboratoriossa. Tutkimus kestää yleensä noin 15–30 minuuttia. Olet yleensä hereillä mutta rentoutunut, ja kurkku puudutetaan ensin. Voit saada rauhoittavaa lääkettä. Yleensä pääset kotiin samana päivänä. Järjestä joku saattamaan sinut kotiin, sillä voit olla unelias tutkimuksen jälkeen.",
  source: SYOPATALO,
  tags: ["bronkoskopia", "tähystys", "keuhkoputket", "kamera", "letku", "näyte", "tutkimus"] },
{ id: "bronchoscopy", language: "sv", title: "Vad är en bronkoskopi?",
  text: "En bronkoskopi är en undersökning där man tittar in i luftvägarna. Läkaren för in ett tunt, böjligt rör med en liten kamera i änden genom näsan eller munnen och ner i lungorna. Undersökningen kan ta små vävnadsprover som undersöks på laboratorium. Den tar oftast 15–30 minuter. Du är vanligtvis vaken men avslappnad, och halsen bedövas först. Du kan få lugnande medicin. Du får oftast åka hem samma dag. Ordna så att någon följer dig hem, eftersom du kan vara trött efteråt.",
  source: SYOPATALO,
  tags: ["bronkoskopi", "luftvägarna", "kamera", "rör", "vävnadsprov", "undersökning"] },

// ---- what is cancer ----
{ id: "cancer", language: "en", title: "What is cancer?",
  text: "Cancer is a disease where some of the body's cells grow and divide in an uncontrolled way. These cells can form a lump, called a tumour, and may spread to other parts of the body. There are many types of cancer. Lung cancer starts in the lungs. Cancer is not an infection and you cannot catch it from someone else. Having cancer does not mean you did anything wrong. Only a doctor can tell you whether you have cancer and what kind it is, using tests and scans.",
  source: KAIKKISYOVASTA,
  tags: ["cancer", "tumour", "tumor", "cells", "disease", "lump", "not infectious", "what is"] },
{ id: "cancer", language: "fi", title: "Mikä on syöpä?",
  text: "Syöpä on sairaus, jossa elimistön solut alkavat kasvaa ja jakautua hallitsemattomasti. Solut voivat muodostaa kyhmyn, eli kasvaimen, ja levitä muihin kehon osiin. On olemassa monenlaisia syöpiä. Keuhkosyöpä alkaa keuhkoista. Syöpä ei ole tarttuva tauti, etkä voi saada sitä toiselta ihmiseltä. Syöpä ei tarkoita, että olisit tehnyt jotain väärin. Vain lääkäri voi sanoa, onko sinulla syöpää ja millainen se on, tutkimusten ja kuvauksen perusteella.",
  source: KAIKKISYOVASTA,
  tags: ["syöpä", "kasvain", "soluja", "sairaus", "ei tarttuva", "mikä on"] },
{ id: "cancer", language: "sv", title: "Vad är cancer?",
  text: "Cancer är en sjukdom där vissa av kroppens celler växer och delar sig okontrollerat. Cellerna kan bilda en knöl, en tumör, och sprida sig till andra delar av kroppen. Det finns många typer av cancer. Lungcancer börjar i lungorna. Cancer är ingen infektion och du kan inte smitta någon annan. Endast en läkare kan avgöra om du har cancer och vilken typ det är, med hjälp av tester och undersökningar.",
  source: KAIKKISYOVASTA,
  tags: ["cancer", "tumör", "celler", "sjukdom", "knöl", "inte smittsam", "vad är"] },

// ---- lung cancer ----
{ id: "lungcancer", language: "en", title: "What is lung cancer?",
  text: "Lung cancer is a disease where cells in the airways or lung tissue start to multiply uncontrollably and form a tumour. Over time these cells can crowd out healthy tissue, affect breathing and sometimes spread to other parts of the body. Lung cancer is the world's most common cancer. In Finland it is one of the three most common cancers for both women and men, with nearly 3,000 people diagnosed each year. It mainly affects older people — only about 1 in 10 cases is found in people under 60. Localised lung cancer can sometimes be cured with surgery or radiotherapy.",
  source: KAIKKISYOVASTA,
  tags: ["lung cancer", "keuhkosyöpä", "lungcancer", "lungs", "tumour", "common", "older people"] },
{ id: "lungcancer", language: "fi", title: "Mikä on keuhkosyöpä?",
  text: "Keuhkosyöpä on sairaus, jossa hengitysteiden tai keuhkokudoksen solut alkavat lisääntyä hallitsemattomasti ja muodostavat kasvaimen. Ajan myötä nämä solut voivat syrjäyttää tervettä kudosta, häiritä hengitystä ja joissain tapauksissa levitä muihin kehon osiin. Keuhkosyöpä on maailman yleisin syöpä. Suomessa se on kolmen yleisimmän syövän joukossa sekä naisilla että miehillä. Siihen sairastuu vuosittain lähes 3 000 suomalaista. Se on etupäässä iäkkäiden ihmisten tauti: vain 10 prosenttia keuhkosyövistä todetaan alle 60-vuotiailta.",
  source: KAIKKISYOVASTA,
  tags: ["keuhkosyöpä", "keuhkot", "kasvain", "yleisin syöpä", "iäkkäät"] },
{ id: "lungcancer", language: "sv", title: "Vad är lungcancer?",
  text: "Lungcancer är en sjukdom där celler i luftvägarna eller lungvävnaden börjar dela sig okontrollerat och bildar en tumör. Med tiden kan dessa celler tränga undan frisk vävnad, påverka andningen och ibland sprida sig till andra delar av kroppen. Lungcancer är världens vanligaste cancer. I Finland är det en av de tre vanligaste cancerformerna för både kvinnor och män, med nästan 3 000 nya fall varje år. Det drabbar främst äldre personer.",
  source: KAIKKISYOVASTA,
  tags: ["lungcancer", "lungorna", "tumör", "vanligaste cancerformen", "äldre"] },

// ---- symptoms ----
{ id: "symptoms", language: "en", title: "Symptoms of lung cancer",
  text: "Lung cancer often has no symptoms in the early stages, and a tumour can grow large in certain parts of the lungs before causing symptoms. Common first symptoms are a persistent cough that does not go away or gets worse, coughing up blood, shortness of breath, chest or shoulder pain, hoarseness, difficulty swallowing, and recurrent lung infections. If the cancer has spread, general symptoms may include loss of appetite, weakness, fatigue, feverishness and weight loss. These early symptoms are often not recognised as lung cancer. If you notice symptoms that worry you, contact your health centre or nurse.",
  source: KAIKKISYOVASTA,
  tags: ["symptoms", "oireet", "symtom", "cough", "yskä", "breathless", "hengenahdistus", "chest pain", "rintakipu", "blood", "veriyskä", "fatigue", "väsymys", "weight loss"] },
{ id: "symptoms", language: "fi", title: "Keuhkosyövän oireet",
  text: "Keuhkosyöpä on usein oireeton varhaisvaiheessa, ja kasvain voi kasvaa suureksikin tietyissä keuhkojen osissa ennen kuin se aiheuttaa oireita. Tavallisia ensimmäisiä oireita ovat pitkittynyt yskä, joka ei mene ohi tai pahenee, veriset yskökset, hengenahdistus, rintakipu tai olkapääkipu, käheys, nielemisvaikeus ja toistuvat keuhkotulehdukset. Jos syöpä on levinnyt, yleisiä oireita voivat olla ruokahaluttomuus, heikkous, väsymys, kuumeilua ja laihtumista. Jos huomaat sinua huolestuttavia oireita, ota yhteyttä terveysasemaan tai hoitajaan.",
  source: KAIKKISYOVASTA,
  tags: ["oireet", "yskä", "veriset yskökset", "hengenahdistus", "rintakipu", "käheys", "väsymys", "laihtuminen"] },
{ id: "symptoms", language: "sv", title: "Symtom på lungcancer",
  text: "Lungcancer har ofta inga symtom i ett tidigt skede, och en tumör kan växa stor i vissa delar av lungorna innan den ger symtom. Vanliga första symtom är en ihållande hosta som inte går över eller blir värre, att hosta upp blod, andnöd, bröstsmärta eller skuldersmärta, heshet, svårighet att svälja samt återkommande lunginfektioner. Om cancern har spridits kan allmänna symtom vara aptitlöshet, svaghet, trötthet, feber och viktnedgång. Om du märker symtom som oroar dig, kontakta din hälsocentral eller sjuksköterska.",
  source: KAIKKISYOVASTA,
  tags: ["symtom", "hosta", "hosta upp blod", "andnöd", "bröstsmärta", "heshet", "trötthet", "viktnedgång"] },

// ---- warning signs ----
{ id: "warningsigns", language: "en", title: "Warning signs of lung cancer",
  text: "Warning signs of lung cancer include a cough that lasts more than three weeks, coughing up blood, increasing shortness of breath, chest pain, hoarseness and recurring chest infections. If you have any of these, contact your health centre. Coughing up blood is a red-flag sign — seek care the same day. In an emergency call 112; otherwise call 116 117 (Päivystysapu) day or night.",
  source: PIRKANMAA,
  tags: ["warning sign", "varoitusmerkki", "varningstecken", "coughing up blood", "veriyskä", "red flag", "seek care", "112", "116 117"] },
{ id: "warningsigns", language: "fi", title: "Keuhkosyövän varoitusmerkit",
  text: "Keuhkosyövän varoitusmerkkejä ovat yli kolme viikkoa kestänyt yskä, verinen ysköskä, paheneva hengenahdistus, rintakipu, käheys ja toistuvat keuhkotulehdukset. Jos sinulla on näitä, ota yhteyttä terveysasemaan. Verinen ysköskä on punainen lippu — hakeudu hoitoon saman päivän aikana. Hätätilanteessa soita 112, muulloin päivystysapuun 116 117 ympäri vuorokauden.",
  source: PIRKANMAA,
  tags: ["varoitusmerkki", "yskä", "verinen ysköskä", "hengenahdistus", "rintakipu", "112", "116 117"] },
{ id: "warningsigns", language: "sv", title: "Varningstecken vid lungcancer",
  text: "Varningstecken vid lungcancer är en hosta som varar mer än tre veckor, att hosta upp blod, ökande andnöd, bröstsmärta, heshet och återkommande lunginfektioner. Om du har något av dessa, kontakta din hälsocentral. Att hosta upp blod är en varningsflagga — sök vård samma dag. I ett nödläge ring 112, annars jourhjälpen 116 117 dag och natt.",
  source: PIRKANMAA,
  tags: ["varningstecken", "hosta", "hosta upp blod", "andnöd", "bröstsmärta", "112", "116 117"] },

// ---- diagnosis ----
{ id: "diagnosis", language: "en", title: "How lung cancer is diagnosed",
  text: "Lung cancer is most often first seen on a chest X-ray. The exact location and spread of the cancer are then assessed with a CT scan or a PET-CT scan. To confirm cancer and find out its type, a tissue sample is taken — usually during a bronchoscopy (a thin tube passed into the airways) or with a needle guided through the chest wall. Molecular tests may also be done on the tissue to help choose the right drug treatment. Lung cancer is divided into two main groups: non-small cell lung cancer and small cell lung cancer. Blood tests cannot detect lung cancer on their own, but they are used to assess your general health.",
  source: TERVEYSKIRJASTO,
  tags: ["diagnosis", "toteaminen", "toteamande", "chest x-ray", "ct scan", "bronchoscopy", "biopsy", "needle", "non-small cell", "small cell"] },
{ id: "diagnosis", language: "fi", title: "Keuhkosyövän toteaminen",
  text: "Keuhkosyöpä todetaan useimmiten ensin keuhkojen röntgenkuvalla. Syövän tarkempi sijainti ja levinneisyys selvitetään tietokonekerroskuvauksella (TT) tai PET-TT-kuvauksella. Syövän vahvistamiseksi ja tyypin selvittämiseksi otetaan kudosnäyte, yleensä keuhkoputken tähystyksessä tai rintakehän läpi ohjatulla neulalla. Keuhkosyöpä jaetaan ei-pienisoluisiksi ja pienisoluisiksi keuhkosyöviksi.",
  source: TERVEYSKIRJASTO,
  tags: ["toteaminen", "röntgenkuva", "tt-kuvaus", "tähystys", "neula", "kudosnäyte"] },
{ id: "diagnosis", language: "sv", title: "Hur lungcancer diagnostiseras",
  text: "Lungcancer upptäcks oftast först på en bröstrost. Cancerns exakta läge och spridning bedöms sedan med en datortomografi (CT) eller en PET-datortomografi. För att bekräfta cancer och ta reda på vilken typ det är tas ett vävnadsprov, vanligtvis vid en bronkoskopi eller med en nål som förs genom bröstkroppen. Lungcancer delas in i icke-småcellig och småcellig lungcancer.",
  source: TERVEYSKIRJASTO,
  tags: ["diagnostiseras", "bröstrost", "ct", "bronkoskopi", "vävnadsprov", "nål"] },

// ---- treatment ----
{ id: "treatment", language: "en", title: "Treatment of lung cancer",
  text: "Treatment depends on the type of cancer, its stage, your general condition and lung function. Often a combination of approaches is used. Surgery is the only potentially curative treatment and is used for non-small cell lung cancer when possible. Radiotherapy uses high-energy rays and may be used to cure, prolong life or relieve symptoms. Chemotherapy is the main treatment for small cell lung cancer and for widespread non-small cell lung cancer. Targeted medicines are used for tumours with specific molecular changes. Immunotherapy directs your own immune cells to kill cancer cells. For widespread disease, treatment aims to prolong life and relieve symptoms rather than cure.",
  source: KAIKKISYOVASTA,
  tags: ["treatment", "hoito", "behandling", "surgery", "leikkaus", "radiotherapy", "sädehoito", "chemotherapy", "solunsalpaajat", "targeted", "immunotherapy", "immunoterapia"] },
{ id: "treatment", language: "fi", title: "Keuhkosyövän hoito",
  text: "Hoidon valinta riippuu syövän tyypistä, levinneisyysasteesta, yleistilastasi ja keuhkojen kunnossa. Usein käytetään yhdistelmää eri hoitomuodoista. Leikkaus on ainoa mahdollisesti parantava hoitomuoto. Sädehoitoa käytetään parantamiseen, elinajan pidentämiseen tai oireiden lievittämiseen. Solunsalpaajahoidot ovat pääasiallinen hoito pienisoluisessa ja levinneessä ei-pienisoluisessa keuhkosyövässä. Täsmälääkkeitä käytetään kasvaimissa, joissa on tiettyjä molekyylimuutoksia. Immunoterapia ohjaa omia immuunisoluja tappamaan syöpäsoluja.",
  source: KAIKKISYOVASTA,
  tags: ["hoito", "leikkaus", "sädehoito", "solunsalpaajat", "täsmälääkkeet", "immunoterapia"] },
{ id: "treatment", language: "sv", title: "Behandling av lungcancer",
  text: "Behandlingen beror på cancertypen, spridningsgraden, ditt allmäntillstånd och lungfunktionen. Kirurgi är den enda potentiellt botande behandlingen. Strålbehandling kan användas för att bota, förlänga livet eller lindra symtom. Kemoterapi är huvudbehandling för småcellig lungcancer och utbredd icke-småcellig lungcancer. Målriktade läkemedel används vid specifika molekylära förändringar. Immunoterapi styr dina egna immunceller att döda cancerceller.",
  source: KAIKKISYOVASTA,
  tags: ["behandling", "kirurgi", "strålbehandling", "kemoterapi", "målriktade", "immunoterapi"] },

// ---- prognosis ----
{ id: "prognosis", language: "en", title: "Outlook and survival",
  text: "The outlook depends on the stage at diagnosis, your age, sex and general condition. Lung cancer has among the lowest 5-year survival rates, but it is improving slightly. In Finland about 13% of men and 21% of women are alive five years after diagnosis. If the cancer is found early and treated with surgery or curative radiotherapy, about 84% are alive after 12 months. With palliative or life-prolonging treatment, about 40% are alive after 12 months. Only your care team can give you a personal outlook based on your situation.",
  source: SYOPAREKISTERI,
  tags: ["prognosis", "ennuste", "prognos", "survival", "elossaolo", "överlevnad", "5-year", "5 vuoden", "5-års", "curative", "palliative"] },
{ id: "prognosis", language: "fi", title: "Ennuste ja elossaolo",
  text: "Ennuste riippuu taudin vaiheesta diagnoosin hetkellä, iästä, sukupuolesta ja yleisestä kunnosta. Keuhkosyövällä on yksi alhaisimmista viiden vuoden elossaololuvuista, mutta se on parantunut hieman. Suomessa noin 13 prosenttia miehistä ja 21 prosenttia naisista on elossa viisi vuotta diagnoosin jälkeen. Vain hoitotiimisi voi antaa sinulle henkilökohtaisen arvion tilanteestasi.",
  source: SYOPAREKISTERI,
  tags: ["ennuste", "elossaolo", "viiden vuoden", "diagnoosi", "hoitotiimi"] },
{ id: "prognosis", language: "sv", title: "Prognos och överlevnad",
  text: "Prognosen beror på sjukdomsstadiet vid diagnosen, din ålder, kön och allmäntillstånd. Lungcancer har bland de lägsta fem-årsöverlevnaderna, men den förbättras något. I Finland är cirka 13 procent av männen och 21 procent av kvinnorna i livet fem år efter diagnosen. Endast ditt vårdteam kan ge dig en personlig prognos baserad på din situation.",
  source: SYOPAREKISTERI,
  tags: ["prognos", "överlevnad", "fem år", "diagnos", "vårdteam"] },

// ---- risk factors ----
{ id: "risk", language: "en", title: "What causes lung cancer?",
  text: "Smoking is the most common cause of lung cancer — about 90% of lung cancers are due to smoking. Tobacco smoke contains over 5,000 chemical compounds, at least 60 of which are carcinogenic. A smoker's risk of lung cancer is 15–30 times higher than that of a never-smoker. About 1 in 10 lung cancer patients has never smoked. Passive smoking increases risk 2–3 fold. Quitting smoking reduces risk; after 10 years the risk is significantly lower. Other risk factors include radon, asbestos, arsenic, nickel and chromium compounds, COPD and previous tuberculosis.",
  source: KAIKKISYOVASTA,
  tags: ["risk", "riskitekijä", "riskfaktor", "smoking", "tupakointi", "rökning", "smoker", "quit smoking", "radon", "asbestos", "asbesti", "cause", "aiheuttaja", "orsak"] },
{ id: "risk", language: "fi", title: "Keuhkosyövän riskitekijät",
  text: "Tupakointi on yleisin syy keuhkosyöpään — noin 90 prosenttia keuhkosyövistä johtuu tupakoinnista. Tupakansavu sisältää yli 5 000 kemiallista yhdistettä, joista vähintään 60 on syöpää aiheuttavia. Tupakoijan riski sairastua keuhkosyöpään on 15–30 kertaa suurempi kuin tupakoimattoman. Noin 1 kymmenestä keuhkosyöpäpotilaasta ei ole koskaan tupakoinut. Passiivinen tupakointi lisää riskiä 2–3-kertaiseksi. Tupakoinnin lopettaminen vähentää riskiä. Muita riskitekijöitä ovat radon, asbesti, arseeni, nikkeli- ja kromiyhdisteet, COPD ja aiempi tuberkuloosi.",
  source: KAIKKISYOVASTA,
  tags: ["riskitekijät", "tupakointi", "lopeta tupakointi", "radon", "asbesti", "passiivinen tupakointi", "syyt"] },
{ id: "risk", language: "sv", title: "Vad orsakar lungcancer?",
  text: "Rökning är den vanligaste orsaken till lungcancer — cirka 90 procent av all lungcancer beror på rökning. Tobaksrök innehåller över 5 000 kemiska föreningar, varav minst 60 är cancerframkallande. En rökares risk att drabbas av lungcancer är 15–30 gånger högre än en icke-rökares. Cirka 1 av 10 lungcancerpatienter har aldrig rökt. Passiv rökning ökar risken 2–3 gånger. Att sluta röka minskar risken. Andra riskfaktorer är radon, asbest, arsennik, nickel- och kromföreningar, KOL och tidigare tuberkulos.",
  source: KAIKKISYOVASTA,
  tags: ["riskfaktorer", "rökning", "sluta röka", "radon", "asbest", "passiv rökning", "orsaker"] },

// ---- 6-week goal ----
{ id: "pathway", language: "en", title: "The 6-week treatment goal",
  text: "The national goal is that cancer treatment starts within 6 weeks of the referral. The clock starts on the day the referral is sent. Your care team will tell you each next step and how to prepare. If you have not heard anything and are worried, call your nurse.",
  source: FICAN,
  tags: ["referral", "lähete", "remiss", "6 weeks", "6 viikkoa", "6 veckor", "treatment goal", "pathway", "lung clinic"] },
{ id: "pathway", language: "fi", title: "Hoito aloitetaan 6 viikossa",
  text: "Kansallinen tavoite on, että syövän hoito aloitetaan 6 viikon kuluessa lähetteen lähettämisestä. Aika lasketaan lähetteen lähettämispäivästä. Hoitotiimisi kertoo jokaisesta seuraavasta vaiheesta ja siitä, miten voit valmistautua. Jos et ole kuullut mitään ja olet huolissasi, soita hoitajalle.",
  source: FICAN,
  tags: ["lähete", "6 viikkoa", "hoito", "hoitotiimi", "keuhkoklinikka"] },
{ id: "pathway", language: "sv", title: "Behandling inom 6 veckor",
  text: "Det nationella målet är att cancerbehandlingen påbörjas inom 6 veckor från remissen. Tiden räknas från dagen då remissen skickas. Ditt vårdteam berättar om varje nästa steg och hur du ska förbereda dig. Om du inte har hört något och är orolig, ring din sjuksköterska.",
  source: FICAN,
  tags: ["remiss", "6 veckor", "behandling", "vårdteam", "lungklinik"] },

// ---- Kela travel reimbursement ----
{ id: "kela", language: "en", title: "Travel costs to appointments",
  text: "If you need help getting to appointments, you can ask about Kela travel reimbursement for a taxi. Kela can cover travel costs to treatments and examinations when you cannot use public transport for health reasons. Appointments are also sent to Suomi.fi Messages.",
  source: KELA,
  tags: ["kela", "travel", "taxi", "matka", "taksi", "resa", "matkakorvaus", "reseersättning", "suomi.fi"] },
{ id: "kela", language: "fi", title: "Matkakorvaus sairaalakäynneille",
  text: "Jos tarvitset apua pääsemään sairaalakäynneille, voit kysyä Kelan matkakorvausta taksille. Kela voi korvata hoito- ja tutkimusmatkojen kuluja, kun et voi käyttää julkisia kulkuvälineitä terveyssyistä. Ajanvaraukset lähetetään myös Suomi.fi-viesteihin.",
  source: KELA,
  tags: ["kela", "matkakorvaus", "taksi", "sairaalakäynti", "suomi.fi"] },
{ id: "kela", language: "sv", title: "Reseersättning för besök",
  text: "Om du behöver hjälp att ta dig till besöken, kan du fråga efter Kelas reseersättning för taxi. Kela kan ersätta resekostnader för behandlingar och undersökningar när du inte kan använda kollektivtrafiken av hälsoskäl. Tider skickas också till Suomi.fi-meddelanden.",
  source: KELA,
  tags: ["kela", "reseersättning", "taxi", "besök", "suomi.fi"] },

// ---- hospital visit ----
{ id: "visit", language: "en", title: "What to bring to a hospital visit",
  text: "For hospital visits, bring your Kela card or ID, a list of your medicines, and any letters you have received. Wear loose, comfortable clothes. If you are having sedation, arrange for someone to take you home and stay with you. You should not drive for 24 hours afterwards.",
  source: SYOPATALO,
  tags: ["bring", "visit", "käynti", "appointment", "kela card", "kela-kortti", "medicines", "what to bring"] },
{ id: "visit", language: "fi", title: "Mitä mukaan sairaalakäynnille",
  text: "Ota sairaalakäynnille mukaan Kela-kortti tai henkilötodistus, lista lääkkeistäsi ja saamasi kirjeet. Pue ylle väljät ja mukavat vaatteet. Jos saat rauhoittavaa lääkettä, järjestä joku viemään sinut kotiin ja olemaan kanssasi. Et saa ajaa autoa 24 tuntiin tutkimuksen jälkeen.",
  source: SYOPATALO,
  tags: ["mukaan", "sairaalakäynti", "kela-kortti", "lääkkeet", "vaatteet"] },
{ id: "visit", language: "sv", title: "Vad du ska ta med till sjukhusbesöket",
  text: "Ta med ditt Kela-kort eller din legitimation, en lista över dina mediciner och de brev du har fått till sjukhusbesöket. Ha på dig lösa, bekväma kläder. Om du får lugnande medicin, ordna så att någon följer dig hem och stannar hos dig. Du får inte köra bil på 24 timmar efteråt.",
  source: SYOPATALO,
  tags: ["ta med", "sjukhusbesök", "kela-kort", "mediciner", "kläder"] },

// ---- medicines ----
{ id: "medicines", language: "en", title: "Your medicines",
  text: "Your medicine list comes from your prescriptions in Kanta. In this demo, that link is a FHIR mock-up, not a real connection. Take your medicines exactly as your doctor prescribed. If you miss a dose, do not take two at once — call your nurse or pharmacy for advice. Bring an up-to-date list of your medicines to every visit.",
  source: { label: "HUS patient guidance / Kanta (FHIR mock-up)", url: "https://www.hus.fi/en" },
  tags: ["medicines", "lääkkeet", "mediciner", "kanta", "prescription", "resepti", "recept", "dose", "annos", "dos"] },
{ id: "medicines", language: "fi", title: "Lääkkeesi",
  text: "Lääkelistasi tulee Kanta-palvelun resepteistä. Tässä demossa yhteys on FHIR-mallinnus, ei oikea yhteys. Ota lääkkeet juuri niin kuin lääkäri on määrännyt. Jos unohdat annoksen, älä ota kahta kerralla — kysy neuvoa hoitajalta tai apteekista. Ota ajantasainen lääkelista mukaan jokaiselle käynnille.",
  source: { label: "HUS patient guidance / Kanta (FHIR mock-up)", url: "https://www.hus.fi/en" },
  tags: ["lääkkeet", "lääkelista", "kanta", "resepti", "annos", "apteekki"] },
{ id: "medicines", language: "sv", title: "Dina mediciner",
  text: "Din läkemedelslista kommer från dina recept i Kanta. I den här demon är kopplingen en FHIR-attrapp, inte en riktig anslutning. Ta dina mediciner precis som läkaren har ordinerat. Om du missar en dos, ta inte två på en gång — fråga din sjuksköterska eller ditt apotek. Ta med en uppdaterad läkemedelslista till varje besök.",
  source: { label: "HUS patient guidance / Kanta (FHIR mock-up)", url: "https://www.hus.fi/en" },
  tags: ["mediciner", "läkemedelslista", "kanta", "recept", "dos", "apotek"] },

// ---- support ----
{ id: "support", language: "en", title: "Support and someone with you",
  text: "You do not have to go through this alone. You can bring someone you trust to appointments, and they can help you confirm appointments or send a check-in for you if you ask them to. Peer support is available through the Cancer Society of Finland and Terveyskylä's Vertaistalo. Your nurse can also tell you about local support groups. If you feel low or anxious, tell your care team. Help is part of your care.",
  source: KAIKKISYOVASTA,
  tags: ["support", "tuki", "stöd", "someone with you", "läheinen", "närstående", "peer support", "vertaistuki", "alone"] },
{ id: "support", language: "fi", title: "Tuki ja joku mukana",
  text: "Sinun ei tarvitse käydä tätä läpi yksin. Voit ottaa mukaan jonkun, johon luotat, ja hän voi pyynnöstäsi auttaa ajanvarausten vahvistamisessa tai lähettää puolestasi check-inin. Vertaisukea saat Suomen Syöpäpotilaat ry:ltä ja Terveyskylän Vertaistalosta. Hoitajasi voi kertoa myös paikallisista tukiryhmistä. Jos mielesi on matalalla tai olet ahdistunut, kerro hoitotiimillesi.",
  source: KAIKKISYOVASTA,
  tags: ["tuki", "läheinen", "mukaan", "yksin", "vertaistuki", "tukiryhmä"] },
{ id: "support", language: "sv", title: "Stöd och någon med dig",
  text: "Du behöver inte gå igenom detta ensam. Du kan ta med någon du litar på till tiderna, och de kan hjälpa dig att bekräfta tider eller skicka en check-in åt dig om du ber dem. Kamratstöd finns via Finlands Cancerpatienter och Terveyskyläs Vertaistalo. Din sjuksköterska kan också berätta om lokala stödgrupper. Om du känner dig nedstämd eller orolig, berätta det för ditt vårdteam.",
  source: KAIKKISYOVASTA,
  tags: ["stöd", "närstående", "med dig", "ensam", "kamratstöd", "stödgrupp"] },
];

export function findPassages(question: string, language: Lang): Passage[] {
  const q = question.toLowerCase();
  const scored = LEARN_CORPUS
    .filter((p) => p.language === language)
    .map((p) => {
      let score = 0;
      for (const tag of p.tags) {
        if (q.includes(tag.toLowerCase())) score += 1;
      }
      // boost exact id/title words
      if (q.includes(p.id.toLowerCase())) score += 2;
      if (q.includes(p.title.toLowerCase())) score += 3;
      return { passage: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((x) => x.passage);
}
