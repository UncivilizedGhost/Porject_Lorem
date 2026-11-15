// Owner: person 4 — fixed spoken phrases of the voice layer, per language.
export interface VoiceStrings {
  sayYesOrNo: string;
  cancelled: string;
  didntCatch: string;
  helpIntro: string;
  youSaid: (text: string) => string;
  nothingToRepeat: string;
  unavailable: string;
  screenReaderOn: string;
  screenReaderOff: string;
}

export const STRINGS: Record<string, VoiceStrings> = {
  en: {
    sayYesOrNo: "Say yes or no.",
    cancelled: "OK, cancelled.",
    didntCatch: "I didn't catch that. You can say:",
    helpIntro: "You can say:",
    youSaid: (t) => `You said: ${t}. Save this? Say yes or no.`,
    nothingToRepeat: "There is nothing to repeat.",
    unavailable: "Voice is not available right now. Please use the buttons.",
    screenReaderOn: "Screen reader on. Tap anywhere on the screen to have it read out loud.",
    screenReaderOff: "Screen reader off.",
  },
  fi: {
    sayYesOrNo: "Sano kyllä tai ei.",
    cancelled: "Selvä, peruttu.",
    didntCatch: "En ymmärtänyt. Voit sanoa:",
    helpIntro: "Voit sanoa:",
    youSaid: (t) => `Sanoit: ${t}. Tallennetaanko? Sano kyllä tai ei.`,
    nothingToRepeat: "Ei ole mitään toistettavaa.",
    unavailable: "Ääniohjaus ei ole nyt käytettävissä. Käytä painikkeita.",
    screenReaderOn: "Lukuavustus päällä. Napauta tai klikkaa missä tahansa ruudulla saadaksesi sen luettavaksi ääneen.",
    screenReaderOff: "Lukuavustus pois käytöstä.",
  },
  sv: {
    sayYesOrNo: "Säg ja eller nej.",
    cancelled: "OK, avbrutet.",
    didntCatch: "Jag förstod inte. Du kan säga:",
    helpIntro: "Du kan säga:",
    youSaid: (t) => `Du sa: ${t}. Spara detta? Säg ja eller nej.`,
    nothingToRepeat: "Det finns inget att upprepa.",
    unavailable: "Röststyrning är inte tillgänglig just nu. Använd knapparna.",
    screenReaderOn: "Skärmläsare på. Tryck eller klicka var som helst på skärmen för assistans.",
    screenReaderOff: "Skärmläsare avstängd.",
  },
};
