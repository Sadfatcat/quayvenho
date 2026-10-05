/**
 * Âm thanh tổng hợp bằng Web Audio (không cần file asset): SFX ngắn + nhạc nền tự soạn (sáo, piano, violin, guitar) lặp (PLAN §11.3).
 * AudioContext chỉ tạo và resume sau lần chạm đầu tiên (`unlock`) để chạy trên Safari iOS; trước đó mọi lời gọi là no-op.
 */
import { MUSIC_TRACKS } from '@data/music';
import { createReverb, Instruments } from './instruments';

export type SfxName = 'click' | 'seat' | 'print' | 'success' | 'error' | 'walkAway' | 'thunder' | 'buy' | 'unlock' | 'open' | 'tick';
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
  tick: [{ freq: 900, start: 0, duration: 0.03, type: 'square', gain: 0.2 }],
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

const MUSIC_GAIN = 0.6;
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
  private instruments: Instruments | null = null;
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
      this.musicGain.connect(createReverb(this.context, this.context.destination));
      this.instruments = new Instruments(this.context, this.musicGain);
      this.applyVolumes();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    if (this.track) this.startScheduler();
  }

  suspend(): void {
    void this.context?.suspend();
  }

  resume(): void {
    if (this.context?.state === 'suspended') void this.context.resume();
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
    const sameSong = this.track !== null && MUSIC_TRACKS[track] === MUSIC_TRACKS[this.track];
    this.track = track;
    if (sameSong) return;
    this.barIndex = 0;
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
    const { context, instruments, track } = this;
    if (!context || !instruments || !track) return;
    const { bpm, beatsPerBar, bars } = MUSIC_TRACKS[track];
    const beatSeconds = 60 / bpm;
    while (this.nextBarTime < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      for (const note of bars[this.barIndex % bars.length] ?? []) instruments.playNote(note, this.nextBarTime + note.beat * beatSeconds, beatSeconds);
      this.nextBarTime += beatsPerBar * beatSeconds;
      this.barIndex++;
    }
  }
}

export const audio = new AudioEngine();
