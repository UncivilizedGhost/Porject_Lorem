// Owner: person 4 — fixed spoken phrases of the voice layer, per language.
export interface VoiceStrings {
  sayYesOrNo: string;
  cancelled: string;
  didntCatch: string;
  helpIntro: string;
  youSaid: (text: string) => string;
  nothingToRepeat: string;
  unavailable: string;
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
  },
  fi: {
    sayYesOrNo: "Sano kyllä tai ei.",
    cancelled: "Selvä, peruttu.",
    didntCatch: "En ymmärtänyt. Voit sanoa:",
    helpIntro: "Voit sanoa:",
    youSaid: (t) => `Sanoit: ${t}. Tallennetaanko? Sano kyllä tai ei.`,
    nothingToRepeat: "Ei ole mitään toistettavaa.",
    unavailable: "Ääniohjaus ei ole nyt käytettävissä. Käytä painikkeita.",
  },
  sv: {
    sayYesOrNo: "Säg ja eller nej.",
    cancelled: "OK, avbrutet.",
    didntCatch: "Jag förstod inte. Du kan säga:",
    helpIntro: "Du kan säga:",
    youSaid: (t) => `Du sa: ${t}. Spara detta? Säg ja eller nej.`,
    nothingToRepeat: "Det finns inget att upprepa.",
    unavailable: "Röststyrning är inte tillgänglig just nu. Använd knapparna.",
  },
};
