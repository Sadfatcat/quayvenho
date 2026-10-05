export type Voice = 'piano' | 'flute' | 'violin' | 'guitar' | 'guitarSwell' | 'guitarLead' | 'bass' | 'kick' | 'rim' | 'hat' | 'cymbal';

/** `beat` tính từ đầu ô nhịp, `midi` là số nốt MIDI (69 = La 440 Hz), `beats` là độ dài nốt theo phách; `bendCents` là độ trượt lên vào nốt. */
export interface MusicNote {
  voice: Voice;
  beat: number;
  midi: number;
  beats: number;
  gain: number;
  bendCents?: number;
}

export interface MusicTrackDef {
  bpm: number;
  beatsPerBar: number;
  bars: readonly (readonly MusicNote[])[];
}

/** Giai điệu một ô nhịp: [phách, nốt MIDI, số phách, độ trượt (cent, tùy chọn)]. */
type MelodyBar = readonly (readonly [beat: number, midi: number, beats: number, bendCents?: number])[];

const BEATS_PER_BAR = 4;
const OCTAVE = 12;

const note = (voice: Voice, beat: number, midi: number, beats: number, gain: number, bendCents?: number): MusicNote =>
  bendCents === undefined ? { voice, beat, midi, beats, gain } : { voice, beat, midi, beats, gain, bendCents };

const melodyNotes = (voice: Voice, melody: MelodyBar | undefined, gain: number): MusicNote[] =>
  (melody ?? []).map(([beat, midi, beats, bendCents]) => note(voice, beat, midi, beats, gain, bendCents));

// ───────────────────────────── "Gió Qua Chiều Nhẹ" (calm) ─────────────────────────────
// Thiết kế ở mo-ta-nhac/Gio_Qua_Chieu_Nhe_Game_Music_Design.md: 72 bpm, Rê trưởng, ~2:37 lặp được.

const SONG_BPM = 72;
const SONG_PIANO_GAIN = 0.32;
const SONG_BASS_GAIN = 0.45;
const SONG_FLUTE_GAIN = 0.34;
const SONG_VIOLIN_GAIN = 0.3;
const SONG_SWELL_GAIN = 0.1;
const SONG_LEAD_GAIN = 0.3;
const SONG_SOLO_BOOST = 1.35;
const SONG_KICK_GAIN = 0.5;
const SONG_RIM_GAIN = 0.22;
const SONG_HAT_GAIN = 0.1;
const SONG_CYMBAL_GAIN = 0.16;
const PERIODIC_CYMBAL_RATIO = 0.35;
const CYMBAL_EVERY_BARS = 4;
const NO_PITCH = 0;
const SONG_PAD_RATIO = 0.35;
const SOLO_BEND_CENTS = 100;
const PIANO_LATER_NOTE_RATIO = 0.8;
const FIFTH_SEMITONES = 7;
const FIFTH_BASS_RATIO = 0.7;

/** Mức to nhỏ theo từng phần (theo biểu đồ dynamic): intro nhỏ nhất, solo guitar cao nhất, outro giảm dần. */
const LEVEL = { intro: 0.5, a: 0.65, b: 0.8, solo: 1, c: 0.8, outro: 0.4 } as const;

interface SongChord {
  /** Nốt bass (gốc hợp âm). */
  bass: number;
  /** Bốn nốt rải của piano, thấp lên cao. */
  arpeggio: readonly [number, number, number, number];
}

const D_MAJ7: SongChord = { bass: 38, arpeggio: [50, 54, 57, 61] };
const A_OVER_CS: SongChord = { bass: 37, arpeggio: [49, 52, 54, 57] };
const B_M7: SongChord = { bass: 47, arpeggio: [54, 57, 59, 62] };
const G_MAJ7: SongChord = { bass: 43, arpeggio: [55, 59, 62, 66] };
const D_OVER_FS: SongChord = { bass: 42, arpeggio: [54, 57, 62, 66] };
const E_M7: SongChord = { bass: 40, arpeggio: [52, 55, 59, 62] };
const G_OVER_A: SongChord = { bass: 45, arpeggio: [57, 59, 62, 67] };
const A7: SongChord = { bass: 45, arpeggio: [57, 61, 64, 67] };
const FS_M7: SongChord = { bass: 42, arpeggio: [54, 57, 61, 64] };

/** Các câu sáo (motif chính). */
const FLUTE_LINE_1: MelodyBar = [[0, 66, 1], [1, 69, 1], [2, 71, 1], [3, 69, 1.5]];
const FLUTE_LINE_2: MelodyBar = [[0, 66, 1], [1, 64, 1], [2, 62, 1], [3, 64, 1.5]];
const FLUTE_LINE_3: MelodyBar = [[0, 66, 1], [1, 69, 1], [2, 71, 1], [3, 74, 1.5]];
const FLUTE_LINE_4: MelodyBar = [[0, 73, 1], [1, 71, 1], [2, 69, 1], [3, 66, 1.5]];
const flutePhrase = (midi: number, beats: number): MelodyBar => [[0, midi, beats]];

/** Các câu đáp của violin. */
const VIOLIN_RESPONSE_1: MelodyBar = [[0, 69, 2], [2, 71, 1], [3, 73, 1.5]];
const VIOLIN_RESPONSE_2: MelodyBar = [[0, 71, 1], [1, 69, 1], [2, 66, 2]];
const VIOLIN_RESPONSE_3: MelodyBar = [[0, 66, 2], [2, 69, 1], [3, 71, 1.5]];
const VIOLIN_RESPONSE_4: MelodyBar = [[0, 73, 1], [1, 71, 1], [2, 69, 2]];

/** Solo guitar điện clean (có bend nhẹ ở đầu câu). */
const SOLO_BARS: readonly MelodyBar[] = [
  [[0, 66, 1, SOLO_BEND_CENTS], [1, 69, 1], [2, 71, 1], [3, 73, 2]],
  [[0, 69, 1], [1, 66, 1], [2, 64, 2.5]],
  [[0, 66, 1, SOLO_BEND_CENTS], [1, 69, 1], [2, 73, 1], [3, 74, 2]],
  [[0, 73, 1], [1, 71, 1], [2, 69, 1], [3, 66, 1]],
  [[0, 64, 3]],
];

const D_MAJOR_PITCH_CLASSES = [2, 4, 6, 7, 9, 11, 1] as const;
const PITCH_CLASSES = 12;
const DIATONIC_THIRD_STEPS = 2;

/** Nốt cách quãng ba trong Rê trưởng phía trên (dùng cho violin hòa giọng với sáo). */
const thirdAbove = (midi: number): number => {
  const degree = D_MAJOR_PITCH_CLASSES.indexOf((midi % PITCH_CLASSES) as (typeof D_MAJOR_PITCH_CLASSES)[number]);
  if (degree < 0) return midi;
  const target = D_MAJOR_PITCH_CLASSES[(degree + DIATONIC_THIRD_STEPS) % D_MAJOR_PITCH_CLASSES.length] ?? midi;
  return midi + ((target - (midi % PITCH_CLASSES) + PITCH_CLASSES) % PITCH_CLASSES);
};

const harmonize = (melody: MelodyBar | undefined): MelodyBar | undefined =>
  melody?.map(([beat, midi, beats]) => [beat, thirdAbove(midi), beats] as const);

interface SongBar {
  chord: SongChord;
  level: number;
  /** Hệ số bass (không có = không chơi bass). */
  bass?: number | undefined;
  /** Mặc định piano luôn chơi. */
  piano?: false | number | undefined;
  flute?: MelodyBar | undefined;
  violin?: MelodyBar | undefined;
  /** Violin kéo nền rất nhẹ (không có giai điệu). */
  violinPad?: boolean | undefined;
  lead?: MelodyBar | undefined;
  swell?: boolean | undefined;
  /** Trống nhẹ: light = trống đế + hat thưa; mid = thêm rim ở phách 2, 4 và hat móc đơn. */
  drums?: 'light' | 'mid' | undefined;
  /** Chũm chọe (chiêng) mạnh ở đầu ô nhịp, đánh dấu vào phần mới. */
  crash?: boolean | undefined;
}

const drumNotes = (drums: 'light' | 'mid' | undefined, crash: boolean | undefined, level: number, barInSection: number): MusicNote[] => {
  const hit = (voice: Voice, beat: number, gain: number): MusicNote => note(voice, beat, NO_PITCH, 0, gain * level);
  const notes: MusicNote[] = [];
  if (crash) notes.push(hit('cymbal', 0, SONG_CYMBAL_GAIN));
  if (!drums) return notes;
  notes.push(hit('kick', 0, SONG_KICK_GAIN), hit('kick', 2, SONG_KICK_GAIN * 0.8));
  if (drums === 'light') {
    notes.push(hit('hat', 1, SONG_HAT_GAIN), hit('hat', 3, SONG_HAT_GAIN));
    return notes;
  }
  notes.push(hit('rim', 1, SONG_RIM_GAIN), hit('rim', 3, SONG_RIM_GAIN));
  for (const beat of [0.5, 1.5, 2.5, 3.5]) notes.push(hit('hat', beat, SONG_HAT_GAIN));
  if (!crash && barInSection % CYMBAL_EVERY_BARS === 0) notes.push(hit('cymbal', 0, SONG_CYMBAL_GAIN * PERIODIC_CYMBAL_RATIO));
  return notes;
};

const songBar = ({ chord, level, bass, piano, flute, violin, violinPad, lead, swell, drums, crash }: SongBar, barInSection: number): MusicNote[] => {
  const pianoLevel = piano === undefined ? 1 : piano;
  const [root, third, fifth, seventh] = chord.arpeggio;
  const pianoNotes: MusicNote[] = pianoLevel === false
    ? []
    : [root, third, fifth, seventh].map((midi, beat) =>
        note('piano', beat, midi, BEATS_PER_BAR - beat, SONG_PIANO_GAIN * level * pianoLevel * (beat === 0 ? 1 : PIANO_LATER_NOTE_RATIO)),
      );
  const bassNotes: MusicNote[] = bass
    ? [
        note('bass', 0, chord.bass, 2, SONG_BASS_GAIN * level * bass),
        ...(barInSection % 2 === 1 ? [note('bass', 2, chord.bass + FIFTH_SEMITONES, 2, SONG_BASS_GAIN * level * bass * FIFTH_BASS_RATIO)] : []),
      ]
    : [];
  const swellNotes: MusicNote[] = swell
    ? [fifth, seventh].map((midi) => note('guitarSwell', 0, midi + OCTAVE, BEATS_PER_BAR, SONG_SWELL_GAIN * level))
    : [];
  const padNotes: MusicNote[] = violinPad
    ? [fifth, seventh].map((midi) => note('violin', 0, midi, BEATS_PER_BAR, SONG_VIOLIN_GAIN * SONG_PAD_RATIO * level))
    : [];
  return [
    ...pianoNotes,
    ...bassNotes,
    ...swellNotes,
    ...padNotes,
    ...melodyNotes('flute', flute, SONG_FLUTE_GAIN * level),
    ...melodyNotes('violin', violin, SONG_VIOLIN_GAIN * level),
    ...melodyNotes('guitarLead', lead, SONG_LEAD_GAIN * SONG_SOLO_BOOST * level),
    ...drumNotes(drums, crash, level, barInSection),
  ];
};

const section = (bars: readonly SongBar[]): MusicNote[][] => bars.map(songBar);

/** Intro 0:00–0:20: piano + sáo rất nhẹ. */
const INTRO_BARS = section(
  [D_MAJ7, A_OVER_CS, B_M7, G_MAJ7, G_OVER_A, A7].map((chord, index) => ({
    chord,
    level: LEVEL.intro,
    flute: index === 2 ? flutePhrase(69, 3) : index === 4 ? [[0, 66, 2], [2, 69, 2]] : undefined,
  })),
);

const A_CHORDS: readonly SongChord[] = [D_MAJ7, A_OVER_CS, B_M7, G_MAJ7, D_OVER_FS, E_M7, G_OVER_A, A7, G_MAJ7, A7];
const A_FLUTE: readonly (MelodyBar | undefined)[] = [
  FLUTE_LINE_1,
  FLUTE_LINE_2,
  flutePhrase(66, 2),
  undefined,
  FLUTE_LINE_3,
  FLUTE_LINE_4,
  flutePhrase(64, 2),
  undefined,
  [[0, 71, 2], [2, 69, 1]],
  flutePhrase(66, 3),
];
const SWELL_BAR_INDEXES: readonly number[] = [2, 6];

/** Phần A 0:20–0:55: sáo dẫn giai điệu, bass rất nhẹ. */
const A_BARS = section(
  A_CHORDS.map((chord, index) => ({ chord, level: LEVEL.a, bass: 0.6, flute: A_FLUTE[index], swell: SWELL_BAR_INDEXES.includes(index), drums: 'light' })),
);

const B_CHORDS: readonly SongChord[] = [D_MAJ7, A_OVER_CS, B_M7, FS_M7, G_MAJ7, D_OVER_FS, E_M7, A7, G_OVER_A, A7];
const B_FLUTE: readonly (MelodyBar | undefined)[] = [
  FLUTE_LINE_1,
  undefined,
  FLUTE_LINE_2,
  undefined,
  FLUTE_LINE_3,
  undefined,
  FLUTE_LINE_4,
  undefined,
  [[0, 71, 2], [2, 69, 2]],
  flutePhrase(66, 3),
];
const B_VIOLIN: readonly (MelodyBar | undefined)[] = [
  undefined,
  VIOLIN_RESPONSE_1,
  undefined,
  VIOLIN_RESPONSE_2,
  undefined,
  VIOLIN_RESPONSE_3,
  undefined,
  VIOLIN_RESPONSE_4,
  [[0, 74, 2], [2, 73, 2]],
  flutePhrase(69, 3),
];

/** Phần B 0:55–1:30: violin vào, đối đáp với sáo. */
const B_BARS = section(
  B_CHORDS.map((chord, index) => ({
    chord,
    level: LEVEL.b,
    bass: 0.7,
    flute: B_FLUTE[index],
    violin: B_VIOLIN[index],
    swell: SWELL_BAR_INDEXES.includes(index),
    drums: 'mid',
    crash: index === 0,
  })),
);

const SOLO_CHORDS: readonly SongChord[] = [D_MAJ7, A_OVER_CS, B_M7, G_MAJ7, A7];

/** Solo guitar 1:30–1:48: guitar điện nổi lên, violin rất nhẹ, sáo nghỉ. */
const SOLO_SECTION_BARS = section(SOLO_CHORDS.map((chord, index) => ({ chord, level: LEVEL.solo, bass: 0.7, violinPad: true, lead: SOLO_BARS[index], drums: 'mid', crash: index === 0 })));

/** Phần C 1:48–2:20: sáo và violin (hòa giọng quãng ba) cùng phát triển giai điệu. */
const C_BARS = section(
  A_CHORDS.map((chord, index) => {
    const flute = A_FLUTE[index];
    const bridge = index === 3 ? VIOLIN_RESPONSE_2 : index === 7 ? VIOLIN_RESPONSE_4 : undefined;
    return { chord, level: LEVEL.c, bass: 0.7, flute, violin: harmonize(flute) ?? bridge, swell: SWELL_BAR_INDEXES.includes(index), drums: 'mid', crash: index === 0 };
  }),
);

const OUTRO_CHORDS: readonly SongChord[] = [B_M7, G_MAJ7, E_M7, A7, D_MAJ7, D_MAJ7];
const OUTRO_FLUTE: readonly (MelodyBar | undefined)[] = [undefined, flutePhrase(69, 3), [[0, 66, 2], [2, 64, 2]], undefined, undefined, undefined];
const OUTRO_FADE_FROM_BAR = 3;
const OUTRO_FADE_RATIO = 0.7;

/** Outro 2:20–2:40: violin → sáo → piano, kết bằng Dmaj7 ngân nhẹ rồi nối về intro. */
const OUTRO_BARS = section(
  OUTRO_CHORDS.map((chord, index) => ({
    chord,
    level: LEVEL.outro,
    bass: index < OUTRO_FADE_FROM_BAR ? 0.5 : undefined,
    piano: index >= OUTRO_FADE_FROM_BAR ? OUTRO_FADE_RATIO : 1,
    violin: index === 0 ? flutePhrase(71, 3) : undefined,
    flute: OUTRO_FLUTE[index],
  })),
);

const SONG_BARS: readonly (readonly MusicNote[])[] = [...INTRO_BARS, ...A_BARS, ...B_BARS, ...SOLO_SECTION_BARS, ...C_BARS, ...OUTRO_BARS];

const SONG: MusicTrackDef = { bpm: SONG_BPM, beatsPerBar: BEATS_PER_BAR, bars: SONG_BARS };

/** Nhạc nền tự soạn "Gió Qua Chiều Nhẹ" (sáo trúc + violin dẫn, piano/guitar/bass nền); mọi màn dùng chung một bản. */
export const MUSIC_TRACKS = { calm: SONG, busy: SONG } as const satisfies Record<string, MusicTrackDef>;
