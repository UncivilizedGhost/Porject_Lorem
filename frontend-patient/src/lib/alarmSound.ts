// Generic alarm tone for the Call now page: two alternating beeps that start slow and quiet,
// then speed up and get louder. Web Audio only, so there is no sound asset to ship. The page
// starts it on mount and stops it on unmount or when the person silences it.
let context: AudioContext | null = null;
let timer: number | undefined;
let step = 0;
let running = false;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

function beep(ctx: AudioContext, frequency: number, level: number, seconds: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(Math.max(0.0001, level), ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}

function tick(): void {
  if (!running || !context) return;
  const ramp = Math.min(1, step / 18); // full speed after ~18 beeps
  beep(context, step % 2 === 0 ? 880 : 620, 0.04 + ramp * 0.16, 0.26);
  timer = window.setTimeout(tick, 900 - ramp * 720);
  step += 1;
}

export function startAlarm(): void {
  const ctx = audio();
  if (!ctx) return;
  void ctx.resume();
  if (running) return;
  running = true;
  step = 0;
  tick();
}

export function stopAlarm(): void {
  running = false;
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
  void context?.suspend();
}
