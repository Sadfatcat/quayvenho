import type { MusicNote, Voice } from '@data/music';

/** Nhạc cụ tổng hợp bằng Web Audio cho nhạc nền: piano, sáo trúc, violin, guitar điện. */
const MIN_GAIN = 0.0001;
const A4_MIDI = 69;
const A4_HZ = 440;
const SEMITONES_PER_OCTAVE = 12;
const NOISE_SECONDS = 2;
const NOISE_SEED = 20251005;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 2 ** 32;

const REVERB_SECONDS = 2.8;
const REVERB_DECAY_POWER = 3;
const REVERB_WET_GAIN = 0.4;

const PIANO_PARTIALS: readonly (readonly [ratio: number, gain: number, lifeRatio: number])[] = [
  [1, 1, 1],
  [2, 0.35, 0.6],
  [3, 0.12, 0.35],
];
const PIANO_MAX_SECONDS = 4;
const PIANO_ATTACK = 0.01;

const FLUTE_ATTACK = 0.16;
const FLUTE_RELEASE = 0.3;
const FLUTE_VIBRATO_HZ = 4.5;
const FLUTE_VIBRATO_CENTS = 7;
const FLUTE_VIBRATO_DELAY = 0.5;
const FLUTE_BREATH_GAIN = 0.04;
const FLUTE_BREATH_BAND_RATIO = 3;
const FLUTE_BREATH_Q = 0.7;
const FLUTE_OVERTONES: readonly (readonly [ratio: number, gain: number])[] = [
  [2, 0.3],
  [3, 0.1],
];
const FLUTE_CUTOFF_HZ = 2200;

const VIOLIN_ATTACK = 0.3;
const VIOLIN_RELEASE = 0.6;
const VIOLIN_VIBRATO_HZ = 5.5;
const VIOLIN_VIBRATO_CENTS = 20;
const VIOLIN_DETUNE_CENTS = 7;
const VIOLIN_CUTOFF_HZ = 3200;

const BASS_ATTACK = 0.03;
const BASS_RELEASE = 0.35;
const BASS_OVERTONE_GAIN = 0.35;

const GUITAR_DISTORTION = 1.2;
const GUITAR_CUTOFF_HZ = 3000;
const GUITAR_PLUCK_SECONDS = 0.9;
const GUITAR_DELAY_SECONDS = 0.36;
const GUITAR_DELAY_FEEDBACK = 0.3;
const GUITAR_DELAY_WET = 0.25;
const GUITAR_SWELL_ATTACK = 0.9;
const GUITAR_SWELL_RELEASE = 1;
const GUITAR_LEAD_ATTACK = 0.05;
const GUITAR_LEAD_RELEASE = 0.45;
const GUITAR_LEAD_VIBRATO_HZ = 5;
const GUITAR_LEAD_VIBRATO_CENTS = 18;
const GUITAR_LEAD_VIBRATO_DELAY = 0.35;
const GUITAR_LEAD_BEND_SECONDS = 0.15;
const CENTS_PER_OCTAVE = 1200;
const KICK_START_HZ = 110;
const KICK_END_HZ = 45;
const KICK_DROP_SECONDS = 0.16;
const KICK_RELEASE_SECONDS = 0.25;
const RIM_HZ = 330;
const RIM_NOISE_HZ = 1800;
const RIM_SECONDS = 0.07;
const HAT_HIGHPASS_HZ = 7000;
const HAT_SECONDS = 0.05;
const CYMBAL_HIGHPASS_HZ = 5000;
const CYMBAL_SECONDS = 1.8;
const NOISE_OFFSET_STEP = 7.13;
const WAVESHAPER_SAMPLES = 256;

export const midiToHz = (midi: number): number => A4_HZ * 2 ** ((midi - A4_MIDI) / SEMITONES_PER_OCTAVE);

/** Nhiễu giả ngẫu nhiên xác định (LCG), không dùng Math.random. */
const fillNoise = (data: Float32Array, seed: number): void => {
  let state = seed;
  for (let i = 0; i < data.length; i++) {
    state = (LCG_MULTIPLIER * state + LCG_INCREMENT) % LCG_MODULUS;
    data[i] = (state / LCG_MODULUS) * 2 - 1;
  }
};

/** Vang hội trường: nhiễu suy giảm theo thời gian làm đáp ứng xung. */
export const createReverb = (context: AudioContext, destination: AudioNode): AudioNode => {
  const length = Math.floor(context.sampleRate * REVERB_SECONDS);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    fillNoise(data, NOISE_SEED + channel);
    for (let i = 0; i < length; i++) data[i] = (data[i] ?? 0) * (1 - i / length) ** REVERB_DECAY_POWER;
  }
  const convolver = context.createConvolver();
  convolver.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = REVERB_WET_GAIN;
  convolver.connect(wet).connect(destination);
  return convolver;
};

const distortionCurve = (amount: number): Float32Array<ArrayBuffer> => {
  const curve = new Float32Array(WAVESHAPER_SAMPLES);
  for (let i = 0; i < WAVESHAPER_SAMPLES; i++) curve[i] = Math.tanh(amount * ((i / (WAVESHAPER_SAMPLES - 1)) * 2 - 1));
  return curve;
};

interface Envelope {
  when: number;
  attack: number;
  hold: number;
  release: number;
  peak: number;
}

const applyEnvelope = (gain: AudioParam, { when, attack, hold, release, peak }: Envelope): void => {
  gain.setValueAtTime(MIN_GAIN, when);
  gain.exponentialRampToValueAtTime(Math.max(peak, MIN_GAIN), when + attack);
  gain.setValueAtTime(Math.max(peak, MIN_GAIN), when + attack + hold);
  gain.exponentialRampToValueAtTime(MIN_GAIN, when + attack + hold + release);
};

export class Instruments {
  private readonly noise: AudioBuffer;
  private readonly guitarInput: GainNode;

  constructor(
    private readonly context: AudioContext,
    private readonly destination: AudioNode,
  ) {
    this.noise = context.createBuffer(1, Math.floor(context.sampleRate * NOISE_SECONDS), context.sampleRate);
    fillNoise(this.noise.getChannelData(0), NOISE_SEED);
    this.guitarInput = this.createGuitarBus();
  }

  playNote(note: MusicNote, when: number, beatSeconds: number): void {
    const freq = midiToHz(note.midi);
    const seconds = note.beats * beatSeconds;
    const players: Record<Voice, () => void> = {
      piano: () => this.playPiano(freq, when, seconds, note.gain),
      flute: () => this.playFlute(freq, when, seconds, note.gain),
      violin: () => this.playViolin(freq, when, seconds, note.gain),
      guitar: () => this.playGuitar(freq, when, note.gain),
      guitarSwell: () => this.playGuitarSwell(freq, when, seconds, note.gain),
      guitarLead: () => this.playGuitarLead(freq, when, seconds, note.gain, note.bendCents ?? 0),
      bass: () => this.playBass(freq, when, seconds, note.gain),
      kick: () => this.playKick(when, note.gain),
      rim: () => this.playRim(when, note.gain),
      hat: () => this.playNoiseHit(when, note.gain, 'highpass', HAT_HIGHPASS_HZ, HAT_SECONDS),
      cymbal: () => this.playNoiseHit(when, note.gain, 'highpass', CYMBAL_HIGHPASS_HZ, CYMBAL_SECONDS),
    };
    players[note.voice]();
  }

  private oscillator(type: OscillatorType, freq: number, when: number, stopAt: number, destination: AudioNode, peak: number, env: Omit<Envelope, 'when' | 'peak'>): OscillatorNode {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    applyEnvelope(gain.gain, { when, peak, ...env });
    osc.connect(gain).connect(destination);
    osc.start(when);
    osc.stop(stopAt + 0.05);
    return osc;
  }

  private addVibrato(osc: OscillatorNode, when: number, stopAt: number, hz: number, cents: number, delay = 0): void {
    const lfo = this.context.createOscillator();
    const depth = this.context.createGain();
    lfo.frequency.value = hz;
    if (delay > 0) {
      depth.gain.setValueAtTime(0, when);
      depth.gain.linearRampToValueAtTime(cents, when + delay);
    } else {
      depth.gain.value = cents;
    }
    lfo.connect(depth).connect(osc.detune);
    lfo.start(when);
    lfo.stop(stopAt + 0.05);
  }

  private playPiano(freq: number, when: number, seconds: number, gain: number): void {
    const life = Math.min(Math.max(seconds + 1.5, 1.5), PIANO_MAX_SECONDS);
    for (const [ratio, partialGain, lifeRatio] of PIANO_PARTIALS) {
      const duration = life * lifeRatio;
      this.oscillator('sine', freq * ratio, when, when + duration, this.destination, gain * partialGain, { attack: PIANO_ATTACK, hold: 0, release: duration - PIANO_ATTACK });
    }
  }

  /** Sáo trúc: sóng tam giác + hài sine qua lọc thấp cho ấm, rung nhẹ vào muộn, chút hơi thở. */
  private playFlute(freq: number, when: number, seconds: number, gain: number): void {
    const hold = Math.max(seconds - FLUTE_ATTACK, 0.05);
    const stopAt = when + FLUTE_ATTACK + hold + FLUTE_RELEASE;
    const env = { attack: FLUTE_ATTACK, hold, release: FLUTE_RELEASE };
    const tone = this.context.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = FLUTE_CUTOFF_HZ;
    tone.connect(this.destination);
    const voice = this.oscillator('triangle', freq, when, stopAt, tone, gain, env);
    this.addVibrato(voice, when, stopAt, FLUTE_VIBRATO_HZ, FLUTE_VIBRATO_CENTS, FLUTE_VIBRATO_DELAY);
    for (const [ratio, overtoneGain] of FLUTE_OVERTONES) this.oscillator('sine', freq * ratio, when, stopAt, tone, gain * overtoneGain, env);

    const breath = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const breathGain = this.context.createGain();
    breath.buffer = this.noise;
    breath.loop = true;
    filter.type = 'bandpass';
    filter.frequency.value = freq * FLUTE_BREATH_BAND_RATIO;
    filter.Q.value = FLUTE_BREATH_Q;
    applyEnvelope(breathGain.gain, { when, peak: gain * FLUTE_BREATH_GAIN, ...env });
    breath.connect(filter).connect(breathGain).connect(this.destination);
    breath.start(when);
    breath.stop(stopAt + 0.05);
  }

  /** Violin kéo nền: hai sóng răng cưa lệch nhẹ, lọc mềm, vào chậm. */
  private playViolin(freq: number, when: number, seconds: number, gain: number): void {
    const hold = Math.max(seconds - VIOLIN_ATTACK, 0.05);
    const stopAt = when + VIOLIN_ATTACK + hold + VIOLIN_RELEASE;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = VIOLIN_CUTOFF_HZ;
    filter.connect(this.destination);
    const env = { attack: VIOLIN_ATTACK, hold, release: VIOLIN_RELEASE };
    for (const detune of [-VIOLIN_DETUNE_CENTS, VIOLIN_DETUNE_CENTS]) {
      const osc = this.oscillator('sawtooth', freq, when, stopAt, filter, gain / 2, env);
      osc.detune.value = detune;
      this.addVibrato(osc, when, stopAt, VIOLIN_VIBRATO_HZ, VIOLIN_VIBRATO_CENTS);
    }
  }

  /** Guitar clean ngân dài (chord swell): vào rất chậm, lọc mềm, đi qua delay vọng. */
  private playGuitarSwell(freq: number, when: number, seconds: number, gain: number): void {
    const hold = Math.max(seconds - GUITAR_SWELL_ATTACK, 0.05);
    const stopAt = when + GUITAR_SWELL_ATTACK + hold + GUITAR_SWELL_RELEASE;
    this.oscillator('sawtooth', freq, when, stopAt, this.guitarInput, gain, { attack: GUITAR_SWELL_ATTACK, hold, release: GUITAR_SWELL_RELEASE });
  }

  /** Guitar solo clean: sustain, rung nhẹ vào muộn và (tùy chọn) trượt lên từ thấp hơn vào nốt. */
  private playGuitarLead(freq: number, when: number, seconds: number, gain: number, bendCents: number): void {
    const hold = Math.max(seconds - GUITAR_LEAD_ATTACK, 0.05);
    const stopAt = when + GUITAR_LEAD_ATTACK + hold + GUITAR_LEAD_RELEASE;
    const env = { attack: GUITAR_LEAD_ATTACK, hold, release: GUITAR_LEAD_RELEASE };
    const voice = this.oscillator('sawtooth', freq, when, stopAt, this.guitarInput, gain, env);
    this.oscillator('triangle', freq, when, stopAt, this.guitarInput, gain, env);
    if (bendCents > 0) {
      voice.frequency.setValueAtTime(freq * 2 ** (-bendCents / CENTS_PER_OCTAVE), when);
      voice.frequency.linearRampToValueAtTime(freq, when + GUITAR_LEAD_BEND_SECONDS);
    }
    this.addVibrato(voice, when, stopAt, GUITAR_LEAD_VIBRATO_HZ, GUITAR_LEAD_VIBRATO_CENTS, GUITAR_LEAD_VIBRATO_DELAY);
  }

  /** Trống đế mềm: sine trượt từ cao xuống thấp. */
  private playKick(when: number, gain: number): void {
    const osc = this.context.createOscillator();
    const envelope = this.context.createGain();
    osc.frequency.setValueAtTime(KICK_START_HZ, when);
    osc.frequency.exponentialRampToValueAtTime(KICK_END_HZ, when + KICK_DROP_SECONDS);
    applyEnvelope(envelope.gain, { when, attack: 0.004, hold: 0, release: KICK_RELEASE_SECONDS, peak: gain });
    osc.connect(envelope).connect(this.destination);
    osc.start(when);
    osc.stop(when + KICK_RELEASE_SECONDS + 0.05);
  }

  /** Rim/cross-stick nhẹ: tiếng gõ ngắn (sine) cộng nhiễu dải giữa. */
  private playRim(when: number, gain: number): void {
    this.oscillator('sine', RIM_HZ, when, when + RIM_SECONDS, this.destination, gain, { attack: 0.002, hold: 0, release: RIM_SECONDS });
    this.playNoiseHit(when, gain, 'bandpass', RIM_NOISE_HZ, RIM_SECONDS);
  }

  /** Nhiễu lọc tắt dần: dùng cho hat (ngắn) và chũm chọe/chiêng (dài). */
  private playNoiseHit(when: number, gain: number, filterType: BiquadFilterType, freq: number, seconds: number): void {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noise;
    source.loop = true;
    filter.type = filterType;
    filter.frequency.value = freq;
    applyEnvelope(envelope.gain, { when, attack: 0.002, hold: 0, release: seconds, peak: gain });
    source.connect(filter).connect(envelope).connect(this.destination);
    source.start(when, (when * NOISE_OFFSET_STEP) % (NOISE_SECONDS / 2));
    source.stop(when + seconds + 0.05);
  }

  /** Bass: sine trầm cộng hài bậc hai (triangle) để loa điện thoại vẫn nghe rõ. */
  private playBass(freq: number, when: number, seconds: number, gain: number): void {
    const hold = Math.max(seconds - BASS_ATTACK, 0.05);
    const stopAt = when + BASS_ATTACK + hold + BASS_RELEASE;
    const env = { attack: BASS_ATTACK, hold, release: BASS_RELEASE };
    this.oscillator('sine', freq, when, stopAt, this.destination, gain, env);
    this.oscillator('triangle', freq * 2, when, stopAt, this.destination, gain * BASS_OVERTONE_GAIN, env);
  }

  /** Guitar điện: nốt gảy ngắn qua méo nhẹ và delay vọng. */
  private playGuitar(freq: number, when: number, gain: number): void {
    this.oscillator('sawtooth', freq, when, when + GUITAR_PLUCK_SECONDS, this.guitarInput, gain, { attack: PIANO_ATTACK, hold: 0, release: GUITAR_PLUCK_SECONDS - PIANO_ATTACK });
  }

  private createGuitarBus(): GainNode {
    const input = this.context.createGain();
    const shaper = this.context.createWaveShaper();
    const tone = this.context.createBiquadFilter();
    const delay = this.context.createDelay(1);
    const feedback = this.context.createGain();
    const wet = this.context.createGain();
    shaper.curve = distortionCurve(GUITAR_DISTORTION);
    tone.type = 'lowpass';
    tone.frequency.value = GUITAR_CUTOFF_HZ;
    delay.delayTime.value = GUITAR_DELAY_SECONDS;
    feedback.gain.value = GUITAR_DELAY_FEEDBACK;
    wet.gain.value = GUITAR_DELAY_WET;
    input.connect(shaper).connect(tone);
    tone.connect(this.destination);
    tone.connect(delay);
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(this.destination);
    return input;
  }
}
