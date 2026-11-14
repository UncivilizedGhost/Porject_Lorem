// Owner: person 2 — single source of truth for all icons, using @phosphor-icons/react
// (free, MIT-licensed icon pack).
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bed,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  Circle,
  Cross,
  Drop,
  FileText,
  Gear,
  House,
  Lightning,
  Microphone,
  Minus,
  Moon,
  Path,
  Phone,
  Pill,
  Play,
  Pencil,
  Question,
  Smiley,
  SpeakerHigh,
  Stairs,
  Sun,
  Timer,
  Thermometer,
  Users,
  Virus,
  Warning,
} from "@phosphor-icons/react";

export type IconName =
  // Common
  | "chevron-right"
  | "chevron-left"
  | "chevron-down"
  | "report"
  | "phone"
  | "check"
  | "check-circle"
  | "circle"
  | "pill"
  | "play"
  | "slow"
  | "mic"
  | "contrast"
  | "warning"
  | "urgent"
  // Warning sign icons
  | "sign-cough"
  | "sign-voice"
  | "sign-blood"
  | "sign-tired"
  | "sign-appetite"
  | "sign-fallback"
  // Guided question option icons
  | "opt-yes"
  | "opt-no"
  | "opt-stairs"
  | "opt-light-effort"
  | "opt-at-rest"
  | "opt-none"
  | "opt-streaks"
  | "opt-more-than-streaks"
  | "opt-mild"
  | "opt-moderate"
  | "opt-severe"
  | "opt-very-severe"
  | "opt-well"
  | "opt-unwell"
  | "opt-managing"
  | "opt-cant-usual"
  | "opt-in-bed"
  | "opt-normal"
  | "opt-less"
  | "opt-hardly"
  | "opt-not-at-all"
  | "opt-a-little"
  | "opt-somewhat"
  | "opt-quite-a-bit"
  | "opt-very-much"
  // Own words
  | "pencil"
  // Bottom nav
  | "home"
  | "pathway"
  | "medicines"
  | "learn"
  | "helping"
  | "checkin"
  | "help"
  // Shell
  | "speaker"
  | "help-pill"
  | "settings"
  | "brand-mark"
  // Symptom report
  | "symptom-breathlessness"
  | "symptom-cough"
  | "symptom-pain"
  | "symptom-fever"
  | "symptom-tired"
  | "symptom-other"
  | "symptom-urgent";

const ICONS: Record<IconName, React.ElementType> = {
  // Common
  "chevron-right": ArrowRight,
  "chevron-left": ArrowLeft,
  "chevron-down": ArrowDown,
  report: FileText,
  phone: Phone,
  check: Check,
  "check-circle": CheckCircle,
  circle: Circle,
  pill: Pill,
  play: Play,
  slow: Timer,
  mic: Microphone,
  contrast: Sun,
  warning: Warning,
  urgent: Warning,
  // Warning signs
  "sign-cough": Virus,
  "sign-voice": Microphone,
  "sign-blood": Drop,
  "sign-tired": Moon,
  "sign-appetite": Smiley,
  "sign-fallback": Circle,
  // Guided question options
  "opt-yes": Check,
  "opt-no": Cross,
  "opt-stairs": Stairs,
  "opt-light-effort": Lightning,
  "opt-at-rest": Timer,
  "opt-none": Circle,
  "opt-streaks": Lightning,
  "opt-more-than-streaks": ArrowUp,
  "opt-mild": Circle,
  "opt-moderate": Circle,
  "opt-severe": Warning,
  "opt-very-severe": Warning,
  "opt-well": Smiley,
  "opt-unwell": Virus,
  "opt-managing": Check,
  "opt-cant-usual": Cross,
  "opt-in-bed": Bed,
  "opt-normal": Circle,
  "opt-less": Minus,
  "opt-hardly": Minus,
  "opt-not-at-all": Cross,
  "opt-a-little": Minus,
  "opt-somewhat": Minus,
  "opt-quite-a-bit": ArrowUp,
  "opt-very-much": ArrowUp,
  // Own words
  pencil: Pencil,
  // Bottom nav
  home: House,
  pathway: Path,
  medicines: Pill,
  learn: BookOpen,
  helping: Users,
  checkin: Calendar,
  help: Question,
  // Shell
  speaker: SpeakerHigh,
  "help-pill": Question,
  settings: Gear,
  "brand-mark": Circle,
  // Symptom report
  "symptom-breathlessness": Virus,
  "symptom-cough": Virus,
  "symptom-pain": Warning,
  "symptom-fever": Thermometer,
  "symptom-tired": Moon,
  "symptom-other": Circle,
  "symptom-urgent": Warning,
};

interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  const Comp = ICONS[name];
  return <Comp size={size} className={className} aria-hidden="true" focusable="false" />;
}
