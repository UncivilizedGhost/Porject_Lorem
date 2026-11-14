// Every user-visible string of the app, in English, Finnish and Swedish. One row per message:
// [English, Finnish, Swedish]. Server-provided content (symptom names, question prompts, pathway
// step names, medicine labels, Learn answers) stays as the API sends it; this covers the app's
// own words — headings, buttons, notes and errors.
export type UiLanguage = "en" | "fi" | "sv";

const INDEX: Record<UiLanguage, 0 | 1 | 2> = { en: 0, fi: 1, sv: 2 };

/** Records and old stored settings can carry a language outside the three the app translates. */
export function isUiLanguage(value: unknown): value is UiLanguage {
  return value === "en" || value === "fi" || value === "sv";
}

export const MESSAGES = {
  "nav.home": ["Home", "Etusivu", "Hem"],
  "nav.pathway": ["Pathway", "Hoitopolku", "Vårdväg"],
  "nav.medicines": ["Medicines", "Lääkkeet", "Läkemedel"],
  "nav.learn": ["Learn", "Opi", "Lär dig"],

  "common.back": ["Back", "Takaisin", "Tillbaka"],
  "common.readAloud": ["Read aloud", "Lue ääneen", "Läs högt"],
  "common.settings": ["Text size and settings", "Tekstikoko ja asetukset", "Textstorlek och inställningar"],
  "common.help": ["Help", "Apua", "Hjälp"],
  "common.loading": ["Loading…", "Ladataan…", "Laddar…"],
  "common.next": ["Next", "Seuraava", "Nästa"],
  "common.previous": ["Previous", "Edellinen", "Föregående"],
  "common.saved": ["Saved", "Tallennettu", "Sparat"],
  "common.home": ["Home", "Etusivu", "Hem"],

  "login.title": [
    "Lung cancer pathway support for Western Uusimaa",
    "Keuhkosyövän hoitopolun tuki Länsi-Uudellamaalla",
    "Stöd för lungcancervårdförloppet i Västra Nyland",
  ],
  "login.patient": ["Patient", "Potilas", "Patient"],
  "login.support": ["Support person", "Läheinen", "Närstående"],
  "login.note": [
    "Coordinator nurse and county decision-maker are not part of this demo.",
    "Koordinaattihoitaja ja hyvinvointialueen päättäjä eivät kuulu tähän demoon.",
    "Koordinerande sjuksköterska och beslutsfattare ingår inte i den här demon.",
  ],
  "login.error": [
    "We could not connect. Please try again.",
    "Yhteyttä ei saatu. Yritä uudelleen.",
    "Vi kunde inte ansluta. Försök igen.",
  ],

  "home.morning": ["Good morning", "Hyvää huomenta", "God morgon"],
  "home.afternoon": ["Good afternoon", "Hyvää päivää", "God eftermiddag"],
  "home.evening": ["Good evening", "Hyvää iltaa", "God kväll"],
  "home.status.on_track": [
    "Your tests are going as planned",
    "Tutkimuksesi etenevät suunnitellusti",
    "Dina undersökningar går enligt planen",
  ],
  "home.status.running_late": [
    "Running late, Nurse Aino knows",
    "Aikataulu on venynyt, hoitaja Aino tietää",
    "Det är försenat, sjuksköterska Aino vet",
  ],
  "home.nextStep": ["Your next step", "Seuraava vaiheesi", "Ditt nästa steg"],
  "home.howToGetThere": [
    "How to get there and what to bring",
    "Miten pääset perille ja mitä ottaa mukaan",
    "Hur du tar dig dit och vad du ska ta med",
  ],
  "home.notConfirmed": ["Not confirmed yet", "Ei vielä vahvistettu", "Inte bekräftad än"],
  "home.confirm": ["Confirm appointment", "Vahvista aika", "Bekräfta tiden"],
  "home.reportTitle": ["Report a symptom", "Ilmoita oireesta", "Rapportera ett symtom"],
  "home.reportSub": ["Tell Nurse Aino", "Kerro hoitaja Ainolle", "Berätta för sjuksköterska Aino"],
  "home.callTitle": ["Call Nurse Aino", "Soita hoitaja Ainolle", "Ring sjuksköterska Aino"],
  "home.callSub": ["Weekdays 8–16", "Arkisin 8–16", "Vardagar 8–16"],
  "home.checkinTitle": ["Weekly check-in", "Viikkotarkistus", "Veckokoll"],
  "home.checkinSub": ["A few questions · 3 min", "Muutama kysymys · 3 min", "Några frågor · 3 min"],
  "home.checkinSubCount": ["{n} questions · 3 min", "{n} kysymystä · 3 min", "{n} frågor · 3 min"],
  "home.readableNext": [" Next: {what}, {when}, {where}.", " Seuraavaksi: {what}, {when}, {where}.", " Härnäst: {what}, {when}, {where}."],

  "pathway.title": ["Your pathway", "Hoitopolkusi", "Din vårdväg"],
  "pathway.jump": ["Go to the current step", "Siirry nykyiseen vaiheeseen", "Gå till det aktuella steget"],
  "pathway.week": ["Week {n}", "Viikko {n}", "Vecka {n}"],
  "pathway.by": ["By {date}", "{date} mennessä", "Senast {date}"],
  "pathway.allDone": ["All steps done", "Kaikki vaiheet tehty", "Alla steg klara"],
  "pathway.usually": ["Usually {date}", "Yleensä {date}", "Vanligen {date}"],
  "pathway.next": ["Next", "Seuraava", "Nästa"],
  "pathway.goal": [
    "If you need treatment, it starts within 6 weeks of your referral.",
    "Jos tarvitset hoitoa, se alkaa 6 viikon kuluessa lähetteestäsi.",
    "Om du behöver behandling börjar den inom 6 veckor från din remiss.",
  ],

  "medicines.title": ["Medicines today", "Tämän päivän lääkkeet", "Dagens läkemedel"],
  "medicines.sub": [
    "From your prescriptions in Kanta (FHIR mock-up)",
    "Kanta-reseptistäsi (FHIR-havainnollistus)",
    "Från dina recept i Kanta (FHIR-demo)",
  ],
  "medicines.readBody": [
    "From your prescriptions in Kanta. For each medicine: I took it, I skipped it or Side effect.",
    "Kanta-reseptistäsi. Jokaisesta lääkkeestä: otin sen, jätin sen väliin tai haittavaikutus.",
    "Från dina recept i Kanta. För varje läkemedel: jag tog den, jag hoppade över den eller biverkning.",
  ],
  "medicines.empty": ["No medicines right now.", "Ei lääkkeitä juuri nyt.", "Inga läkemedel just nu."],
  "medicines.withBreakfast": ["With breakfast", "Aamiaisen kanssa", "Till frukost"],
  "medicines.withDinner": ["With dinner", "Päivällisen kanssa", "Till middag"],
  "medicines.whenNeeded": ["When needed", "Tarvittaessa", "Vid behov"],
  "medicines.taken": ["Taken", "Otettu", "Tagen"],
  "medicines.skipped": ["Skipped", "Väliin jätetty", "Hoppat över"],
  "medicines.sideEffectNoted": ["Side effect noted", "Haittavaikutus kirjattu", "Biverkning noterad"],
  "medicines.logged": ["{status} at {time}", "{status} klo {time}", "{status} kl. {time}"],
  "medicines.took": ["I took it", "Otin sen", "Jag tog den"],
  "medicines.iSkipped": ["I skipped it", "Jätin sen väliin", "Jag hoppade över den"],
  "medicines.sideEffect": ["Side effect", "Haittavaikutus", "Biverkning"],
  "medicines.failed": [
    "Could not save. Please try again.",
    "Tallennus ei onnistunut. Yritä uudelleen.",
    "Kunde inte spara. Försök igen.",
  ],

  "learn.title": ["Ask about care", "Kysy hoidostasi", "Fråga om din vård"],
  "learn.intro": [
    "Ask about tests and what to expect.",
    "Kysy tutkimuksista ja siitä, mitä odottaa.",
    "Fråga om undersökningar och vad du kan vänta dig.",
  ],
  "learn.label": ["Your question", "Kysymyksesi", "Din fråga"],
  "learn.ask": ["Ask", "Kysy", "Fråga"],
  "learn.askVoice": ["Ask by voice", "Kysy puheella", "Fråga med rösten"],
  "learn.prompt": ["What would you like to know?", "Mitä haluat tietää?", "Vad vill du veta?"],
  "learn.suggested": ["Suggested questions", "Ehdotetut kysymykset", "Förslag på frågor"],
  "learn.source": ["Source", "Lähde", "Källa"],
  "learn.readAnswer": ["Read answer", "Lue vastaus", "Läs svaret"],
  "learn.failure": [
    "I could not reach the answer service. Please ask your nurse.",
    "Vastauspalveluun ei saatu yhteyttä. Kysy hoitajalta.",
    "Jag nådde inte svarstjänsten. Fråga din sjuksköterska.",
  ],
  "learn.note": [
    "Answers come only from reviewed Finnish sources. For your own results, ask Nurse Aino.",
    "Vastaukset tulevat vain tarkistetuista suomalaisista lähteistä. Omista tuloksistasi kysy hoitaja Ainolta.",
    "Svaren kommer bara från granskade finländska källor. Fråga din egen sjuksköterska om dina resultat.",
  ],
  "voice.assistantOn": [
    "Voice assistant on. Tap or click anywhere on the screen to have it read out loud.",
    "Ääniavustaja päällä. Napauta tai klikkaa missä tahansa ruudulla saadaksesi sen luettavaksi ääneen.",
    "Röstassistenten är på. Tryck eller klicka var som helst på skärmen för att få det läst högt.",
  ],
  "voice.assistantOff": [
    "Voice assistant off.",
    "Ääniavustaja pois käytöstä.",
    "Röstassistenten är avstängd.",
  ],

  "settings.title": ["Make it easier to use", "Helpota käyttöä", "Gör det lättare att använda"],
  "settings.readBody": [
    "Language, reading speed, appearance and voice. Staff at your health station can switch these on for you.",
    "Kieli, lukunopeus, ulkoasu ja ääni. Terveysasemasi henkilökunta voi ottaa nämä käyttöön puolestasi.",
    "Språk, läshastighet, utseende och röst. Personalen på din hälsostation kan slå på dessa åt dig.",
  ],
  "settings.language": ["Language", "Kieli", "Språk"],
  "settings.readingSpeed": ["Reading speed", "Lukunopeus", "Läshastighet"],
  "settings.normal": ["Normal", "Normaali", "Normal"],
  "settings.slow": ["Slow", "Hidas", "Långsam"],
  "settings.appearance": ["Appearance", "Ulkoasu", "Utseende"],
  "settings.voiceMode": ["Voice mode", "Äänitila", "Röstläge"],
  "settings.voiceOn": ["Use the app by voice", "Käytä sovellusta puheella", "Använd appen med rösten"],
  "settings.contrast": ["High contrast", "Suuri kontrasti", "Hög kontrast"],
  "settings.contrastOn": ["Stronger contrast", "Vahvempi kontrasti", "Starkare kontrast"],
  "settings.textSize": ["Text size {size}", "Tekstikoko {size}", "Textstorlek {size}"],
  "settings.error": [
    "Your choice is shown here but could not be saved. Please try again.",
    "Valintasi näkyy tässä, mutta sitä ei voitu tallentaa. Yritä uudelleen.",
    "Ditt val visas här men kunde inte sparas. Försök igen.",
  ],
  "settings.note": [
    "Staff at your health station can switch these on for you.",
    "Terveysasemasi henkilökunta voi ottaa nämä käyttöön puolestasi.",
    "Personalen på din hälsostation kan slå på dessa åt dig.",
  ],

  "help.title": ["Who to call", "Kenelle soittaa", "Vem du ska ringa"],
  "help.sub": [
    "Pick the one that matches how you feel right now.",
    "Valitse se, joka vastaa oloasi juuri nyt.",
    "Välj det som passar hur du mår just nu.",
  ],
  "help.call112": ["Call 112", "Soita 112", "Ring 112"],
  "help.sub112": [
    "Emergency: chest pain, heavy bleeding, struggling to breathe",
    "Hätätilanne: rintakipu, runsas verenvuoto, hengitysvaikeus",
    "Akut: bröstsmärta, kraftig blödning, andningssvårigheter",
  ],
  "help.call116": ["Call 116 117", "Soita 116 117", "Ring 116 117"],
  "help.sub116": [
    "Medical helpline: fever, pain, or symptoms getting worse",
    "Terveysneuvonta: kuume, kipu tai pahenevat oireet",
    "Sjukvårdsrådgivning: feber, smärta eller förvärrade symtom",
  ],
  "help.nurse": ["Tell Nurse Aino", "Kerro hoitaja Ainolle", "Berätta för sjuksköterska Aino"],
  "help.nurseSub": [
    "Weekdays 8–16 · she calls you back",
    "Arkisin 8–16 · hän soittaa sinulle takaisin",
    "Vardagar 8–16 · hon ringer tillbaka",
  ],
  "help.note": [
    "If you are not sure, call 116 117. They will tell you what to do next.",
    "Jos et ole varma, soita 116 117. He kertovat, mitä tehdä seuraavaksi.",
    "Om du är osäker, ring 116 117. De berättar vad du ska göra härnäst.",
  ],
  "help.readPriority": [
    "In an emergency call 112. If you suddenly feel much worse, call 116 117.",
    "Hätätilanteessa soita 112. Jos olosi huononee yhtäkkiä, soita 116 117.",
    "Vid akut ring 112. Om du plötsligt blir mycket sämre, ring 116 117.",
  ],

  "checkin.title": ["Weekly check-in", "Viikkotarkistus", "Veckokoll"],
  "checkin.next": ["Next question", "Seuraava kysymys", "Nästa fråga"],
  "checkin.send": ["Send check-in", "Lähetä tarkistus", "Skicka kollen"],
  "checkin.loadError": [
    "Could not load the questions. Please try again.",
    "Kysymyksiä ei voitu ladata. Yritä uudelleen.",
    "Kunde inte ladda frågorna. Försök igen.",
  ],
  "checkin.sendError": [
    "Your check-in could not be sent. If you feel worse, phone 116 117 or 112.",
    "Tarkistusta ei voitu lähettää. Jos olosi huononee, soita 116 117 tai 112.",
    "Kollen kunde inte skickas. Om du blir sämre, ring 116 117 eller 112.",
  ],
  "checkin.thanksTitle": ["Thank you", "Kiitos", "Tack"],
  "checkin.thanksBody": [
    "Your check-in was sent to Nurse Aino. Your next check-in is in about a week.",
    "Tarkistuksesi lähetettiin hoitaja Ainolle. Seuraava tarkistus on noin viikon päästä.",
    "Din koll skickades till sjuksköterska Aino. Nästa koll är om ungefär en vecka.",
  ],
  "checkin.worse": [
    "If you feel worse before the next check-in",
    "Jos olosi huononee ennen seuraavaa tarkistusta",
    "Om du blir sämre före nästa koll",
  ],
  "checkin.thanksNote": [
    "If something changes before your next check-in, report it. Do not wait for the week to pass.",
    "Jos jokin muuttuu ennen seuraavaa tarkistusta, ilmoita siitä. Älä odota viikon loppuun.",
    "Om något förändras före nästa koll, rapportera det. Vänta inte ut veckan.",
  ],

  "report.eyebrow": ["Report a symptom", "Ilmoita oireesta", "Rapportera ett symtom"],
  "report.pickHeading": [
    "What would you like to tell Nurse Aino about?",
    "Mistä haluat kertoa hoitaja Ainolle?",
    "Vad vill du berätta för sjuksköterska Aino om?",
  ],
  "report.pickNote": [
    "Pick the one that bothers you most. You can add more at the end.",
    "Valitse se, joka vaivaa eniten. Voit lisätä muita lopuksi.",
    "Välj det som besvärar dig mest. Du kan lägga till fler i slutet.",
  ],
  "report.urgent": ["Very unwell right now", "Erittäin huonovointinen juuri nyt", "Mycket dålig just nu"],
  "report.other": ["Something else", "Jokin muu", "Något annat"],
  "report.next": ["Next", "Seuraava", "Nästa"],
  "report.voiceHint": [
    "Or hold and say your answer. We read it back before saving.",
    "Tai pidä painettuna ja sano vastauksesi. Luemme sen takaisin ennen tallennusta.",
    "Eller håll intryckt och säg ditt svar. Vi läser upp det före sparning.",
  ],
  "report.moreEyebrow": ["Your report", "Ilmoituksesi", "Din rapport"],
  "report.moreTitle": ["Anything else?", "Tuleeko mieleen muuta?", "Något mer?"],
  "report.moreSub": [
    "Add another symptom, or send what you have to Nurse Aino.",
    "Lisää toinen oire tai lähetä nykyiset hoitaja Ainolle.",
    "Lägg till ett symtom till eller skicka det du har till sjuksköterska Aino.",
  ],
  "report.addAnother": ["Add another symptom", "Lisää toinen oire", "Lägg till ett symtom till"],
  "report.thatIsAll": ["No, that's all", "Ei, siinä kaikki", "Nej, det är allt"],
  "report.loadError": [
    "Could not load the questions. Please try again.",
    "Kysymyksiä ei voitu ladata. Yritä uudelleen.",
    "Kunde inte ladda frågorna. Försök igen.",
  ],
  "report.sendError": [
    "Your report could not be sent. If it is urgent, phone 116 117 or 112.",
    "Ilmoitusta ei voitu lähettää. Jos asia on kiireellinen, soita 116 117 tai 112.",
    "Rapporten kunde inte skickas. Om det är brådskande, ring 116 117 eller 112.",
  ],
  "report.callError": [
    "Your report could not be sent, but you can still call now.",
    "Ilmoitusta ei voitu lähettää, mutta voit silti soittaa heti.",
    "Rapporten kunde inte skickas, men du kan fortfarande ringa nu.",
  ],
  "report.r1Heading": [
    "Is any of this happening right now?",
    "Tapahtuuko jokin näistä juuri nyt?",
    "Händer något av detta just nu?",
  ],
  "report.r1Body": [
    "Tap what is happening, or None of these.",
    "Napauta sitä, mitä tapahtuu, tai Ei mikään näistä.",
    "Tryck på det som händer, eller Inget av dessa.",
  ],
  "report.r1Notice": [
    "This is not an emergency service. A nurse replies within 1–2 working days. For urgent help phone 116 117 or 112.",
    "Tämä ei ole hätäpalvelu. Hoitaja vastaa 1–2 arkipäivässä. Kiireellisessä asiassa soita 116 117 tai 112.",
    "Detta är inte en akuttjänst. En sjuksköterska svarar inom 1–2 vardagar. Vid brådskande behov ring 116 117 eller 112.",
  ],
  "report.none": ["None of these", "Ei mikään näistä", "Inget av dessa"],
  "report.ownEyebrow": ["Almost done", "Melkein valmis", "Nästan klar"],
  "report.ownTitle": [
    "Anything to add in your own words?",
    "Haluatko lisätä jotain omin sanoin?",
    "Något att tillägga med egna ord?",
  ],
  "report.ownBubble": [
    "You said. Tap the text to change it.",
    "Sanoit näin. Muuta napauttamalla tekstiä.",
    "Du sa så här. Ändra genom att trycka på texten.",
  ],
  "report.ownPlaceholder": [
    "Type here, or tap the microphone",
    "Kirjoita tähän tai napauta mikrofonia",
    "Skriv här eller tryck på mikrofonen",
  ],
  "report.speak": ["Tap to speak", "Puhu napauttamalla", "Tala genom att trycka"],
  "report.speakStop": ["Release to stop", "Irrota lopettaaksesi", "Släpp för att stoppa"],
  "report.listening": ["Listening…", "Kuuntelen…", "Lyssnar…"],
  "report.speakSub": [
    "Or tap the text to type",
    "Tai napauta tekstiä kirjoittaaksesi",
    "Eller tryck på texten för att skriva",
  ],
  "report.sendReport": ["Send to Nurse Aino", "Lähetä hoitaja Ainolle", "Skicka till sjuksköterska Aino"],
  "report.skip": ["Skip this step", "Ohita tämä vaihe", "Hoppa över det här steget"],
  "report.sentTitle": ["Sent to Nurse Aino", "Lähetetty hoitaja Ainolle", "Skickat till sjuksköterska Aino"],
  "report.sentBody": [
    "A nurse reads your answers and replies within 1–2 working days.",
    "Hoitaja lukee vastauksesi ja vastaa 1–2 arkipäivässä.",
    "En sjuksköterska läser dina svar och svarar inom 1–2 vardagar.",
  ],
  "report.meanwhile": ["Meanwhile", "Sillä välin", "Under tiden"],
  "report.amber": [
    "Getting worse? Call 116 117. Emergency: 112.",
    "Paheniko? Soita 116 117. Hätätilanne: 112.",
    "Förvärras det? Ring 116 117. Akut: 112.",
  ],
  "report.whoToCall": ["Who to call", "Kenelle soittaa", "Vem du ska ringa"],
  "report.comeNow": ["Please call now.", "Soita heti.", "Ring nu."],
  "report.callReason": ["You told us: {reason}. ", "Kerroit meille: {reason}. ", "Du berättade: {reason}. "],
  "report.callVeryUnwell": [
    "You told us you are very unwell. ",
    "Kerroit, että olet erittäin huonovointinen. ",
    "Du berättade att du mår mycket dåligt. ",
  ],
  "report.callChecked": [
    "This needs to be checked today.",
    "Tämä pitää tutkia tänään.",
    "Detta behöver undersökas i dag.",
  ],
  "report.call112sub": [
    "If it feels like an emergency",
    "Jos kyseessä on hätätilanne",
    "Om det känns akut",
  ],
  "report.call116sub": ["Medical helpline", "Terveysneuvonta", "Sjukvårdsrådgivning"],
  "report.orGo": [
    "Or go to the nearest emergency department.",
    "Tai mene lähimpään päivystykseen.",
    "Eller åk till närmaste akutmottagning.",
  ],
  "report.toldAino": [
    "We have told Nurse Aino too.",
    "Olemme kertoneet myös hoitaja Ainolle.",
    "Vi har även meddelat sjuksköterska Aino.",
  ],

  "signs.title": [
    "Choose all symptoms which apply to you",
    "Valitse kaikki oireet, jotka koskevat sinua",
    "Välj alla symtom som stämmer för dig",
  ],
  "signs.body": [
    "Tap each symptom that applies to you. Tap again to deselect. Then tap Continue.",
    "Napauta kutakin sinua koskevaa oiretta. Napauta uudelleen poistaaksesi valinnan. Siirry sitten eteenpäin painikkeella Jatka.",
    "Tryck på varje symtom som stämmer för dig. Tryck igen för att avmarkera. Tryck sedan på Fortsätt.",
  ],
  "signs.none": [
    "None of these apply to me",
    "Yksikään näistä ei koske minua",
    "Inget av dessa stämmer för mig",
  ],
  "signs.sent": [
    "Sent. Nurse Aino will call you.",
    "Lähetetty. Hoitaja Aino soittaa sinulle.",
    "Skickat. Sjuksköterska Aino ringer dig.",
  ],
  "signs.redTitle": ["Seek care today", "Hakeudu hoitoon tänään", "Sök vård i dag"],
  "signs.redBody": [
    "Do not wait for a call. Phone now.",
    "Älä odota soittoa. Soita nyt.",
    "Vänta inte på ett samtal. Ring nu.",
  ],
  "signs.submit": [
    "Submit symptoms",
    "Lähetä oireet",
    "Skicka symtom",
  ],
  "signs.error": [
    "We could not send that. Please try again.",
    "Lähetys ei onnistunut. Yritä uudelleen.",
    "Det kunde inte skickas. Försök igen.",
  ],
  "signs.loadError": [
    "We could not load the list. Please try again.",
    "Listaa ei voitu ladata. Yritä uudelleen.",
    "Listan kunde inte laddas. Försök igen.",
  ],
  "signs.readPriority": [
    "Seek care today. Call 112 or 116 117.",
    "Hakeudu hoitoon tänään. Soita 112 tai 116 117.",
    "Sök vård i dag. Ring 112 eller 116 117.",
  ],

  "trusted.title": ["Helping the patient", "Autat potilasta", "Du hjälper patienten"],
  "trusted.body": [
    "Appointments and confirmations you can help with.",
    "Ajat ja vahvistukset, joissa voit auttaa.",
    "Tider och bekräftelser du kan hjälpa till med.",
  ],
  "trusted.pending": ["He hasn't confirmed yet", "Hän ei ole vielä vahvistanut", "Hen har inte bekräftat än"],
  "trusted.confirmed": ["Confirmed", "Vahvistettu", "Bekräftad"],
  "trusted.confirm": [
    "Confirm appointment for them",
    "Vahvista aika hänen puolestaan",
    "Bekräfta tiden för hen",
  ],
  "trusted.note": [
    "If he does not answer, the reminders escalate: a message and text on day 0, an automated call on day 2, and Nurse Aino calls on day 3.",
    "Jos hän ei vastaa, muistutukset etenevät: viesti ja tekstiviesti päivänä 0, automaattinen soitto päivänä 2 ja hoitaja Aino soittaa päivänä 3.",
    "Om hen inte svarar trappas påminnelserna uupp: meddelande och sms dag 0, automatiskt samtal dag 2 och sjuksköterska Aino ringer dag 3.",
  ],
  "trusted.report": [
    "Report a symptom for him",
    "Ilmoita oireesta hänen puolestaan",
    "Rapportera ett symtom för hen",
  ],
  "trusted.reportSub": [
    "Saved as reported by you",
    "Tallennetaan sinun ilmoittamanasi",
    "Sparas som rapporterat av dig",
  ],
  "trusted.callSub": [
    "His nurse, weekdays 8–16",
    "Hänen hoitajansa, arkisin 8–16",
    "Hens sjuksköterska, vardagar 8–16",
  ],
  "trusted.privacy": [
    "You see appointments and confirmations only. Everything you do is shown to the nurse with your name.",
    "Näet vain ajat ja vahvistukset. Kaikki tekemäsi näkyy hoitajalle nimelläsi.",
    "Du ser bara tider och bekräftelser. Allt du gör visas för sjuksköterskan med ditt namn.",
  ],

  "confirm.heading": ["Confirm your {what}", "Vahvista: {what}", "Bekräfta: {what}"],
  "confirm.eyebrow": [
    "Please confirm you can come",
    "Vahvista, että pääset tulemaan",
    "Bekräfta att du kan komma",
  ],
  "confirm.note": [
    "If we don't hear from you, an automated call comes on day 2 and Nurse Aino calls on day 3.",
    "Jos emme kuule sinusta, automaattinen soitto tulee päivänä 2 ja hoitaja Aino soittaa päivänä 3.",
    "Om vi inte hör av dig kommer ett automatiskt samtal dag 2 och sjuksköterska Aino ringer dag 3.",
  ],
  "confirm.newTime": ["I need a new time", "Tarvitsen uuden ajan", "Jag behöver en ny tid"],
  "confirm.failed": [
    "We could not confirm this just now. Please try again.",
    "Vahvistus ei onnistunut juuri nyt. Yritä uudelleen.",
    "Vi kunde inte bekräfta just nu. Försök igen.",
  ],
  "confirm.doneTitle": ["Confirmed", "Vahvistettu", "Bekräftat"],
  "confirm.doneBody": [
    "Thank you. There will be no more reminders or calls about this step.",
    "Kiitos. Tästä vaiheesta ei tule enää muistutuksia tai soittoja.",
    "Tack. Det kommer inte fler påminnelser eller samtal om det här steget.",
  ],
  "confirm.done": ["Done", "Valmis", "Klar"],
  "confirm.slide": ["Slide to confirm", "Liu'uta vahvistaaksesi", "Skjut för att bekräfta"],
  "confirm.tap": [
    "Or tap here to confirm",
    "Tai napauta tästä vahvistaaksesi",
    "Eller tryck här för att bekräfta",
  ],

  "risk.label": ["Screening check", "Seulontatarkistus", "Screeningkontroll"],
  "risk.consentTitle": ["May a nurse contact you?", "Saako hoitaja ottaa sinuun yhteyttä?", "Får en sjuksköterska kontakta dig?"],
  "risk.consentBody": [
    "If you say yes, a nurse may call you about your result. You can say no and still see it.",
    "Jos sanot kyllä, hoitaja voi soittaa sinulle tuloksestasi. Voit sanoa ei ja nähdä tuloksen silti.",
    "Om du säger ja får en sjuksköterska ringa dig om ditt resultat. Du kan säga nej och ändå se det.",
  ],
  "risk.yes": [
    "Yes, a nurse may contact me",
    "Kyllä, hoitaja saa ottaa minuun yhteyttä",
    "Ja, en sjuksköterska får kontakta mig",
  ],
  "risk.no": ["No, do not contact me", "Ei, älkää ottako minuun yhteyttä", "Nej, kontakta mig inte"],
  "risk.saveFailed": [
    "We could not save your answers.",
    "Vastauksiasi ei voitu tallentaa.",
    "Vi kunde inte spara dina svar.",
  ],
  "risk.retry": ["Try again", "Yritä uudelleen", "Försök igen"],
  "risk.eligibleTitle": [
    "You may be able to join the lung cancer screening",
    "Saatat voida osallistua keuhkosyövän seulontaan",
    "Du kan kanske delta i lungcancerscreeningen",
  ],
  "risk.eligibleBody": [
    "Based on your answers, you fit the national screening pilot. It is free, and you choose whether to join.",
    "Vastauksiesi perusteella sovit kansalliseen seulontakokeiluun. Se on maksuton, ja päätät itse osallistumisesta.",
    "Utifrån dina svar passar du för den nationella screeningpiloten. Den är gratis och du väljer själv om du vill delta.",
  ],
  "risk.signup": ["Sign up for the screening", "Ilmoittaudu seulontaan", "Anmäl dig till screeningen"],
  "risk.seeSigns": [
    "See the signs to watch for",
    "Katso merkit, joita seurata",
    "Se tecknen att hålla koll på",
  ],

  "noPathway.title": ["No pathway yet", "Ei vielä hoitopolkua", "Ingen vårdväg än"],
  "noPathway.body": [
    "The nurse will call you about your symptom. After the call, your appointments and next steps show here.",
    "Hoitaja soittaa sinulle oireestasi. Soiton jälkeen ajat ja seuraavat vaiheet näkyvät tässä.",
    "Sjuksköterskan ringer dig om ditt symtom. Efter samtalet visas dina tider och nästa steg här.",
  ],
  "demo.badge": [
    "Demo only · day {day}",
    "Vain demo · päivä {day}",
    "Endast demo · dag {day}",
  ],
  "demo.advance": ["Advance one day", "Siirry päivä eteenpäin", "Gå fram en dag"],
  "demo.patient": ["patient", "potilas", "patient"],
  "demo.caretaker": ["caretaker", "omainen", "anhörig"],
  "demo.alarm": ["Trigger alarm", "Laukaise hälytys", "Utlös larm"],

  "demo.alarmFailed": [
    "The alarm was not sent to the nurse.",
    "Hälytystä ei lähetetty hoitajalle.",
    "Larmet skickades inte till sjuksköterskan.",
  ],
  "card.title": ["My care plan card", "Hoitosuunnitelmani kortti", "Mitt vårdplanskort"],
  "card.nextStep": ["Next step", "Seuraava vaihe", "Nästa steg"],
  "card.bring": ["Bring with you", "Ota mukaan", "Ta med dig"],
  "card.howToGetThere": ["How to get there", "Miten pääset perille", "Hur du tar dig dit"],
  "card.howToGetThereBody": [
    "Use the HSL journey planner. Kela taxi reimbursement may cover your trip.",
    "Käytä HSL-reittiopasta. Kela voi korvata taksimatkasi.",
    "Använd HSL:s reseplanerare. Fpa kan ersätta din taxiresa.",
  ],
  "card.noNext": [
    "There is no next step planned yet.",
    "Seuraavaa vaihetta ei ole vielä suunniteltu.",
    "Nästa steg är inte planerat än.",
  ],
  "card.emergency": ["in an emergency", "hätätilanteessa", "vid akut"],
  "card.worse": [
    "if you suddenly feel much worse, day or night",
    "jos olosi huononee yhtäkkiä, yöllä tai päivällä",
    "om du plötsligt blir mycket sämre, dag eller natt",
  ],
  "card.nurseLine": ["weekdays 8–16", "arkisin 8–16", "vardagar 8–16"],
  "card.print": ["Print this card", "Tulosta kortti", "Skriv ut kortet"],
  "selfcare.breathlessness": [
    "Sit upright and rest. Slow, relaxed breaths help.",
    "Istuhdu pystyyn ja lepää. Hitaat, rauhalliset hengitykset auttavat.",
    "Sitt upp och vila. Lugna, långsamma andetag hjälper.",
  ],
  "selfcare.cough": [
    "Sip warm drinks and rest your voice.",
    "Siemaise lämmintä juomaa ja lepuuta ääntäsi.",
    "Sörp varma drycker och vila rösten.",
  ],
  "selfcare.pain": [
    "Rest, and take your usual pain relief as your nurse has advised.",
    "Lepää ja käytä tavanomaista kipulääkettäsi hoitajan ohjeen mukaan.",
    "Vila och ta din vanliga smärtlindring enligt sjuksköterskans råd.",
  ],
  "selfcare.fever_unwell": [
    "Drink plenty of fluids and rest.",
    "Juo runsaasti nesteitä ja lepää.",
    "Drick rikligt och vila.",
  ],
  "selfcare.tired_appetite": [
    "Eat small meals often, and rest when you need to.",
    "Syö pieniä aterioita usein ja lepää kun tarvitset.",
    "Ät små mål ofta och vila när du behöver.",
  ],
  "selfcare.other": [
    "Rest and keep a note of how it changes.",
    "Lepää ja kirjaa muistiin, miten oire muuttuu.",
    "Vila och anteckna hur det förändras.",
  ],

  /* ----------------------------------------------------------------------------------------
   * Trusted Person variants. `translate` prefers "<key>.trusted" when the session role is
   * trusted_person, so only the lines where "you" would be wrong for a helper are repeated
   * here. Anything without a variant keeps the patient's wording.
   * -------------------------------------------------------------------------------------- */
  "nav.trusted": ["Helping", "Autan", "Hjälper"],
  "nav.checkin": ["Check-in", "Tarkistus", "Koll"],
  "nav.help": ["Help", "Apua", "Hjälp"],

  "report.eyebrow.trusted": [
    "Report a symptom for them",
    "Ilmoita oireesta hänen puolestaan",
    "Rapportera ett symtom för hen",
  ],
  "report.r1Heading.trusted": [
    "Is any of this happening to them right now?",
    "Tapahtuuko jokin näistä hänelle juuri nyt?",
    "Händer något av detta med hen just nu?",
  ],
  "report.r1Body.trusted": [
    "Tap what is happening to them, or None of these.",
    "Napauta sitä, mitä hänelle tapahtuu, tai Ei mikään näistä.",
    "Tryck på det som händer hen, eller Inget av dessa.",
  ],
  "report.pickHeading.trusted": [
    "What would you like to tell Nurse Aino about them?",
    "Mistä haluat kertoa hoitaja Ainolle hänen osaltaan?",
    "Vad vill du berätta för sjuksköterska Aino om hen?",
  ],
  "report.pickNote.trusted": [
    "Pick the one that bothers them most. You can add more at the end.",
    "Valitse se, joka vaivaa häntä eniten. Voit lisätä muita lopuksi.",
    "Välj det som besvärar hen mest. Du kan lägga till fler i slutet.",
  ],
  "report.urgent.trusted": [
    "They are very unwell right now",
    "Hän voi hyvin huonosti juuri nyt",
    "Hen mår mycket dåligt just nu",
  ],
  "report.other.trusted": [
    "Something else they describe",
    "Jokin muu, jonka hän kuvaa",
    "Något annat som hen beskriver",
  ],
  "report.ownTitle.trusted": [
    "Anything to add about them in your own words?",
    "Haluatko lisätä jotain hänestä omin sanoin?",
    "Något att tillägga om hen med egna ord?",
  ],
  "report.ownPlaceholder.trusted": [
    "Describe it here, or tap the microphone",
    "Kuvaile tähän tai napauta mikrofonia",
    "Beskriv här eller tryck på mikrofonen",
  ],
  "report.sentBody.trusted": [
    "A nurse reads the answers and replies within 1–2 working days.",
    "Hoitaja lukee vastaukset ja vastaa 1–2 arkipäivässä.",
    "En sjuksköterska läser svaren och svarar inom 1–2 vardagar.",
  ],
  "report.callVeryUnwell.trusted": [
    "They are very unwell. ",
    "Hän on erittäin huonovointinen. ",
    "Hen mår mycket dåligt. ",
  ],

  "confirm.eyebrow.trusted": [
    "Please confirm they can come",
    "Vahvista, että hän pääsee tulemaan",
    "Bekräfta att hen kan komma",
  ],
  "confirm.heading.trusted": [
    "Confirm the {what}",
    "Vahvista: {what}",
    "Bekräfta: {what}",
  ],
  "confirm.note.trusted": [
    "If we don't hear from you or them, an automated call comes on day 2 and Nurse Aino calls on day 3.",
    "Jos emme kuule sinusta tai hänestä, automaattinen soitto tulee päivänä 2 ja hoitaja Aino soittaa päivänä 3.",
    "Om vi inte hör av dig eller hen kommer ett automatiskt samtal dag 2 och sjuksköterska Aino ringer dag 3.",
  ],

  "help.title.trusted": [
    "Who to call for them",
    "Kenelle soittaa hänen puolestaan",
    "Vem du ska ringa för hen",
  ],
  "help.sub.trusted": [
    "If they need help now, these numbers are fastest.",
    "Jos hän tarvitsee apua nyt, nämä numerot ovat nopeimmat.",
    "Om hen behöver hjälp nu är dessa nummer snabbast.",
  ],
  "help.nurseSub.trusted": [
    "Report it for them and Nurse Aino replies in 1–2 working days",
    "Ilmoita hänen puolestaan, niin hoitaja Aino vastaa 1–2 arkipäivässä",
    "Rapportera för hen, så svarar sjuksköterska Aino inom 1–2 vardagar",
  ],

  "checkin.title.trusted": [
    "Weekly check-in for them",
    "Viikkotarkistus hänestä",
    "Veckokoll för hen",
  ],
  "signs.title.trusted": [
    "Warning signs to watch for",
    "Varoitusmerkit, joita seurata",
    "Varningstecken att hålla koll på",
  ],
  "signs.body.trusted": [
    "Tap what they have. The nurse is told straight away.",
    "Napauta sitä, mitä hänellä on. Hoitajalle ilmoitetaan heti.",
    "Tryck på det hen har. Sjuksköterskan får veta direkt.",
  ],
} as const;

export type MessageKey = keyof typeof MESSAGES;

const WEEKDAY_NAMES: Record<UiLanguage, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fi: ["sunnuntai", "maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai"],
  sv: ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"],
};

/** Weekday name for a Date.getDay() index, in the page language. */
export function weekdayName(day: number, language: UiLanguage): string {
  return WEEKDAY_NAMES[language][day] ?? WEEKDAY_NAMES.en[day] ?? "";
}

export function translate(
  language: UiLanguage,
  key: MessageKey,
  vars?: Record<string, string | number>,
  role: "patient" | "trusted_person" = "patient",
): string {
  // A Trusted Person reads a few lines in their own voice ("Is any of this happening to them?").
  // A variant exists only where the patient's wording would be wrong; the rest falls back.
  const variant = role === "trusted_person" ? (`${key}.trusted` as MessageKey) : null;
  const row = variant && variant in MESSAGES ? MESSAGES[variant] : MESSAGES[key];
  // A bad record language, or a key from stale code, must never crash a screen: fall back to
  // English, then to the key itself.
  const index = INDEX[language] ?? 0;
  let text: string = row?.[index] ?? row?.[0] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
