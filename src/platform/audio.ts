/**
 * Âm thanh tổng hợp bằng Web Audio (không cần file asset): SFX ngắn + nhạc nền lofi lặp (PLAN §11.3).
 * AudioContext chỉ tạo và resume sau lần chạm đầu tiên (`unlock`) để chạy trên Safari iOS; trước đó mọi lời gọi là no-op.
 */
export type SfxName = 'click' | 'seat' | 'print' | 'success' | 'error' | 'walkAway' | 'thunder' | 'buy' | 'unlock' | 'open';
export type MusicTrack = 'calm' | 'busy';

interface Tone {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

const SFX_TONES: Record<SfxName, readonly Tone[]> = {
  click: [{ freq: 520, start: 0, duration: 0.05, type: 'triangle', gain: 0.5 }],
  seat: [{ freq: 660, start: 0, duration: 0.07, type: 'sine' }],
  print: [
    { freq: 140, start: 0, duration: 0.08, type: 'sawtooth', gain: 0.25 },
    { freq: 150, start: 0.1, duration: 0.08, type: 'sawtooth', gain: 0.25 },
    { freq: 140, start: 0.2, duration: 0.08, type: 'sawtooth', gain: 0.25 },
  ],
  success: [
    { freq: 880, start: 0, duration: 0.12, type: 'triangle' },
    { freq: 1320, start: 0.1, duration: 0.2, type: 'triangle' },
  ],
  error: [{ freq: 180, start: 0, duration: 0.25, type: 'square', gain: 0.35, slideTo: 120 }],
  walkAway: [{ freq: 300, start: 0, duration: 0.3, type: 'sine', slideTo: 160 }],
  thunder: [{ freq: 70, start: 0, duration: 0.7, type: 'sawtooth', gain: 0.4, slideTo: 40 }],
  buy: [
    { freq: 700, start: 0, duration: 0.06, type: 'square', gain: 0.3 },
    { freq: 940, start: 0.07, duration: 0.1, type: 'square', gain: 0.3 },
  ],
  unlock: [
    { freq: 523, start: 0, duration: 0.15, type: 'triangle' },
    { freq: 659, start: 0.15, duration: 0.15, type: 'triangle' },
    { freq: 784, start: 0.3, duration: 0.3, type: 'triangle' },
  ],
  open: [
    { freq: 660, start: 0, duration: 0.15, type: 'sine' },
    { freq: 880, start: 0.15, duration: 0.25, type: 'sine' },
  ],
};

/** Hợp âm lofi (Hz) cho mỗi nhịp; mỗi track dùng độ dài nhịp khác nhau. */
const CHORDS: readonly (readonly number[])[] = [
  [220, 277.18, 329.63, 415.3],
  [174.61, 220, 261.63, 329.63],
  [196, 246.94, 293.66, 392],
  [164.81, 207.65, 246.94, 329.63],
];
const BAR_SECONDS: Record<MusicTrack, number> = { calm: 3, busy: 2.1 };
const MUSIC_GAIN = 0.12;
const CROSSFADE_SECONDS = 0.8;
const SCHEDULE_AHEAD_SECONDS = 1;
const SCHEDULER_INTERVAL_MS = 250;
const SFX_MASTER_GAIN = 0.35;
const MIN_ENVELOPE_GAIN = 0.0001;
const ATTACK_SECONDS = 0.01;

class AudioEngine {
  private context: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicVolume = 0.7;
  private sfxVolume = 0.8;
  private track: MusicTrack | null = null;
  private nextBarTime = 0;
  private barIndex = 0;
  private scheduler: number | null = null;

  /** Gọi trong handler của lần chạm đầu tiên. An toàn khi gọi nhiều lần. */
  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.context) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.context = new Ctor();
      this.sfxGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain.connect(this.context.destination);
      this.musicGain.connect(this.context.destination);
      this.applyVolumes();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    if (this.track) this.startScheduler();
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    this.applyVolumes();
  }

  playSfx(name: SfxName): void {
    const { context, sfxGain } = this;
    if (!context || !sfxGain || this.sfxVolume <= 0) return;
    const base = context.currentTime;
    for (const tone of SFX_TONES[name]) this.playTone(sfxGain, base + tone.start, tone);
  }

  /** Đổi nhạc nền: crossfade 800 ms (nhạc cũ nhỏ dần rồi mới đổi nhịp). `null` giữ nhạc hiện tại. */
  playMusic(track: MusicTrack | null): void {
    if (track === null || track === this.track) return;
    this.track = track;
    if (!this.context || !this.musicGain) return;
    const { currentTime } = this.context;
    const gain = this.musicGain.gain;
    gain.cancelScheduledValues(currentTime);
    gain.setValueAtTime(gain.value, currentTime);
    gain.linearRampToValueAtTime(0, currentTime + CROSSFADE_SECONDS / 2);
    gain.linearRampToValueAtTime(this.musicVolume * MUSIC_GAIN, currentTime + CROSSFADE_SECONDS);
    this.nextBarTime = currentTime + CROSSFADE_SECONDS / 2;
    this.startScheduler();
  }

  private applyVolumes(): void {
    if (!this.sfxGain || !this.musicGain) return;
    this.sfxGain.gain.value = this.sfxVolume * SFX_MASTER_GAIN;
    this.musicGain.gain.value = this.musicVolume * MUSIC_GAIN;
  }

  private playTone(destination: GainNode, startAt: number, tone: Tone): void {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = tone.type ?? 'sine';
    oscillator.frequency.setValueAtTime(tone.freq, startAt);
    if (tone.slideTo) oscillator.frequency.linearRampToValueAtTime(tone.slideTo, startAt + tone.duration);
    envelope.gain.setValueAtTime(MIN_ENVELOPE_GAIN, startAt);
    envelope.gain.exponentialRampToValueAtTime(tone.gain ?? 0.6, startAt + ATTACK_SECONDS);
    envelope.gain.exponentialRampToValueAtTime(MIN_ENVELOPE_GAIN, startAt + tone.duration);
    oscillator.connect(envelope).connect(destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + tone.duration + 0.02);
  }

  private startScheduler(): void {
    if (this.scheduler !== null || !this.context) return;
    this.nextBarTime = Math.max(this.nextBarTime, this.context.currentTime);
    this.scheduler = window.setInterval(() => this.scheduleBars(), SCHEDULER_INTERVAL_MS);
    this.scheduleBars();
  }

  private scheduleBars(): void {
    const { context, musicGain, track } = this;
    if (!context || !musicGain || !track) return;
    const barSeconds = BAR_SECONDS[track];
    while (this.nextBarTime < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const chord = CHORDS[this.barIndex % CHORDS.length] ?? [];
      chord.forEach((freq, index) =>
        this.playTone(musicGain, this.nextBarTime + index * (barSeconds / 8), { freq, start: 0, duration: barSeconds * 0.9, type: 'triangle', gain: 0.5 }),
      );
      this.playTone(musicGain, this.nextBarTime, { freq: (chord[0] ?? 220) / 2, start: 0, duration: barSeconds * 0.8, type: 'sine', gain: 0.7 });
      this.nextBarTime += barSeconds;
      this.barIndex++;
    }
  }
}

export const audio = new AudioEngine();
